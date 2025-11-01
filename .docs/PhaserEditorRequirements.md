# Phaser Editor 2D - Requirements & Integration Guide

**Version:** Phaser Editor 2D v4 (web-based)
**Project:** WHR Arcade Game (Unity → Phaser Migration)
**Date:** 2025-10-31

## Overview

Phaser Editor 2D is a web-based IDE for developing Phaser 3 games with visual scene editing and asset management. This document captures requirements and configuration specifics for integrating it with the WHR Arcade Game migration project.

---

## Core Concepts

### Scene Files (.scene)

**Purpose:** Visual scene composition with object positioning and property configuration.

**Key Characteristics:**
- **Custom Format:** `.scene` files use proprietary JSON format
- **Compilation:** Scenes compile to **clean, readable Phaser code** (not runtime-loaded)
- **WYSIWYG:** Uses Phaser renderer directly - what you see in editor matches game runtime
- **Vanilla Phaser:** No custom plugins required - generates standard Phaser 3 code

**WHR Project Context:**
- Our `.scene` files are in `web/data/editor/*.scene`
- Generated from Unity data via `tools/export_phaser_editor_scenes.py`
- Currently **VIEW-ONLY** (one-way export pipeline)
- Future: implement bidirectional workflow for designer edits

### Asset Pack Files (.pack.json)

**Purpose:** Centralized asset loading configuration for Phaser Loader.

**Key Characteristics:**
- **Native Phaser Format:** Asset Packs are standard Phaser, work in any Phaser project
- **Visual Management:** Editor provides UI for organizing assets instead of manual JSON
- **IDE Integration:** Scene Editor uses Asset Pack data to load textures for preview
- **Reusable:** Asset Pack files are portable across projects

**WHR Project Context:**
- Asset pack location: `web/data/editor/assets.pack.json`
- Generated via `tools/generate_asset_pack.py`
- **CRITICAL:** Paths must be relative to pack file location

---

## Project Structure Requirements

### Directory Layout

Phaser Editor doesn't mandate specific structure, but our project uses:

```
web/
├── assets/                    # Game assets (images, audio, etc.)
│   └── sprites/
│       ├── backgrounds/       # Background images
│       ├── platforms/         # Platform textures
│       └── characters/        # Character sprites
├── data/                      # Game data files
│   ├── scenes.json           # Runtime scene configs
│   ├── unity_scene_snapshot.json
│   ├── unity_platform_textures.json
│   └── editor/               # Phaser Editor files (VIEW-ONLY)
│       ├── *.scene           # Scene definitions
│       ├── *.js              # Compiled scene classes
│       └── assets.pack.json  # Asset pack manifest
├── js/                        # Runtime game code
│   ├── main.js
│   ├── scenes/
│   ├── systems/
│   └── entities/
└── index.html                 # Entry point
```

**Important Paths:**
- **Asset Pack:** `web/assets/asset-pack.json`
- **Scenes:** `web/data/editor/*.scene`
- **Assets:** `web/assets/**/*`

---

## Asset Pack Configuration

### File Format

**Schema:**
```json
{
  "meta": {
    "app": "Phaser Editor 2D - Asset Pack Editor",
    "contentType": "phasereditor2d.pack.core.AssetContentType",
    "url": "https://phasereditor2d.com",
    "version": 2
  },
  "section1": {
    "files": [
      {
        "type": "image",
        "key": "asset-key",
        "url": "relative/path/to/asset.png"
      }
    ]
  }
}
```

**Required Fields:**
- `meta.app` - Identifies Phaser Editor format
- `meta.contentType` - Editor content type identifier
- `meta.version` - Asset Pack format version (2 for current)
- `section1.files` - Array of asset file configurations

**File Entry Fields:**
- `type` - Asset type (image, spritesheet, audio, json, etc.)
- `key` - Unique cache identifier
- `url` - Path to asset file

### Path Resolution

**CRITICAL:** Phaser Editor resolves URLs relative to the **project root**, not the asset pack file location.

**Example:**
```
Project root: web/
Pack file:    web/assets/asset-pack.json
Asset file:   web/assets/sprites/platforms/Mesa_01.png
Correct URL:  "assets/sprites/platforms/Mesa_01.png"
```

**Path Calculation:**
1. Phaser Editor project root: `web/`
2. Asset location from root: `assets/sprites/platforms/Mesa_01.png`
3. URL in asset pack: `"assets/sprites/platforms/Mesa_01.png"`

**Important:** Even though the asset pack is in `web/assets/`, paths must include `"assets/"` prefix because Phaser Editor resolves them from the project root (`web/`), not from the pack file location.

### Optional Pack Features

**baseURL:** Set common base path for all assets in section
```json
{
  "section1": {
    "baseURL": "../../assets/",
    "files": [
      {
        "type": "image",
        "key": "platform",
        "url": "sprites/platforms/Mesa_01.png"  // Relative to baseURL
      }
    ]
  }
}
```

**path:** Additional path prefix
```json
{
  "section1": {
    "path": "sprites/",
    "files": [...]
  }
}
```

**prefix:** Key prefix for all assets in section
```json
{
  "section1": {
    "prefix": "unity-",
    "files": [
      { "key": "platform", ... }  // Becomes "unity-platform"
    ]
  }
}
```

### Supported Asset Types

From Phaser 3 Asset Pack specification:

**Images:**
- `image` - Standard image file
- `svg` - SVG vector graphics
- `spritesheet` - Sprite sheet with frame config
- `atlas` - Texture atlas (JSON or XML)
- `multiatlas` - Multi-page atlas

**Audio:**
- `audio` - Sound file
- `audioSprite` - Audio sprite sheet

**Data:**
- `json` - JSON data
- `xml` - XML data
- `text` - Plain text file

**Scripts:**
- `script` - JavaScript file
- `scripts` - Multiple JS files

**Other:**
- `tilemapCSV`, `tilemapTiledJSON` - Tilemap formats
- `bitmapFont` - Bitmap font
- `plugin` - Phaser plugin
- `video` - Video file

**WHR Project Currently Uses:**
- `image` for all platform textures and backgrounds

---

## Scene File Configuration

### File Format

**Schema:**
```json
{
  "id": "uuid",
  "settings": {
    "compilerOutputLanguage": "JAVA_SCRIPT",
    "javaScriptInitFieldsInConstructor": false,
    "javaScriptGenerateFieldDeclarations": true,
    "exportClass": true,
    "autoImport": false,
    "importFileExtension": false,
    "createMethodName": "editorCreate",
    "compilerInsertSpaces": false,
    "compilerTabSize": 4,
    "borderWidth": 1280,
    "borderHeight": 720,
    "borderX": 0,
    "borderY": 0,
    "sceneKey": "scene_key_name"
  },
  "sceneType": "SCENE",
  "displayList": [],
  "meta": {
    "app": "Phaser Editor 2D - Scene Editor",
    "url": "https://phasereditor2d.com",
    "contentType": "phasereditor2d.core.scene.SceneContentType"
  }
}
```

### Scene Settings

**Compiler Settings:**
- `compilerOutputLanguage` - "JAVA_SCRIPT" or "TYPE_SCRIPT"
- `exportClass` - Generate class export (true/false)
- `createMethodName` - Generated method name (default: "editorCreate")
- `compilerInsertSpaces` - Use spaces vs tabs
- `compilerTabSize` - Tab width

**Scene Dimensions:**
- `borderWidth`, `borderHeight` - Scene canvas size (1280×720 for WHR)
- `borderX`, `borderY` - Scene offset (usually 0, 0)
- `sceneKey` - Phaser scene key identifier

**WHR Project Settings:**
- **Language:** JavaScript (no TypeScript yet)
- **Canvas:** 1280×720 (with 4× zoom at runtime)
- **Method:** `editorCreate()` - called from scene's `create()` method

### Display List

**Purpose:** Array of game objects in the scene.

**Object Types:**
- `Image` - Static image
- `Sprite` - Animated sprite
- `TileSprite` - Tiling sprite
- `Container` - Object container
- `Text` - Text object
- And many more Phaser types

**Example Image Entry:**
```json
{
  "type": "Image",
  "id": "uuid",
  "texture": "bg-desert-cave",
  "frame": null,
  "x": 640.0,
  "y": 360.0,
  "scaleX": 1.0,
  "scaleY": 1.0,
  "originX": 0.5,
  "originY": 0.5,
  "angle": 0,
  "alpha": 1,
  "visible": true,
  "flipX": false,
  "flipY": false,
  "data": {
    "custom": "metadata"
  }
}
```

**Custom Data:**
- `data` object stores custom properties
- Survives round-trip through editor
- Used for physics metadata (e.g., `data.oneWay`, `data.prefab`)

---

## Scene Compilation

### Compilation Process

1. **Source:** `.scene` file (JSON)
2. **Compiler:** Phaser Editor Scene Compiler
3. **Output:** `.js` file with Phaser code

**Example Output:**
```javascript
// Auto-generated by Phaser Editor Scene Compiler

class DesertCaveScene extends Phaser.Scene {
  constructor() {
    super("desert_cave");
  }

  editorCreate() {
    // Background
    const bg = this.add.image(640, 360, "bg-desert-cave");
    bg.scaleX = 1.0;
    bg.scaleY = 1.0;

    // Platforms
    const platform1 = this.add.sprite(150, 200, "unity-platform-mesa-01");
    platform1.setData("unityPlatform", { type: "solid" });

    this.events.emit("scene-awake");
  }

  create() {
    this.editorCreate();
  }
}

export default DesertCaveScene;
```

### Integration with Runtime

**Current WHR Approach:**
- `.scene` files are **NOT loaded at runtime**
- Instead, `SceneLoader.js` builds scenes procedurally from `scenes.json`
- `.scene` files serve as **preview artifacts** for Phaser Editor

**Future Bidirectional Workflow:**
- Add `SceneLoader.loadEditorScene()` method
- Parse `.scene` displayList
- Recreate game objects with physics metadata
- Allow designers to edit in Phaser Editor

---

## WHR Project Integration

### Current Pipeline

```
Unity Scene
    ↓ (manual export)
unity_scene_snapshot.json
    ↓
scenes.json + unity_platform_textures.json
    ↓ (tools/export_phaser_editor_scenes.py)
web/data/editor/*.scene
    ↓ (Phaser Editor - PREVIEW ONLY)
Visual Scene Preview
```

### Asset Pack Generation

**Tool:** `tools/generate_asset_pack.py`

**Inputs:**
- `web/data/scenes.json` - Background references
- `web/data/unity_platform_textures.json` - Platform texture mappings

**Output:**
- `web/assets/asset-pack.json`

**Run Before Scene Export:**
```bash
python3 tools/generate_asset_pack.py
python3 tools/export_phaser_editor_scenes.py
```

### Scene Export

**Tool:** `tools/export_phaser_editor_scenes.py`

**Inputs:**
- `web/data/scenes.json` - Scene configuration
- `web/data/unity_scene_snapshot.json` - Unity platform data
- `web/data/unity_platform_textures.json` - Texture mappings

**Output:**
- `web/data/editor/{scene_key}.scene` - Scene definition
- `web/data/editor/{scene_key}.js` - Compiled scene class

**Options:**
```bash
# Export all scenes
python3 tools/export_phaser_editor_scenes.py

# Export specific scene
python3 tools/export_phaser_editor_scenes.py --scene desert_cave

# Custom output directory
python3 tools/export_phaser_editor_scenes.py --out web/data/editor
```

---

## Platform Requirements

### System Requirements

**Supported Platforms:**
- Windows
- macOS
- Linux

**Browser-Based Client:**
- Memory: 150-300 MB (depends on project asset size)
- Modern web browser required

### Installation

Phaser Editor 2D runs as a web application. Installation details depend on version (cloud vs. self-hosted).

**For WHR Project:**
- Designer installs Phaser Editor 2D locally
- Opens project from `web/` directory
- Asset pack located at `web/assets/asset-pack.json`
- Scenes auto-discovered in `web/data/editor/`

---

## Best Practices

### Asset Organization

**✅ DO:**
- Keep asset pack in `web/assets/` alongside the assets themselves
- Use relative paths from pack file location
- Organize assets by type (`sprites/backgrounds/`, `sprites/platforms/`)
- Generate asset pack before exporting scenes
- Use descriptive, unique keys (`unity-platform-mesa-01`)

**❌ DON'T:**
- Use absolute paths in asset pack
- Mix asset pack location without updating URLs
- Manually edit generated `.scene` files (regenerate instead)
- Forget to regenerate asset pack after adding new textures

### Scene Management

**✅ DO:**
- Keep `.scene` files in `web/data/editor/`
- Add header comment: `// AUTO-GENERATED - DO NOT EDIT`
- Regenerate scenes after Unity changes
- Use `data` object for custom metadata
- Test scenes in Phaser Editor before committing

**❌ DON'T:**
- Edit generated `.scene` files manually
- Commit broken scenes (test in editor first)
- Mix scene format versions
- Hardcode asset references (use asset pack)

### Development Workflow

**Recommended Order:**
1. Export Unity scene data to JSON
2. Update `scenes.json` configuration (spawn, margins, etc.)
3. Add new textures to `unity_platform_textures.json`
4. **Generate asset pack** (`generate_asset_pack.py`)
5. Export scenes (`export_phaser_editor_scenes.py`)
6. Preview in Phaser Editor
7. Test in browser runtime
8. Commit if successful

---

## Troubleshooting

### Missing Textures in Editor

**Symptom:** Phaser Editor shows "missing texture" warnings

**Causes:**
1. Asset pack not generated
2. Incorrect paths in asset pack
3. Asset files don't exist at specified path

**Solutions:**
```bash
# 1. Regenerate asset pack
python3 tools/generate_asset_pack.py

# 2. Verify paths are relative to project root (web/)
# Project root: web/
# Asset file:   web/assets/sprites/platforms/Mesa_01.png
# Correct URL:  assets/sprites/platforms/Mesa_01.png

# 3. Check files exist
ls web/assets/sprites/platforms/
```

### Scene Won't Open in Editor

**Symptom:** Phaser Editor fails to load .scene file

**Causes:**
1. Invalid JSON syntax
2. Missing required fields
3. Incompatible version

**Solutions:**
```bash
# Validate JSON
python3 -m json.tool web/data/editor/desert_cave.scene > /dev/null

# Check meta section
cat web/data/editor/desert_cave.scene | python3 -m json.tool | grep -A 5 '"meta"'

# Regenerate from source
python3 tools/export_phaser_editor_scenes.py --scene desert_cave
```

### Paths Not Resolving

**Symptom:** Assets load in runtime but not in editor (or vice versa)

**Cause:** Different base paths for runtime vs. editor

**Solution:**
- **Runtime:** Loads from `web/` as base
- **Editor:** Loads from project root (`web/`), **NOT** relative to pack file
- **Asset Pack URLs:** Must be relative to project root (`web/`)
- **Scene Texture Keys:** Reference asset pack keys, not paths

```json
// ✅ CORRECT - includes "assets/" prefix
{
  "type": "image",
  "key": "bg-desert",
  "url": "assets/sprites/backgrounds/Desert.png"
}

// ❌ WRONG - missing "assets/" prefix
{
  "type": "image",
  "key": "bg-desert",
  "url": "sprites/backgrounds/Desert.png"  // Wrong! Must include "assets/"
}
```

---

## Future Enhancements

### Planned Features

1. **Bidirectional Workflow**
   - Import `.scene` files back to runtime format
   - Allow designer edits in Phaser Editor
   - Sync changes bidirectionally

2. **TypeScript Support**
   - Migrate to TypeScript compilation
   - Type-safe scene generation
   - Better IDE integration

3. **Animation Editor Integration**
   - Export Unity animation data
   - Create Phaser animation definitions
   - Visual timeline editing in Phaser Editor

4. **Tilemap Support**
   - Export Unity tilemap data
   - Phaser Editor tilemap integration
   - Tile-based level editing

5. **Prefab System**
   - Reusable scene prefabs
   - Component composition
   - Prefab libraries

### Out of Scope (Current Phase)

- Mobile builds (desktop browsers only)
- Multiplayer networking
- Advanced physics (Matter.js)
- 3D rendering
- Custom shaders
- Audio mixing in editor

---

## References

### Official Documentation

- **Phaser Editor 2D:** https://docs.phaser.io/phaser-editor/
- **Phaser Editor v3 Help:** https://help-v3.phasereditor2d.com/
- **Phaser 3 API:** https://docs.phaser.io/
- **Phaser Asset Packs:** [Phaser Loader API Documentation]

### WHR Project Documentation

- **Scene Export Workflow:** `.docs/workflows/Scene_Export_Workflow.md`
- **Phase 3 Handoff:** `.docs/project_plan/Handoff_Codex_Phase3_Update_20251031.md`
- **Bug Tracking:** `.docs/bug_tracking/Bug_Fix_Platform_Scaling_2025_10_31.md`
- **Migration Strategy:** `WHRPhaserMigration_Codex.md`

### Tools

- **Asset Pack Generator:** `tools/generate_asset_pack.py`
- **Scene Exporter:** `tools/export_phaser_editor_scenes.py`

---

## Changelog

**2025-10-31:**
- Initial documentation created
- Asset pack path bug fixed through experimentation
- Moved asset pack to `web/assets/asset-pack.json`
- **Discovered:** Phaser Editor resolves paths from project root, not pack file location
- **Correct format:** URLs must include `assets/` prefix (e.g., `assets/sprites/platforms/Mesa_01.png`)
- Verified with WHR project structure and Phaser Editor testing
- Added troubleshooting section
- Documented current pipeline and future enhancements

---

**Last Updated:** 2025-10-31
**Document Version:** 1.0
**Project Phase:** Phase 3 - Scene Porting
