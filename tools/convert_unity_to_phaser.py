#!/usr/bin/env python3
"""
Convert Unity scene coordinates to Phaser pixel coordinates.

This script applies the coordinate transformation logic from SceneLoader.js to convert
Unity scene data (unity_scene_snapshot.json) into Phaser pixel coordinates. The output
is used by both the runtime game and Phaser Editor scene exports.

Usage:
    python3 tools/convert_unity_to_phaser.py
    python3 tools/convert_unity_to_phaser.py --scene desert_cave
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional

REPO_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = REPO_ROOT / "web" / "data"
SCENES_JSON_PATH = DATA_DIR / "scenes.json"
UNITY_SNAPSHOT_PATH = DATA_DIR / "unity_scene_snapshot.json"
OUTPUT_PATH = DATA_DIR / "phaser_scene_data.json"

# Default game display size
GAME_WIDTH = 1280
GAME_HEIGHT = 720


@dataclass
class UnityMapping:
    """Coordinate mapping from Unity to Phaser."""
    scaleX: float
    scaleY: float
    offsetX: float
    offsetY: float
    displayWidth: float
    displayHeight: float


@dataclass
class Point:
    """2D point."""
    x: float
    y: float


@dataclass
class Size:
    """2D size."""
    width: float
    height: float


class ConversionError(RuntimeError):
    pass


def load_json(path: Path) -> Dict:
    """Load JSON file with error handling."""
    if not path.exists():
        raise ConversionError(f"Required file missing: {path}")
    try:
        with path.open(encoding="utf-8") as handle:
            return json.load(handle)
    except json.JSONDecodeError as exc:
        raise ConversionError(f"Invalid JSON in {path}: {exc}") from exc


def calculate_unity_mapping(
    scene_config: Dict,
    unity_data: Dict,
    display_width: float = GAME_WIDTH,
    display_height: float = GAME_HEIGHT,
) -> Optional[UnityMapping]:
    """
    Calculate Unity-to-Phaser coordinate mapping.

    Ported from SceneLoader.js:192-264 (calculateUnityMapping).
    """
    if not scene_config.get("unityScene"):
        return None

    # Get margins from scene config
    margins = scene_config.get("unityMappingMargins", {"x": 80, "top": 80, "bottom": 120})
    margin_x = margins.get("x", 80)
    margin_top = margins.get("top", 80)
    margin_bottom = margins.get("bottom", 120)

    # Collect all points (platforms, colliders, spawn)
    points: List[Point] = []

    platforms = unity_data.get("platforms", [])
    if isinstance(platforms, list):
        for p in platforms:
            if isinstance(p, dict):
                points.append(Point(x=p.get("x", 0), y=p.get("y", 0)))

    colliders = unity_data.get("colliders", [])
    if isinstance(colliders, list):
        for c in colliders:
            if isinstance(c, dict) and "x" in c and "y" in c:
                points.append(Point(x=c["x"], y=c["y"]))

    player_spawn = unity_data.get("player_spawn")
    if isinstance(player_spawn, dict) and "x" in player_spawn and "y" in player_spawn:
        points.append(Point(x=player_spawn["x"], y=player_spawn["y"]))

    if not points:
        return None

    # Find bounding box
    min_x = min(p.x for p in points)
    max_x = max(p.x for p in points)
    min_y = min(p.y for p in points)
    max_y = max(p.y for p in points)

    range_x = max_x - min_x
    range_y = max_y - min_y

    # Calculate scale factors
    scale_x = (display_width - margin_x * 2) / range_x if range_x > 0 else 1.0
    center_x = (min_x + max_x) / 2
    offset_x = (display_width / 2 - center_x * scale_x) if range_x > 0 else (display_width / 2 - min_x * scale_x)

    scale_y = (display_height - (margin_top + margin_bottom)) / range_y if range_y > 0 else 1.0
    offset_y = display_height - margin_bottom + min_y * scale_y

    return UnityMapping(
        scaleX=scale_x,
        scaleY=scale_y,
        offsetX=offset_x,
        offsetY=offset_y,
        displayWidth=display_width,
        displayHeight=display_height,
    )


def convert_unity_point(point: Point, mapping: UnityMapping) -> Point:
    """
    Convert Unity point to Phaser pixel coordinates.

    Ported from SceneLoader.js:266-274 (convertUnityPoint).
    """
    return Point(
        x=mapping.offsetX + point.x * mapping.scaleX,
        y=mapping.offsetY - point.y * mapping.scaleY,  # Note the minus!
    )


def convert_unity_size(width: float, height: float, mapping: UnityMapping) -> Size:
    """
    Convert Unity size to Phaser pixels.

    Ported from SceneLoader.js:276-284 (convertUnitySize).
    """
    return Size(
        width=width * mapping.scaleX,
        height=height * mapping.scaleY,
    )


def convert_platform(platform: Dict, mapping: UnityMapping) -> Dict:
    """Convert a single Unity platform to Phaser coordinates."""
    # Apply Unity scale to base dimensions first
    unity_scale_x = float(platform.get("scale_x", 1.0))
    unity_scale_y = float(platform.get("scale_y", 1.0))
    base_width = platform.get("width", 0.0)
    base_height = platform.get("height", 0.0)
    scaled_width = base_width * abs(unity_scale_x)
    scaled_height = base_height * abs(unity_scale_y)

    # Convert position
    unity_point = Point(x=platform.get("x", 0.0), y=platform.get("y", 0.0))
    phaser_point = convert_unity_point(unity_point, mapping)

    # Convert size
    phaser_size = convert_unity_size(scaled_width, scaled_height, mapping)

    return {
        "prefab_asset": platform.get("prefab_asset", ""),
        "x": phaser_point.x,
        "y": phaser_point.y,
        "width": phaser_size.width,
        "height": phaser_size.height,
        "scale_x": unity_scale_x,
        "scale_y": unity_scale_y,
        "z": platform.get("z", 0.0),
    }


def convert_collider(collider: Dict, mapping: UnityMapping) -> Dict:
    """Convert a single Unity collider to Phaser coordinates."""
    # Convert position
    unity_point = Point(x=collider.get("x", 0.0), y=collider.get("y", 0.0))
    phaser_point = convert_unity_point(unity_point, mapping)

    # Convert size
    phaser_size = convert_unity_size(
        collider.get("width", 0.0),
        collider.get("height", 0.0),
        mapping
    )

    return {
        "x": phaser_point.x,
        "y": phaser_point.y,
        "width": phaser_size.width,
        "height": phaser_size.height,
        "is_trigger": collider.get("is_trigger", False),
        "game_object": collider.get("game_object"),
    }


def convert_spawn_point(spawn: Dict, mapping: UnityMapping) -> Dict:
    """Convert Unity spawn point to Phaser coordinates."""
    unity_point = Point(x=spawn.get("x", 0.0), y=spawn.get("y", 0.0))
    phaser_point = convert_unity_point(unity_point, mapping)

    return {
        "x": phaser_point.x,
        "y": phaser_point.y,
    }


def convert_scene(
    scene_key: str,
    scene_config: Dict,
    unity_data: Dict,
) -> Optional[Dict]:
    """Convert a Unity scene to Phaser coordinates."""
    # Get display size from background config
    background = scene_config.get("background", {})
    display_width = background.get("displayWidth", GAME_WIDTH)
    display_height = background.get("displayHeight", GAME_HEIGHT)

    # Calculate mapping
    mapping = calculate_unity_mapping(scene_config, unity_data, display_width, display_height)
    if not mapping:
        return None

    result = {
        "scene_key": scene_key,
        "scene_name": scene_config.get("name", scene_key),
        "unity_scene": scene_config.get("unityScene"),
        "display_width": display_width,
        "display_height": display_height,
        "mapping": {
            "scaleX": mapping.scaleX,
            "scaleY": mapping.scaleY,
            "offsetX": mapping.offsetX,
            "offsetY": mapping.offsetY,
        },
    }

    # Convert platforms
    platforms = unity_data.get("platforms", [])
    if isinstance(platforms, list) and platforms:
        result["platforms"] = [convert_platform(p, mapping) for p in platforms]

    # Convert colliders
    colliders = unity_data.get("colliders", [])
    if isinstance(colliders, list) and colliders:
        result["colliders"] = [convert_collider(c, mapping) for c in colliders]

    # Convert spawn point
    player_spawn = unity_data.get("player_spawn")
    if isinstance(player_spawn, dict):
        result["player_spawn"] = convert_spawn_point(player_spawn, mapping)

    # Preserve original Unity data for reference
    result["unity_source"] = {
        "scene_file": unity_data.get("scene_file"),
        "scene_name": unity_data.get("scene_name"),
    }

    return result


def parse_args(argv: Optional[List[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Convert Unity scene coordinates to Phaser pixel coordinates."
    )
    parser.add_argument(
        "--scene",
        action="append",
        dest="scenes",
        help="Limit conversion to specific scene keys.",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=OUTPUT_PATH,
        help="Output JSON file for converted data.",
    )
    return parser.parse_args(argv)


def main(argv: Optional[List[str]] = None) -> int:
    args = parse_args(argv)

    try:
        # Load input data
        scenes_data = load_json(SCENES_JSON_PATH)
        unity_snapshot = load_json(UNITY_SNAPSHOT_PATH)
    except ConversionError as exc:
        print(f"[convert_unity_to_phaser] {exc}", file=sys.stderr)
        return 1

    # Build Unity data lookup
    unity_lookup: Dict[str, Dict] = {}
    if isinstance(unity_snapshot, list):
        for entry in unity_snapshot:
            if not isinstance(entry, dict):
                continue
            scene_key = entry.get("scene_name") or Path(entry.get("scene_file", "")).stem
            scene_file = entry.get("scene_file")
            if scene_file:
                unity_lookup[scene_file] = entry
            if scene_key:
                unity_lookup[scene_key] = entry

    # Process scenes
    scenes_config = scenes_data.get("scenes", {})
    requested = set(args.scenes or [])
    converted_scenes: List[Dict] = []

    for key, config in scenes_config.items():
        if requested and key not in requested:
            continue

        unity_scene = config.get("unityScene")
        if not unity_scene:
            continue

        unity_data = unity_lookup.get(unity_scene) or unity_lookup.get(key)
        if not unity_data:
            print(f"[WARN] No Unity data for {key} ({unity_scene})", file=sys.stderr)
            continue

        converted = convert_scene(key, config, unity_data)
        if converted:
            converted_scenes.append(converted)
            print(f"[OK] Converted {key} ({len(converted.get('platforms', []))} platforms)")
        else:
            print(f"[WARN] Could not convert {key}", file=sys.stderr)

    if not converted_scenes:
        print("[WARN] No scenes converted", file=sys.stderr)
        return 2

    # Write output
    output = {
        "generated_by": "tools/convert_unity_to_phaser.py",
        "source_files": {
            "scenes": str(SCENES_JSON_PATH.relative_to(REPO_ROOT)),
            "unity_snapshot": str(UNITY_SNAPSHOT_PATH.relative_to(REPO_ROOT)),
        },
        "scenes": {scene["scene_key"]: scene for scene in converted_scenes},
    }

    args.out.parent.mkdir(parents=True, exist_ok=True)
    with args.out.open("w", encoding="utf-8") as handle:
        json.dump(output, handle, indent=2)
        handle.write("\n")

    print(f"\n[OK] Wrote {len(converted_scenes)} scenes to {args.out.relative_to(REPO_ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
