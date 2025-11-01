#!/usr/bin/env python3
"""
Validate Phaser Editor compatibility of generated scenes and asset packs.

This script checks:
1. Asset pack format matches Phaser Editor expectations
2. Scene files have required fields
3. Texture keys in scenes exist in asset pack
4. File paths are correct
"""

from pathlib import Path
import json
import sys

REPO_ROOT = Path(__file__).resolve().parents[1]
WEB_DIR = REPO_ROOT / "web"
ASSETS_DIR = WEB_DIR / "assets"
EDITOR_DIR = WEB_DIR / "data" / "editor"
ASSET_PACK_PATH = ASSETS_DIR / "asset-pack.json"


def load_json(path):
    """Load and parse JSON file."""
    if not path.exists():
        return None
    with path.open() as f:
        return json.load(f)


def check_asset_pack():
    """Validate asset pack format."""
    print("=" * 60)
    print("ASSET PACK VALIDATION")
    print("=" * 60)

    pack = load_json(ASSET_PACK_PATH)
    if not pack:
        print(f"❌ Asset pack not found: {ASSET_PACK_PATH}")
        return False

    # Check required fields
    if "meta" not in pack:
        print("❌ Missing 'meta' section")
        return False

    meta = pack["meta"]
    required_meta = ["app", "contentType", "url", "version"]
    for field in required_meta:
        if field not in meta:
            print(f"❌ Missing meta.{field}")
            return False
        print(f"✅ meta.{field}: {meta[field]}")

    # Check sections
    if "section1" not in pack:
        print("❌ Missing 'section1'")
        return False

    section = pack["section1"]
    if "files" not in section or not isinstance(section["files"], list):
        print("❌ Missing or invalid 'files' array")
        return False

    print(f"\n✅ Asset pack has {len(section['files'])} files")

    # Validate file entries
    texture_keys = {}
    for i, file_entry in enumerate(section["files"]):
        if "type" not in file_entry or "key" not in file_entry or "url" not in file_entry:
            print(f"❌ File {i} missing required fields (type, key, url)")
            continue

        key = file_entry["key"]
        url = file_entry["url"]
        file_path = WEB_DIR / url

        texture_keys[key] = url

        if not file_path.exists():
            print(f"❌ [{key}] File not found: {file_path}")
        else:
            print(f"✅ [{key}] {url}")

    print(f"\n✅ Asset pack validation complete: {len(texture_keys)} texture keys")
    return texture_keys


def check_scene_file(scene_path, texture_keys):
    """Validate a single scene file."""
    scene_name = scene_path.stem
    print(f"\n{'=' * 60}")
    print(f"SCENE: {scene_name}")
    print(f"{'=' * 60}")

    scene = load_json(scene_path)
    if not scene:
        print(f"❌ Failed to load scene: {scene_path}")
        return False

    # Check required top-level fields
    required_fields = ["id", "settings", "sceneType", "displayList", "meta"]
    for field in required_fields:
        if field not in scene:
            print(f"❌ Missing required field: {field}")
        else:
            print(f"✅ Has field: {field}")

    # Check settings
    if "settings" in scene:
        settings = scene["settings"]
        if "sceneKey" in settings:
            print(f"✅ Scene key: {settings['sceneKey']}")
        else:
            print(f"⚠️  No sceneKey in settings")

    # Check displayList for texture references
    if "displayList" in scene:
        display_list = scene["displayList"]
        print(f"\n✅ Display list has {len(display_list)} objects")

        missing_textures = []
        for i, obj in enumerate(display_list):
            obj_type = obj.get("type", "Unknown")
            texture = obj.get("texture")

            if texture:
                if texture not in texture_keys:
                    missing_textures.append(texture)
                    print(f"❌ Object {i} ({obj_type}): texture '{texture}' not in asset pack")
                else:
                    print(f"✅ Object {i} ({obj_type}): texture '{texture}' → {texture_keys[texture]}")

        if missing_textures:
            print(f"\n❌ Scene references {len(missing_textures)} missing textures:")
            for tex in set(missing_textures):
                print(f"   - {tex}")
            return False

    print(f"\n✅ Scene '{scene_name}' validation passed")
    return True


def main():
    """Run all validations."""
    print("\n" + "=" * 60)
    print("PHASER EDITOR COMPATIBILITY VALIDATION")
    print("=" * 60 + "\n")

    # Check asset pack
    texture_keys = check_asset_pack()
    if not texture_keys:
        print("\n❌ Asset pack validation failed. Fix asset pack first.")
        return 1

    # Check all scene files
    scene_files = list(EDITOR_DIR.glob("*.scene"))
    if not scene_files:
        print(f"\n⚠️  No scene files found in {EDITOR_DIR}")
        return 1

    print(f"\nFound {len(scene_files)} scene files to validate:\n")

    all_valid = True
    for scene_path in sorted(scene_files):
        if not check_scene_file(scene_path, texture_keys):
            all_valid = False

    # Summary
    print("\n" + "=" * 60)
    print("VALIDATION SUMMARY")
    print("=" * 60)

    if all_valid:
        print("✅ All validations passed!")
        print("\nNext steps:")
        print("1. Open Phaser Editor 2D")
        print("2. Import/open project from: web/")
        print("3. Open Asset Pack Editor")
        print("4. Verify asset-pack.json is loaded")
        print("5. Open Scene Editor")
        print("6. Try opening desert_cave.scene")
        return 0
    else:
        print("❌ Some validations failed. Check errors above.")
        print("\nRecommendations:")
        print("1. Regenerate asset pack: python3 tools/generate_asset_pack.py")
        print("2. Regenerate scenes: python3 tools/export_phaser_editor_scenes.py")
        print("3. Re-run this validation")
        return 1


if __name__ == "__main__":
    sys.exit(main())
