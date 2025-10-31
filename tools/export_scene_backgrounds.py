#!/usr/bin/env python3
"""
Unity scene metadata exporter for Phaser migration.

This script scans Unity *.unity files to extract background sprite information and
player spawn transforms. The results make it easier to keep the Phaser scene JSON
in sync with the authoritative Unity data.

Run from the repo root:

    python tools/export_scene_backgrounds.py > unity_scene_snapshot.json
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple

ROOT = Path(__file__).resolve().parents[1]
UNITY_ASSETS = ROOT / "Unity" / "Assets"
SCENES_DIR = UNITY_ASSETS / "Scenes"
PLAYER_PREFAB_GUID = "deda7e69f3bc24999aaf088df64bf7f3"
PLATFORMS_DIR = UNITY_ASSETS / "prefabs" / "Platforms"




_PREFAB_SIZE_CACHE: Dict[str, Tuple[float, float]] = {}


def resolve_prefab_path(prefab_asset: str) -> Path:
    return UNITY_ASSETS / prefab_asset


def get_prefab_size(prefab_asset: str) -> Tuple[float, float]:
    if prefab_asset in _PREFAB_SIZE_CACHE:
        return _PREFAB_SIZE_CACHE[prefab_asset]

    path = resolve_prefab_path(prefab_asset)
    width = 0.0
    height = 0.0
    if path.exists():
        try:
            lines = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            lines = path.read_text(encoding="latin-1")
        current_block = None
        for raw_line in lines.splitlines():
            if raw_line.startswith("--- !u!61"):
                current_block = "Box"
            elif raw_line.startswith("--- !u!"):
                current_block = None
            if current_block == "Box" and "m_Size:" in raw_line:
                match = re.search(r"m_Size: \{x: ([^,]+), y: ([^}]+)\}", raw_line)
                if match:
                    width = max(width, abs(float(match.group(1))))
                    height = max(height, abs(float(match.group(2))))

    if width == 0.0:
        width = 0.16
    if height == 0.0:
        height = 0.16

    _PREFAB_SIZE_CACHE[prefab_asset] = (width, height)
    return _PREFAB_SIZE_CACHE[prefab_asset]

def build_guid_lookup(meta_files: Iterable[Path]) -> Dict[str, Path]:
    """Build mapping of Unity GUID -> asset path (without .meta suffix)."""
    guid_to_path: Dict[str, Path] = {}
    for meta_path in meta_files:
        try:
            text = meta_path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        match = re.search(r"^guid:\s*([0-9a-f]+)", text, flags=re.MULTILINE)
        if not match:
            continue
        guid = match.group(1)
        asset_path = meta_path.with_suffix("")  # drop .meta
        try:
            relative = asset_path.relative_to(UNITY_ASSETS)
        except ValueError:
            relative = asset_path
        guid_to_path[guid] = relative
    return guid_to_path


def collect_platform_guids() -> Dict[str, str]:
    """Return mapping of prefab GUID -> relative asset path for platform prefabs."""
    guids: Dict[str, str] = {}
    if not PLATFORMS_DIR.exists():
        return guids
    for meta_path in PLATFORMS_DIR.rglob("*.meta"):
        relative_asset = meta_path.with_suffix("")
        try:
            guid_text = meta_path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        match = re.search(r"^guid:\s*([0-9a-f]+)", guid_text, flags=re.MULTILINE)
        if not match:
            continue
        guid = match.group(1)
        try:
            relative = relative_asset.relative_to(UNITY_ASSETS)
        except ValueError:
            relative = relative_asset
        guids[guid] = str(relative)
    return guids


def parse_scene(
    scene_path: Path,
    platform_guid_map: Dict[str, str]
) -> Tuple[Dict[str, Dict[str, Optional[str]]], Optional[Dict[str, float]], List[Dict[str, float]]]:
    """Return (backgrounds, player_spawn, platforms) metadata extracted from a Unity scene."""
    game_object_names: Dict[str, str] = {}
    backgrounds: Dict[str, Dict[str, Optional[str]]] = {}
    player_spawn: Optional[Dict[str, float]] = None
    platform_instances: List[Dict[str, float]] = []

    current_block = None
    current_id = None
    sprite_data: Dict[str, Optional[str]] = {}
    pending_property: Optional[str] = None
    current_prefab_transform: Dict[str, float] = {}
    current_prefab_guid: Optional[str] = None

    with scene_path.open(encoding="utf-8") as handle:
        for raw_line in handle:
            line = raw_line.rstrip("\n")

            block_match = re.match(r"^---\s*!u!(\d+)\s+&(\d+)", line)
            if block_match:
                if current_block == "1001":
                    if (
                        current_prefab_guid == PLAYER_PREFAB_GUID
                        and {"pos_x", "pos_y"} <= current_prefab_transform.keys()
                    ):
                        player_spawn = {
                            "x": current_prefab_transform["pos_x"],
                            "y": current_prefab_transform["pos_y"],
                            "z": current_prefab_transform.get("pos_z", 0.0),
                        }
                    if (
                        current_prefab_guid
                        and current_prefab_guid in platform_guid_map
                        and {"pos_x", "pos_y"} <= current_prefab_transform.keys()
                    ):
                        prefab_asset = platform_guid_map[current_prefab_guid]
                        base_width, base_height = get_prefab_size(prefab_asset)
                        scale_x = float(current_prefab_transform.get("scale_x", 1.0))
                        scale_y = float(current_prefab_transform.get("scale_y", 1.0))
                        width_units = abs(base_width * scale_x)
                        height_units = abs(base_height * scale_y)
                        if width_units <= 0 or height_units <= 0:
                            continue
                        if width_units > 25 or height_units > 25:
                            continue
                        platform_instances.append(
                            {
                                "prefab_guid": current_prefab_guid,
                                "prefab_asset": prefab_asset,
                                "x": current_prefab_transform.get("pos_x", 0.0),
                                "y": current_prefab_transform.get("pos_y", 0.0),
                                "z": current_prefab_transform.get("pos_z", 0.0),
                                "scale_x": scale_x,
                                "scale_y": scale_y,
                                "width": width_units,
                                "height": height_units
                            }
                        )
                current_prefab_transform = {
                    'pos_x': 0.0,
                    'pos_y': 0.0,
                    'pos_z': 0.0,
                    'scale_x': 1.0,
                    'scale_y': 1.0,
                    'scale_z': 1.0
                }
                pending_property = None
                current_prefab_guid = None

                block_type = block_match.group(1)
                current_id = block_match.group(2)
                current_block = block_type
                sprite_data = {"game_object": None, "guid": None, "sorting_order": None}
                continue

            if current_block == "1":  # GameObject block
                name_match = re.match(r"\s*m_Name:\s*(.+)$", line)
                if name_match:
                    game_object_names[current_id] = name_match.group(1)

            if current_block == "212":  # SpriteRenderer block
                go_match = re.search(r"m_GameObject:\s*\{fileID:\s*(\d+)\}", line)
                if go_match:
                    sprite_data["game_object"] = go_match.group(1)

                if "m_Sprite:" in line:
                    guid_match = re.search(r"guid:\s*([0-9a-f]+)", line)
                    if guid_match:
                        sprite_data["guid"] = guid_match.group(1)

                sorting_match = re.search(r"m_SortingOrder:\s*(-?\d+)", line)
                if sorting_match:
                    sprite_data["sorting_order"] = sorting_match.group(1)

                if sprite_data["game_object"] and sprite_data["guid"]:
                    backgrounds[current_id] = dict(sprite_data)  # copy
                    current_block = None
                    sprite_data = {"game_object": None, "guid": None, "sorting_order": None}

            if current_block == "1001":  # PrefabInstance block
                source_match = re.search(r"m_SourcePrefab:\s*\{fileID:\s*\d+,\s*guid:\s*([0-9a-f]+)", line)
                if source_match:
                    current_prefab_guid = source_match.group(1)
                prop_match = re.search(r"propertyPath:\s*(.+)", line)
                if prop_match:
                    pending_property = prop_match.group(1).strip()
                value_match = re.search(r"\svalue:\s*(-?\d+\.?\d*)", line)
                if value_match and pending_property:
                    if pending_property.startswith("m_LocalPosition."):
                        axis = pending_property.split(".")[-1]
                        current_prefab_transform[f"pos_{axis}"] = float(value_match.group(1))
                    elif pending_property.startswith("m_LocalScale."):
                        axis = pending_property.split(".")[-1]
                        current_prefab_transform[f"scale_{axis}"] = float(value_match.group(1))

    # Filter to background-like GameObjects.
    filtered: Dict[str, Dict[str, Optional[str]]] = {}
    for sprite in backgrounds.values():
        go_id = sprite["game_object"]
        if not go_id:
            continue
        name = game_object_names.get(go_id, "").lower()
        if "background" not in name:
            continue
        filtered[go_id] = {
            "game_object": game_object_names.get(go_id, ""),
            "sprite_guid": sprite["guid"],
            "sorting_order": sprite["sorting_order"],
        }
    return filtered, player_spawn, platform_instances


def main() -> None:
    meta_files = UNITY_ASSETS.rglob("*.meta")
    guid_lookup = build_guid_lookup(meta_files)
    platform_guids = collect_platform_guids()

    scene_files = sorted(SCENES_DIR.glob("*.unity"))
    results = []

    for scene in scene_files:
        backgrounds, spawn, platforms = parse_scene(scene, platform_guids)
        entry = {
            "scene_file": str(scene.relative_to(UNITY_ASSETS)),
            "scene_name": scene.stem,
            "backgrounds": [],
            "player_spawn": spawn,
            "platforms": platforms,
        }
        for data in backgrounds.values():
            guid = data.get("sprite_guid")
            asset_path = guid_lookup.get(guid) if guid else None
            entry["backgrounds"].append(
                {
                    "game_object": data.get("game_object"),
                    "sprite_guid": guid,
                    "sprite_path": str(asset_path) if asset_path else None,
                    "sorting_order": int(data["sorting_order"]) if data["sorting_order"] else None,
                }
            )
        if entry["backgrounds"] or entry["player_spawn"] or entry["platforms"]:
            results.append(entry)

    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
