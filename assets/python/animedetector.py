# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# Moepictures - A cute and moe anime image board ❤          #
# Copyright © 2026 Moebytes <moebytes.com>                  #
# Licensed under CC BY-NC 4.0. See license.txt for details. # 
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

import subprocess
import sys

required_modules = [
    "onnxruntime", "numpy", "Pillow"
]

for module in required_modules:
    try:
        if module == "Pillow":
            import PIL
        else:
            __import__(module.replace("-", "_"))
    except ImportError:
        subprocess.check_call([sys.executable, "-m", "pip", "install", module])

import json
import numpy as np
from PIL import Image
from onnxruntime import InferenceSession, SessionOptions, GraphOptimizationLevel
from typing import Tuple
import argparse
import os

class AnimeDetector():
    def __init__(self, model_dir: str):
        model_path = f"{model_dir}/model.onnx"
        self.model = self.load_local_onnx_model(model_path)
        with open(f"{model_dir}/meta.json", "r") as f:
            self.labels = json.load(f)["labels"]

    def extract_halfway_frame(self, image_path: str) -> Image.Image:
        img = Image.open(image_path)

        if not getattr(img, "is_animated", False):
            return img.convert("RGB")

        frame_count = img.n_frames
        mid = frame_count // 2
        img.seek(mid)

        return img.convert("RGB")

    def img_encode(self, image_path: str, size: Tuple[int, int]=(384, 384), normalize: Tuple[int, int]=(0.5, 0.5)):
        ext = os.path.splitext(image_path)[1].lower()

        if ext in [".gif", ".webp"]:
            try:
                img = self.extract_halfway_frame(image_path)
            except Exception:
                img = Image.open(image_path).convert("RGB")
        else:
            img = Image.open(image_path).convert("RGB")

        img = img.resize(size, Image.BILINEAR)

        data = np.asarray(img, dtype=np.float32) / 255.0
        data = np.transpose(data, (2, 0, 1))

        if normalize:
            mean_, std_ = normalize
            mean = np.array([mean_, mean_, mean_], dtype=np.float32).reshape(3, 1, 1)
            std = np.array([std_, std_, std_], dtype=np.float32).reshape(3, 1, 1)
            data = (data - mean) / std

        return data

    def load_local_onnx_model(self, model_path: str) -> InferenceSession:
        options = SessionOptions()
        options.graph_optimization_level = GraphOptimizationLevel.ORT_ENABLE_ALL
        return InferenceSession(model_path, options)

    def __call__(self, image_path: str):
        input_ = self.img_encode(image_path, size=(384, 384))[None, ...]
        output, = self.model.run(["output"], {"input": input_})

        values = dict(zip(self.labels, map(lambda x: float(x), output[0])))
        max_key = max(values, key=values.get)
        return max_key

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Classify Image")
    parser.add_argument("-i", "--input")
    parser.add_argument("-m", "--model_dir")
    args = parser.parse_args()
    classifier = AnimeDetector(model_dir=args.model_dir)
    result = classifier(args.input)
    sys.stdout.write(result)