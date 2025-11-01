#!/usr/bin/env python3
"""
Generate Phaser Editor asset pack JSON from texture mappings.

Usage:
    python tools/generate_asset_pack.py
    python tools/generate_asset_pack.py --out web/data/editor/assets.pack.json
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Dict, List

REPO_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = REPO_ROOT / "web" / "data"
ASSETS_DIR = REPO_ROOT / "web" / "assets"
PLATFORM_TEXTURES_PATH = DATA_DIR / "unity_platform_textures.json"
SCENES_PATH = DATA_DIR / "scenes.json"


def load_json(path: Path) -> Dict:
    if not path.exists():
        raise FileNotFoundError(f"Required file missing: {path}")
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def generate_asset_pack() -> Dict:
    """Generate Phaser Editor asset pack from all referenced assets."""

    platform_textures = load_json(PLATFORM_TEXTURES_PATH)
    scenes = load_json(SCENES_PATH)

    assets = {
        "section1": {
            "files": []
        }
    }

    # Add platform textures
    # Phaser Editor resolves paths relative to project root (web/), not the asset pack location
    # So we keep "assets/" prefix even though pack is in web/assets/
    for prefab, texture_data in platform_textures.items():
        texture_key = texture_data.get("textureKey")
        file_path = texture_data.get("file", "")

        if texture_key and file_path:
            # Keep full path: "assets/sprites/..." (relative to web/ project root)
            assets["section1"]["files"].append({
                "type": "image",
                "key": texture_key,
                "url": file_path,
            })

    # Add background images from scenes
    for scene_key, scene_config in scenes.get("scenes", {}).items():
        background = scene_config.get("background", {})
        bg_key = background.get("key")
        bg_file = background.get("file", "")

        if bg_key and bg_file:
            # Keep full path relative to project root
            assets["section1"]["files"].append({
                "type": "image",
                "key": bg_key,
                "url": bg_file,
            })

        # Add background layers
        for layer in background.get("layers", []):
            layer_key = layer.get("key")
            layer_file = layer.get("file", "")

            if layer_key and layer_file:
                # Keep full path relative to project root
                assets["section1"]["files"].append({
                    "type": "image",
                    "key": layer_key,
                    "url": layer_file,
                })

    # Deduplicate by key
    seen_keys = set()
    unique_files = []
    for file_entry in assets["section1"]["files"]:
        key = file_entry["key"]
        if key not in seen_keys:
            seen_keys.add(key)
            unique_files.append(file_entry)

    assets["section1"]["files"] = unique_files

    return {
        "meta": {
            "app": "Phaser Editor 2D - Asset Pack Editor",
            "contentType": "phasereditor2d.pack.core.AssetContentType",
            "url": "https://phasereditor2d.com",
            "version": 2
        },
        "section1": assets["section1"]
    }


def main(argv: List[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Generate Phaser Editor asset pack from texture mappings."
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=ASSETS_DIR / "asset-pack.json",
        help="Output path for asset pack JSON",
    )

    args = parser.parse_args(argv)

    try:
        pack = generate_asset_pack()

        args.out.parent.mkdir(parents=True, exist_ok=True)
        with args.out.open("w", encoding="utf-8") as f:
            json.dump(pack, f, indent=2)
            f.write("\n")

        file_count = len(pack["section1"]["files"])
        print(f"[OK] Generated asset pack with {file_count} assets: {args.out.relative_to(REPO_ROOT)}")
        return 0

    except Exception as exc:
        print(f"[ERROR] {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
