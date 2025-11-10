import subprocess
import sys
import os

required_modules = [
    "torch", "opencv-python", "numpy", "Pillow", "pytorch_lightning"
]

for module in required_modules:
    try:
        if module == "opencv-python":
            import cv2
        elif module == "Pillow":
            import PIL
        else:
            __import__(module.replace("-", "_"))
    except ImportError:
        subprocess.check_call([sys.executable, "-m", "pip", "install", module])

import torch
import os
import cv2
from torch.cuda import amp
import pytorch_lightning as pl
import numpy as np
import torch.nn as nn
import torch.nn.functional as F
from PIL import Image
import argparse

dirname = os.path.dirname(__file__)
device = "mps" if torch.backends.mps.is_available() else "cuda" if torch.cuda.is_available() else "cpu"
bce_loss = nn.BCEWithLogitsLoss(reduction="mean")

def muti_loss_fusion(preds, target):
    loss0 = 0.0
    loss = 0.0
    for i in range(0, len(preds)):
        if preds[i].shape[2] != target.shape[2] or preds[i].shape[3] != target.shape[3]:
            tmp_target = F.interpolate(
                target, size=preds[i].size()[2:], mode="bilinear", align_corners=True
            )
            loss = loss + bce_loss(preds[i], tmp_target)
        else:
            loss = loss + bce_loss(preds[i], target)
        if i == 0:
            loss0 = loss
    return loss0, loss

fea_loss = nn.MSELoss(reduction="mean")
kl_loss = nn.KLDivLoss(reduction="mean")
l1_loss = nn.L1Loss(reduction="mean")
smooth_l1_loss = nn.SmoothL1Loss(reduction="mean")

def muti_loss_fusion_kl(preds, target, dfs, fs, mode="MSE"):
    loss0 = 0.0
    loss = 0.0
    for i in range(0, len(preds)):
        if preds[i].shape[2] != target.shape[2] or preds[i].shape[3] != target.shape[3]:
            tmp_target = F.interpolate(
                target, size=preds[i].size()[2:], mode="bilinear", align_corners=True
            )
            loss = loss + bce_loss(preds[i], tmp_target)
        else:
            loss = loss + bce_loss(preds[i], target)
        if i == 0:
            loss0 = loss

    for i in range(0, len(dfs)):
        df = dfs[i]
        fs_i = fs[i]
        if mode == "MSE":
            loss = loss + fea_loss(
                df, fs_i
            ) 
        elif mode == "KL":
            loss = loss + kl_loss(F.log_softmax(df, dim=1), F.softmax(fs_i, dim=1))
        elif mode == "MAE":
            loss = loss + l1_loss(df, fs_i)
        elif mode == "SmoothL1":
            loss = loss + smooth_l1_loss(df, fs_i)
    return loss0, loss

class REBNCONV(nn.Module):
    def __init__(self, in_ch=3, out_ch=3, dirate=1, stride=1):
        super(REBNCONV, self).__init__()
        self.conv_s1 = nn.Conv2d(
            in_ch, out_ch, 3, padding=1 * dirate, dilation=1 * dirate, stride=stride
        )
        self.bn_s1 = nn.BatchNorm2d(out_ch)
        self.relu_s1 = nn.ReLU(inplace=True)

    def forward(self, x):
        hx = x
        xout = self.relu_s1(self.bn_s1(self.conv_s1(hx)))
        return xout

def _upsample_like(src, tar):
    src = F.interpolate(src, size=tar.shape[2:], mode="bilinear", align_corners=False)
    return src

class RSU7(nn.Module):
    def __init__(self, in_ch=3, mid_ch=12, out_ch=3, img_size=512):
        super(RSU7, self).__init__()
        self.in_ch = in_ch
        self.mid_ch = mid_ch
        self.out_ch = out_ch
        self.rebnconvin = REBNCONV(in_ch, out_ch, dirate=1)  ## 1 -> 1/2
        self.rebnconv1 = REBNCONV(out_ch, mid_ch, dirate=1)
        self.pool1 = nn.MaxPool2d(2, stride=2, ceil_mode=True)
        self.rebnconv2 = REBNCONV(mid_ch, mid_ch, dirate=1)
        self.pool2 = nn.MaxPool2d(2, stride=2, ceil_mode=True)
        self.rebnconv3 = REBNCONV(mid_ch, mid_ch, dirate=1)
        self.pool3 = nn.MaxPool2d(2, stride=2, ceil_mode=True)
        self.rebnconv4 = REBNCONV(mid_ch, mid_ch, dirate=1)
        self.pool4 = nn.MaxPool2d(2, stride=2, ceil_mode=True)
        self.rebnconv5 = REBNCONV(mid_ch, mid_ch, dirate=1)
        self.pool5 = nn.MaxPool2d(2, stride=2, ceil_mode=True)
        self.rebnconv6 = REBNCONV(mid_ch, mid_ch, dirate=1)
        self.rebnconv7 = REBNCONV(mid_ch, mid_ch, dirate=2)
        self.rebnconv6d = REBNCONV(mid_ch * 2, mid_ch, dirate=1)
        self.rebnconv5d = REBNCONV(mid_ch * 2, mid_ch, dirate=1)
        self.rebnconv4d = REBNCONV(mid_ch * 2, mid_ch, dirate=1)
        self.rebnconv3d = REBNCONV(mid_ch * 2, mid_ch, dirate=1)
        self.rebnconv2d = REBNCONV(mid_ch * 2, mid_ch, dirate=1)
        self.rebnconv1d = REBNCONV(mid_ch * 2, out_ch, dirate=1)

    def forward(self, x):
        b, c, h, w = x.shape
        hx = x
        hxin = self.rebnconvin(hx)
        hx1 = self.rebnconv1(hxin)
        hx = self.pool1(hx1)
        hx2 = self.rebnconv2(hx)
        hx = self.pool2(hx2)
        hx3 = self.rebnconv3(hx)
        hx = self.pool3(hx3)
        hx4 = self.rebnconv4(hx)
        hx = self.pool4(hx4)
        hx5 = self.rebnconv5(hx)
        hx = self.pool5(hx5)
        hx6 = self.rebnconv6(hx)
        hx7 = self.rebnconv7(hx6)
        hx6d = self.rebnconv6d(torch.cat((hx7, hx6), 1))
        hx6dup = _upsample_like(hx6d, hx5)
        hx5d = self.rebnconv5d(torch.cat((hx6dup, hx5), 1))
        hx5dup = _upsample_like(hx5d, hx4)
        hx4d = self.rebnconv4d(torch.cat((hx5dup, hx4), 1))
        hx4dup = _upsample_like(hx4d, hx3)
        hx3d = self.rebnconv3d(torch.cat((hx4dup, hx3), 1))
        hx3dup = _upsample_like(hx3d, hx2)
        hx2d = self.rebnconv2d(torch.cat((hx3dup, hx2), 1))
        hx2dup = _upsample_like(hx2d, hx1)
        hx1d = self.rebnconv1d(torch.cat((hx2dup, hx1), 1))
        return hx1d + hxin

class RSU6(nn.Module):
    def __init__(self, in_ch=3, mid_ch=12, out_ch=3):
        super(RSU6, self).__init__()
        self.rebnconvin = REBNCONV(in_ch, out_ch, dirate=1)
        self.rebnconv1 = REBNCONV(out_ch, mid_ch, dirate=1)
        self.pool1 = nn.MaxPool2d(2, stride=2, ceil_mode=True)
        self.rebnconv2 = REBNCONV(mid_ch, mid_ch, dirate=1)
        self.pool2 = nn.MaxPool2d(2, stride=2, ceil_mode=True)
        self.rebnconv3 = REBNCONV(mid_ch, mid_ch, dirate=1)
        self.pool3 = nn.MaxPool2d(2, stride=2, ceil_mode=True)
        self.rebnconv4 = REBNCONV(mid_ch, mid_ch, dirate=1)
        self.pool4 = nn.MaxPool2d(2, stride=2, ceil_mode=True)
        self.rebnconv5 = REBNCONV(mid_ch, mid_ch, dirate=1)
        self.rebnconv6 = REBNCONV(mid_ch, mid_ch, dirate=2)
        self.rebnconv5d = REBNCONV(mid_ch * 2, mid_ch, dirate=1)
        self.rebnconv4d = REBNCONV(mid_ch * 2, mid_ch, dirate=1)
        self.rebnconv3d = REBNCONV(mid_ch * 2, mid_ch, dirate=1)
        self.rebnconv2d = REBNCONV(mid_ch * 2, mid_ch, dirate=1)
        self.rebnconv1d = REBNCONV(mid_ch * 2, out_ch, dirate=1)

    def forward(self, x):
        hx = x
        hxin = self.rebnconvin(hx)
        hx1 = self.rebnconv1(hxin)
        hx = self.pool1(hx1)
        hx2 = self.rebnconv2(hx)
        hx = self.pool2(hx2)
        hx3 = self.rebnconv3(hx)
        hx = self.pool3(hx3)
        hx4 = self.rebnconv4(hx)
        hx = self.pool4(hx4)
        hx5 = self.rebnconv5(hx)
        hx6 = self.rebnconv6(hx5)
        hx5d = self.rebnconv5d(torch.cat((hx6, hx5), 1))
        hx5dup = _upsample_like(hx5d, hx4)
        hx4d = self.rebnconv4d(torch.cat((hx5dup, hx4), 1))
        hx4dup = _upsample_like(hx4d, hx3)
        hx3d = self.rebnconv3d(torch.cat((hx4dup, hx3), 1))
        hx3dup = _upsample_like(hx3d, hx2)
        hx2d = self.rebnconv2d(torch.cat((hx3dup, hx2), 1))
        hx2dup = _upsample_like(hx2d, hx1)
        hx1d = self.rebnconv1d(torch.cat((hx2dup, hx1), 1))
        return hx1d + hxin

class RSU5(nn.Module):
    def __init__(self, in_ch=3, mid_ch=12, out_ch=3):
        super(RSU5, self).__init__()
        self.rebnconvin = REBNCONV(in_ch, out_ch, dirate=1)
        self.rebnconv1 = REBNCONV(out_ch, mid_ch, dirate=1)
        self.pool1 = nn.MaxPool2d(2, stride=2, ceil_mode=True)
        self.rebnconv2 = REBNCONV(mid_ch, mid_ch, dirate=1)
        self.pool2 = nn.MaxPool2d(2, stride=2, ceil_mode=True)
        self.rebnconv3 = REBNCONV(mid_ch, mid_ch, dirate=1)
        self.pool3 = nn.MaxPool2d(2, stride=2, ceil_mode=True)
        self.rebnconv4 = REBNCONV(mid_ch, mid_ch, dirate=1)
        self.rebnconv5 = REBNCONV(mid_ch, mid_ch, dirate=2)
        self.rebnconv4d = REBNCONV(mid_ch * 2, mid_ch, dirate=1)
        self.rebnconv3d = REBNCONV(mid_ch * 2, mid_ch, dirate=1)
        self.rebnconv2d = REBNCONV(mid_ch * 2, mid_ch, dirate=1)
        self.rebnconv1d = REBNCONV(mid_ch * 2, out_ch, dirate=1)

    def forward(self, x):
        hx = x
        hxin = self.rebnconvin(hx)
        hx1 = self.rebnconv1(hxin)
        hx = self.pool1(hx1)
        hx2 = self.rebnconv2(hx)
        hx = self.pool2(hx2)
        hx3 = self.rebnconv3(hx)
        hx = self.pool3(hx3)
        hx4 = self.rebnconv4(hx)
        hx5 = self.rebnconv5(hx4)
        hx4d = self.rebnconv4d(torch.cat((hx5, hx4), 1))
        hx4dup = _upsample_like(hx4d, hx3)
        hx3d = self.rebnconv3d(torch.cat((hx4dup, hx3), 1))
        hx3dup = _upsample_like(hx3d, hx2)
        hx2d = self.rebnconv2d(torch.cat((hx3dup, hx2), 1))
        hx2dup = _upsample_like(hx2d, hx1)
        hx1d = self.rebnconv1d(torch.cat((hx2dup, hx1), 1))
        return hx1d + hxin

class RSU4(nn.Module):
    def __init__(self, in_ch=3, mid_ch=12, out_ch=3):
        super(RSU4, self).__init__()
        self.rebnconvin = REBNCONV(in_ch, out_ch, dirate=1)
        self.rebnconv1 = REBNCONV(out_ch, mid_ch, dirate=1)
        self.pool1 = nn.MaxPool2d(2, stride=2, ceil_mode=True)
        self.rebnconv2 = REBNCONV(mid_ch, mid_ch, dirate=1)
        self.pool2 = nn.MaxPool2d(2, stride=2, ceil_mode=True)
        self.rebnconv3 = REBNCONV(mid_ch, mid_ch, dirate=1)
        self.rebnconv4 = REBNCONV(mid_ch, mid_ch, dirate=2)
        self.rebnconv3d = REBNCONV(mid_ch * 2, mid_ch, dirate=1)
        self.rebnconv2d = REBNCONV(mid_ch * 2, mid_ch, dirate=1)
        self.rebnconv1d = REBNCONV(mid_ch * 2, out_ch, dirate=1)

    def forward(self, x):
        hx = x
        hxin = self.rebnconvin(hx)
        hx1 = self.rebnconv1(hxin)
        hx = self.pool1(hx1)
        hx2 = self.rebnconv2(hx)
        hx = self.pool2(hx2)
        hx3 = self.rebnconv3(hx)
        hx4 = self.rebnconv4(hx3)
        hx3d = self.rebnconv3d(torch.cat((hx4, hx3), 1))
        hx3dup = _upsample_like(hx3d, hx2)
        hx2d = self.rebnconv2d(torch.cat((hx3dup, hx2), 1))
        hx2dup = _upsample_like(hx2d, hx1)
        hx1d = self.rebnconv1d(torch.cat((hx2dup, hx1), 1))
        return hx1d + hxin

class RSU4F(nn.Module):
    def __init__(self, in_ch=3, mid_ch=12, out_ch=3):
        super(RSU4F, self).__init__()
        self.rebnconvin = REBNCONV(in_ch, out_ch, dirate=1)
        self.rebnconv1 = REBNCONV(out_ch, mid_ch, dirate=1)
        self.rebnconv2 = REBNCONV(mid_ch, mid_ch, dirate=2)
        self.rebnconv3 = REBNCONV(mid_ch, mid_ch, dirate=4)
        self.rebnconv4 = REBNCONV(mid_ch, mid_ch, dirate=8)
        self.rebnconv3d = REBNCONV(mid_ch * 2, mid_ch, dirate=4)
        self.rebnconv2d = REBNCONV(mid_ch * 2, mid_ch, dirate=2)
        self.rebnconv1d = REBNCONV(mid_ch * 2, out_ch, dirate=1)

    def forward(self, x):
        hx = x
        hxin = self.rebnconvin(hx)
        hx1 = self.rebnconv1(hxin)
        hx2 = self.rebnconv2(hx1)
        hx3 = self.rebnconv3(hx2)
        hx4 = self.rebnconv4(hx3)
        hx3d = self.rebnconv3d(torch.cat((hx4, hx3), 1))
        hx2d = self.rebnconv2d(torch.cat((hx3d, hx2), 1))
        hx1d = self.rebnconv1d(torch.cat((hx2d, hx1), 1))
        return hx1d + hxin

class myrebnconv(nn.Module):
    def __init__(
        self,
        in_ch=3,
        out_ch=1,
        kernel_size=3,
        stride=1,
        padding=1,
        dilation=1,
        groups=1,
    ):
        super(myrebnconv, self).__init__()
        self.conv = nn.Conv2d(
            in_ch,
            out_ch,
            kernel_size=kernel_size,
            stride=stride,
            padding=padding,
            dilation=dilation,
            groups=groups,
        )
        self.bn = nn.BatchNorm2d(out_ch)
        self.rl = nn.ReLU(inplace=True)
    def forward(self, x):
        return self.rl(self.bn(self.conv(x)))


class ISNetGTEncoder(nn.Module):
    def __init__(self, in_ch=1, out_ch=1):
        super(ISNetGTEncoder, self).__init__()
        self.conv_in = myrebnconv(
            in_ch, 16, 3, stride=2, padding=1
        )
        self.stage1 = RSU7(16, 16, 64)
        self.pool12 = nn.MaxPool2d(2, stride=2, ceil_mode=True)
        self.stage2 = RSU6(64, 16, 64)
        self.pool23 = nn.MaxPool2d(2, stride=2, ceil_mode=True)
        self.stage3 = RSU5(64, 32, 128)
        self.pool34 = nn.MaxPool2d(2, stride=2, ceil_mode=True)
        self.stage4 = RSU4(128, 32, 256)
        self.pool45 = nn.MaxPool2d(2, stride=2, ceil_mode=True)
        self.stage5 = RSU4F(256, 64, 512)
        self.pool56 = nn.MaxPool2d(2, stride=2, ceil_mode=True)
        self.stage6 = RSU4F(512, 64, 512)
        self.side1 = nn.Conv2d(64, out_ch, 3, padding=1)
        self.side2 = nn.Conv2d(64, out_ch, 3, padding=1)
        self.side3 = nn.Conv2d(128, out_ch, 3, padding=1)
        self.side4 = nn.Conv2d(256, out_ch, 3, padding=1)
        self.side5 = nn.Conv2d(512, out_ch, 3, padding=1)
        self.side6 = nn.Conv2d(512, out_ch, 3, padding=1)

    @staticmethod
    def compute_loss(args):
        preds, targets = args
        return muti_loss_fusion(preds, targets)

    def forward(self, x):
        hx = x
        hxin = self.conv_in(hx)
        # hx = self.pool_in(hxin)
        hx1 = self.stage1(hxin)
        hx = self.pool12(hx1)
        hx2 = self.stage2(hx)
        hx = self.pool23(hx2)
        hx3 = self.stage3(hx)
        hx = self.pool34(hx3)
        hx4 = self.stage4(hx)
        hx = self.pool45(hx4)
        hx5 = self.stage5(hx)
        hx = self.pool56(hx5)
        hx6 = self.stage6(hx)
        d1 = self.side1(hx1)
        d1 = _upsample_like(d1, x)
        d2 = self.side2(hx2)
        d2 = _upsample_like(d2, x)
        d3 = self.side3(hx3)
        d3 = _upsample_like(d3, x)
        d4 = self.side4(hx4)
        d4 = _upsample_like(d4, x)
        d5 = self.side5(hx5)
        d5 = _upsample_like(d5, x)
        d6 = self.side6(hx6)
        d6 = _upsample_like(d6, x)
        return [d1, d2, d3, d4, d5, d6], [hx1, hx2, hx3, hx4, hx5, hx6]

class ISNetDIS(nn.Module):
    def __init__(self, in_ch=3, out_ch=1):
        super(ISNetDIS, self).__init__()
        self.conv_in = nn.Conv2d(in_ch, 64, 3, stride=2, padding=1)
        self.pool_in = nn.MaxPool2d(2, stride=2, ceil_mode=True)
        self.stage1 = RSU7(64, 32, 64)
        self.pool12 = nn.MaxPool2d(2, stride=2, ceil_mode=True)
        self.stage2 = RSU6(64, 32, 128)
        self.pool23 = nn.MaxPool2d(2, stride=2, ceil_mode=True)
        self.stage3 = RSU5(128, 64, 256)
        self.pool34 = nn.MaxPool2d(2, stride=2, ceil_mode=True)
        self.stage4 = RSU4(256, 128, 512)
        self.pool45 = nn.MaxPool2d(2, stride=2, ceil_mode=True)
        self.stage5 = RSU4F(512, 256, 512)
        self.pool56 = nn.MaxPool2d(2, stride=2, ceil_mode=True)
        self.stage6 = RSU4F(512, 256, 512)
        self.stage5d = RSU4F(1024, 256, 512)
        self.stage4d = RSU4(1024, 128, 256)
        self.stage3d = RSU5(512, 64, 128)
        self.stage2d = RSU6(256, 32, 64)
        self.stage1d = RSU7(128, 16, 64)
        self.side1 = nn.Conv2d(64, out_ch, 3, padding=1)
        self.side2 = nn.Conv2d(64, out_ch, 3, padding=1)
        self.side3 = nn.Conv2d(128, out_ch, 3, padding=1)
        self.side4 = nn.Conv2d(256, out_ch, 3, padding=1)
        self.side5 = nn.Conv2d(512, out_ch, 3, padding=1)
        self.side6 = nn.Conv2d(512, out_ch, 3, padding=1)

    @staticmethod
    def compute_loss_kl(preds, targets, dfs, fs, mode="MSE"):
        return muti_loss_fusion_kl(preds, targets, dfs, fs, mode=mode)

    @staticmethod
    def compute_loss(args):
        if len(args) == 3:
            ds, dfs, labels = args
            return muti_loss_fusion(ds, labels)
        else:
            ds, dfs, labels, fs = args
            return muti_loss_fusion_kl(ds, labels, dfs, fs, mode="MSE")

    def forward(self, x):
        hx = x
        hxin = self.conv_in(hx)
        hx = self.pool_in(hxin)
        hx1 = self.stage1(hxin)
        hx = self.pool12(hx1)
        hx2 = self.stage2(hx)
        hx = self.pool23(hx2)
        hx3 = self.stage3(hx)
        hx = self.pool34(hx3)
        hx4 = self.stage4(hx)
        hx = self.pool45(hx4)
        hx5 = self.stage5(hx)
        hx = self.pool56(hx5)
        hx6 = self.stage6(hx)
        hx6up = _upsample_like(hx6, hx5)
        hx5d = self.stage5d(torch.cat((hx6up, hx5), 1))
        hx5dup = _upsample_like(hx5d, hx4)
        hx4d = self.stage4d(torch.cat((hx5dup, hx4), 1))
        hx4dup = _upsample_like(hx4d, hx3)
        hx3d = self.stage3d(torch.cat((hx4dup, hx3), 1))
        hx3dup = _upsample_like(hx3d, hx2)
        hx2d = self.stage2d(torch.cat((hx3dup, hx2), 1))
        hx2dup = _upsample_like(hx2d, hx1)
        hx1d = self.stage1d(torch.cat((hx2dup, hx1), 1))
        d1 = self.side1(hx1d)
        d1 = _upsample_like(d1, x)
        d2 = self.side2(hx2d)
        d2 = _upsample_like(d2, x)
        d3 = self.side3(hx3d)
        d3 = _upsample_like(d3, x)
        d4 = self.side4(hx4d)
        d4 = _upsample_like(d4, x)
        d5 = self.side5(hx5d)
        d5 = _upsample_like(d5, x)
        d6 = self.side6(hx6)
        d6 = _upsample_like(d6, x)
        return [d1, d2, d3, d4, d5, d6], [hx1d, hx2d, hx3d, hx4d, hx5d, hx6]

class AnimeSegmentation(pl.LightningModule):
    def __init__(self, net_name, img_size=None, lr=1e-3):
        super().__init__()
        self.img_size = img_size
        self.lr = lr
        self.net = ISNetDIS()
        if net_name == "isnet_is":
            self.gt_encoder = ISNetGTEncoder()
            self.gt_encoder.requires_grad_(False)
        else:
            self.gt_encoder = None

    @classmethod
    def try_load(cls, net_name, ckpt_path, map_location=None, img_size=None):
        state_dict = torch.load(ckpt_path, map_location=map_location)
        if "epoch" in state_dict:
            return cls.load_from_checkpoint(ckpt_path, net_name=net_name, img_size=img_size, map_location=map_location)
        else:
            model = cls(net_name, img_size)
            if any([k.startswith("net.") for k, v in state_dict.items()]):
                model.load_state_dict(state_dict)
            else:
                model.net.load_state_dict(state_dict)
            return model

    def forward(self, x):
        return self.net(x)[0][0].sigmoid()


def get_mask(model, input_img, use_amp=True, s=640):
    input_img = (input_img / 255).astype(np.float32)
    dim = input_img.shape[2]
    if dim == 4:
        input_img = input_img[..., :3]
    h, w = h0, w0 = input_img.shape[:-1]
    h, w = (s, int(s * w / h)) if h > w else (int(s * h / w), s)
    ph, pw = s - h, s - w
    img_input = np.zeros([s, s, 3], dtype=np.float32)
    img_input[ph // 2:ph // 2 + h, pw // 2:pw // 2 + w] = cv2.resize(input_img, (w, h))
    img_input = np.transpose(img_input, (2, 0, 1))
    img_input = img_input[np.newaxis, :]
    tmpImg = torch.from_numpy(img_input).type(torch.FloatTensor).to(model.device)
    with torch.no_grad():
        if use_amp:
            with amp.autocast():
                pred = model(tmpImg)
            pred = pred.to(dtype=torch.float32)
        else:
            pred = model(tmpImg)
        pred = pred.cpu().numpy()[0]
        pred = np.transpose(pred, (1, 2, 0))
        pred = pred[ph // 2:ph // 2 + h, pw // 2:pw // 2 + w]
        pred = cv2.resize(pred, (w0, h0))[:, :, np.newaxis]
        return pred

def segmentate(image_path: str, out_path: str, model_path: str):
    segmentate_model = AnimeSegmentation.try_load("isnet_is", model_path, device, img_size=1024)
    segmentate_model.eval()
    segmentate_model.to(device)

    img = np.array(Image.open(image_path)) 
    
    mask = get_mask(segmentate_model, img, use_amp=False, s=1024)
    img = np.concatenate((mask * img + 1 - mask, mask * 255), axis=2).astype(np.uint8)
    img = cv2.cvtColor(img, cv2.COLOR_RGBA2BGRA)

    cv2.imwrite(os.path.normpath(out_path), img)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(prog="Anime Segmentator")
    parser.add_argument("-i", "--input")
    parser.add_argument("-o", "--output")
    parser.add_argument("-m", "--model_path")
    args = parser.parse_args()

    segmentate(args.input, args.output, args.model_path)