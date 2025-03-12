import subprocess
import sys

required_modules = [
    "pandas", "torch", "numpy", "Pillow", "timm"
]

for module in required_modules:
    try:
        if module == "Pillow":
            import PIL
        else:
            __import__(module.replace("-", "_"))
    except ImportError:
        subprocess.check_call([sys.executable, "-m", "pip", "install", module])

import pandas as pd
import torch
import torch.nn.functional as F
import os
import numpy as np
from PIL import Image
import json
import timm
import argparse
import sys

device = "mps" if torch.backends.mps.is_available() else "cuda" if torch.cuda.is_available() else "cpu"

def load_model_config(config_path):
    with open(config_path, "r") as f:
        config = json.load(f)
    if "pretrained_cfg" not in config:
        pretrained_cfg = config
        config = {}
        config["architecture"] = pretrained_cfg.pop("architecture")
        config["num_features"] = pretrained_cfg.pop("num_features", None)
        if "labels" in pretrained_cfg:
            pretrained_cfg["label_names"] = pretrained_cfg.pop("labels")
        config["pretrained_cfg"] = pretrained_cfg
    pretrained_cfg = config["pretrained_cfg"]
    if "num_classes" in config:
        pretrained_cfg["num_classes"] = config["num_classes"]

    if "label_names" in config:
        pretrained_cfg["label_names"] = config.pop("label_names")
    if "label_descriptions" in config:
        pretrained_cfg["label_descriptions"] = config.pop("label_descriptions")
    model_args = config.get("model_args", {})
    model_name = config["architecture"]
    kwargs = {}
    if model_args:
        for k, v in model_args.items():
            kwargs.setdefault(k, v)
    return pretrained_cfg, model_name, kwargs

def get_tags(model_dir, probs, general_threshold = 0.35, character_threshold = 0.75):
    df = pd.read_csv(os.path.join(model_dir, "selected_tags.csv"), usecols=["name", "category"])
    labels = {"names": df["name"].tolist(), "rating": list(np.where(df["category"] == 9)[0]), 
              "general": list(np.where(df["category"] == 0)[0]), "character": list(np.where(df["category"] == 4)[0])}
    probs = list(zip(labels["names"], probs.numpy()))
    general_labels = [probs[i] for i in labels["general"]]
    general_labels = dict([x for x in general_labels if x[1] > general_threshold])
    general_labels = dict(sorted(general_labels.items(), key=lambda item: item[1], reverse=True))
    character_labels = [probs[i] for i in labels["character"]]
    character_labels = dict([x for x in character_labels if x[1] > character_threshold])
    character_labels = dict(sorted(character_labels.items(), key=lambda item: item[1], reverse=True))
    # combined = [x for x in character_labels]
    # combined.extend([x for x in general_labels])
    # caption = ", ".join(combined).replace("_", "-")
    # return caption
    general_tags = [x.replace("_", "-") for x in general_labels]
    character_tags = [x.replace("_", "-") for x in character_labels]
    result = json.dumps({"tags": general_tags, "characters": character_tags})
    return result

def pad_square(image):
    w, h = image.size
    px = max(image.size)
    canvas = Image.new("RGB", (px, px), (255, 255, 255))
    canvas.paste(image, ((px - w) // 2, (px - h) // 2))
    return canvas

def predict_wdtagger(model_dir, image):
    pretrained_cfg, model_name, kwargs = load_model_config(os.path.join(model_dir, "config.json"))
    wdtagger_model = timm.create_model(model_name, pretrained_cfg=pretrained_cfg, checkpoint_path=os.path.join(model_dir, "model.safetensors"), **kwargs).eval()

    transform = timm.data.create_transform(**timm.data.resolve_data_config(wdtagger_model.pretrained_cfg, model=wdtagger_model))
    image = pad_square(image)
    input = transform(image).unsqueeze(0)
    input = input[:, [2, 1, 0]]
    wdtagger_model = wdtagger_model.to(device)
    input = input.to(device)

    with torch.no_grad():
        outputs = wdtagger_model.forward(input)
        outputs = F.sigmoid(outputs)
        outputs = outputs.squeeze(0).to("cpu")

    return get_tags(model_dir, outputs)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(prog="WDTagger")
    parser.add_argument("-i", "--input")
    parser.add_argument("-m", "--model_dir")
    args = parser.parse_args()

    image = Image.open(args.input).convert("RGB")
    result = predict_wdtagger(args.model_dir, image)
    sys.stdout.write(result)