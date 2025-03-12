import subprocess
import sys
import os

required_modules = [
    "torch", "opencv-python", "numpy", "Pillow", "manga-ocr", "text-detector",
    "translate", "argparse", "pyclipper", "shapely", "torchvision"
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
import cv2
import numpy as np
from PIL import Image
import logging
from manga_ocr import MangaOcr
from text_detector import TextDetector
from translate import Translator
import argparse
import json
import sys

device = "mps" if torch.backends.mps.is_available() else "cuda" if torch.cuda.is_available() else "cpu"
dirname = os.path.dirname(os.path.abspath(__file__))

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

def split_into_chunks(img, mask_refined, block, line_index, textheight=64, max_ratio=16, anchor_window=2):
    line_crop = block.get_transformed_region(img, line_index, textheight)
    h, w, c = line_crop.shape
    ratio = w / h

    if ratio <= max_ratio:
        return [line_crop], []

    else:
        k = gaussian(textheight * 2, textheight / 8)

        line_mask = block.get_transformed_region(mask_refined, line_index, textheight)
        num_chunks = int(np.ceil(ratio / max_ratio))

        anchors = np.linspace(0, w, num_chunks + 1)[1:-1]
        line_density = line_mask.sum(axis=0)
        line_density = np.convolve(line_density, k, "same")
        line_density /= line_density.max()

        anchor_window *= textheight
        cut_points = []
        for anchor in anchors:
            anchor = int(anchor)

            n0 = np.clip(anchor - anchor_window // 2, 0, w)
            n1 = np.clip(anchor + anchor_window // 2, 0, w)

            p = line_density[n0:n1].argmin()
            p += n0

            cut_points.append(p)

        return np.split(line_crop, cut_points, axis=1), cut_points

def ocr_image(img_path):
    text_detector = TextDetector(model_path=os.path.join(dirname, "comictextdetector.pt"), input_size=1024, device=device, act="leaky")
    manga_ocr = MangaOcr()
    translator = Translator(to_lang="en", from_lang="ja")
    img = cv2.imdecode(np.fromfile(img_path, dtype=np.uint8), cv2.IMREAD_COLOR)
    height, width, channels = img.shape
    result = []
    mask, mask_refined, block_list = text_detector(img, refine_mode=1, keep_undetected_mask=True)
    for block_index, block in enumerate(block_list):
        box = list(block.xyxy)
        result_block = {
            "imageWidth": width,
            "imageHeight": height,
            "x": box[0],
            "y": box[1],
            "width": box[2] - box[0],
            "height": box[3] - box[1],
            "transcript": ""
        }
        for line_index, line in enumerate(block.lines_array()):
            max_ratio = 16 if block.vertical else 8
            line_crops, cut_points = split_into_chunks(img, mask_refined, block, line_index, max_ratio=max_ratio)

            line_text = ""
            for line_crop in line_crops:
                if block.vertical:
                    line_crop = cv2.rotate(line_crop, cv2.ROTATE_90_CLOCKWISE)
                line_text += manga_ocr(Image.fromarray(line_crop))

            result_block["transcript"] += line_text

        result.append(result_block)
    
    transcriptJoin = "\n".join(block["transcript"] for block in result)
    translatedJoin = translator.translate(transcriptJoin)
    translatedSplit = translatedJoin.split("\n")

    for i, translation in enumerate(translatedSplit):
        result[i]["translation"] = translation

    return json.dumps(convert_to_serializable(result))

if __name__ == "__main__":
    parser = argparse.ArgumentParser(prog="Manga OCR")
    parser.add_argument("-i", "--input")
    args = parser.parse_args()

    result = ocr_image(args.input)
    sys.stdout.write(result)