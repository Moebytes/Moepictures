import cv2
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from pathlib import Path
from typing import Union, List
import pyclipper
from shapely.geometry import Polygon
import random
import pkg_resources as pkg
import time
import torchvision
import math
from copy import deepcopy
import warnings 

TEXTDET_MASK = 0
TEXTDET_DET = 1
TEXTDET_INFERENCE = 2
LANG_LIST = ['eng', 'ja', 'unknown']
LANGCLS2IDX = {'eng': 0, 'ja': 1, 'unknown': 2}
REFINEMASK_INPAINT = 0

torch.set_flush_denormal(True)

def autopad(k, p=None):  # kernel, padding
    # Pad to 'same'
    if p is None:
        p = k // 2 if isinstance(k, int) else [x // 2 for x in k]  # auto-pad
    return p

class Conv(nn.Module):
    # Standard convolution
    def __init__(self, c1, c2, k=1, s=1, p=None, g=1, act=True):  # ch_in, ch_out, kernel, stride, padding, groups
        super().__init__()
        self.conv = nn.Conv2d(c1, c2, k, s, autopad(k, p), groups=g, bias=False)
        self.bn = nn.BatchNorm2d(c2)
        if isinstance(act, bool):
            self.act = nn.SiLU() if act is True else (act if isinstance(act, nn.Module) else nn.Identity())
        elif isinstance(act, str):
            if act == 'leaky':
                self.act = nn.LeakyReLU(0.1, inplace=True)
            elif act == 'relu':
                self.act = nn.ReLU(inplace=True)
            else:
                self.act = None
    def forward(self, x):
        return self.act(self.bn(self.conv(x)))

    def forward_fuse(self, x):
        return self.act(self.conv(x))

class DWConv(Conv):
    # Depth-wise convolution class
    def __init__(self, c1, c2, k=1, s=1, act=True):  # ch_in, ch_out, kernel, stride, padding, groups
        super().__init__(c1, c2, k, s, g=math.gcd(c1, c2), act=act)

class TransformerLayer(nn.Module):
    # Transformer layer https://arxiv.org/abs/2010.11929 (LayerNorm layers removed for better performance)
    def __init__(self, c, num_heads):
        super().__init__()
        self.q = nn.Linear(c, c, bias=False)
        self.k = nn.Linear(c, c, bias=False)
        self.v = nn.Linear(c, c, bias=False)
        self.ma = nn.MultiheadAttention(embed_dim=c, num_heads=num_heads)
        self.fc1 = nn.Linear(c, c, bias=False)
        self.fc2 = nn.Linear(c, c, bias=False)

    def forward(self, x):
        x = self.ma(self.q(x), self.k(x), self.v(x))[0] + x
        x = self.fc2(self.fc1(x)) + x
        return x

class TransformerBlock(nn.Module):
    # Vision Transformer https://arxiv.org/abs/2010.11929
    def __init__(self, c1, c2, num_heads, num_layers):
        super().__init__()
        self.conv = None
        if c1 != c2:
            self.conv = Conv(c1, c2)
        self.linear = nn.Linear(c2, c2)  # learnable position embedding
        self.tr = nn.Sequential(*(TransformerLayer(c2, num_heads) for _ in range(num_layers)))
        self.c2 = c2

    def forward(self, x):
        if self.conv is not None:
            x = self.conv(x)
        b, _, w, h = x.shape
        p = x.flatten(2).permute(2, 0, 1)
        return self.tr(p + self.linear(p)).permute(1, 2, 0).reshape(b, self.c2, w, h)

class Bottleneck(nn.Module):
    # Standard bottleneck
    def __init__(self, c1, c2, shortcut=True, g=1, e=0.5, act=True):  # ch_in, ch_out, shortcut, groups, expansion
        super().__init__()
        c_ = int(c2 * e)  # hidden channels
        self.cv1 = Conv(c1, c_, 1, 1, act=act)
        self.cv2 = Conv(c_, c2, 3, 1, g=g, act=act)
        self.add = shortcut and c1 == c2

    def forward(self, x):
        return x + self.cv2(self.cv1(x)) if self.add else self.cv2(self.cv1(x))

class BottleneckCSP(nn.Module):
    # CSP Bottleneck https://github.com/WongKinYiu/CrossStagePartialNetworks
    def __init__(self, c1, c2, n=1, shortcut=True, g=1, e=0.5):  # ch_in, ch_out, number, shortcut, groups, expansion
        super().__init__()
        c_ = int(c2 * e)  # hidden channels
        self.cv1 = Conv(c1, c_, 1, 1)
        self.cv2 = nn.Conv2d(c1, c_, 1, 1, bias=False)
        self.cv3 = nn.Conv2d(c_, c_, 1, 1, bias=False)
        self.cv4 = Conv(2 * c_, c2, 1, 1)
        self.bn = nn.BatchNorm2d(2 * c_)  # applied to cat(cv2, cv3)
        self.act = nn.SiLU()
        self.m = nn.Sequential(*(Bottleneck(c_, c_, shortcut, g, e=1.0) for _ in range(n)))

    def forward(self, x):
        y1 = self.cv3(self.m(self.cv1(x)))
        y2 = self.cv2(x)
        return self.cv4(self.act(self.bn(torch.cat((y1, y2), dim=1))))

class C3(nn.Module):
    # CSP Bottleneck with 3 convolutions
    def __init__(self, c1, c2, n=1, shortcut=True, g=1, e=0.5, act=True):  # ch_in, ch_out, number, shortcut, groups, expansion
        super().__init__()
        c_ = int(c2 * e)  # hidden channels
        self.cv1 = Conv(c1, c_, 1, 1, act=act)
        self.cv2 = Conv(c1, c_, 1, 1, act=act)
        self.cv3 = Conv(2 * c_, c2, 1, act=act)  # act=FReLU(c2)
        self.m = nn.Sequential(*(Bottleneck(c_, c_, shortcut, g, e=1.0, act=act) for _ in range(n)))
        # self.m = nn.Sequential(*[CrossConv(c_, c_, 3, 1, g, 1.0, shortcut) for _ in range(n)])

    def forward(self, x):
        return self.cv3(torch.cat((self.m(self.cv1(x)), self.cv2(x)), dim=1))

class C3TR(C3):
    # C3 module with TransformerBlock()
    def __init__(self, c1, c2, n=1, shortcut=True, g=1, e=0.5):
        super().__init__(c1, c2, n, shortcut, g, e)
        c_ = int(c2 * e)
        self.m = TransformerBlock(c_, c_, 4, n)

class C3SPP(C3):
    # C3 module with SPP()
    def __init__(self, c1, c2, k=(5, 9, 13), n=1, shortcut=True, g=1, e=0.5):
        super().__init__(c1, c2, n, shortcut, g, e)
        c_ = int(c2 * e)
        self.m = SPP(c_, c_, k)

class C3Ghost(C3):
    # C3 module with GhostBottleneck()
    def __init__(self, c1, c2, n=1, shortcut=True, g=1, e=0.5):
        super().__init__(c1, c2, n, shortcut, g, e)
        c_ = int(c2 * e)  # hidden channels
        self.m = nn.Sequential(*(GhostBottleneck(c_, c_) for _ in range(n)))

class SPP(nn.Module):
    # Spatial Pyramid Pooling (SPP) layer https://arxiv.org/abs/1406.4729
    def __init__(self, c1, c2, k=(5, 9, 13)):
        super().__init__()
        c_ = c1 // 2  # hidden channels
        self.cv1 = Conv(c1, c_, 1, 1)
        self.cv2 = Conv(c_ * (len(k) + 1), c2, 1, 1)
        self.m = nn.ModuleList([nn.MaxPool2d(kernel_size=x, stride=1, padding=x // 2) for x in k])

    def forward(self, x):
        x = self.cv1(x)
        with warnings.catch_warnings():
            warnings.simplefilter('ignore')  # suppress torch 1.9.0 max_pool2d() warning
            return self.cv2(torch.cat([x] + [m(x) for m in self.m], 1))

class SPPF(nn.Module):
    # Spatial Pyramid Pooling - Fast (SPPF) layer for YOLOv5 by Glenn Jocher
    def __init__(self, c1, c2, k=5):  # equivalent to SPP(k=(5, 9, 13))
        super().__init__()
        c_ = c1 // 2  # hidden channels
        self.cv1 = Conv(c1, c_, 1, 1)
        self.cv2 = Conv(c_ * 4, c2, 1, 1)
        self.m = nn.MaxPool2d(kernel_size=k, stride=1, padding=k // 2)

    def forward(self, x):
        x = self.cv1(x)
        with warnings.catch_warnings():
            warnings.simplefilter('ignore')  # suppress torch 1.9.0 max_pool2d() warning
            y1 = self.m(x)
            y2 = self.m(y1)
            return self.cv2(torch.cat([x, y1, y2, self.m(y2)], 1))

class Focus(nn.Module):
    # Focus wh information into c-space
    def __init__(self, c1, c2, k=1, s=1, p=None, g=1, act=True):  # ch_in, ch_out, kernel, stride, padding, groups
        super().__init__()
        self.conv = Conv(c1 * 4, c2, k, s, p, g, act)
        # self.contract = Contract(gain=2)

    def forward(self, x):  # x(b,c,w,h) -> y(b,4c,w/2,h/2)
        return self.conv(torch.cat([x[..., ::2, ::2], x[..., 1::2, ::2], x[..., ::2, 1::2], x[..., 1::2, 1::2]], 1))
        # return self.conv(self.contract(x))

class GhostConv(nn.Module):
    # Ghost Convolution https://github.com/huawei-noah/ghostnet
    def __init__(self, c1, c2, k=1, s=1, g=1, act=True):  # ch_in, ch_out, kernel, stride, groups
        super().__init__()
        c_ = c2 // 2  # hidden channels
        self.cv1 = Conv(c1, c_, k, s, None, g, act)
        self.cv2 = Conv(c_, c_, 5, 1, None, c_, act)

    def forward(self, x):
        y = self.cv1(x)
        return torch.cat([y, self.cv2(y)], 1)

class GhostBottleneck(nn.Module):
    # Ghost Bottleneck https://github.com/huawei-noah/ghostnet
    def __init__(self, c1, c2, k=3, s=1):  # ch_in, ch_out, kernel, stride
        super().__init__()
        c_ = c2 // 2
        self.conv = nn.Sequential(GhostConv(c1, c_, 1, 1),  # pw
                                  DWConv(c_, c_, k, s, act=False) if s == 2 else nn.Identity(),  # dw
                                  GhostConv(c_, c2, 1, 1, act=False))  # pw-linear
        self.shortcut = nn.Sequential(DWConv(c1, c1, k, s, act=False),
                                      Conv(c1, c2, 1, 1, act=False)) if s == 2 else nn.Identity()

    def forward(self, x):
        return self.conv(x) + self.shortcut(x)

class Contract(nn.Module):
    # Contract width-height into channels, i.e. x(1,64,80,80) to x(1,256,40,40)
    def __init__(self, gain=2):
        super().__init__()
        self.gain = gain

    def forward(self, x):
        b, c, h, w = x.size()  # assert (h / s == 0) and (W / s == 0), 'Indivisible gain'
        s = self.gain
        x = x.view(b, c, h // s, s, w // s, s)  # x(1,64,40,2,40,2)
        x = x.permute(0, 3, 5, 1, 2, 4).contiguous()  # x(1,2,2,64,40,40)
        return x.view(b, c * s * s, h // s, w // s)  # x(1,256,40,40)

class Expand(nn.Module):
    # Expand channels into width-height, i.e. x(1,64,80,80) to x(1,16,160,160)
    def __init__(self, gain=2):
        super().__init__()
        self.gain = gain

    def forward(self, x):
        b, c, h, w = x.size()  # assert C / s ** 2 == 0, 'Indivisible gain'
        s = self.gain
        x = x.view(b, s, s, c // s ** 2, h, w)  # x(1,2,2,16,80,80)
        x = x.permute(0, 3, 4, 1, 5, 2).contiguous()  # x(1,16,80,2,80,2)
        return x.view(b, c // s ** 2, h * s, w * s)  # x(1,16,160,160)

class Concat(nn.Module):
    # Concatenate a list of tensors along dimension
    def __init__(self, dimension=1):
        super().__init__()
        self.d = dimension

    def forward(self, x):
        return torch.cat(x, self.d)

class Detect(nn.Module):
    stride = None  # strides computed during build
    onnx_dynamic = False  # ONNX export parameter

    def __init__(self, nc=80, anchors=(), ch=(), inplace=True):  # detection layer
        super().__init__()
        self.nc = nc  # number of classes
        self.no = nc + 5  # number of outputs per anchor
        self.nl = len(anchors)  # number of detection layers
        self.na = len(anchors[0]) // 2  # number of anchors
        self.grid = [torch.zeros(1)] * self.nl  # init grid
        self.anchor_grid = [torch.zeros(1)] * self.nl  # init anchor grid
        self.register_buffer('anchors', torch.tensor(anchors).float().view(self.nl, -1, 2))  # shape(nl,na,2)
        self.m = nn.ModuleList(nn.Conv2d(x, self.no * self.na, 1) for x in ch)  # output conv
        self.inplace = inplace  # use in-place ops (e.g. slice assignment)

    def forward(self, x):
        z = []  # inference output
        for i in range(self.nl):
            x[i] = self.m[i](x[i])  # conv
            bs, _, ny, nx = x[i].shape  # x(bs,255,20,20) to x(bs,3,20,20,85)
            x[i] = x[i].view(bs, self.na, self.no, ny, nx).permute(0, 1, 3, 4, 2).contiguous()

            if not self.training:  # inference
                if self.onnx_dynamic or self.grid[i].shape[2:4] != x[i].shape[2:4]:
                    self.grid[i], self.anchor_grid[i] = self._make_grid(nx, ny, i)

                y = x[i].sigmoid()
                if self.inplace:
                    y[..., 0:2] = (y[..., 0:2] * 2 - 0.5 + self.grid[i]) * self.stride[i]  # xy
                    y[..., 2:4] = (y[..., 2:4] * 2) ** 2 * self.anchor_grid[i]  # wh
                else:  # for YOLOv5 on AWS Inferentia https://github.com/ultralytics/yolov5/pull/2953
                    xy = (y[..., 0:2] * 2 - 0.5 + self.grid[i]) * self.stride[i]  # xy
                    wh = (y[..., 2:4] * 2) ** 2 * self.anchor_grid[i]  # wh
                    y = torch.cat((xy, wh, y[..., 4:]), -1)
                z.append(y.view(bs, -1, self.no))

        return x if self.training else (torch.cat(z, 1), x)

    def _make_grid(self, nx=20, ny=20, i=0):
        d = self.anchors[i].device
        if check_version(torch.__version__, '1.10.0'):  # torch>=1.10.0 meshgrid workaround for torch>=0.7 compatibility
            yv, xv = torch.meshgrid([torch.arange(ny, device=d), torch.arange(nx, device=d)], indexing='ij')
        else:
            yv, xv = torch.meshgrid([torch.arange(ny, device=d), torch.arange(nx, device=d)])
        grid = torch.stack((xv, yv), 2).expand((1, self.na, ny, nx, 2)).float()
        anchor_grid = (self.anchors[i].clone() * self.stride[i]) \
            .view((1, self.na, 1, 1, 2)).expand((1, self.na, ny, nx, 2)).float()
        return grid, anchor_grid

class Model(nn.Module):
    def __init__(self, cfg='yolov5s.yaml', ch=3, nc=None, anchors=None):  # model, input channels, number of classes
        super().__init__()
        self.out_indices = None
        if isinstance(cfg, dict):
            self.yaml = cfg  # model dict
        else:  # is *.yaml
            import yaml  # for torch hub
            self.yaml_file = Path(cfg).name
            with open(cfg, encoding='ascii', errors='ignore') as f:
                self.yaml = yaml.safe_load(f)  # model dict

        # Define model
        ch = self.yaml['ch'] = self.yaml.get('ch', ch)  # input channels
        if nc and nc != self.yaml['nc']:
            # LOGGER.info(f"Overriding model.yaml nc={self.yaml['nc']} with nc={nc}")
            self.yaml['nc'] = nc  # override yaml value
        if anchors:
            # LOGGER.info(f'Overriding model.yaml anchors with anchors={anchors}')
            self.yaml['anchors'] = round(anchors)  # override yaml value
        self.model, self.save = parse_model(deepcopy(self.yaml), ch=[ch])  # model, savelist
        self.names = [str(i) for i in range(self.yaml['nc'])]  # default names
        self.inplace = self.yaml.get('inplace', True)

        # Build strides, anchors
        m = self.model[-1]  # Detect()
        # with torch.no_grad():
        if isinstance(m, Detect):
            s = 256  # 2x min stride
            m.inplace = self.inplace
            m.stride = torch.tensor([s / x.shape[-2] for x in self.forward(torch.zeros(1, ch, s, s))])  # forward
            m.anchors /= m.stride.view(-1, 1, 1)
            check_anchor_order(m)
            self.stride = m.stride
            self._initialize_biases()  # only run once

        # Init weights, biases
        initialize_weights(self)

    def forward(self, x, augment=False, profile=False, visualize=False, detect=False):
        if augment:
            return self._forward_augment(x)  # augmented inference, None
        return self._forward_once(x, profile, visualize, detect=detect)  # single-scale inference, train

    def _forward_augment(self, x):
        img_size = x.shape[-2:]  # height, width
        s = [1, 0.83, 0.67]  # scales
        f = [None, 3, None]  # flips (2-ud, 3-lr)
        y = []  # outputs
        for si, fi in zip(s, f):
            xi = scale_img(x.flip(fi) if fi else x, si, gs=int(self.stride.max()))
            yi = self._forward_once(xi)[0]  # forward
            yi = self._descale_pred(yi, fi, si, img_size)
            y.append(yi)
        y = self._clip_augmented(y)  # clip augmented tails
        return torch.cat(y, 1), None  # augmented inference, train

    def _forward_once(self, x, profile=False, visualize=False, detect=False):
        y, dt = [], []  # outputs
        z = []
        for ii, m in enumerate(self.model):
            if m.f != -1:  # if not from previous layer
                x = y[m.f] if isinstance(m.f, int) else [x if j == -1 else y[j] for j in m.f]  # from earlier layers
            if profile:
                self._profile_one_layer(m, x, dt)
            x = m(x)  # run
            y.append(x if m.i in self.save else None)  # save output
            if self.out_indices is not None:
                if m.i in self.out_indices:
                    z.append(x)
        if self.out_indices is not None:
            if detect:
                return x, z
            else:
                return z
        else:
            return x

    def _descale_pred(self, p, flips, scale, img_size):
        # de-scale predictions following augmented inference (inverse operation)
        if self.inplace:
            p[..., :4] /= scale  # de-scale
            if flips == 2:
                p[..., 1] = img_size[0] - p[..., 1]  # de-flip ud
            elif flips == 3:
                p[..., 0] = img_size[1] - p[..., 0]  # de-flip lr
        else:
            x, y, wh = p[..., 0:1] / scale, p[..., 1:2] / scale, p[..., 2:4] / scale  # de-scale
            if flips == 2:
                y = img_size[0] - y  # de-flip ud
            elif flips == 3:
                x = img_size[1] - x  # de-flip lr
            p = torch.cat((x, y, wh, p[..., 4:]), -1)
        return p

    def _clip_augmented(self, y):
        # Clip YOLOv5 augmented inference tails
        nl = self.model[-1].nl  # number of detection layers (P3-P5)
        g = sum(4 ** x for x in range(nl))  # grid points
        e = 1  # exclude layer count
        i = (y[0].shape[1] // g) * sum(4 ** x for x in range(e))  # indices
        y[0] = y[0][:, :-i]  # large
        i = (y[-1].shape[1] // g) * sum(4 ** (nl - 1 - x) for x in range(e))  # indices
        y[-1] = y[-1][:, i:]  # small
        return y

    def _profile_one_layer(self, m, x, dt):
        c = isinstance(m, Detect)  # is final layer, copy input as inplace fix
        for _ in range(10):
            m(x.copy() if c else x)


    def _initialize_biases(self, cf=None):  # initialize biases into Detect(), cf is class frequency
        # https://arxiv.org/abs/1708.02002 section 3.3
        # cf = torch.bincount(torch.tensor(np.concatenate(dataset.labels, 0)[:, 0]).long(), minlength=nc) + 1.
        m = self.model[-1]  # Detect() module
        for mi, s in zip(m.m, m.stride):  # from
            b = mi.bias.view(m.na, -1)  # conv.bias(255) to (3,85)
            b.data[:, 4] += math.log(8 / (640 / s) ** 2)  # obj (8 objects per 640 image)
            b.data[:, 5:] += math.log(0.6 / (m.nc - 0.999999)) if cf is None else torch.log(cf / cf.sum())  # cls
            mi.bias = torch.nn.Parameter(b.view(-1), requires_grad=True)

    def _print_biases(self):
        m = self.model[-1]  # Detect() module
        for mi in m.m:  # from
            b = mi.bias.detach().view(m.na, -1).T  # conv.bias(255) to (3,85)

    def fuse(self):  # fuse model Conv2d() + BatchNorm2d() layers
        for m in self.model.modules():
            if isinstance(m, (Conv, DWConv)) and hasattr(m, 'bn'):
                m.conv = fuse_conv_and_bn(m.conv, m.bn)  # update conv
                delattr(m, 'bn')  # remove batchnorm
                m.forward = m.forward_fuse  # update forward
        # self.info()
        return self

    # def info(self, verbose=False, img_size=640):  # print model information
    #     model_info(self, verbose, img_size)

    def _apply(self, fn):
        # Apply to(), cpu(), cuda(), half() to model tensors that are not parameters or registered buffers
        self = super()._apply(fn)
        m = self.model[-1]  # Detect()
        if isinstance(m, Detect):
            m.stride = fn(m.stride)
            m.grid = list(map(fn, m.grid))
            if isinstance(m.anchor_grid, list):
                m.anchor_grid = list(map(fn, m.anchor_grid))
        return self

def parse_model(d, ch):  # model_dict, input_channels(3)
    # LOGGER.info(f"\n{'':>3}{'from':>18}{'n':>3}{'params':>10}  {'module':<40}{'arguments':<30}")
    anchors, nc, gd, gw = d['anchors'], d['nc'], d['depth_multiple'], d['width_multiple']
    na = (len(anchors[0]) // 2) if isinstance(anchors, list) else anchors  # number of anchors
    no = na * (nc + 5)  # number of outputs = anchors * (classes + 5)

    layers, save, c2 = [], [], ch[-1]  # layers, savelist, ch out
    for i, (f, n, m, args) in enumerate(d['backbone'] + d['head']):  # from, number, module, args
        m = eval(m) if isinstance(m, str) else m  # eval strings
        for j, a in enumerate(args):
            try:
                args[j] = eval(a) if isinstance(a, str) else a  # eval strings
            except NameError:
                pass

        n = n_ = max(round(n * gd), 1) if n > 1 else n  # depth gain
        if m in [Conv, GhostConv, Bottleneck, GhostBottleneck, SPP, SPPF, DWConv, Focus,
                 BottleneckCSP, C3, C3TR, C3SPP, C3Ghost]:
            c1, c2 = ch[f], args[0]
            if c2 != no:  # if not output
                c2 = make_divisible(c2 * gw, 8)

            args = [c1, c2, *args[1:]]
            if m in [BottleneckCSP, C3, C3TR, C3Ghost]:
                args.insert(2, n)  # number of repeats
                n = 1
        elif m is nn.BatchNorm2d:
            args = [ch[f]]
        elif m is Concat:
            c2 = sum(ch[x] for x in f)
        elif m is Detect:
            args.append([ch[x] for x in f])
            if isinstance(args[1], int):  # number of anchors
                args[1] = [list(range(args[1] * 2))] * len(f)
        elif m is Contract:
            c2 = ch[f] * args[0] ** 2
        elif m is Expand:
            c2 = ch[f] // args[0] ** 2
        else:
            c2 = ch[f]

        m_ = nn.Sequential(*(m(*args) for _ in range(n))) if n > 1 else m(*args)  # module
        t = str(m)[8:-2].replace('__main__.', '')  # module type
        np = sum(x.numel() for x in m_.parameters())  # number params
        m_.i, m_.f, m_.type, m_.np = i, f, t, np  # attach index, 'from' index, type, number params
        # LOGGER.info(f'{i:>3}{str(f):>18}{n_:>3}{np:10.0f}  {t:<40}{str(args):<30}')  # print
        save.extend(x % i for x in ([f] if isinstance(f, int) else f) if x != -1)  # append to savelist
        layers.append(m_)
        if i == 0:
            ch = []
        ch.append(c2)
    return nn.Sequential(*layers), sorted(save)

@torch.no_grad()
def load_yolov5_ckpt(weights, map_location='cpu', fuse=True, inplace=True, out_indices=[1, 3, 5, 7, 9]):
    if isinstance(weights, str):
        ckpt = torch.load(weights, map_location=map_location)  # load
    else:
        ckpt = weights
    
    model = Model(ckpt['cfg'])
    model.load_state_dict(ckpt['weights'], strict=True)
    
    if fuse:
        model = model.float().fuse().eval()  # FP32 model
    else:
        model = model.float().eval()  # without layer fuse

    # Compatibility updates
    for m in model.modules():
        if type(m) in [nn.Hardswish, nn.LeakyReLU, nn.ReLU, nn.ReLU6, nn.SiLU, Detect, Model]:
            m.inplace = inplace  # pytorch 1.7.0 compatibility
            if type(m) is Detect:
                if not isinstance(m.anchor_grid, list):  # new Detect Layer compatibility
                    delattr(m, 'anchor_grid')
                    setattr(m, 'anchor_grid', [torch.zeros(1)] * m.nl)
        elif type(m) is Conv:
            m._non_persistent_buffers_set = set()  # pytorch 1.6.0 compatibility
    model.out_indices = out_indices
    return model

class double_conv_up_c3(nn.Module):
    def __init__(self, in_ch, mid_ch, out_ch, act=True):
        super(double_conv_up_c3, self).__init__()
        self.conv = nn.Sequential(
        C3(in_ch+mid_ch, mid_ch, act=act),
        nn.ConvTranspose2d(mid_ch, out_ch, kernel_size=4, stride = 2, padding=1, bias=False),
        nn.BatchNorm2d(out_ch),
        nn.ReLU(inplace=True),
        )

    def forward(self, x):
        return self.conv(x)

class double_conv_c3(nn.Module):
    def __init__(self, in_ch, out_ch, stride=1, act=True):
        super(double_conv_c3, self).__init__()
        if stride > 1 :
            self.down = nn.AvgPool2d(2,stride=2) if stride > 1 else None
        self.conv = C3(in_ch, out_ch, act=act)

    def forward(self, x):
        if self.down is not None :
            x = self.down(x)
        x = self.conv(x)
        return x

class UnetHead(nn.Module):
    def __init__(self, act=True) -> None:

        super(UnetHead, self).__init__()
        self.down_conv1 = double_conv_c3(512, 512, 2, act=act)
        self.upconv0 = double_conv_up_c3(0, 512, 256, act=act)
        self.upconv2 = double_conv_up_c3(256, 512, 256, act=act)
        self.upconv3 = double_conv_up_c3(0, 512, 256, act=act)
        self.upconv4 = double_conv_up_c3(128, 256, 128, act=act)
        self.upconv5 = double_conv_up_c3(64, 128, 64, act=act)
        self.upconv6 = nn.Sequential(
            nn.ConvTranspose2d(64, 1, kernel_size=4, stride = 2, padding=1, bias=False),
            nn.Sigmoid()
        )

    def forward(self, f160, f80, f40, f20, f3, forward_mode=TEXTDET_MASK):
        # input: 640@3
        d10 = self.down_conv1(f3) # 512@10
        u20 = self.upconv0(d10)  # 256@10
        u40 = self.upconv2(torch.cat([f20, u20], dim = 1)) # 256@40

        if forward_mode == TEXTDET_DET:
            return f80, f40, u40
        else:
            u80 = self.upconv3(torch.cat([f40, u40], dim = 1)) # 256@80
            u160 = self.upconv4(torch.cat([f80, u80], dim = 1)) # 128@160
            u320 = self.upconv5(torch.cat([f160, u160], dim = 1)) # 64@320
            mask = self.upconv6(u320)
            if forward_mode == TEXTDET_MASK:
                return mask
            else:
                return mask, [f80, f40, u40]
            
    def init_weight(self, init_func):
        self.apply(init_func)

class DBHead(nn.Module):
    def __init__(self, in_channels, k = 50, shrink_with_sigmoid=True, act=True):
        super().__init__()
        self.k = k
        self.shrink_with_sigmoid = shrink_with_sigmoid
        self.upconv3 = double_conv_up_c3(0, 512, 256, act=act)
        self.upconv4 = double_conv_up_c3(128, 256, 128, act=act)
        self.conv = nn.Sequential(
            nn.Conv2d(128, in_channels, 1),
            nn.BatchNorm2d(in_channels),
            nn.ReLU(inplace=True)
        )
        self.binarize = nn.Sequential(
            nn.Conv2d(in_channels, in_channels // 4, 3, padding=1),
            nn.BatchNorm2d(in_channels // 4),
            nn.ReLU(inplace=True),
            nn.ConvTranspose2d(in_channels // 4, in_channels // 4, 2, 2),
            nn.BatchNorm2d(in_channels // 4),
            nn.ReLU(inplace=True),
            nn.ConvTranspose2d(in_channels // 4, 1, 2, 2)
            )
        self.thresh = self._init_thresh(in_channels)

    def forward(self, f80, f40, u40, shrink_with_sigmoid=True, step_eval=False):
        shrink_with_sigmoid = self.shrink_with_sigmoid
        u80 = self.upconv3(torch.cat([f40, u40], dim = 1)) # 256@80
        x = self.upconv4(torch.cat([f80, u80], dim = 1)) # 128@160
        x = self.conv(x)
        threshold_maps = self.thresh(x)
        x = self.binarize(x)
        shrink_maps = torch.sigmoid(x)
        
        if self.training:
            binary_maps = self.step_function(shrink_maps, threshold_maps)
            if shrink_with_sigmoid:
                return torch.cat((shrink_maps, threshold_maps, binary_maps), dim=1)
            else:
                return torch.cat((shrink_maps, threshold_maps, binary_maps, x), dim=1)
        else:
            if step_eval:
                return self.step_function(shrink_maps, threshold_maps)
            else:
                return torch.cat((shrink_maps, threshold_maps), dim=1)

    def init_weight(self, init_func):
        self.apply(init_func)

    def _init_thresh(self, inner_channels, serial=False, smooth=False, bias=False):
        in_channels = inner_channels
        if serial:
            in_channels += 1
        self.thresh = nn.Sequential(
            nn.Conv2d(in_channels, inner_channels // 4, 3, padding=1, bias=bias),
            nn.BatchNorm2d(inner_channels // 4),
            nn.ReLU(inplace=True),
            self._init_upsample(inner_channels // 4, inner_channels // 4, smooth=smooth, bias=bias),
            nn.BatchNorm2d(inner_channels // 4),
            nn.ReLU(inplace=True),
            self._init_upsample(inner_channels // 4, 1, smooth=smooth, bias=bias),
            nn.Sigmoid())
        return self.thresh

    def _init_upsample(self, in_channels, out_channels, smooth=False, bias=False):
        if smooth:
            inter_out_channels = out_channels
            if out_channels == 1:
                inter_out_channels = in_channels
            module_list = [
                nn.Upsample(scale_factor=2, mode='nearest'),
                nn.Conv2d(in_channels, inter_out_channels, 3, 1, 1, bias=bias)]
            if out_channels == 1:
                module_list.append(nn.Conv2d(in_channels, out_channels, kernel_size=1, stride=1, padding=1, bias=True))
            return nn.Sequential(module_list)
        else:
            return nn.ConvTranspose2d(in_channels, out_channels, 2, 2)

    def step_function(self, x, y):
        return torch.reciprocal(1 + torch.exp(-self.k * (x - y)))

def get_base_det_models(model_path, device='cpu', half=False, act='leaky'):
    textdetector_dict = torch.load(model_path, map_location=device)
    blk_det = load_yolov5_ckpt(textdetector_dict['blk_det'], map_location=device)
    text_seg = UnetHead(act=act)
    text_seg.load_state_dict(textdetector_dict['text_seg'])
    text_det = DBHead(64, act=act)
    text_det.load_state_dict(textdetector_dict['text_det'])
    if half:
        return blk_det.eval().half(), text_seg.eval().half(), text_det.eval().half()
    return blk_det.eval().to(device), text_seg.eval().to(device), text_det.eval().to(device)

class TextDetBase(nn.Module):
    def __init__(self, model_path, device='cpu', half=False, fuse=False, act='leaky'):
        super(TextDetBase, self).__init__()
        self.blk_det, self.text_seg, self.text_det = get_base_det_models(model_path, device, half, act=act)
        if fuse:
            self.fuse()

    def fuse(self):
        def _fuse(model):
            for m in model.modules():
                if isinstance(m, (Conv)) and hasattr(m, 'bn'):
                    m.conv = fuse_conv_and_bn(m.conv, m.bn)  # update conv
                    delattr(m, 'bn')  # remove batchnorm
                    m.forward = m.forward_fuse  # update forward
            return model
        self.text_seg = _fuse(self.text_seg)
        self.text_det = _fuse(self.text_det)

    def forward(self, features):
        blks, features = self.blk_det(features, detect=True)
        mask, features = self.text_seg(*features, forward_mode=TEXTDET_INFERENCE)
        lines = self.text_det(*features, step_eval=False)
        return blks[0], mask, lines

class TextDetBaseDNN:
    def __init__(self, input_size, model_path):
        self.input_size = input_size
        self.model = cv2.dnn.readNetFromONNX(model_path)
        self.uoln = self.model.getUnconnectedOutLayersNames()
    
    def __call__(self, im_in):
        blob = cv2.dnn.blobFromImage(im_in, scalefactor=1 / 255.0, size=(self.input_size, self.input_size))
        self.model.setInput(blob)
        blks, mask, lines_map  = self.model.forward(self.uoln)
        return blks, mask, lines_map

class SegDetectorRepresenter():
    def __init__(self, thresh=0.3, box_thresh=0.7, max_candidates=1000, unclip_ratio=1.5):
        self.min_size = 3
        self.thresh = thresh
        self.box_thresh = box_thresh
        self.max_candidates = max_candidates
        self.unclip_ratio = unclip_ratio

    def __call__(self, batch, pred, is_output_polygon=False):
        '''
        batch: (image, polygons, ignore_tags
        batch: a dict produced by dataloaders.
            image: tensor of shape (N, C, H, W).
            polygons: tensor of shape (N, K, 4, 2), the polygons of objective regions.
            ignore_tags: tensor of shape (N, K), indicates whether a region is ignorable or not.
            shape: the original shape of images.
            filename: the original filenames of images.
        pred:
            binary: text region segmentation map, with shape (N, H, W)
            thresh: [if exists] thresh hold prediction with shape (N, H, W)
            thresh_binary: [if exists] binarized with threshhold, (N, H, W)
        '''
        pred = pred[:, 0, :, :]
        segmentation = self.binarize(pred)
        boxes_batch = []
        scores_batch = []
        # print(pred.size())
        batch_size = pred.size(0) if isinstance(pred, torch.Tensor) else pred.shape[0]
        for batch_index in range(batch_size):
            # height, width = batch['shape'][batch_index]
            height, width = pred.shape[1], pred.shape[2]
            if is_output_polygon:
                boxes, scores = self.polygons_from_bitmap(pred[batch_index], segmentation[batch_index], width, height)
            else:
                boxes, scores = self.boxes_from_bitmap(pred[batch_index], segmentation[batch_index], width, height)
            boxes_batch.append(boxes)
            scores_batch.append(scores)
        return boxes_batch, scores_batch

    def binarize(self, pred):
        return pred > self.thresh

    def polygons_from_bitmap(self, pred, _bitmap, dest_width, dest_height):
        '''
        _bitmap: single map with shape (H, W),
            whose values are binarized as {0, 1}
        '''

        assert len(_bitmap.shape) == 2
        bitmap = _bitmap.cpu().numpy()  # The first channel
        pred = pred.cpu().detach().numpy()
        height, width = bitmap.shape
        boxes = []
        scores = []

        contours, _ = cv2.findContours((bitmap * 255).astype(np.uint8), cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)

        for contour in contours[:self.max_candidates]:
            epsilon = 0.005 * cv2.arcLength(contour, True)
            approx = cv2.approxPolyDP(contour, epsilon, True)
            points = approx.reshape((-1, 2))
            if points.shape[0] < 4:
                continue
            # _, sside = self.get_mini_boxes(contour)
            # if sside < self.min_size:
            #     continue
            score = self.box_score_fast(pred, contour.squeeze(1))
            if self.box_thresh > score:
                continue

            if points.shape[0] > 2:
                box = self.unclip(points, unclip_ratio=self.unclip_ratio)
                if len(box) > 1:
                    continue
            else:
                continue
            box = box.reshape(-1, 2)
            _, sside = self.get_mini_boxes(box.reshape((-1, 1, 2)))
            if sside < self.min_size + 2:
                continue

            if not isinstance(dest_width, int):
                dest_width = dest_width.item()
                dest_height = dest_height.item()

            box[:, 0] = np.clip(np.round(box[:, 0] / width * dest_width), 0, dest_width)
            box[:, 1] = np.clip(np.round(box[:, 1] / height * dest_height), 0, dest_height)
            boxes.append(box)
            scores.append(score)
        return boxes, scores

    def boxes_from_bitmap(self, pred, _bitmap, dest_width, dest_height):
        '''
        _bitmap: single map with shape (H, W),
            whose values are binarized as {0, 1}
        '''

        assert len(_bitmap.shape) == 2
        if isinstance(pred, torch.Tensor):
            bitmap = _bitmap.cpu().numpy()  # The first channel
            pred = pred.cpu().detach().numpy()
        else:
            bitmap = _bitmap
        height, width = bitmap.shape
        contours, _ = cv2.findContours((bitmap * 255).astype(np.uint8), cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
        num_contours = min(len(contours), self.max_candidates)
        boxes = np.zeros((num_contours, 4, 2), dtype=np.int16)
        scores = np.zeros((num_contours,), dtype=np.float32)

        for index in range(num_contours):
            contour = contours[index].squeeze(1)
            points, sside = self.get_mini_boxes(contour)
            # if sside < self.min_size:
            #     continue
            if sside < 2:
                continue
            points = np.array(points)
            score = self.box_score_fast(pred, contour)
            # if self.box_thresh > score:
            #     continue

            box = self.unclip(points, unclip_ratio=self.unclip_ratio).reshape(-1, 1, 2)
            box, sside = self.get_mini_boxes(box)
            # if sside < 5:
            #     continue
            box = np.array(box)
            if not isinstance(dest_width, int):
                dest_width = dest_width.item()
                dest_height = dest_height.item()

            box[:, 0] = np.clip(np.round(box[:, 0] / width * dest_width), 0, dest_width)
            box[:, 1] = np.clip(np.round(box[:, 1] / height * dest_height), 0, dest_height)
            boxes[index, :, :] = box.astype(np.int16)
            scores[index] = score
        return boxes, scores

    def unclip(self, box, unclip_ratio=1.5):
        poly = Polygon(box)
        distance = poly.area * unclip_ratio / poly.length
        offset = pyclipper.PyclipperOffset()
        offset.AddPath(box, pyclipper.JT_ROUND, pyclipper.ET_CLOSEDPOLYGON)
        expanded = np.array(offset.Execute(distance))
        return expanded

    def get_mini_boxes(self, contour):
        bounding_box = cv2.minAreaRect(contour)
        points = sorted(list(cv2.boxPoints(bounding_box)), key=lambda x: x[0])

        index_1, index_2, index_3, index_4 = 0, 1, 2, 3
        if points[1][1] > points[0][1]:
            index_1 = 0
            index_4 = 1
        else:
            index_1 = 1
            index_4 = 0
        if points[3][1] > points[2][1]:
            index_2 = 2
            index_3 = 3
        else:
            index_2 = 3
            index_3 = 2

        box = [points[index_1], points[index_2], points[index_3], points[index_4]]
        return box, min(bounding_box[1])

    def box_score_fast(self, bitmap, _box):
        h, w = bitmap.shape[:2]
        box = _box.copy()
        xmin = np.clip(np.floor(box[:, 0].min()).astype(np.int64), 0, w - 1)
        xmax = np.clip(np.ceil(box[:, 0].max()).astype(np.int64), 0, w - 1)
        ymin = np.clip(np.floor(box[:, 1].min()).astype(np.int64), 0, h - 1)
        ymax = np.clip(np.ceil(box[:, 1].max()).astype(np.int64), 0, h - 1)

        mask = np.zeros((ymax - ymin + 1, xmax - xmin + 1), dtype=np.uint8)
        box[:, 0] = box[:, 0] - xmin
        box[:, 1] = box[:, 1] - ymin
        cv2.fillPoly(mask, box.reshape(1, -1, 2).astype(np.int32), 1)
        if bitmap.dtype == np.float16:
            bitmap = bitmap.astype(np.float32)
        return cv2.mean(bitmap[ymin:ymax + 1, xmin:xmax + 1], mask)[0]

def union_area(bboxa, bboxb):
    x1 = max(bboxa[0], bboxb[0])
    y1 = max(bboxa[1], bboxb[1])
    x2 = min(bboxa[2], bboxb[2])
    y2 = min(bboxa[3], bboxb[3])
    if y2 < y1 or x2 < x1:
        return -1
    return (y2 - y1) * (x2 - x1)

# 4 points bbox to 8 points polygon
def xywh2xyxypoly(xywh, to_int=True):
    xyxypoly = np.tile(xywh[:, [0, 1]], 4)
    xyxypoly[:, [2, 4]] += xywh[:, [2]]
    xyxypoly[:, [5, 7]] += xywh[:, [3]]
    if to_int:
        xyxypoly = xyxypoly.astype(np.int64)
    return xyxypoly

def rotate_polygons(center, polygons, rotation, new_center=None, to_int=True):
    if new_center is None:
        new_center = center
    rotation = np.deg2rad(rotation)
    s, c = np.sin(rotation), np.cos(rotation)
    polygons = polygons.astype(np.float32)
    
    polygons[:, 1::2] -= center[1]
    polygons[:, ::2] -= center[0]
    rotated = np.copy(polygons)
    rotated[:, 1::2] = polygons[:, 1::2] * c - polygons[:, ::2] * s
    rotated[:, ::2] = polygons[:, 1::2] * s + polygons[:, ::2] * c
    rotated[:, 1::2] += new_center[1]
    rotated[:, ::2] += new_center[0]
    if to_int:
        return rotated.astype(np.int64)
    return rotated

def letterbox(im, new_shape=(640, 640), color=(0, 0, 0), auto=False, scaleFill=False, scaleup=True, stride=128):
    # Resize and pad image while meeting stride-multiple constraints
    shape = im.shape[:2]  # current shape [height, width]
    if not isinstance(new_shape, tuple):
        new_shape = (new_shape, new_shape)

    # Scale ratio (new / old)
    r = min(new_shape[0] / shape[0], new_shape[1] / shape[1])
    if not scaleup:  # only scale down, do not scale up (for better val mAP)
        r = min(r, 1.0)

    # Compute padding
    ratio = r, r  # width, height ratios
    new_unpad = int(round(shape[1] * r)), int(round(shape[0] * r))
    dw, dh = new_shape[1] - new_unpad[0], new_shape[0] - new_unpad[1]  # wh padding
    if auto:  # minimum rectangle
        dw, dh = np.mod(dw, stride), np.mod(dh, stride)  # wh padding
    elif scaleFill:  # stretch
        dw, dh = 0.0, 0.0
        new_unpad = (new_shape[1], new_shape[0])
        ratio = new_shape[1] / shape[1], new_shape[0] / shape[0]  # width, height ratios

    # dw /= 2  # divide padding into 2 sides
    # dh /= 2
    dh, dw = int(dh), int(dw)

    if shape[::-1] != new_unpad:  # resize
        im = cv2.resize(im, new_unpad, interpolation=cv2.INTER_LINEAR)
    top, bottom = int(round(dh - 0.1)), int(round(dh + 0.1))
    left, right = int(round(dw - 0.1)), int(round(dw + 0.1))
    im = cv2.copyMakeBorder(im, 0, dh, 0, dw, cv2.BORDER_CONSTANT, value=color)  # add border
    return im, ratio, (dw, dh)

def expand_textwindow(img_size, xyxy, expand_r=8, shrink=False):
    im_h, im_w = img_size[:2]
    x1, y1 , x2, y2 = xyxy
    w = x2 - x1
    h = y2 - y1
    paddings = int(round((max(h, w) * 0.25 + min(h, w) * 0.75) / expand_r))
    if shrink:
        paddings *= -1
    x1, y1 = max(0, x1 - paddings), max(0, y1 - paddings)
    x2, y2 = min(im_w-1, x2+paddings), min(im_h-1, y2+paddings)
    return [x1, y1, x2, y2]

def draw_connected_labels(num_labels, labels, stats, centroids, names="draw_connected_labels", skip_background=True):
    labdraw = np.zeros((labels.shape[0], labels.shape[1], 3), dtype=np.uint8)
    max_ind = 0
    if isinstance(num_labels, int):
        num_labels = range(num_labels)
    
    # for ind, lab in enumerate((range(num_labels))):
    for lab in num_labels:
        if skip_background and lab == 0:
            continue
        randcolor = (random.randint(0,255), random.randint(0,255), random.randint(0,255))
        labdraw[np.where(labels==lab)] = randcolor
        maxr, minr = 0.5, 0.001
        maxw, maxh = stats[max_ind][2] * maxr, stats[max_ind][3] * maxr
        minarea = labdraw.shape[0] * labdraw.shape[1] * minr

        stat = stats[lab]
        bboxarea = stat[2] * stat[3]
        if stat[2] < maxw and stat[3] < maxh and bboxarea > minarea:
            pix = np.zeros((labels.shape[0], labels.shape[1]), dtype=np.uint8)
            pix[np.where(labels==lab)] = 255

            rect = cv2.minAreaRect(cv2.findNonZero(pix))
            box = np.int0(cv2.boxPoints(rect))
            labdraw = cv2.drawContours(labdraw, [box], 0, randcolor, 2)
            labdraw = cv2.circle(labdraw, (int(centroids[lab][0]),int(centroids[lab][1])), radius=5, color=(random.randint(0,255), random.randint(0,255), random.randint(0,255)), thickness=-1)                

    cv2.imshow(names, labdraw)
    return labdraw

def imread(imgpath, read_type=cv2.IMREAD_COLOR):
    img = cv2.imdecode(np.fromfile(imgpath, dtype=np.uint8), read_type)
    return img

class TextBlock(object):
    def __init__(self, xyxy: List, 
                       lines: List = None, 
                       language: str = 'unknown',
                       vertical: bool = False, 
                       font_size: float = -1,
                       distance: List = None,
                       angle: int = 0,
                       vec: List = None,
                       norm: float = -1,
                       merged: bool = False,
                       weight: float = -1,
                       text: List = None,
                       translation: str = "",
                       fg_r = 0,
                       fg_g = 0,
                       fg_b = 0,
                       bg_r = 0,
                       bg_g = 0,
                       bg_b = 0,                
                       line_spacing = 1.,
                       font_family: str = "",
                       bold: bool = False,
                       underline: bool = False,
                       italic: bool = False,
                       alignment: int = -1,
                       alpha: float = 255,
                       rich_text: str = "",
                       _bounding_rect: List = None,
                       accumulate_color = True,
                       default_stroke_width = 0.2,
                       target_lang: str = "",
                       **kwargs) -> None:
        self.xyxy = [int(num) for num in xyxy]                    # boundingbox of textblock
        self.lines = [] if lines is None else lines     # polygons of textlines
        self.vertical = vertical            # orientation of textlines
        self.language = language
        self.font_size = font_size          # font pixel size
        self.distance = None if distance is None else np.array(distance, np.float64)   # distance between textlines and "origin"          
        self.angle = angle                  # rotation angle of textlines

        self.vec = None if vec is None else np.array(vec, np.float64) # primary vector of textblock
        self.norm = norm                    # primary norm of textblock
        self.merged = merged
        self.weight = weight

        self.text = text if text is not None else []
        self.prob = 1

        self.translation = translation

        # note they're accumulative rgb values of textlines
        self.fg_r = fg_r                       
        self.fg_g = fg_g
        self.fg_b = fg_b
        self.bg_r = bg_r
        self.bg_g = bg_g
        self.bg_b = bg_b

        # self.stroke_width = stroke_width
        self.font_family: str = font_family
        self.bold: bool = bold
        self.underline: bool = underline
        self.italic: bool = italic
        self.alpha = alpha
        self.rich_text = rich_text
        self.line_spacing = line_spacing
        # self.alignment = alignment
        self._alignment = alignment
        self._target_lang = target_lang

        self._bounding_rect = _bounding_rect
        self.default_stroke_width = default_stroke_width
        self.accumulate_color = accumulate_color

    def adjust_bbox(self, with_bbox=False):
        lines = self.lines_array().astype(np.int32)
        if with_bbox:
            self.xyxy[0] = min(lines[..., 0].min(), self.xyxy[0])
            self.xyxy[1] = min(lines[..., 1].min(), self.xyxy[1])
            self.xyxy[2] = max(lines[..., 0].max(), self.xyxy[2])
            self.xyxy[3] = max(lines[..., 1].max(), self.xyxy[3])
        else:
            self.xyxy[0] = lines[..., 0].min()
            self.xyxy[1] = lines[..., 1].min()
            self.xyxy[2] = lines[..., 0].max()
            self.xyxy[3] = lines[..., 1].max()

    def sort_lines(self):
        if self.distance is not None:
            idx = np.argsort(self.distance)
            self.distance = self.distance[idx]
            lines = np.array(self.lines, dtype=np.int32)
            self.lines = lines[idx].tolist()

    def lines_array(self, dtype=np.float64):
        return np.array(self.lines, dtype=dtype)

    def aspect_ratio(self) -> float:
        min_rect = self.min_rect()
        middle_pnts = (min_rect[:, [1, 2, 3, 0]] + min_rect) / 2
        norm_v = np.linalg.norm(middle_pnts[:, 2] - middle_pnts[:, 0])
        norm_h = np.linalg.norm(middle_pnts[:, 1] - middle_pnts[:, 3])
        return norm_v / norm_h

    def center(self):
        xyxy = np.array(self.xyxy)
        return (xyxy[:2] + xyxy[2:]) / 2
    
    def min_rect(self, rotate_back=True):
        angled = self.angle != 0
        center = self.center()
        polygons = self.lines_array().reshape(-1, 8)
        if angled:
            polygons = rotate_polygons(center, polygons, self.angle)
        min_x = polygons[:, ::2].min()
        min_y = polygons[:, 1::2].min()
        max_x = polygons[:, ::2].max()
        max_y = polygons[:, 1::2].max()
        min_bbox = np.array([[min_x, min_y, max_x, min_y, max_x, max_y, min_x, max_y]])
        if angled and rotate_back:
            min_bbox = rotate_polygons(center, min_bbox, -self.angle)
        return min_bbox.reshape(-1, 4, 2).astype(np.int64)

    # equivalent to qt's boundingRect, ignore angle
    def bounding_rect(self):
        if self._bounding_rect is None:
        # if True:
            min_bbox = self.min_rect(rotate_back=False)[0]
            x, y = min_bbox[0]
            w, h = min_bbox[2] - min_bbox[0]
            return [x, y, w, h]
        return self._bounding_rect

    def __getattribute__(self, name: str):
        if name == 'pts':
            return self.lines_array()
        # else:
        return object.__getattribute__(self, name)

    def __len__(self):
        return len(self.lines)

    def __getitem__(self, idx):
        return self.lines[idx]

    def to_dict(self):
        blk_dict = deepcopy(vars(self))
        return blk_dict

    def get_transformed_region(self, img, idx, textheight) -> np.ndarray :
        im_h, im_w = img.shape[:2]
        direction = 'v' if self.vertical else 'h'
        src_pts = np.array(self.lines[idx], dtype=np.float64)

        if self.language == 'eng' or (self.language == 'unknown' and not self.vertical):
            e_size = self.font_size / 3
            src_pts[..., 0] += np.array([-e_size, e_size, e_size, -e_size])
            src_pts[..., 1] += np.array([-e_size, -e_size, e_size, e_size])
            src_pts[..., 0] = np.clip(src_pts[..., 0], 0, im_w)
            src_pts[..., 1] = np.clip(src_pts[..., 1], 0, im_h)

        middle_pnt = (src_pts[[1, 2, 3, 0]] + src_pts) / 2
        vec_v = middle_pnt[2] - middle_pnt[0]   # vertical vectors of textlines
        vec_h = middle_pnt[1] - middle_pnt[3]   # horizontal vectors of textlines
        ratio = np.linalg.norm(vec_v) / np.linalg.norm(vec_h)

        if direction == 'h' :
            h = int(textheight)
            w = int(round(textheight / ratio))
            dst_pts = np.array([[0, 0], [w - 1, 0], [w - 1, h - 1], [0, h - 1]]).astype(np.float32)
            M, _ = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 5.0)
            region = cv2.warpPerspective(img, M, (w, h))
        elif direction == 'v' :
            w = int(textheight)
            h = int(round(textheight * ratio))
            dst_pts = np.array([[0, 0], [w - 1, 0], [w - 1, h - 1], [0, h - 1]]).astype(np.float32)
            M, _ = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 5.0)
            region = cv2.warpPerspective(img, M, (w, h))
            region = cv2.rotate(region, cv2.ROTATE_90_COUNTERCLOCKWISE)
        # cv2.imshow('region'+str(idx), region)
        # cv2.waitKey(0)
        return region

    def get_text(self):
        if isinstance(self.text, str):
            return self.text
        return ' '.join(self.text).strip()

    def set_font_colors(self, frgb, srgb, accumulate=True):
        self.accumulate_color = accumulate
        num_lines = len(self.lines) if accumulate and len(self.lines) > 0 else 1
        # set font color
        frgb = np.array(frgb) * num_lines
        self.fg_r, self.fg_g, self.fg_b = frgb
        # set stroke color  
        srgb = np.array(srgb) * num_lines
        self.bg_r, self.bg_g, self.bg_b = srgb

    def get_font_colors(self, bgr=False):
        num_lines = len(self.lines)
        frgb = np.array([self.fg_r, self.fg_g, self.fg_b])
        brgb = np.array([self.bg_r, self.bg_g, self.bg_b])
        if self.accumulate_color:
            if num_lines > 0:
                frgb = (frgb / num_lines).astype(np.int32)
                brgb = (brgb / num_lines).astype(np.int32)
                if bgr:
                    return frgb[::-1], brgb[::-1]
                else:
                    return frgb, brgb
            else:
                return [0, 0, 0], [0, 0, 0]
        else:
            return frgb, brgb

    def xywh(self):
        x, y, w, h = self.xyxy
        return [x, y, w-x, h-y]

    # alignleft: 0, center: 1, right: 2 
    def alignment(self):
        if self._alignment >= 0:
            return self._alignment
        elif self.vertical:
            return 0
        lines = self.lines_array()
        if len(lines) == 1:
            return 0
        angled = self.angle != 0
        polygons = lines.reshape(-1, 8)
        if angled:
            polygons = rotate_polygons((0, 0), polygons, self.angle)
        polygons = polygons.reshape(-1, 4, 2)
        
        left_std = np.std(polygons[:, 0, 0])
        # right_std = np.std(polygons[:, 1, 0])
        center_std = np.std((polygons[:, 0, 0] + polygons[:, 1, 0]) / 2)
        if left_std < center_std:
            return 0
        else:
            return 1

    def target_lang(self):
        return self.target_lang

    @property
    def stroke_width(self):
        var = np.array([self.fg_r, self.fg_g, self.fg_b]) \
            - np.array([self.bg_r, self.bg_g, self.bg_b])
        var = np.abs(var).sum()
        if var > 40:
            return self.default_stroke_width
        return 0

def sort_textblk_list(blk_list: List[TextBlock], im_w: int, im_h: int) -> List[TextBlock]:
    if len(blk_list) == 0:
        return blk_list
    num_ja = 0
    xyxy = []
    for blk in blk_list:
        if blk.language == 'ja':
            num_ja += 1
        xyxy.append(blk.xyxy)
    xyxy = np.array(xyxy)
    flip_lr = num_ja > len(blk_list) / 2
    im_oriw = im_w
    if im_w > im_h:
        im_w /= 2
    num_gridy, num_gridx = 4, 3
    img_area = im_h * im_w
    center_x = (xyxy[:, 0] + xyxy[:, 2]) / 2
    if flip_lr:
        if im_w != im_oriw:
            center_x = im_oriw - center_x
        else:
            center_x = im_w - center_x
    grid_x = (center_x / im_w * num_gridx).astype(np.int32)
    center_y = (xyxy[:, 1] + xyxy[:, 3]) / 2
    grid_y = (center_y / im_h * num_gridy).astype(np.int32)
    grid_indices = grid_y * num_gridx + grid_x
    grid_weights = grid_indices * img_area + 1.2 * (center_x - grid_x * im_w / num_gridx) + (center_y - grid_y * im_h / num_gridy)
    if im_w != im_oriw:
        grid_weights[np.where(grid_x >= num_gridx)] += img_area * num_gridy * num_gridx
    
    for blk, weight in zip(blk_list, grid_weights):
        blk.weight = weight
    blk_list.sort(key=lambda blk: blk.weight)
    return blk_list

def examine_textblk(blk: TextBlock, im_w: int, im_h: int, sort: bool = False) -> None:
    lines = blk.lines_array()
    middle_pnts = (lines[:, [1, 2, 3, 0]] + lines) / 2
    vec_v = middle_pnts[:, 2] - middle_pnts[:, 0]   # vertical vectors of textlines
    vec_h = middle_pnts[:, 1] - middle_pnts[:, 3]   # horizontal vectors of textlines
    # if sum of vertical vectors is longer, then text orientation is vertical, and vice versa.
    center_pnts = (lines[:, 0] + lines[:, 2]) / 2
    v = np.sum(vec_v, axis=0)
    h = np.sum(vec_h, axis=0)
    norm_v, norm_h = np.linalg.norm(v), np.linalg.norm(h)
    if blk.language == 'ja':
        vertical = norm_v > norm_h
    else:
        vertical = norm_v > norm_h * 2
    # calcuate distance between textlines and origin 
    if vertical:
        primary_vec, primary_norm = v, norm_v
        distance_vectors = center_pnts - np.array([[im_w, 0]], dtype=np.float64)   # vertical manga text is read from right to left, so origin is (imw, 0)
        font_size = int(round(norm_h / len(lines)))
    else:
        primary_vec, primary_norm = h, norm_h
        distance_vectors = center_pnts - np.array([[0, 0]], dtype=np.float64)
        font_size = int(round(norm_v / len(lines)))
    
    rotation_angle = int(math.atan2(primary_vec[1], primary_vec[0]) / math.pi * 180)     # rotation angle of textlines
    distance = np.linalg.norm(distance_vectors, axis=1)     # distance between textlinecenters and origin
    rad_matrix = np.arccos(np.einsum('ij, j->i', distance_vectors, primary_vec) / (distance * primary_norm))
    distance = np.abs(np.sin(rad_matrix) * distance)
    blk.lines = lines.astype(np.int32).tolist()
    blk.distance = distance
    blk.angle = rotation_angle
    if vertical:
        blk.angle -= 90
    if abs(blk.angle) < 3:
        blk.angle = 0
    blk.font_size = font_size
    blk.vertical = vertical
    blk.vec = primary_vec
    blk.norm = primary_norm
    if sort:
        blk.sort_lines()

def try_merge_textline(blk: TextBlock, blk2: TextBlock, fntsize_tol=1.3, distance_tol=2) -> bool:
    if blk2.merged:
        return False
    fntsize_div = blk.font_size / blk2.font_size
    num_l1, num_l2 = len(blk), len(blk2)
    fntsz_avg = (blk.font_size * num_l1 + blk2.font_size * num_l2) / (num_l1 + num_l2)
    vec_prod = blk.vec @ blk2.vec
    vec_sum = blk.vec + blk2.vec
    cos_vec = vec_prod / blk.norm / blk2.norm
    distance = blk2.distance[-1] - blk.distance[-1]
    distance_p1 = np.linalg.norm(np.array(blk2.lines[-1][0]) - np.array(blk.lines[-1][0]))
    l1, l2 = Polygon(blk.lines[-1]), Polygon(blk2.lines[-1])
    if not l1.intersects(l2):
        if fntsize_div > fntsize_tol or 1 / fntsize_div > fntsize_tol:
            return False
        if abs(cos_vec) < 0.866:   # cos30
            return False
        if distance > distance_tol * fntsz_avg or distance_p1 > fntsz_avg * 2.5:
            return False
    # merge
    blk.lines.append(blk2.lines[0])
    blk.vec = vec_sum
    blk.angle = int(round(np.rad2deg(math.atan2(vec_sum[1], vec_sum[0]))))
    if blk.vertical:
        blk.angle -= 90
    blk.norm = np.linalg.norm(vec_sum)
    blk.distance = np.append(blk.distance, blk2.distance[-1])
    blk.font_size = fntsz_avg
    blk2.merged = True
    return True

def merge_textlines(blk_list: List[TextBlock]) -> List[TextBlock]:
    if len(blk_list) < 2:
        return blk_list
    blk_list.sort(key=lambda blk: blk.distance[0])
    merged_list = []
    for ii, current_blk in enumerate(blk_list):
        if current_blk.merged:
            continue
        for jj, blk in enumerate(blk_list[ii+1:]):
            try_merge_textline(current_blk, blk)
        merged_list.append(current_blk)
    for blk in merged_list:
        blk.adjust_bbox(with_bbox=False)
    return merged_list

def split_textblk(blk: TextBlock):
    font_size, distance, lines = blk.font_size, blk.distance, blk.lines
    l0 = np.array(blk.lines[0])
    lines.sort(key=lambda line: np.linalg.norm(np.array(line[0]) - l0[0]))
    distance_tol = font_size * 2
    current_blk = deepcopy(blk)
    current_blk.lines = [l0]
    sub_blk_list = [current_blk]
    textblock_splitted = False
    for jj, line in enumerate(lines[1:]):
        l1, l2 = Polygon(lines[jj]), Polygon(line)
        split = False
        if not l1.intersects(l2):
            line_disance = abs(distance[jj+1] - distance[jj])
            if line_disance > distance_tol:
                split = True
            elif blk.vertical and abs(blk.angle) < 15:
                if len(current_blk.lines) > 1 or line_disance > font_size:
                    split = abs(lines[jj][0][1] - line[0][1]) > font_size
        if split:
            current_blk = deepcopy(current_blk)
            current_blk.lines = [line]
            sub_blk_list.append(current_blk)
        else:
            current_blk.lines.append(line)
    if len(sub_blk_list) > 1:
        textblock_splitted = True
        for current_blk in sub_blk_list:
            current_blk.adjust_bbox(with_bbox=False)
    return textblock_splitted, sub_blk_list

def group_output(blks, lines, im_w, im_h, mask=None, sort_blklist=True) -> List[TextBlock]:
    blk_list: List[TextBlock] = []
    scattered_lines = {'ver': [], 'hor': []}
    for bbox, cls, conf in zip(*blks):
        # cls could give wrong result
        blk_list.append(TextBlock(bbox, language=LANG_LIST[cls]))

    # step1: filter & assign lines to textblocks
    bbox_score_thresh = 0.4
    mask_score_thresh = 0.1
    for ii, line in enumerate(lines):
        bx1, bx2 = line[:, 0].min(), line[:, 0].max()
        by1, by2 = line[:, 1].min(), line[:, 1].max()
        bbox_score, bbox_idx = -1, -1
        line_area = (by2-by1) * (bx2-bx1)
        for jj, blk in enumerate(blk_list):
            score = union_area(blk.xyxy, [bx1, by1, bx2, by2]) / line_area
            if bbox_score < score:
                bbox_score = score
                bbox_idx = jj
        if bbox_score > bbox_score_thresh:
            blk_list[bbox_idx].lines.append(line)
        else:   # if no textblock was assigned, check whether there is "enough" textmask
            if mask is not None:
                mask_score = mask[by1: by2, bx1: bx2].mean() / 255
                if mask_score < mask_score_thresh:
                    continue
            blk = TextBlock([bx1, by1, bx2, by2], [line])
            examine_textblk(blk, im_w, im_h, sort=False)
            if blk.vertical:
                scattered_lines['ver'].append(blk)
            else:
                scattered_lines['hor'].append(blk)

    # step2: filter textblocks, sort & split textlines
    final_blk_list = []
    for blk in blk_list:
        # filter textblocks 
        if len(blk.lines) == 0:
            bx1, by1, bx2, by2 = blk.xyxy
            if mask is not None:
                mask_score = mask[by1: by2, bx1: bx2].mean() / 255
                if mask_score < mask_score_thresh:
                    continue
            xywh = np.array([[bx1, by1, bx2-bx1, by2-by1]])
            blk.lines = xywh2xyxypoly(xywh).reshape(-1, 4, 2).tolist()
        examine_textblk(blk, im_w, im_h, sort=True)
        
        # split manga text if there is a distance gap
        textblock_splitted = False
        if len(blk.lines) > 1:
            if blk.language == 'ja':
                textblock_splitted = True
            elif blk.vertical:
                textblock_splitted = True
        if textblock_splitted:
            textblock_splitted, sub_blk_list = split_textblk(blk)
        else:
            sub_blk_list = [blk]
        # modify textblock to fit its textlines
        if not textblock_splitted:
            for blk in sub_blk_list:
                blk.adjust_bbox(with_bbox=True)
        final_blk_list += sub_blk_list

    # step3: merge scattered lines, sort textblocks by "grid"
    final_blk_list += merge_textlines(scattered_lines['hor'])
    final_blk_list += merge_textlines(scattered_lines['ver'])
    if sort_blklist:
        final_blk_list = sort_textblk_list(final_blk_list, im_w, im_h)

    for blk in final_blk_list:
        if blk.language == 'eng' and not blk.vertical:
            num_lines = len(blk.lines)
            if num_lines == 0:
                continue
            # blk.line_spacing = blk.bounding_rect()[3] / num_lines / blk.font_size
            expand_size = max(int(blk.font_size * 0.1), 2)
            rad = np.deg2rad(blk.angle)
            shifted_vec = np.array([[[-1, -1],[1, -1],[1, 1],[-1, 1]]])
            shifted_vec = shifted_vec * np.array([[[np.sin(rad), np.cos(rad)]]]) * expand_size
            lines = blk.lines_array() + shifted_vec
            lines[..., 0] = np.clip(lines[..., 0], 0, im_w-1)
            lines[..., 1] = np.clip(lines[..., 1], 0, im_h-1)
            blk.lines = lines.astype(np.int64).tolist()
            blk.font_size += expand_size
            
    return final_blk_list

def visualize_textblocks(canvas, blk_list:  List[TextBlock]):
    lw = max(round(sum(canvas.shape) / 2 * 0.003), 2)  # line width
    for ii, blk in enumerate(blk_list):
        bx1, by1, bx2, by2 = blk.xyxy
        cv2.rectangle(canvas, (bx1, by1), (bx2, by2), (127, 255, 127), lw)
        lines = blk.lines_array(dtype=np.int32)
        for jj, line in enumerate(lines):
            cv2.putText(canvas, str(jj), line[0], cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255,127,0), 1)
            cv2.polylines(canvas, [line], True, (0,127,255), 2)
        cv2.polylines(canvas, [blk.min_rect()], True, (127,127,0), 2)
        center = [int((bx1 + bx2)/2), int((by1 + by2)/2)]
        cv2.putText(canvas, str(blk.angle), center, cv2.FONT_HERSHEY_SIMPLEX, 1, (127,127,255), 2)
        cv2.putText(canvas, str(ii), (bx1, by1 + lw + 2), 0, lw / 3, (255,127,127), max(lw-1, 1), cv2.LINE_AA)
    return canvas

def get_topk_color(color_list, bins, k=3, color_var=10, bin_tol=0.001):
    idx = np.argsort(bins * -1)
    color_list, bins = color_list[idx], bins[idx]
    top_colors = [color_list[0]]
    bin_tol = np.sum(bins) * bin_tol
    if len(color_list) > 1:
        for color, bin in zip(color_list[1:], bins[1:]):
            if np.abs(np.array(top_colors) - color).min() > color_var:
                top_colors.append(color)
            if len(top_colors) >= k or bin < bin_tol:
                break
    return top_colors

def minxor_thresh(threshed, mask, dilate=False):
    neg_threshed = 255 - threshed
    e_size = 1
    if dilate:
        element = cv2.getStructuringElement(cv2.MORPH_RECT, (2 * e_size + 1, 2 * e_size + 1),(e_size, e_size))
        neg_threshed = cv2.dilate(neg_threshed, element, iterations=1)
        threshed = cv2.dilate(threshed, element, iterations=1)
    neg_xor_sum = cv2.bitwise_xor(neg_threshed, mask).sum()
    xor_sum = cv2.bitwise_xor(threshed, mask).sum()
    if neg_xor_sum < xor_sum:
        return neg_threshed, neg_xor_sum
    else:
        return threshed, xor_sum

def get_otsuthresh_masklist(img, pred_mask, per_channel=False) -> List[np.ndarray]:
    channels = [img[..., 0], img[..., 1], img[..., 2]]
    mask_list = []
    for c in channels:
        _, threshed = cv2.threshold(c, 1, 255, cv2.THRESH_OTSU+cv2.THRESH_BINARY)
        threshed, xor_sum = minxor_thresh(threshed, pred_mask, dilate=False)
        mask_list.append([threshed, xor_sum])
    mask_list.sort(key=lambda x: x[1])
    if per_channel:
        return mask_list
    else:
        return [mask_list[0]]

def get_topk_masklist(im_grey, pred_mask):
    if len(im_grey.shape) == 3 and im_grey.shape[-1] == 3:
        im_grey = cv2.cvtColor(im_grey, cv2.COLOR_BGR2GRAY)
    msk = np.ascontiguousarray(pred_mask)
    candidate_grey_px = im_grey[np.where(cv2.erode(msk, np.ones((3,3), np.uint8), iterations=1) > 127)]
    bin, his = np.histogram(candidate_grey_px, bins=255)
    topk_color = get_topk_color(his, bin, color_var=10, k=3)
    color_range = 30
    mask_list = list()
    for ii, color in enumerate(topk_color):
        c_top = min(color+color_range, 255)
        c_bottom = c_top - 2 * color_range
        threshed = cv2.inRange(im_grey, c_bottom, c_top)
        threshed, xor_sum = minxor_thresh(threshed, msk)
        mask_list.append([threshed, xor_sum])
    return mask_list

def merge_mask_list(mask_list, pred_mask, blk: TextBlock = None, pred_thresh=30, text_window=None, filter_with_lines=False, refine_mode=REFINEMASK_INPAINT):
    mask_list.sort(key=lambda x: x[1])
    linemask = None
    if blk is not None and filter_with_lines:
        linemask = np.zeros_like(pred_mask)
        lines = blk.lines_array(dtype=np.int64)
        for line in lines:
            line[..., 0] -= text_window[0]
            line[..., 1] -= text_window[1]
            cv2.fillPoly(linemask, [line], 255)
        linemask = cv2.dilate(linemask, np.ones((3, 3), np.uint8), iterations=3)
    
    if pred_thresh > 0:
        e_size = 1
        element = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * e_size + 1, 2 * e_size + 1),(e_size, e_size))      
        pred_mask = cv2.erode(pred_mask, element, iterations=1)
        _, pred_mask = cv2.threshold(pred_mask, 60, 255, cv2.THRESH_BINARY)
    connectivity = 8
    mask_merged = np.zeros_like(pred_mask)
    for ii, (candidate_mask, xor_sum) in enumerate(mask_list):
        num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(candidate_mask, connectivity, cv2.CV_16U)
        for label_index, stat, centroid in zip(range(num_labels), stats, centroids):
            if label_index != 0: # skip background label
                x, y, w, h, area = stat
                if w * h < 3:
                    continue
                x1, y1, x2, y2 = x, y, x+w, y+h
                label_local = labels[y1: y2, x1: x2]
                label_cordinates = np.where(label_local==label_index)
                tmp_merged = np.zeros_like(label_local, np.uint8)
                tmp_merged[label_cordinates] = 255
                tmp_merged = cv2.bitwise_or(mask_merged[y1: y2, x1: x2], tmp_merged)
                xor_merged = cv2.bitwise_xor(tmp_merged, pred_mask[y1: y2, x1: x2]).sum()
                xor_origin = cv2.bitwise_xor(mask_merged[y1: y2, x1: x2], pred_mask[y1: y2, x1: x2]).sum()
                if xor_merged < xor_origin:
                    mask_merged[y1: y2, x1: x2] = tmp_merged

    if refine_mode == REFINEMASK_INPAINT:
        mask_merged = cv2.dilate(mask_merged, np.ones((3, 3), np.uint8), iterations=1)
    # fill holes
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(255-mask_merged, connectivity, cv2.CV_16U)
    sorted_area = np.sort(stats[:, -1])
    if len(sorted_area) > 1:
        area_thresh = sorted_area[-2]
    else:
        area_thresh = sorted_area[-1]
    for label_index, stat, centroid in zip(range(num_labels), stats, centroids):
        x, y, w, h, area = stat
        if area < area_thresh:
            x1, y1, x2, y2 = x, y, x+w, y+h
            label_local = labels[y1: y2, x1: x2]
            label_cordinates = np.where(label_local==label_index)
            tmp_merged = np.zeros_like(label_local, np.uint8)
            tmp_merged[label_cordinates] = 255
            tmp_merged = cv2.bitwise_or(mask_merged[y1: y2, x1: x2], tmp_merged)
            xor_merged = cv2.bitwise_xor(tmp_merged, pred_mask[y1: y2, x1: x2]).sum()
            xor_origin = cv2.bitwise_xor(mask_merged[y1: y2, x1: x2], pred_mask[y1: y2, x1: x2]).sum()
            if xor_merged < xor_origin:
                mask_merged[y1: y2, x1: x2] = tmp_merged
    return mask_merged

def refine_undetected_mask(img: np.ndarray, mask_pred: np.ndarray, mask_refined: np.ndarray, blk_list: List[TextBlock], refine_mode=REFINEMASK_INPAINT):
    mask_pred[np.where(mask_refined > 30)] = 0
    _, pred_mask_t = cv2.threshold(mask_pred, 30, 255, cv2.THRESH_BINARY)
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(pred_mask_t, 4, cv2.CV_16U)
    valid_labels = np.where(stats[:, -1] > 50)[0]
    seg_blk_list = []
    if len(valid_labels) > 0:
        for lab_index in valid_labels[1:]:
            x, y, w, h, area = stats[lab_index]
            bx1, by1 = x, y
            bx2, by2 = x+w, y+h
            bbox = [bx1, by1, bx2, by2]
            bbox_score = -1
            for blk in blk_list:
                bbox_s = union_area(blk.xyxy, bbox)
                if bbox_s > bbox_score:
                    bbox_score = bbox_s
            if bbox_score / w / h < 0.5:
                seg_blk_list.append(TextBlock(bbox))
    if len(seg_blk_list) > 0:
        mask_refined = cv2.bitwise_or(mask_refined, refine_mask(img, mask_pred, seg_blk_list, refine_mode=refine_mode))
    return mask_refined

def refine_mask(img: np.ndarray, pred_mask: np.ndarray, blk_list: List[TextBlock], refine_mode: int = REFINEMASK_INPAINT) -> np.ndarray:
    mask_refined = np.zeros_like(pred_mask)
    for blk in blk_list:
        bx1, by1, bx2, by2 = expand_textwindow(img.shape, blk.xyxy, expand_r=16)
        im = np.ascontiguousarray(img[by1: by2, bx1: bx2])
        msk = np.ascontiguousarray(pred_mask[by1: by2, bx1: bx2])
        mask_list = get_topk_masklist(im, msk)
        mask_list += get_otsuthresh_masklist(im, msk, per_channel=False)
        mask_merged = merge_mask_list(mask_list, msk, blk=blk, text_window=[bx1, by1, bx2, by2], refine_mode=refine_mode)
        mask_refined[by1: by2, bx1: bx2] = cv2.bitwise_or(mask_refined[by1: by2, bx1: bx2], mask_merged)
    return mask_refined

def scale_img(img, ratio=1.0, same_shape=False, gs=32):  # img(16,3,256,416)
    # scales img(bs,3,y,x) by ratio constrained to gs-multiple
    if ratio == 1.0:
        return img
    else:
        h, w = img.shape[2:]
        s = (int(h * ratio), int(w * ratio))  # new size
        img = F.interpolate(img, size=s, mode='bilinear', align_corners=False)  # resize
        if not same_shape:  # pad/crop img
            h, w = (math.ceil(x * ratio / gs) * gs for x in (h, w))
        return F.pad(img, [0, w - s[1], 0, h - s[0]], value=0.447)  # value = imagenet mean

def fuse_conv_and_bn(conv, bn):
    # Fuse convolution and batchnorm layers https://tehnokv.com/posts/fusing-batchnorm-and-conv/
    fusedconv = nn.Conv2d(conv.in_channels,
                          conv.out_channels,
                          kernel_size=conv.kernel_size,
                          stride=conv.stride,
                          padding=conv.padding,
                          groups=conv.groups,
                          bias=True).requires_grad_(False).to(conv.weight.device)

    # prepare filters
    w_conv = conv.weight.clone().view(conv.out_channels, -1)
    w_bn = torch.diag(bn.weight.div(torch.sqrt(bn.eps + bn.running_var)))
    fusedconv.weight.copy_(torch.mm(w_bn, w_conv).view(fusedconv.weight.shape))

    # prepare spatial bias
    b_conv = torch.zeros(conv.weight.size(0), device=conv.weight.device) if conv.bias is None else conv.bias
    b_bn = bn.bias - bn.weight.mul(bn.running_mean).div(torch.sqrt(bn.running_var + bn.eps))
    fusedconv.bias.copy_(torch.mm(w_bn, b_conv.reshape(-1, 1)).reshape(-1) + b_bn)

    return fusedconv

def check_anchor_order(m):
    # Check anchor order against stride order for YOLOv5 Detect() module m, and correct if necessary
    a = m.anchors.prod(-1).view(-1)  # anchor area
    da = a[-1] - a[0]  # delta a
    ds = m.stride[-1] - m.stride[0]  # delta s
    if da.sign() != ds.sign():  # same order
        m.anchors[:] = m.anchors.flip(0)

def initialize_weights(model):
    for m in model.modules():
        t = type(m)
        if t is nn.Conv2d:
            pass  # nn.init.kaiming_normal_(m.weight, mode='fan_out', nonlinearity='relu')
        elif t is nn.BatchNorm2d:
            m.eps = 1e-3
            m.momentum = 0.03
        elif t in [nn.Hardswish, nn.LeakyReLU, nn.ReLU, nn.ReLU6, nn.SiLU]:
            m.inplace = True

def make_divisible(x, divisor):
    # Returns nearest x divisible by divisor
    if isinstance(divisor, torch.Tensor):
        divisor = int(divisor.max())  # to int
    return math.ceil(x / divisor) * divisor

def check_version(current='0.0.0', minimum='0.0.0', name='version ', pinned=False, hard=False):
    # Check version vs. required version
    current, minimum = (pkg.parse_version(x) for x in (current, minimum))
    result = (current == minimum) if pinned else (current >= minimum)  # bool
    if hard:  # assert min requirements met
        assert result, f'{name}{minimum} required by YOLOv5, but {name}{current} is currently installed'
    else:
        return result

class Colors:
    # Ultralytics color palette https://ultralytics.com/
    def __init__(self):
        # hex = matplotlib.colors.TABLEAU_COLORS.values()
        hex = ('FF3838', 'FF9D97', 'FF701F', 'FFB21D', 'CFD231', '48F90A', '92CC17', '3DDB86', '1A9334', '00D4BB',
               '2C99A8', '00C2FF', '344593', '6473FF', '0018EC', '8438FF', '520085', 'CB38FF', 'FF95C8', 'FF37C7')
        self.palette = [self.hex2rgb('#' + c) for c in hex]
        self.n = len(self.palette)

    def __call__(self, i, bgr=False):
        c = self.palette[int(i) % self.n]
        return (c[2], c[1], c[0]) if bgr else c

    @staticmethod
    def hex2rgb(h):  # rgb order (PIL)
        return tuple(int(h[1 + i:1 + i + 2], 16) for i in (0, 2, 4))

def box_iou(box1, box2):
    # https://github.com/pytorch/vision/blob/master/torchvision/ops/boxes.py
    """
    Return intersection-over-union (Jaccard index) of boxes.
    Both sets of boxes are expected to be in (x1, y1, x2, y2) format.
    Arguments:
        box1 (Tensor[N, 4])
        box2 (Tensor[M, 4])
    Returns:
        iou (Tensor[N, M]): the NxM matrix containing the pairwise
            IoU values for every element in boxes1 and boxes2
    """

    def box_area(box):
        # box = 4xn
        return (box[2] - box[0]) * (box[3] - box[1])

    area1 = box_area(box1.T)
    area2 = box_area(box2.T)

    # inter(N,M) = (rb(N,M,2) - lt(N,M,2)).clamp(0).prod(2)
    inter = (torch.min(box1[:, None, 2:], box2[:, 2:]) - torch.max(box1[:, None, :2], box2[:, :2])).clamp(0).prod(2)
    return inter / (area1[:, None] + area2 - inter)  # iou = inter / (area1 + area2 - inter)

def non_max_suppression(prediction, conf_thres=0.25, iou_thres=0.45, classes=None, agnostic=False, multi_label=False,
                        labels=(), max_det=300):
    """Runs Non-Maximum Suppression (NMS) on inference results

    Returns:
         list of detections, on (n,6) tensor per image [xyxy, conf, cls]
    """

    if isinstance(prediction, np.ndarray):
        prediction = torch.from_numpy(prediction)

    nc = prediction.shape[2] - 5  # number of classes
    xc = prediction[..., 4] > conf_thres  # candidates

    # Checks
    assert 0 <= conf_thres <= 1, f'Invalid Confidence threshold {conf_thres}, valid values are between 0.0 and 1.0'
    assert 0 <= iou_thres <= 1, f'Invalid IoU {iou_thres}, valid values are between 0.0 and 1.0'

    # Settings
    min_wh, max_wh = 2, 4096  # (pixels) minimum and maximum box width and height
    max_nms = 30000  # maximum number of boxes into torchvision.ops.nms()
    time_limit = 10.0  # seconds to quit after
    redundant = True  # require redundant detections
    multi_label &= nc > 1  # multiple labels per box (adds 0.5ms/img)
    merge = False  # use merge-NMS

    t = time.time()
    output = [torch.zeros((0, 6), device=prediction.device)] * prediction.shape[0]
    for xi, x in enumerate(prediction):  # image index, image inference
        # Apply constraints
        # x[((x[..., 2:4] < min_wh) | (x[..., 2:4] > max_wh)).any(1), 4] = 0  # width-height
        x = x[xc[xi]]  # confidence

        # Cat apriori labels if autolabelling
        if labels and len(labels[xi]):
            l = labels[xi]
            v = torch.zeros((len(l), nc + 5), device=x.device)
            v[:, :4] = l[:, 1:5]  # box
            v[:, 4] = 1.0  # conf
            v[range(len(l)), l[:, 0].long() + 5] = 1.0  # cls
            x = torch.cat((x, v), 0)

        # If none remain process next image
        if not x.shape[0]:
            continue

        # Compute conf
        x[:, 5:] *= x[:, 4:5]  # conf = obj_conf * cls_conf

        # Box (center x, center y, width, height) to (x1, y1, x2, y2)
        box = xywh2xyxy(x[:, :4])

        # Detections matrix nx6 (xyxy, conf, cls)
        if multi_label:
            i, j = (x[:, 5:] > conf_thres).nonzero(as_tuple=False).T
            x = torch.cat((box[i], x[i, j + 5, None], j[:, None].float()), 1)
        else:  # best class only
            conf, j = x[:, 5:].max(1, keepdim=True)
            x = torch.cat((box, conf, j.float()), 1)[conf.view(-1) > conf_thres]

        # Filter by class
        if classes is not None:
            x = x[(x[:, 5:6] == torch.tensor(classes, device=x.device)).any(1)]

        # Apply finite constraint
        # if not torch.isfinite(x).all():
        #     x = x[torch.isfinite(x).all(1)]

        # Check shape
        n = x.shape[0]  # number of boxes
        if not n:  # no boxes
            continue
        elif n > max_nms:  # excess boxes
            x = x[x[:, 4].argsort(descending=True)[:max_nms]]  # sort by confidence

        # Batched NMS
        c = x[:, 5:6] * (0 if agnostic else max_wh)  # classes
        boxes, scores = x[:, :4] + c, x[:, 4]  # boxes (offset by class), scores
        i = torchvision.ops.nms(boxes, scores, iou_thres)  # NMS
        if i.shape[0] > max_det:  # limit detections
            i = i[:max_det]
        if merge and (1 < n < 3E3):  # Merge NMS (boxes merged using weighted mean)
            # update boxes as boxes(i,4) = weights(i,n) * boxes(n,4)
            iou = box_iou(boxes[i], boxes) > iou_thres  # iou matrix
            weights = iou * scores[None]  # box weights
            x[i, :4] = torch.mm(weights, x[:, :4]).float() / weights.sum(1, keepdim=True)  # merged boxes
            if redundant:
                i = i[iou.sum(1) > 1]  # require redundancy

        output[xi] = x[i]
        if (time.time() - t) > time_limit:
            print(f'WARNING: NMS time limit {time_limit}s exceeded')
            break  # time limit exceeded

    return output

def xywh2xyxy(x):
    # Convert nx4 boxes from [x, y, w, h] to [x1, y1, x2, y2] where xy1=top-left, xy2=bottom-right
    y = x.clone() if isinstance(x, torch.Tensor) else np.copy(x)
    y[:, 0] = x[:, 0] - x[:, 2] / 2  # top left x
    y[:, 1] = x[:, 1] - x[:, 3] / 2  # top left y
    y[:, 2] = x[:, 0] + x[:, 2] / 2  # bottom right x
    y[:, 3] = x[:, 1] + x[:, 3] / 2  # bottom right y
    return y

def preprocess_img(img, input_size=(1024, 1024), device='cpu', bgr2rgb=True, half=False, to_tensor=True):
    if bgr2rgb:
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img_in, ratio, (dw, dh) = letterbox(img, new_shape=input_size, auto=False, stride=64)
    if to_tensor:
        img_in = img_in.transpose((2, 0, 1))[::-1]  # HWC to CHW, BGR to RGB
        img_in = np.array([np.ascontiguousarray(img_in)]).astype(np.float32) / 255
        if to_tensor:
            img_in = torch.from_numpy(img_in).to(device)
            if half:
                img_in = img_in.half()
    return img_in, ratio, int(dw), int(dh)

def postprocess_mask(img: Union[torch.Tensor, np.ndarray], thresh=None):
    # img = img.permute(1, 2, 0)
    if isinstance(img, torch.Tensor):
        img = img.squeeze_()
        if img.device != 'cpu':
            img = img.detach_().cpu()
        img = img.numpy()
    else:
        img = img.squeeze()
    if thresh is not None:
        img = img > thresh
    img = img * 255
    # if isinstance(img, torch.Tensor):

    return img.astype(np.uint8)

def postprocess_yolo(det, conf_thresh, nms_thresh, resize_ratio, sort_func=None):
    det = non_max_suppression(det, conf_thresh, nms_thresh)[0]
    # bbox = det[..., 0:4]
    if det.device != 'cpu':
        det = det.detach_().cpu().numpy()
    det[..., [0, 2]] = det[..., [0, 2]] * resize_ratio[0]
    det[..., [1, 3]] = det[..., [1, 3]] * resize_ratio[1]
    if sort_func is not None:
        det = sort_func(det)

    blines = det[..., 0:4].astype(np.int32)
    confs = np.round(det[..., 4], 3)
    cls = det[..., 5].astype(np.int32)
    return blines, cls, confs

class TextDetector:
    lang_list = ['eng', 'ja', 'unknown']
    langcls2idx = {'eng': 0, 'ja': 1, 'unknown': 2}

    def __init__(self, model_path, input_size=1024, device='cpu', half=False, nms_thresh=0.35, conf_thresh=0.4, mask_thresh=0.3, act='leaky'):
        super(TextDetector, self).__init__()
        cuda = device == 'cuda'

        if Path(model_path).suffix == '.onnx':
            self.model = cv2.dnn.readNetFromONNX(model_path)
            self.net = TextDetBaseDNN(input_size, model_path)
            self.backend = 'opencv'
        else:
            self.net = TextDetBase(model_path, device=device, act=act)
            self.backend = 'torch'
        
        if isinstance(input_size, int):
            input_size = (input_size, input_size)
        self.input_size = input_size
        self.device = device
        self.half = half
        self.conf_thresh = conf_thresh
        self.nms_thresh = nms_thresh
        self.seg_rep = SegDetectorRepresenter(thresh=0.3)

    @torch.no_grad()
    def __call__(self, img, refine_mode=REFINEMASK_INPAINT, keep_undetected_mask=False):
        img_in, ratio, dw, dh = preprocess_img(img, input_size=self.input_size, device=self.device, half=self.half, to_tensor=self.backend=='torch')
        im_h, im_w = img.shape[:2]

        blks, mask, lines_map = self.net(img_in)

        resize_ratio = (im_w / (self.input_size[0] - dw), im_h / (self.input_size[1] - dh))
        blks = postprocess_yolo(blks, self.conf_thresh, self.nms_thresh, resize_ratio)

        if self.backend == 'opencv':
            if mask.shape[1] == 2:     # some version of opencv spit out reversed result
                tmp = mask
                mask = lines_map
                lines_map = tmp
        mask = postprocess_mask(mask)

        lines, scores = self.seg_rep(self.input_size, lines_map)
        box_thresh = 0.6
        idx = np.where(scores[0] > box_thresh)
        lines, scores = lines[0][idx], scores[0][idx]
        
        # map output to input img
        mask = mask[: mask.shape[0]-dh, : mask.shape[1]-dw]
        mask = cv2.resize(mask, (im_w, im_h), interpolation=cv2.INTER_LINEAR)
        if lines.size == 0 :
            lines = []
        else :
            lines = lines.astype(np.float64)
            lines[..., 0] *= resize_ratio[0]
            lines[..., 1] *= resize_ratio[1]
            lines = lines.astype(np.int32)
        blk_list = group_output(blks, lines, im_w, im_h, mask)
        mask_refined = refine_mask(img, mask, blk_list, refine_mode=refine_mode)
        if keep_undetected_mask:
            mask_refined = refine_undetected_mask(img, mask, mask_refined, blk_list, refine_mode=refine_mode)
    
        return mask, mask_refined, blk_list