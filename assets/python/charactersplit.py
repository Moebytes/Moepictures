# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# Moepictures - A cute and moe anime image board ❤          #
# Copyright © 2026 Moebytes <moebytes.com>                  #
# Licensed under CC BY-NC 4.0. See license.txt for details. # 
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

import subprocess
import sys

required_modules = [
    "Pillow", "opencv-python", "numpy", "pandas", "tqdm",
    "torch", "torchvision", "pytorch-lightning", "onnxruntime",
    "pycocotools", "mmcv", "mmengine", "mmdet"
]

for module in required_modules:
    try:
        if module == "opencv-python":
            import cv2
        if module == "Pillow":
            import PIL
        else:
            __import__(module.replace("-", "_"))
    except ImportError:
        subprocess.check_call([sys.executable, "-m", "pip", "install", module])

import cv2
import json
from PIL import Image
import numpy as np
import sys
import os
import argparse
from animeseg import AnimeInsSeg, AnimeInstances, get_color

dirname = os.path.dirname(os.path.abspath(__file__))
net = AnimeInsSeg(os.path.join(dirname, "charactersplit/rtmdetl_e60.ckpt"), mask_thr=0.3, refine_kwargs={"refine_method": "refinenet_isnet"})

def draw_bounding_boxes(img: np.ndarray, instances: AnimeInstances, save_path: str):
    img_height, img_width = img.shape[:2]
    drawed = img.copy()
    for i, (bbox, mask) in enumerate(zip(instances.bboxes, instances.masks)):
        color = get_color(i)
        mask_alpha = 0.5
        linewidth = max(round(sum(img.shape) / 2 * 0.003), 2)

        # bounding box
        p1, p2 = (int(bbox[0]), int(bbox[1])), (int(bbox[2] + bbox[0]), int(bbox[3] + bbox[1]))
        cv2.rectangle(drawed, p1, p2, color, thickness=linewidth, lineType=cv2.LINE_AA)

        # mask
        p = mask.astype(np.float32)
        blend_mask = np.full((img_height, img_width, 3), color, dtype=np.float32)
        alpha_msk = (mask_alpha * p)[..., None]
        alpha_ori = 1 - alpha_msk
        drawed = drawed * alpha_ori + alpha_msk * blend_mask

        drawed = drawed.astype(np.uint8)
        pil_img = Image.fromarray(drawed[..., ::-1])
        pil_img.save(save_path)

def convert_to_serializable(obj):
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {k: convert_to_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_to_serializable(i) for i in obj]
    return obj

def character_results(img: np.ndarray, instances: AnimeInstances):
    img_height, img_width = img.shape[:2]
    result = []

    bboxes = instances.bboxes if instances.bboxes is not None else []
    tags_list = instances.tags if instances.tags is not None else [None] * len(bboxes)
    characters_list = instances.character_tags if instances.character_tags is not None else [None] * len(bboxes)

    for i, (bbox, tags, character_tags) in enumerate(zip(bboxes, tags_list, characters_list)):
        x1, y1, w, h = bbox
        result_block = {
            "imageWidth": img_width,
            "imageHeight": img_height,
            "x": float(x1),
            "y": float(y1),
            "width": float(w),
            "height": float(h),
            "tags": tags or "",
            "characterTags": character_tags or []
        }
        result.append(result_block)

    if not result:
        return json.dumps([])
    
    return json.dumps(convert_to_serializable(result))

def charsplit_image(img_path: str):
    img = cv2.imread(img_path)
    instances: AnimeInstances = net.infer(img, infer_tags=True, output_type="numpy", pred_score_thr=0.3)
    return character_results(img, instances)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(prog="Character Split")
    parser.add_argument("-i", "--input")
    args = parser.parse_args()

    result = charsplit_image(args.input)
    sys.stdout.write(">>>JSON<<<\n")
    sys.stdout.write(result)
    sys.stdout.write("\n>>>ENDJSON<<<")