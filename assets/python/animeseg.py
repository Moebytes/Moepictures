# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# Moepictures - A cute and moe anime image board ❤          #
# Copyright © 2026 Moebytes <moebytes.com>                  #
# Licensed under CC BY-NC 4.0. See license.txt for details. # 
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

import json
import cv2
import logging
import os
import os.path as osp
import pandas as pd
from tqdm import tqdm
from PIL import Image
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
from torch.cuda import amp
from torchvision.ops.boxes import box_iou
import pytorch_lightning as pl
from torch import Tensor
from pathlib import Path
from onnxruntime import InferenceSession
from pycocotools.coco import COCO
import pycocotools.mask as maskUtils
from typing import List, Tuple, Dict, Union, Optional, Callable
import mmcv
from mmcv.transforms import Compose
from mmengine import Config
from mmdet.registry import MODELS
from mmengine.model.utils import revert_sync_batchnorm
from mmdet.structures.bbox.transforms import scale_boxes, get_box_wh
from mmdet.utils import register_all_modules, get_test_pipeline_cfg, InstanceList, reduce_mean, AvoidCUDAOOM
from mmdet.registry import MODELS
from mmdet.structures import DetDataSample, SampleList
from mmdet.models.detectors.single_stage import SingleStageDetector
from mmdet.models.dense_heads.rtmdet_ins_head import RTMDetInsSepBNHead

dirname = os.path.dirname(os.path.abspath(__file__))
register_all_modules()

CATEGORIES = [
    {"id": 0, "name": "object", "isthing": 1}
]

DEFAULT_DEVICE = "cpu"

class Colors:
    # Ultralytics color palette https://ultralytics.com/
    def __init__(self):
        # hex = matplotlib.colors.TABLEAU_COLORS.values()
        hexs = ('FF1010', '10FF10', 'FFF010', '100FFF', '0018EC', 'FF3838', 'FF9D97', 'FF701F', 'FFB21D', 'CFD231', 
                '48F90A', '92CC17', '3DDB86', '1A9334', '00D4BB', '2C99A8', '00C2FF', '344593', '6473FF', '0018EC', 
                '8438FF', '520085', 'CB38FF', 'FF95C8', 'FF37C7')
        self.palette = [self.hex2rgb(f'#{c}') for c in hexs]
        self.n = len(self.palette)

    def __call__(self, i, bgr=True):
        c = self.palette[int(i) % self.n]
        return (c[2], c[1], c[0]) if bgr else c

    @staticmethod
    def hex2rgb(h):  # rgb order (PIL)
        return tuple(int(h[1 + i:1 + i + 2], 16) for i in (0, 2, 4))
    
colors = Colors()
def get_color(idx):
    if idx == -1:
        return 255
    else:
        return colors(idx)

IMG_EXT = {'.bmp', '.jpg', '.png', '.jpeg'}
def find_all_imgs(img_dir, abs_path=False):
    imglist = []
    dir_list = os.listdir(img_dir)
    for filename in dir_list:
        file_suffix = Path(filename).suffix
        if file_suffix.lower() not in IMG_EXT:
            continue
        if abs_path:
            imglist.append(osp.join(img_dir, filename))
        else:
            imglist.append(filename)
    return imglist

def make_square(img, target_size):
    old_size = img.shape[:2]
    desired_size = max(old_size)
    desired_size = max(desired_size, target_size)

    delta_w = desired_size - old_size[1]
    delta_h = desired_size - old_size[0]
    top, bottom = delta_h // 2, delta_h - (delta_h // 2)
    left, right = delta_w // 2, delta_w - (delta_w // 2)

    color = [255, 255, 255]
    new_im = cv2.copyMakeBorder(
        img, top, bottom, left, right, cv2.BORDER_CONSTANT, value=color
    )
    return new_im

def smart_resize(img, size):
    # Assumes the image has already gone through make_square
    if img.shape[0] > size:
        img = cv2.resize(img, (size, size), interpolation=cv2.INTER_AREA)
    elif img.shape[0] < size:
        img = cv2.resize(img, (size, size), interpolation=cv2.INTER_CUBIC)
    return img

def scaledown_maxsize(img: np.ndarray, max_size: int, divisior: int = None):
    im_h, im_w = img.shape[:2]
    ori_h, ori_w = img.shape[:2]
    resize_ratio = max_size / max(im_h, im_w)
    if resize_ratio < 1:
        if im_h > im_w:
            im_h = max_size
            im_w = max(1, int(round(im_w * resize_ratio)))
        
        else:
            im_w = max_size
            im_h = max(1, int(round(im_h * resize_ratio)))
    if divisior is not None:
        im_w = int(np.ceil(im_w / divisior) * divisior)
        im_h = int(np.ceil(im_h / divisior) * divisior)

    if im_w != ori_w or im_h != ori_h:
       img = cv2.resize(img, (im_w, im_h), interpolation=cv2.INTER_LINEAR)
       
    return img

def resize_pad(img: np.ndarray, tgt_size: int, pad_value: Tuple = (0, 0, 0)):
    # downscale to tgt_size and pad to square
    img = scaledown_maxsize(img, tgt_size)
    padl, padr, padt, padb = 0, 0, 0, 0
    h, w = img.shape[:2]
    # padt = (tgt_size - h) // 2
    # padb = tgt_size - h - padt
    # padl = (tgt_size - w) // 2
    # padr = tgt_size - w - padl
    padb = tgt_size - h
    padr = tgt_size - w

    if padt + padb + padl + padr > 0:
        img = cv2.copyMakeBorder(img, padt, padb, padl, padr, cv2.BORDER_CONSTANT, value=pad_value)

    return img, (padt, padb, padl, padr)

NP_BOOL_TYPES = (np.bool_)
NP_FLOAT_TYPES = (np.float_, np.float16, np.float32, np.float64)
NP_INT_TYPES = (np.int_, np.int8, np.int16, np.int32, np.int64, np.uint, np.uint8, np.uint16, np.uint32, np.uint64)

class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        elif isinstance(obj, np.ScalarType):
            if isinstance(obj, NP_BOOL_TYPES):
                return bool(obj)
            elif isinstance(obj, NP_FLOAT_TYPES):
                return float(obj)
            elif isinstance(obj, NP_INT_TYPES):
                return int(obj)
        return json.JSONEncoder.default(self, obj)
    
def dict2json(adict: dict, json_path: str):
    with open(json_path, "w", encoding="utf-8") as f:
        f.write(json.dumps(adict, ensure_ascii=False, cls=NumpyEncoder))

def mask2rle(mask: np.ndarray, decode_for_json: bool = True) -> Dict:
    mask_rle = maskUtils.encode(np.array(
                        mask[..., np.newaxis] > 0, order='F',
                        dtype='uint8'))[0]
    if decode_for_json:
        mask_rle['counts'] = mask_rle['counts'].decode()
    return mask_rle

class Tagger :
    def __init__(self, filename) -> None:
        self.model = InferenceSession(filename, providers=['CUDAExecutionProvider'])
        [root, _] = os.path.split(filename)
        self.tags = pd.read_csv(os.path.join(root, 'selected_tags.csv') if root else 'selected_tags.csv')
        
        _, self.height, _, _ = self.model.get_inputs()[0].shape

        characters = self.tags.loc[self.tags['category'] == 4]
        self.characters = set(characters['name'].values.tolist())

    def label(self, image: Image) -> Dict[str, float] :
        # alpha to white
        image = image.convert('RGBA')
        new_image = Image.new('RGBA', image.size, 'WHITE')
        new_image.paste(image, mask=image)
        image = new_image.convert('RGB')
        image = np.asarray(image)

        # PIL RGB to OpenCV BGR
        image = image[:, :, ::-1]

        image = make_square(image, self.height)
        image = smart_resize(image, self.height)
        image = image.astype(np.float32)
        image = np.expand_dims(image, 0)

        # evaluate model
        input_name = self.model.get_inputs()[0].name
        label_name = self.model.get_outputs()[0].name
        confidents = self.model.run([label_name], {input_name: image})[0]

        tags = self.tags[:][['name']]
        tags['confidents'] = confidents[0]

        # first 4 items are for rating (general, sensitive, questionable, explicit)
        ratings = dict(tags[:4].values)

        # rest are regular tags
        tags = dict(tags[4:].values)

        tags = {t: v for t, v in tags.items() if v > 0.5}
        return tags

    def label_cv2_bgr(self, image: np.ndarray) -> Dict[str, float] :
        # image in BGR u8
        image = make_square(image, self.height)
        image = smart_resize(image, self.height)
        image = image.astype(np.float32)
        image = np.expand_dims(image, 0)

        # evaluate model
        input_name = self.model.get_inputs()[0].name
        label_name = self.model.get_outputs()[0].name
        confidents = self.model.run([label_name], {input_name: image})[0]

        tags = self.tags[:][['name']]
        cats = self.tags[:][['category']]
        tags['confidents'] = confidents[0]

        # first 4 items are for rating (general, sensitive, questionable, explicit)
        ratings = dict(tags[:4].values)

        # rest are regular tags
        tags = dict(tags[4:].values)

        tags = [t for t, v in tags.items() if v > 0.5]
        character_str = []
        for t in tags:
            if t in self.characters:
                character_str.append(t)
        return tags, character_str
    
def tags2multilines(tags: Union[str, List], lw, tf, max_width):
    if isinstance(tags, str):
        taglist = tags.split(' ')
    else:
        taglist = tags

    sz = cv2.getTextSize(' ', 0, lw / 3, tf)
    line_height = sz[0][1]
    line_width = 0
    if len(taglist) > 0:
        lines = [taglist[0]]
        if len(taglist) > 1:
            for t in taglist[1:]:
                textl = len(t) * line_height
                if line_width + line_height + textl > max_width:
                    lines.append(t)
                    line_width = 0
                else:
                    line_width = line_width + line_height + textl
                    lines[-1] = lines[-1] + ' ' + t
    return lines, line_height

class AnimeInstances:
    def __init__(self, 
                 masks: Union[np.ndarray, torch.Tensor ]= None, 
                 bboxes: Union[np.ndarray, torch.Tensor ] = None, 
                 scores: Union[np.ndarray, torch.Tensor ] = None,
                 tags: List[str] = None, character_tags: List[str] = None) -> None:
        self.masks = masks
        self.tags = tags
        self.bboxes =  bboxes
        

        if scores is None:
            scores = [1.] * len(self)
            if self.is_numpy:
                scores = np.array(scores)
            elif self.is_tensor:
                scores = torch.tensor(scores)

        self.scores = scores

        if tags is None:
            self.tags = [''] * len(self)
            self.character_tags = [''] * len(self)
        else:
            self.tags = tags
            self.character_tags = character_tags

    @property
    def is_cuda(self):
        if isinstance(self.masks, torch.Tensor) and self.masks.is_cuda:
            return True
        else:
            return False
        
    @property
    def is_tensor(self):
        if self.is_empty:
            return False
        else:
            return isinstance(self.masks, torch.Tensor)
        
    @property
    def is_numpy(self):
        if self.is_empty:
            return True
        else:
            return isinstance(self.masks, np.ndarray)

    @property
    def is_empty(self):
        return self.masks is None or len(self.masks) == 0\
        
    def remove_duplicated(self):
        
        num_masks = len(self)
        if num_masks < 2:
            return
        
        need_cvt = False
        if self.is_numpy:
            need_cvt = True
            self.to_tensor()

        mask_areas = torch.Tensor([mask.sum() for mask in self.masks])
        sids = torch.argsort(mask_areas, descending=True)
        sids = sids.cpu().numpy().tolist()
        mask_areas = mask_areas[sids]
        masks = self.masks[sids]
        bboxes = self.bboxes[sids]
        tags = [self.tags[sid] for sid in sids]
        scores = self.scores[sids]

        canvas = masks[0]

        valid_ids: List = np.arange(num_masks).tolist()
        for ii, mask in enumerate(masks[1:]):

            mask_id = ii + 1
            canvas_and = torch.bitwise_and(canvas, mask)

            and_area = canvas_and.sum()
            mask_area = mask_areas[mask_id]

            if and_area / mask_area > 0.8:
                valid_ids.remove(mask_id)
            elif mask_id != num_masks - 1:
                canvas = torch.bitwise_or(canvas, mask)

        sids = valid_ids
        self.masks = masks[sids]
        self.bboxes = bboxes[sids]
        self.tags = [tags[sid] for sid in sids]
        self.scores = scores[sids]

        if need_cvt:
            self.to_numpy()

        # sids = 

    def draw_instances(self, 
                      img: np.ndarray,
                      draw_bbox: bool = True, 
                      draw_ins_mask: bool = True, 
                      draw_ins_contour: bool = True, 
                      draw_tags: bool = False,
                      draw_indices: List = None,
                      mask_alpha: float = 0.4):
        
        mask_alpha = 0.75


        drawed = img.copy()
        
        if self.is_empty:
            return drawed
        
        im_h, im_w = img.shape[:2]

        mask_shape = self.masks[0].shape
        if mask_shape[0] != im_h or mask_shape[1] != im_w:
            drawed = cv2.resize(drawed, (mask_shape[1], mask_shape[0]), interpolation=cv2.INTER_AREA)
            im_h, im_w = mask_shape[0], mask_shape[1]
        
        if draw_indices is None:
            draw_indices = list(range(len(self)))
        ins_dict = {'mask': [], 'tags': [], 'score': [], 'bbox': [], 'character_tags': []}
        colors = []
        for idx in draw_indices:
            ins = self.get_instance(idx, out_type='numpy')
            for key, data in ins.items():
                ins_dict[key].append(data)
            colors.append(get_color(idx))

        if draw_bbox:
            lw = max(round(sum(drawed.shape) / 2 * 0.003), 2)
            for color, bbox in zip(colors, ins_dict['bbox']):
                p1, p2 = (int(bbox[0]), int(bbox[1])), (int(bbox[2] + bbox[0]), int(bbox[3] + bbox[1]))
                cv2.rectangle(drawed, p1, p2, color, thickness=lw, lineType=cv2.LINE_AA)

        if draw_ins_mask:
            drawed = drawed.astype(np.float32)
            for color, mask in zip(colors, ins_dict['mask']):
                p = mask.astype(np.float32)
                blend_mask = np.full((im_h, im_w, 3), color, dtype=np.float32)
                alpha_msk = (mask_alpha * p)[..., None]
                alpha_ori = 1 - alpha_msk
                drawed = drawed * alpha_ori + alpha_msk * blend_mask
            drawed = drawed.astype(np.uint8)

        if draw_tags:
            lw = max(round(sum(drawed.shape) / 2 * 0.002), 2)
            tf = max(lw - 1, 1)
            for color, tags, bbox in zip(colors, ins_dict['tags'], ins_dict['bbox']):
                if not tags:
                    continue
                lines, line_height = tags2multilines(tags, lw, tf, bbox[2])
                for ii, l in enumerate(lines):
                    xy = (bbox[0], bbox[1] + line_height + int(line_height * 1.2 * ii))
                    cv2.putText(drawed, l, xy, 0, lw / 3, color, thickness=tf, lineType=cv2.LINE_AA)
                
        # cv2.imshow('canvas', drawed)
        # cv2.waitKey(0)
        return drawed
    

    def cuda(self):
        if self.is_empty:
            return self
        self.to_tensor(device='cuda')
        return self
    
    def cpu(self):
        if not self.is_tensor or not self.is_cuda:
            return self
        self.masks = self.masks.cpu()
        self.scores = self.scores.cpu()
        self.bboxes = self.bboxes.cpu()
        return self

    def to_tensor(self, device: str = 'cpu'):
        if self.is_empty:
            return self
        elif self.is_tensor and self.masks.device == device:
            return self
        self.masks = torch.from_numpy(self.masks).to(device)
        self.bboxes = torch.from_numpy(self.bboxes).to(device)
        self.scores = torch.from_numpy(self.scores ).to(device)
        return self
    
    def to_numpy(self):
        if self.is_numpy:
            return self
        if self.is_cuda:
            self.masks = self.masks.cpu().numpy()
            self.scores = self.scores.cpu().numpy()
            self.bboxes = self.bboxes.cpu().numpy()
        else:
            self.masks = self.masks.numpy()
            self.scores = self.scores.numpy()
            self.bboxes = self.bboxes.numpy()
        return self
    
    def get_instance(self, ins_idx: int, out_type: str = None, device: str = None):
        mask = self.masks[ins_idx]
        tags = self.tags[ins_idx]
        character_tags = self.character_tags[ins_idx]
        bbox = self.bboxes[ins_idx]
        score = self.scores[ins_idx]
        if out_type is not None:
            if out_type == 'numpy' and not self.is_numpy:
                mask = mask.cpu().numpy()
                bbox = bbox.cpu().numpy()
                score = score.cpu().numpy()
            if out_type == 'tensor' and not self.is_tensor:
                mask = torch.from_numpy(mask)
                bbox = torch.from_numpy(bbox)
                score = torch.from_numpy(score)
            if isinstance(mask, torch.Tensor) and device is not None and mask.device != device:
                mask = mask.to(device)
                bbox = bbox.to(device)
                score = score.to(device)
            
        return {
            'mask': mask,
            'tags': tags,
            'character_tags': character_tags,
            'bbox': bbox,
            'score': score
        }
    
    def __len__(self):
        if self.is_empty:
            return 0
        else:
            return len(self.masks)
        
    def resize(self, h, w, mode = 'area'):
        if self.is_empty:
            return
        if self.is_tensor:
            masks = self.masks.to(torch.float).unsqueeze(1)
            oh, ow = masks.shape[2], masks.shape[3]
            hs, ws = h / oh, w / ow
            bboxes = self.bboxes.float()
            bboxes[:, ::2] *= hs
            bboxes[:, 1::2] *= ws
            self.bboxes = torch.round(bboxes).int()
            masks = torch.nn.functional.interpolate(masks, (h, w), mode=mode)
            self.masks = masks.squeeze(1) > 0.3

    def compose_masks(self, output_type=None):
        if self.is_empty:
            return None
        else:
            mask = self.masks[0]
            if len(self.masks) > 1:
                for m in self.masks[1:]:
                    if self.is_numpy:
                        mask = np.logical_or(mask, m)
                    else:
                        mask = torch.logical_or(mask, m)
            if output_type is not None:
                if output_type == 'numpy' and not self.is_numpy:
                    mask = mask.cpu().numpy()
                if output_type == 'tensor' and not self.is_tensor:
                    mask = torch.from_numpy(mask)
            return mask

def single_image_preprocess(img: Union[str, np.ndarray], pipeline: Compose):
    if isinstance(img, str):
        img = mmcv.imread(img)
    elif not isinstance(img, np.ndarray):
        raise NotImplementedError

    # img = square_pad_resize(img, 1024)[0]

    data_ = dict(img=img, img_id=0)
    data_ = pipeline(data_)
    data_['inputs'] = [data_['inputs']]
    data_['data_samples'] = [data_['data_samples']]

    return data_, img

def structure_loss(pred, mask):
    weit  = 1+5*torch.abs(F.avg_pool2d(mask, kernel_size=15, stride=1, padding=7)-mask)
    wbce  = F.binary_cross_entropy_with_logits(pred, mask, reduction='none')
    wbce  = (weit*wbce).sum(dim=(2,3))/weit.sum(dim=(2,3))

    pred  = torch.sigmoid(pred)
    inter = ((pred*mask)*weit).sum(dim=(2,3))
    union = ((pred+mask)*weit).sum(dim=(2,3))
    wiou  = 1-(inter+1)/(union-inter+1)
    return (wbce+wiou).mean()

def muti_loss_fusion(preds, target, dist_weight=None, loss0_weight=1.0):
    loss0 = 0.0
    loss = 0.0

    for i in range(0, len(preds)):
        weight = dist_weight if i == 0 else None
        if preds[i].shape[2] != target.shape[2] or preds[i].shape[3] != target.shape[3]:
            tmp_target = F.interpolate(target, size=preds[i].size()[2:], mode='bilinear', align_corners=True)
            loss = loss + structure_loss(preds[i], tmp_target)
        else:
            # loss = loss + bce_loss(preds[i], target, weight)
            loss = loss + structure_loss(preds[i], target)
        if i == 0:
            loss *= loss0_weight
            loss0 = loss
    return loss0, loss

_fea_loss = nn.MSELoss(reduction="mean")
def fea_loss(p, t, weights=None):
    return _fea_loss(p, t)

kl_loss = nn.KLDivLoss(reduction="mean")
l1_loss = nn.L1Loss(reduction="mean")
smooth_l1_loss = nn.SmoothL1Loss(reduction="mean")

def muti_loss_fusion_kl(preds, target, dfs, fs, mode='MSE', dist_weight=None, loss0_weight=1.0):
    loss0 = 0.0
    loss = 0.0

    for i in range(0, len(preds)):
        weight = dist_weight if i == 0 else None
        if preds[i].shape[2] != target.shape[2] or preds[i].shape[3] != target.shape[3]:
            tmp_target = F.interpolate(target, size=preds[i].size()[2:], mode='bilinear', align_corners=True)
            # loss = loss + bce_loss(preds[i], tmp_target, weight)
            loss = loss + structure_loss(preds[i], tmp_target)
        else:
            # loss = loss + bce_loss(preds[i], target, weight)
            loss = loss + structure_loss(preds[i], target)
        if i == 0:
            loss *= loss0_weight
            loss0 = loss

    for i in range(0, len(dfs)):
        df = dfs[i]
        fs_i = fs[i]
        if mode == 'MSE':
            loss = loss + fea_loss(df, fs_i, dist_weight)  ### add the mse loss of features as additional constraints
        elif mode == 'KL':
            loss = loss + kl_loss(F.log_softmax(df, dim=1), F.softmax(fs_i, dim=1))
        elif mode == 'MAE':
            loss = loss + l1_loss(df, fs_i)
        elif mode == 'SmoothL1':
            loss = loss + smooth_l1_loss(df, fs_i)

    return loss0, loss

## upsample tensor 'src' to have the same spatial size with tensor 'tar'
def _upsample_like(src, tar):
    src = F.interpolate(src, size=tar.shape[2:], mode='bilinear', align_corners=False)

    return src

class REBNCONV(nn.Module):
    def __init__(self, in_ch=3, out_ch=3, dirate=1, stride=1):
        super(REBNCONV, self).__init__()

        self.conv_s1 = nn.Conv2d(in_ch, out_ch, 3, padding=1 * dirate, dilation=1 * dirate, stride=stride)
        self.bn_s1 = nn.BatchNorm2d(out_ch)
        self.relu_s1 = nn.ReLU(inplace=True)

    def forward(self, x):
        hx = x
        xout = self.relu_s1(self.bn_s1(self.conv_s1(hx)))

        return xout
    
### RSU-7 ###
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


### RSU-6 ###
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


### RSU-5 ###
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


### RSU-4 ###
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


### RSU-4F ###
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
    def __init__(self, in_ch=3,
                 out_ch=1,
                 kernel_size=3,
                 stride=1,
                 padding=1,
                 dilation=1,
                 groups=1):
        super(myrebnconv, self).__init__()

        self.conv = nn.Conv2d(in_ch,
                              out_ch,
                              kernel_size=kernel_size,
                              stride=stride,
                              padding=padding,
                              dilation=dilation,
                              groups=groups)
        self.bn = nn.BatchNorm2d(out_ch)
        self.rl = nn.ReLU(inplace=True)

    def forward(self, x):
        return self.rl(self.bn(self.conv(x)))
    
class ISNetGTEncoder(nn.Module):
    def __init__(self, in_ch=1, out_ch=1):
        super(ISNetGTEncoder, self).__init__()

        self.conv_in = myrebnconv(in_ch, 16, 3, stride=2, padding=1)  # nn.Conv2d(in_ch,64,3,stride=2,padding=1)

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
    def compute_loss(args, dist_weight=None):
        preds, targets = args
        return muti_loss_fusion(preds, targets, dist_weight)

    def forward(self, x):
        hx = x

        hxin = self.conv_in(hx)
        # hx = self.pool_in(hxin)

        # stage 1
        hx1 = self.stage1(hxin)
        hx = self.pool12(hx1)

        # stage 2
        hx2 = self.stage2(hx)
        hx = self.pool23(hx2)

        # stage 3
        hx3 = self.stage3(hx)
        hx = self.pool34(hx3)

        # stage 4
        hx4 = self.stage4(hx)
        hx = self.pool45(hx4)

        # stage 5
        hx5 = self.stage5(hx)
        hx = self.pool56(hx5)

        # stage 6
        hx6 = self.stage6(hx)

        # side output
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

        # d0 = self.outconv(torch.cat((d1,d2,d3,d4,d5,d6),1))

        # return [torch.sigmoid(d1), torch.sigmoid(d2), torch.sigmoid(d3), torch.sigmoid(d4), torch.sigmoid(d5), torch.sigmoid(d6)], [hx1, hx2, hx3, hx4, hx5, hx6]
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

        # decoder
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

        # self.outconv = nn.Conv2d(6*out_ch,out_ch,1)

    @staticmethod
    def compute_loss_kl(preds, targets, dfs, fs, mode='MSE'):
        return muti_loss_fusion_kl(preds, targets, dfs, fs, mode=mode, loss0_weight=5.0)

    @staticmethod
    def compute_loss(args, dist_weight=None):
        if len(args) == 3:
            ds, dfs, labels = args
            return muti_loss_fusion(ds, labels, dist_weight, loss0_weight=5.0)
        else:
            ds, dfs, labels, fs = args
            return muti_loss_fusion_kl(ds, labels, dfs, fs, mode="MSE", dist_weight=dist_weight, loss0_weight=5.0)

    def forward(self, x):
        hx = x

        hxin = self.conv_in(hx)
        hx = self.pool_in(hxin)

        # stage 1
        hx1 = self.stage1(hxin)
        hx = self.pool12(hx1)

        # stage 2
        hx2 = self.stage2(hx)
        hx = self.pool23(hx2)

        # stage 3
        hx3 = self.stage3(hx)
        hx = self.pool34(hx3)

        # stage 4
        hx4 = self.stage4(hx)
        hx = self.pool45(hx4)

        # stage 5
        hx5 = self.stage5(hx)
        hx = self.pool56(hx5)

        # stage 6
        hx6 = self.stage6(hx)
        hx6up = _upsample_like(hx6, hx5)

        # -------------------- decoder --------------------
        hx5d = self.stage5d(torch.cat((hx6up, hx5), 1))
        hx5dup = _upsample_like(hx5d, hx4)

        hx4d = self.stage4d(torch.cat((hx5dup, hx4), 1))
        hx4dup = _upsample_like(hx4d, hx3)

        hx3d = self.stage3d(torch.cat((hx4dup, hx3), 1))
        hx3dup = _upsample_like(hx3d, hx2)

        hx2d = self.stage2d(torch.cat((hx3dup, hx2), 1))
        hx2dup = _upsample_like(hx2d, hx1)

        hx1d = self.stage1d(torch.cat((hx2dup, hx1), 1))

        # side output
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

        # d0 = self.outconv(torch.cat((d1,d2,d3,d4,d5,d6),1))

        # return [torch.sigmoid(d1), torch.sigmoid(d2), torch.sigmoid(d3), torch.sigmoid(d4), torch.sigmoid(d5), torch.sigmoid(d6)], [hx1d, hx2d, hx3d, hx4d, hx5d, hx6]
        return [d1, d2, d3, d4, d5, d6], [hx1d, hx2d, hx3d, hx4d, hx5d, hx6]

def get_net(net_name):
    if net_name == "isnet":
        return ISNetDIS()
    elif net_name == "isnet_is":
        return ISNetDIS()
    elif net_name == "isnet_gt":
        return ISNetGTEncoder()
    elif net_name == "u2net":
        pass
        #return U2NET_full2()
    elif net_name == "u2netl":
        pass
        #return U2NET_lite2()
    elif net_name == "modnet":
        pass
        #return MODNet()
    raise NotImplemented

def f1_torch(pred, gt):
    # micro F1-score
    pred = pred.float().view(pred.shape[0], -1)
    gt = gt.float().view(gt.shape[0], -1)
    tp1 = torch.sum(pred * gt, dim=1)
    tp_fp1 = torch.sum(pred, dim=1)
    tp_fn1 = torch.sum(gt, dim=1)
    pred = 1 - pred
    gt = 1 - gt
    tp2 = torch.sum(pred * gt, dim=1)
    tp_fp2 = torch.sum(pred, dim=1)
    tp_fn2 = torch.sum(gt, dim=1)
    precision = (tp1 + tp2) / (tp_fp1 + tp_fp2 + 0.0001)
    recall = (tp1 + tp2) / (tp_fn1 + tp_fn2 + 0.0001)
    f1 = (1 + 0.3) * precision * recall / (0.3 * precision + recall + 0.0001)
    return precision, recall, f1

class AnimeSegmentation(pl.LightningModule):
    def __init__(self, net_name):
        super().__init__()
        assert net_name in ["isnet_is", "isnet", "isnet_gt", "u2net", "u2netl", "modnet"]
        self.net = get_net(net_name)
        if net_name == "isnet_is":
            self.gt_encoder = get_net("isnet_gt")
            self.gt_encoder.requires_grad_(False)
        else:
            self.gt_encoder = None

    @classmethod
    def try_load(cls, net_name, ckpt_path, map_location=None):
        state_dict = torch.load(ckpt_path, map_location=map_location)
        if "epoch" in state_dict:
            return cls.load_from_checkpoint(ckpt_path, net_name=net_name, map_location=map_location)
        else:
            model = cls(net_name)
            if any([k.startswith("net.") for k, v in state_dict.items()]):
                model.load_state_dict(state_dict)
            else:
                model.net.load_state_dict(state_dict)
            return model

    def configure_optimizers(self):
        optimizer = optim.Adam(self.net.parameters(), lr=0.001, betas=(0.9, 0.999), eps=1e-08, weight_decay=0)
        return optimizer

    def forward(self, x):
        if isinstance(self.net, ISNetDIS):
            return self.net(x)[0][0].sigmoid()
        if isinstance(self.net, ISNetGTEncoder):
            return self.net(x)[0][0].sigmoid()
        #elif isinstance(self.net, U2NET):
        #    return self.net(x)[0].sigmoid()
        #elif isinstance(self.net, MODNet):
        #    return self.net(x, True)[2]
        raise NotImplemented

    def training_step(self, batch, batch_idx):
        images, labels = batch["image"], batch["label"]
        if isinstance(self.net, ISNetDIS):
            ds, dfs = self.net(images)
            loss_args = [ds, dfs, labels]
        elif isinstance(self.net, ISNetGTEncoder):
            ds = self.net(labels)[0]
            loss_args = [ds, labels]
        #elif isinstance(self.net, U2NET):
        #    ds = self.net(images)
        #    loss_args = [ds, labels]
        #elif isinstance(self.net, MODNet):
        #    trimaps = batch["trimap"]
        #    pred_semantic, pred_detail, pred_matte = self.net(images, False)
        #    loss_args = [pred_semantic, pred_detail, pred_matte, images, trimaps, labels]
        else:
            raise NotImplemented
        if self.gt_encoder is not None:
            fs = self.gt_encoder(labels)[1]
            loss_args.append(fs)

        loss0, loss = self.net.compute_loss(loss_args)
        self.log_dict({"train/loss": loss, "train/loss_tar": loss0})
        return loss

    def validation_step(self, batch, batch_idx):
        images, labels = batch["image"], batch["label"]
        if isinstance(self.net, ISNetGTEncoder):
            preds = self.forward(labels)
        else:
            preds = self.forward(images)
        pre, rec, f1, = f1_torch(preds.nan_to_num(nan=0, posinf=1, neginf=0), labels)
        mae_m = F.l1_loss(preds, labels, reduction="mean")
        pre_m = pre.mean()
        rec_m = rec.mean()
        f1_m = f1.mean()
        self.log_dict({"val/precision": pre_m, "val/recall": rec_m, "val/f1": f1_m, "val/mae": mae_m}, sync_dist=True)

def prepare_refine_batch(segmentations: np.ndarray, img: np.ndarray, max_batch_size: int = 4, device: str = 'cpu', input_size: int = 720):

    img, (pt, pb, pl, pr) = resize_pad(img, input_size, pad_value=(0, 0, 0))

    img = img.transpose((2, 0, 1)).astype(np.float32) / 255.

    batch = []
    num_seg = len(segmentations)
    
    for ii, seg in enumerate(segmentations):
        seg, _ = resize_pad(seg, input_size, 0)
        seg = seg[None, ...]
        batch.append(np.concatenate((img, seg)))

        if ii == num_seg - 1:
            yield torch.from_numpy(np.array(batch)).to(device), (pt, pb, pl, pr)
        elif len(batch) >= max_batch_size:
            yield torch.from_numpy(np.array(batch)).to(device), (pt, pb, pl, pr)
            batch = []

def load_refinenet(refine_method = 'animeseg', device: str = None) -> AnimeSegmentation:
    if device is None:
        device = DEFAULT_DEVICE
    if refine_method == 'animeseg':
        model = AnimeSegmentation.try_load('isnet_is', os.path.join(dirname, 'segmentator/anime-segmentation.ckpt'), device)
    elif refine_method == 'refinenet_isnet':
        model = ISNetDIS(in_ch=4)
        sd = torch.load(os.path.join(dirname, 'charactersplit/refine_last.ckpt'), map_location='cpu')
        model.load_state_dict(sd)
    else:
        raise NotImplementedError
    return model.eval().to(device)

def get_mask(model, input_img, use_amp=True, s=640):
    h0, w0 = h, w = input_img.shape[0], input_img.shape[1]
    if h > w:
        h, w = s, int(s * w / h)
    else:
        h, w = int(s * h / w), s
    ph, pw = s - h, s - w
    tmpImg = np.zeros([s, s, 3], dtype=np.float32)
    tmpImg[ph // 2:ph // 2 + h, pw // 2:pw // 2 + w] = cv2.resize(input_img, (w, h)) / 255
    tmpImg = tmpImg.transpose((2, 0, 1))
    tmpImg = torch.from_numpy(tmpImg).unsqueeze(0).type(torch.FloatTensor).to(model.device)
    with torch.no_grad():
        if use_amp:
            with amp.autocast():
                pred = model(tmpImg)
            pred = pred.to(dtype=torch.float32)
        else:
            pred = model(tmpImg)
        pred = pred[0, :, ph // 2:ph // 2 + h, pw // 2:pw // 2 + w]
        pred = cv2.resize(pred.cpu().numpy().transpose((1, 2, 0)), (w0, h0))[:, :, np.newaxis]
        return pred
    
def sthgoeswrong(logits):
    return torch.any(torch.isnan(logits)) or torch.any(torch.isinf(logits))

@MODELS.register_module()
class RTMDetInsSepBNHeadCustom(RTMDetInsSepBNHead):
    def _mask_predict_by_feat_single(self, mask_feat: Tensor, kernels: Tensor,
                                     priors: Tensor) -> Tensor:

        ori_maskfeat = mask_feat

        num_inst = priors.shape[0]
        h, w = mask_feat.size()[-2:]
        if num_inst < 1:
            return torch.empty(
                size=(num_inst, h, w),
                dtype=mask_feat.dtype,
                device=mask_feat.device)
        if len(mask_feat.shape) < 4:
            mask_feat.unsqueeze(0)

        coord = self.prior_generator.single_level_grid_priors(
            (h, w), level_idx=0, device=mask_feat.device).reshape(1, -1, 2)
        num_inst = priors.shape[0]
        points = priors[:, :2].reshape(-1, 1, 2)
        strides = priors[:, 2:].reshape(-1, 1, 2)
        relative_coord = (points - coord).permute(0, 2, 1) / (
            strides[..., 0].reshape(-1, 1, 1) * 8)
        relative_coord = relative_coord.reshape(num_inst, 2, h, w)

        mask_feat = torch.cat(
            [relative_coord,
             mask_feat.repeat(num_inst, 1, 1, 1)], dim=1)
        weights, biases = self.parse_dynamic_params(kernels)

        fp16_used = weights[0].dtype == torch.float16

        n_layers = len(weights)
        x = mask_feat.reshape(1, -1, h, w)
        for i, (weight, bias) in enumerate(zip(weights, biases)):
            with torch.cuda.amp.autocast(enabled=False):
                if fp16_used:
                    weight = weight.to(torch.float32)
                    bias = bias.to(torch.float32)
                x = F.conv2d(
                    x, weight, bias=bias, stride=1, padding=0, groups=num_inst)
                if i < n_layers - 1:
                    x = F.relu(x)

        if fp16_used:
            x = torch.clip(x, -8192, 8192)
        if sthgoeswrong(x):
            torch.save({'mask_feat': ori_maskfeat, 'kernels': kernels, 'priors': priors}, 'maskhead_nan_input.pt')
            raise Exception('Mask Head NaN')

        x = x.reshape(num_inst, h, w)
        return x

    @AvoidCUDAOOM.retry_if_cuda_oom
    def loss_mask_by_feat(self, mask_feats: Tensor, flatten_kernels: Tensor,
                          sampling_results_list: list,
                          batch_gt_instances: InstanceList) -> Tensor:
        batch_pos_mask_logits = []
        pos_gt_masks = []
        ignore_masks = []
        for idx, (mask_feat, kernels, sampling_results,
                  gt_instances) in enumerate(
                      zip(mask_feats, flatten_kernels, sampling_results_list,
                          batch_gt_instances)):
            pos_priors = sampling_results.pos_priors
            pos_inds = sampling_results.pos_inds
            pos_kernels = kernels[pos_inds]  # n_pos, num_gen_params
            pos_mask_logits = self._mask_predict_by_feat_single(
                mask_feat, pos_kernels, pos_priors)
            if gt_instances.masks.numel() == 0:
                gt_masks = torch.empty_like(gt_instances.masks)
                # if gt_masks.shape[0] > 0:
                    # ignore = torch.zeros(gt_masks.shape[0], dtype=torch.bool).to(device=gt_masks.device)
                    # ignore_masks.append(ignore)
            else:
                msk = torch.logical_not(gt_instances.ignore_mask[sampling_results.pos_assigned_gt_inds])
                gt_masks = gt_instances.masks[
                    sampling_results.pos_assigned_gt_inds, :][msk]
                pos_mask_logits = pos_mask_logits[msk]
                # ignore_masks.append(gt_instances.ignore_mask[sampling_results.pos_assigned_gt_inds])
            batch_pos_mask_logits.append(pos_mask_logits)
            pos_gt_masks.append(gt_masks)

        pos_gt_masks = torch.cat(pos_gt_masks, 0)
        batch_pos_mask_logits = torch.cat(batch_pos_mask_logits, 0)
        # ignore_masks = torch.logical_not(torch.cat(ignore_masks, 0))

        # pos_gt_masks = pos_gt_masks[ignore_masks]
        # batch_pos_mask_logits = batch_pos_mask_logits[ignore_masks]


        # avg_factor
        num_pos = batch_pos_mask_logits.shape[0]
        num_pos = reduce_mean(mask_feats.new_tensor([num_pos
                                                     ])).clamp_(min=1).item()

        if batch_pos_mask_logits.shape[0] == 0:
            return mask_feats.sum() * 0

        scale = self.prior_generator.strides[0][0] // self.mask_loss_stride
        # upsample pred masks
        batch_pos_mask_logits = F.interpolate(
            batch_pos_mask_logits.unsqueeze(0),
            scale_factor=scale,
            mode='bilinear',
            align_corners=False).squeeze(0)
        # downsample gt masks
        pos_gt_masks = pos_gt_masks[:, self.mask_loss_stride //
                                    2::self.mask_loss_stride,
                                    self.mask_loss_stride //
                                    2::self.mask_loss_stride]

        loss_mask = self.loss_mask(
            batch_pos_mask_logits,
            pos_gt_masks,
            weight=None,
            avg_factor=num_pos)

        return loss_mask

def read_imglst_from_txt(filep) -> List[str]:
    with open(filep, 'r', encoding='utf8') as f:
        lines = f.read().splitlines() 
    return lines

def animeseg_refine(det_pred: DetDataSample, img: np.ndarray, net: AnimeSegmentation, to_rgb=True, input_size: int = 1024):
    num_pred = len(det_pred.pred_instances)
    if num_pred < 1:
        return
    
    with torch.no_grad():
        if to_rgb:
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        seg_thr = 0.5
        mask = get_mask(net, img, s=input_size)[..., 0]
        mask = (mask > seg_thr)
        
        ins_masks = det_pred.pred_instances.masks

        if isinstance(ins_masks, torch.Tensor):
            tensor_device = ins_masks.device
            tensor_dtype = ins_masks.dtype
            to_tensor = True
            ins_masks = ins_masks.cpu().numpy()

        area_original = np.sum(ins_masks, axis=(1, 2))
        masks_refined = np.bitwise_and(ins_masks, mask[None, ...])
        area_refined = np.sum(masks_refined, axis=(1, 2))

        for ii in range(num_pred):
            if area_refined[ii] / area_original[ii] > 0.3:
                ins_masks[ii] = masks_refined[ii]
        ins_masks = np.ascontiguousarray(ins_masks)

        # for ii, insm in enumerate(ins_masks):
        #     cv2.imwrite(f'{ii}.png', insm.astype(np.uint8) * 255)

        if to_tensor:
            ins_masks = torch.from_numpy(ins_masks).to(dtype=tensor_dtype).to(device=tensor_device)

        det_pred.pred_instances.masks = ins_masks
        # rst = np.concatenate((mask * img + 1 - mask, mask * 255), axis=2).astype(np.uint8)
        # cv2.imwrite('rst.png', rst)

class AnimeInsSeg:
    def __init__(self, ckpt: str, default_det_size: int = 640, device: str = None, 
                 refine_kwargs: dict = {'refine_method': 'refinenet_isnet'},
                 tagger_path: str = os.path.join(dirname, 'wdtagger/model.onnx'), mask_thr=0.3) -> None:
        self.ckpt = ckpt
        self.default_det_size = default_det_size
        self.device = DEFAULT_DEVICE if device is None else device

        # init detector in mmdet's way

        ckpt = torch.load(ckpt, map_location='cpu')
        cfg = Config.fromstring(ckpt['meta']['cfg'].replace('file_client_args', 'backend_args'), file_format='.py')
        cfg.visualizer = []
        cfg.vis_backends = {}
        cfg.default_hooks.pop('visualization')
        
        # self.model: SingleStageDetector = init_detector(cfg, checkpoint=None, device='cpu')
        model = MODELS.build(cfg.model)
        model = revert_sync_batchnorm(model)

        self.model = model.to(self.device).eval()
        self.model.load_state_dict(ckpt['state_dict'], strict=False)
        self.model = self.model.to(self.device).eval()
        self.cfg = cfg.copy()

        test_pipeline = get_test_pipeline_cfg(self.cfg.copy())
        test_pipeline[0].type = 'mmdet.LoadImageFromNDArray'
        test_pipeline = Compose(test_pipeline)
        self.default_data_pipeline = test_pipeline

        self.refinenet = None
        self.refinenet_animeseg: AnimeSegmentation = None
        self.postprocess_refine: Callable = None

        if refine_kwargs is not None:
            self.set_refine_method(**refine_kwargs)

        self.tagger = None
        self.tagger_path = tagger_path

        self.mask_thr = mask_thr

    def init_tagger(self, tagger_path: str = None):
        tagger_path = self.tagger_path if tagger_path is None else tagger_path
        self.tagger = Tagger(self.tagger_path)

    def infer_tags(self, instances: AnimeInstances, img: np.ndarray, infer_grey: bool = False):
        if self.tagger is None:
            self.init_tagger()

        if infer_grey:
            img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)[..., None][..., [0, 0, 0]]

        num_ins = len(instances)
        for ii in range(num_ins):
            bbox = instances.bboxes[ii]
            mask = instances.masks[ii]
            if isinstance(bbox, torch.Tensor):
                bbox = bbox.cpu().numpy()
                mask = mask.cpu().numpy()
            bbox = bbox.astype(np.int32)
            
            crop = img[bbox[1]: bbox[3] + bbox[1], bbox[0]: bbox[2] + bbox[0]].copy()
            mask = mask[bbox[1]: bbox[3] + bbox[1], bbox[0]: bbox[2] + bbox[0]]
            crop[mask == 0] = 255
            tags, character_tags = self.tagger.label_cv2_bgr(crop)
            exclude_tags = ['simple_background', 'white_background']
            valid_tags = []
            for tag in tags:
                if tag in exclude_tags:
                    continue
                valid_tags.append(tag)
            instances.tags[ii] = ' '.join(valid_tags)
            instances.character_tags[ii] = character_tags

    @torch.no_grad()
    def infer_embeddings(self, imgs, det_size = None):

        def hijack_bbox_mask_post_process(
                self,
                results,
                mask_feat,
                cfg,
                rescale: bool = False,
                with_nms: bool = True,
                img_meta: Optional[dict] = None):

            stride = self.prior_generator.strides[0][0]
            if rescale:
                assert img_meta.get('scale_factor') is not None
                scale_factor = [1 / s for s in img_meta['scale_factor']]
                results.bboxes = scale_boxes(results.bboxes, scale_factor)

            if hasattr(results, 'score_factors'):
                # TODO： Add sqrt operation in order to be consistent with
                #  the paper.
                score_factors = results.pop('score_factors')
                results.scores = results.scores * score_factors

            # filter small size bboxes
            if cfg.get('min_bbox_size', -1) >= 0:
                w, h = get_box_wh(results.bboxes)
                valid_mask = (w > cfg.min_bbox_size) & (h > cfg.min_bbox_size)
                if not valid_mask.all():
                    results = results[valid_mask]

            # results.mask_feat = mask_feat
            return results, mask_feat

        def hijack_detector_predict(self: SingleStageDetector,
                    batch_inputs: torch.Tensor,
                    batch_data_samples: SampleList,
                    rescale: bool = True) -> SampleList:
            x = self.extract_feat(batch_inputs)

            bbox_head: RTMDetInsSepBNHeadCustom = self.bbox_head
            old_postprocess = RTMDetInsSepBNHeadCustom._bbox_mask_post_process
            RTMDetInsSepBNHeadCustom._bbox_mask_post_process = hijack_bbox_mask_post_process
            # results_list = bbox_head.predict(
            #     x, batch_data_samples, rescale=rescale)
            
            batch_img_metas = [
                data_samples.metainfo for data_samples in batch_data_samples
            ]

            outs = bbox_head(x)

            results_list = bbox_head.predict_by_feat(
                *outs, batch_img_metas=batch_img_metas, rescale=rescale)

            # batch_data_samples = self.add_pred_to_datasample(
            #     batch_data_samples, results_list)
            
            RTMDetInsSepBNHeadCustom._bbox_mask_post_process = old_postprocess
            return results_list

        old_predict = SingleStageDetector.predict
        SingleStageDetector.predict = hijack_detector_predict
        test_pipeline, imgs, _ = self.prepare_data_pipeline(imgs, det_size)

        if len(imgs) > 1:
            imgs = tqdm(imgs)
        model = self.model
        img = imgs[0]
        data_, img = test_pipeline(img)
        data = model.data_preprocessor(data_, False)
        instance_data, mask_feat = model(**data, mode='predict')[0]
        SingleStageDetector.predict = old_predict

        # print((instance_data.scores > 0.9).sum())
        return img, instance_data, mask_feat

    def segment_with_bboxes(self, img, bboxes: torch.Tensor, instance_data, mask_feat: torch.Tensor):
        # instance_data.bboxes: x1, y1, x2, y2
        maxidx = torch.argmax(instance_data.scores)
        bbox = instance_data.bboxes[maxidx].cpu().numpy()
        p1, p2 = (int(bbox[0]), int(bbox[1])), (int(bbox[2]), int(bbox[3]))
        tgt_bboxes = instance_data.bboxes

        im_h, im_w = img.shape[:2]
        long_side = max(im_h, im_w)
        bbox_head: RTMDetInsSepBNHeadCustom = self.model.bbox_head
        priors, kernels = instance_data.priors, instance_data.kernels
        stride = bbox_head.prior_generator.strides[0][0]

        ins_bboxes, ins_segs, scores = [], [], []
        for bbox in bboxes:
            bbox = torch.from_numpy(np.array([bbox])).to(tgt_bboxes.dtype).to(tgt_bboxes.device)
            ioulst = box_iou(bbox, tgt_bboxes).squeeze()
            matched_idx = torch.argmax(ioulst)

            mask_logits = bbox_head._mask_predict_by_feat_single(
                mask_feat, kernels[matched_idx][None, ...], priors[matched_idx][None, ...])

            mask_logits = F.interpolate(
                mask_logits.unsqueeze(0), scale_factor=stride, mode='bilinear')

            mask_logits = F.interpolate(
                mask_logits,
                size=[long_side, long_side],
                mode='bilinear',
                align_corners=False)[..., :im_h, :im_w]
            mask = mask_logits.sigmoid().squeeze()
            mask = mask > 0.5
            mask = mask.cpu().numpy()
            ins_segs.append(mask)
            
            matched_iou_score = ioulst[matched_idx]
            matched_score = instance_data.scores[matched_idx]
            scores.append(matched_score.cpu().item())
            matched_bbox = tgt_bboxes[matched_idx]

            ins_bboxes.append(matched_bbox.cpu().numpy())
            # p1, p2 = (int(matched_bbox[0]), int(matched_bbox[1])), (int(matched_bbox[2]), int(matched_bbox[3]))

        if len(ins_bboxes) > 0:
            ins_bboxes = np.array(ins_bboxes).astype(np.int32)
            ins_bboxes[:, 2:] -= ins_bboxes[:, :2]
            ins_segs = np.array(ins_segs)
        instances = AnimeInstances(ins_segs, ins_bboxes, scores)
        
        self._postprocess_refine(instances, img)
        drawed = instances.draw_instances(img)
        # cv2.imshow('drawed', drawed)
        # cv2.waitKey(0)
        
        return instances

    def set_detect_size(self, det_size: Union[int, Tuple]):
        if isinstance(det_size, int):
            det_size = (det_size, det_size)
        self.default_data_pipeline.transforms[1].scale = det_size
        self.default_data_pipeline.transforms[2].size = det_size
        
    @torch.no_grad()
    def infer(self, imgs: Union[List, str, np.ndarray], 
              pred_score_thr: float = 0.3,
              refine_kwargs: dict = None,
              output_type: str="tensor", 
              det_size: int = None, 
              save_dir: str = '',
              save_visualization: bool = False,
              save_annotation: str = '',
              infer_tags: bool = False,
              obj_id_start: int = -1, 
              img_id_start: int = -1,
              verbose: bool = False,
              infer_grey: bool = False,
              save_mask_only: bool = False,
              val_dir=None,
              max_instances: int = 100,
              **kwargs) -> Union[List[AnimeInstances], AnimeInstances, None]:
    
        """
        Args:
            imgs (str, ndarray, Sequence[str/ndarray]):
                Either image files or loaded images.

        Returns:
            :obj:`AnimeInstances` or list[:obj:`AnimeInstances`]:
            If save_annotation or save_annotation, return None.
        """

        if det_size is not None:
            self.set_detect_size(det_size)
        if refine_kwargs is not None:
            self.set_refine_method(**refine_kwargs)

        self.set_max_instance(max_instances)

        if isinstance(imgs, str):
            if imgs.endswith('.txt'):
                imgs = read_imglst_from_txt(imgs)
        
        if save_annotation or save_visualization:
            return self._infer_save_annotations(imgs, pred_score_thr, det_size, save_dir, save_visualization, \
                                               save_annotation, infer_tags, obj_id_start, img_id_start, val_dir=val_dir)
        else:
            return self._infer_simple(imgs, pred_score_thr, det_size, output_type, infer_tags, verbose=verbose, infer_grey=infer_grey)
        
    def _det_forward(self, img, test_pipeline, pred_score_thr: float = 0.3) -> Tuple[AnimeInstances, np.ndarray]:
        data_, img = test_pipeline(img)
        with torch.no_grad():
            results: DetDataSample = self.model.test_step(data_)[0]
            pred_instances = results.pred_instances
            pred_instances = pred_instances[pred_instances.scores > pred_score_thr]
            if len(pred_instances) < 1:
                return AnimeInstances(), img
        
        del data_
        
        bboxes = pred_instances.bboxes.to(torch.int32)
        bboxes[:, 2:] -= bboxes[:, :2]
        masks = pred_instances.masks
        scores = pred_instances.scores
        return AnimeInstances(masks, bboxes, scores), img
        
    def _infer_simple(self, imgs: Union[List, str, np.ndarray], 
                      pred_score_thr: float = 0.3,
                      det_size: int = None,
                      output_type: str = "tensor",
                      infer_tags: bool = False,
                      infer_grey: bool = False,
                      verbose: bool = False) -> Union[DetDataSample, List[DetDataSample]]:
        
        if isinstance(imgs, List):
            return_list = True
        else:
            return_list = False

        assert output_type in {'tensor', 'numpy'}

        test_pipeline, imgs, _ = self.prepare_data_pipeline(imgs, det_size)
        predictions = []

        if len(imgs) > 1:
            imgs = tqdm(imgs)

        for img in imgs:
            instances, img = self._det_forward(img, test_pipeline, pred_score_thr)
            # drawed = instances.draw_instances(img)
            # cv2.imwrite('drawed.jpg', drawed)
            self.postprocess_results(instances, img)
            # drawed = instances.draw_instances(img)
            # cv2.imwrite('drawed_post.jpg', drawed)

            if infer_tags:
                self.infer_tags(instances, img, infer_grey)
                
            if output_type == 'numpy':
                instances.to_numpy()
                
            predictions.append(instances)

        if return_list:
            return predictions
        else:
            return predictions[0]

    def _infer_save_annotations(self, imgs: Union[List, str, np.ndarray], 
              pred_score_thr: float = 0.3,
              det_size: int = None, 
              save_dir: str = '',
              save_visualization: bool = False,
              save_annotation: str = '',
              infer_tags: bool = False,
              obj_id_start: int = 100000000000, 
              img_id_start: int = 100000000000,
              save_mask_only: bool = False,
              val_dir = None,
              **kwargs) -> None:

        coco_api = None
        if isinstance(imgs, str) and imgs.endswith('.json'):
            coco_api = COCO(imgs)

            if val_dir is None:
                val_dir = osp.join(osp.dirname(osp.dirname(imgs)), 'val')
            imgs = coco_api.getImgIds()
            imgp2ids = {}
            imgps, coco_imgmetas = [], []
            for imgid in imgs:
                imeta = coco_api.loadImgs(imgid)[0]
                imgname = imeta['file_name']
                imgp = osp.join(val_dir, imgname)
                imgp2ids[imgp] = imgid
                imgps.append(imgp)
                coco_imgmetas.append(imeta)
            imgs = imgps

        test_pipeline, imgs, target_dir = self.prepare_data_pipeline(imgs, det_size)
        if save_dir == '':
            save_dir = osp.join(target_dir, \
                osp.basename(self.ckpt).replace('.ckpt', '').replace('.pth', '').replace('.pt', ''))
            
        if not osp.exists(save_dir):
            os.makedirs(save_dir)

        det_annotations = []
        image_meta = []
        obj_id = obj_id_start + 1
        image_id = img_id_start + 1

        for ii, img in enumerate(tqdm(imgs)):
            # prepare data
            if isinstance(img, str):
                img_name = osp.basename(img)
            else:
                img_name = f'{ii}'.zfill(12) + '.jpg'

            if coco_api is not None:
                image_id = imgp2ids[img]
            
            try:
                instances, img = self._det_forward(img, test_pipeline, pred_score_thr)
            except Exception as e:
                raise e
                if isinstance(e, torch.cuda.OutOfMemoryError):
                    gc.collect()
                    torch.cuda.empty_cache()
                    torch.cuda.ipc_collect()
                    try:
                        instances, img = self._det_forward(img, test_pipeline, pred_score_thr)
                    except:
                        logging.warning(f'cuda out of memory: {img_name}')
                        if isinstance(img, str):
                            img = cv2.imread(img)
                        instances = None

            if instances is not None:
                self.postprocess_results(instances, img)

                if infer_tags:
                    self.infer_tags(instances, img)

                if save_visualization:
                    out_file = osp.join(save_dir, img_name)
                    self.save_visualization(out_file, img, instances)

            if save_annotation:
                im_h, im_w = img.shape[:2]
                image_meta.append({
                    "id": image_id,"height": im_h,"width": im_w, 
                    "file_name": img_name, "id": image_id
                })
                if instances is not None:
                    for ii in range(len(instances)):
                        segmentation = instances.masks[ii].squeeze().cpu().numpy().astype(np.uint8)
                        area = segmentation.sum()
                        segmentation *= 255
                        if save_mask_only:
                            cv2.imwrite(osp.join(save_dir, 'mask_' + str(ii).zfill(3) + '_' +img_name+'.png'), segmentation)
                        else:
                            score = instances.scores[ii]
                            if isinstance(score, torch.Tensor):
                                score = score.item()
                            score = float(score)
                            bbox = instances.bboxes[ii].cpu().numpy()
                            bbox = bbox.astype(np.float32).tolist()
                            segmentation = mask2rle(segmentation)
                            tag_string = instances.tags[ii]
                            tag_string_character = instances.character_tags[ii]
                            det_annotations.append({'id': obj_id, 'category_id': 0, 'iscrowd': 0, 'score': score,
                                'segmentation': segmentation, 'image_id': image_id, 'area': area,
                                'tag_string': tag_string, 'tag_string_character': tag_string_character, 'bbox': bbox
                            })
                        obj_id += 1
                image_id += 1

        if save_annotation != '' and not save_mask_only:
            det_meta = {"info": {},"licenses": [], "images": image_meta, 
                        "annotations": det_annotations, "categories": CATEGORIES}
            detp = save_annotation
            dict2json(det_meta, detp)
            logging.info(f'annotations saved to {detp}')
    
    def set_refine_method(self, refine_method: str = 'none', refine_size: int = 720):
        if refine_method == 'none':
            self.postprocess_refine = None
        elif refine_method == 'animeseg':
            if self.refinenet_animeseg is None:
                self.refinenet_animeseg = load_refinenet(refine_method)
            self.postprocess_refine = lambda det_pred, img: \
                                        animeseg_refine(det_pred, img, self.refinenet_animeseg, True, refine_size)
        elif refine_method == 'refinenet_isnet':
            if self.refinenet is None:
                self.refinenet = load_refinenet(refine_method)
            self.postprocess_refine = self._postprocess_refine
        else:
            raise NotImplementedError(f'Invalid refine method: {refine_method}')
        
    def _postprocess_refine(self, instances: AnimeInstances, img: np.ndarray, refine_size: int = 720, max_refine_batch: int = 4, **kwargs):
        
        if instances.is_empty:
            return
        
        segs = instances.masks
        is_tensor = instances.is_tensor
        if is_tensor:
            segs = segs.cpu().numpy()
        segs = segs.astype(np.float32)
        im_h, im_w = img.shape[:2]
        
        masks = []
        with torch.no_grad():
            for batch, (pt, pb, pl, pr) in prepare_refine_batch(segs, img, max_refine_batch, self.device, refine_size):
                preds = self.refinenet(batch)[0][0].sigmoid()
                if pb == 0:
                    pb = -im_h
                if pr == 0:
                    pr = -im_w
                preds = preds[..., pt: -pb, pl: -pr]
                preds  = torch.nn.functional.interpolate(preds, (im_h, im_w), mode='bilinear', align_corners=True)
                masks.append(preds.cpu()[:, 0])

        masks = (torch.concat(masks, dim=0) > self.mask_thr).to(self.device)
        if not is_tensor:
            masks = masks.cpu().numpy()
        instances.masks = masks


    def prepare_data_pipeline(self, imgs: Union[str, np.ndarray, List], det_size: int) -> Tuple[Compose, List, str]:
        if det_size is None:
            det_size = self.default_det_size

        target_dir = './workspace/output'
        # cast imgs to a list of np.ndarray or image_file_path  if necessary
        if isinstance(imgs, str):
            if osp.isdir(imgs):
                target_dir = imgs
                imgs = find_all_imgs(imgs, abs_path=True)
            elif osp.isfile(imgs):
                target_dir = osp.dirname(imgs)
                imgs = [imgs]
        elif isinstance(imgs, np.ndarray) or isinstance(imgs, str):
            imgs = [imgs]
        elif isinstance(imgs, List):
            if len(imgs) > 0:
                if isinstance(imgs[0], np.ndarray) or isinstance(imgs[0], str):
                    pass
                else:
                    raise NotImplementedError
        else:
            raise NotImplementedError

        test_pipeline = lambda img: single_image_preprocess(img, pipeline=self.default_data_pipeline)
        return test_pipeline, imgs, target_dir

    def save_visualization(self, out_file: str, img: np.ndarray, instances: AnimeInstances):
        drawed = instances.draw_instances(img)
        mmcv.imwrite(drawed, out_file)
    
    def postprocess_results(self, results: DetDataSample, img: np.ndarray) -> None:
        if self.postprocess_refine is not None:
            self.postprocess_refine(results, img)

    def set_mask_threshold(self, mask_thr: float):
        self.model.bbox_head.test_cfg['mask_thr_binary'] = mask_thr

    def set_max_instance(self, num_ins):
        self.model.bbox_head.test_cfg['max_per_img'] = num_ins