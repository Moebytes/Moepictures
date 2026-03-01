# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# Moepictures - A cute and moe anime image board ❤          #
# Copyright © 2026 Moebytes <moebytes.com>                  #
# Licensed under CC BY-NC 4.0. See license.txt for details. # 
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

import subprocess
import sys

required_modules = [
    "torch", "transformers", "safetensors", "Pillow"
]

for module in required_modules:
    try:
        if module == "Pillow":
            import PIL
        else:
            __import__(module.replace("-", "_"))
    except ImportError:
        subprocess.check_call([sys.executable, "-m", "pip", "install", module])


from transformers import ViTForImageClassification, ViTImageProcessor
from safetensors.torch import load_file
from PIL import Image
import torch
import argparse

def predict(image_path: str, model_dir: str):
    model = ViTForImageClassification.from_pretrained(model_dir)
    processor = ViTImageProcessor.from_pretrained(model_dir)
    state_dict = load_file(f"{model_dir}/model.safetensors")
    model.load_state_dict(state_dict, strict=False)
    model.eval()

    image = Image.open(image_path).convert("RGB")
    inputs = processor(images=image, return_tensors="pt")
    with torch.no_grad():
        outputs = model(**inputs)
    logits = outputs.logits
    predicted_class = logits.argmax(-1).item()
    id2label = {0: "cute", 1: "erotic", 2: "sexy"}
    return id2label[predicted_class]

if __name__ == "__main__":
    parser = argparse.ArgumentParser(prog="Image Rater")
    parser.add_argument("-i", "--input")
    parser.add_argument("-m", "--model_dir")
    args = parser.parse_args()

    rating = predict(args.input, args.model_dir)
    sys.stdout.write(rating)