/**
 * SceneLoader reads JSON-driven scene definitions and spawns Phaser objects accordingly.
 */
const EDITOR_SCENE_KEYS = ['desert_1', 'diner', 'desert_cave', 'menu'];
class SceneLoader {
  constructor(scene) {
    this.scene = scene;
    this.sceneData = null;
    this.unityScenes = null;
    this.platformTextureMap = null;
    this.editorScenes = {};
  }

  preloadConfig() {
    const cache = this.scene.cache && this.scene.cache.json;
    if (!cache || !cache.exists('scene-configs')) {
      this.scene.load.json('scene-configs', 'data/scenes.json');
    }
    if (!cache || !cache.exists('unity-scenes')) {
      // Load converted Phaser scene data (coordinates already in pixels)
      this.scene.load.json('unity-scenes', 'data/phaser_scene_data.json');
    }
    if (!cache || !cache.exists('unity-platform-textures')) {
      this.scene.load.json('unity-platform-textures', 'data/unity_platform_textures.json');
    }
    EDITOR_SCENE_KEYS.forEach((sceneKey) => {
      const cacheKey = `editor-scene-${sceneKey}`;
      if (!cache || !cache.exists(cacheKey)) {
        const path = `data/editor/${sceneKey}.scene`;
        this.scene.load.json(cacheKey, path);
      }
    });
  }

  ensureDataLoaded() {
    const cache = this.scene.cache && this.scene.cache.json;
    if (!this.sceneData && cache && cache.exists('scene-configs')) {
      this.sceneData = cache.get('scene-configs');
    }
    if (!this.unityScenes && cache && cache.exists('unity-scenes')) {
      const raw = cache.get('unity-scenes');
      this.unityScenes = {};
      // Handle new format: { scenes: { scene_key: {...}, ... } }
      if (raw && raw.scenes && typeof raw.scenes === 'object') {
        // New format: phaser_scene_data.json
        Object.keys(raw.scenes).forEach((sceneKey) => {
          const sceneData = raw.scenes[sceneKey];
          // Store by scene_key
          this.unityScenes[sceneKey] = sceneData;
          // Also store by unity_scene if available
          if (sceneData.unity_scene) {
            this.unityScenes[sceneData.unity_scene] = sceneData;
          }
        });
      } else if (Array.isArray(raw)) {
        // Legacy format: unity_scene_snapshot.json
        raw.forEach((entry) => {
          if (entry.scene_file) {
            this.unityScenes[entry.scene_file] = entry;
          }
          if (entry.scene_name) {
            this.unityScenes[entry.scene_name] = entry;
          }
        });
      }
    }
    if (!this.platformTextureMap && cache && cache.exists('unity-platform-textures')) {
      const rawTextures = cache.get('unity-platform-textures');
      if (rawTextures && typeof rawTextures === 'object') {
        this.platformTextureMap = rawTextures;
      } else {
        this.platformTextureMap = {};
      }
    }
    if (cache) {
      EDITOR_SCENE_KEYS.forEach((sceneKey) => {
        const cacheKey = `editor-scene-${sceneKey}`;
        if (cache.exists(cacheKey) && !this.editorScenes[sceneKey]) {
          this.editorScenes[sceneKey] = cache.get(cacheKey);
        }
      });
    }
    return this.sceneData;
  }

  getSceneConfig(sceneKey) {
    const data = this.ensureDataLoaded();
    if (!data || !data.scenes || !data.scenes[sceneKey]) {
      console.error(`[SceneLoader] Scene config missing for key: ${sceneKey}`);
      return null;
    }
    return data.scenes[sceneKey];
  }

  preloadAssets(sceneKey) {
    const config = this.getSceneConfig(sceneKey);
    if (!config) return false;

    let queued = false;
    this.ensureDataLoaded();
    if (config.background && config.background.file) {
      const { key, file } = config.background;
      if (key && !this.scene.textures.exists(key)) {
        this.scene.load.image(key, file);
        queued = true;
      } else if (!key && file) {
        const autoKey = `bg-${sceneKey}`;
        if (!this.scene.textures.exists(autoKey)) {
          this.scene.load.image(autoKey, file);
          queued = true;
        }
      }
      if (Array.isArray(config.background.layers)) {
        config.background.layers.forEach((layer) => {
          if (!layer.file) {
            return;
          }
          const layerKey = layer.key || `${config.background.key || sceneKey}-layer-${layer.file}`;
          if (!this.scene.textures.exists(layerKey)) {
            this.scene.load.image(layerKey, layer.file);
            queued = true;
          }
        });
      }
    }
    const unityData = (this.unityScenes && (this.unityScenes[config.unityScene] || this.unityScenes[sceneKey])) || null;
    if (unityData && Array.isArray(unityData.platforms)) {
      unityData.platforms.forEach((platform) => {
        const texture = this.getUnityPlatformTexture(platform.prefab_asset);
        if (!texture || !texture.textureKey || !texture.file) {
          return;
        }
        if (!this.scene.textures.exists(texture.textureKey)) {
          this.scene.load.image(texture.textureKey, texture.file);
          queued = true;
        }
      });
    }
    return queued;
  }

  buildScene(sceneKey) {
    const config = this.getSceneConfig(sceneKey);
    if (!config) return null;

    const objects = {
      background: null,
      groundGroup: this.scene.physics.add.staticGroup(),
      platformGroup: this.scene.physics.add.staticGroup(),
      backgroundLayers: [],
      spawnUnity: config.spawnUnity || null,
      spawn: config.spawn || { x: 0, y: 0 },
      movementMode: config.movementMode || (sceneKey === 'diner' ? 'adventure' : 'platformer'),
      unityColliders: []
    };

    const editorScene = this.editorScenes[sceneKey] || null;
    this.buildBackground(objects, config, editorScene, sceneKey);

    if (Array.isArray(config.platforms)) {
      config.platforms.forEach((platform) => {
        const group = platform.type === 'platform' ? objects.platformGroup : objects.groundGroup;
        const textureKey = platform.type === 'ground' ? 'ground' : 'platform';
        const rect = group.create(platform.x, platform.y, textureKey);
        rect.setDisplaySize(platform.width, platform.height);
        if (platform.tint) {
          rect.setTint(Number(platform.tint));
        }
        rect.refreshBody();
      });
    }

    const mapping = this.calculateUnityMapping(sceneKey, config);
    objects.unityMapping = mapping;
    const unityData = (this.unityScenes && (this.unityScenes[config.unityScene] || this.unityScenes[sceneKey])) || null;

    // Use pre-converted spawn point from Phaser data if available
    if (unityData && unityData.player_spawn) {
      objects.spawn = unityData.player_spawn;
    } else if (config.spawnUnity && mapping) {
      // Fallback to runtime conversion (legacy)
      objects.spawn = this.convertUnityPoint(config.spawnUnity, mapping);
    }

    objects.unityPlatforms = this.buildUnityPlatformsFromSources(sceneKey, mapping, unityData, editorScene);
    objects.unityColliders = this.buildUnityCollidersFromSources(sceneKey, mapping, unityData);
    return objects;
  }

  updateSceneConfig(sceneKey, config) {
    const data = this.ensureDataLoaded() || {};
    if (!data.scenes) {
      data.scenes = {};
    }
    data.scenes[sceneKey] = config;
    this.sceneData = data;
    if (this.scene.cache?.json) {
      this.scene.cache.json.add('scene-configs', data);
    }
  }

  resolveDisplaySize(config) {
    return {
      width: (config.background && config.background.displayWidth) || GAME_WIDTH,
      height: (config.background && config.background.displayHeight) || GAME_HEIGHT
    };
  }

  calculateUnityMapping(sceneKey, config) {
    if (!config.unityScene) {
      return null;
    }
    const unityData = this.unityScenes && (this.unityScenes[config.unityScene] || this.unityScenes[`${config.unityScene}`]);
    if (!unityData) {
      return null;
    }
    const display = this.resolveDisplaySize(config);
    const margins = config.unityMappingMargins || { x: 80, top: 80, bottom: 120 };
    const marginX = margins.x ?? 80;
    const marginTop = margins.top ?? 80;
    const marginBottom = margins.bottom ?? 120;

    const points = [];
    if (Array.isArray(unityData.platforms)) {
      unityData.platforms.forEach(p => {
        points.push({ x: p.x, y: p.y });
      });
    }
    if (Array.isArray(unityData.colliders)) {
      unityData.colliders.forEach((c) => {
        if (typeof c.x === 'number' && typeof c.y === 'number') {
          points.push({ x: c.x, y: c.y });
        }
      });
    }
    if (unityData.player_spawn) {
      points.push({ x: unityData.player_spawn.x, y: unityData.player_spawn.y });
    }
    if (!points.length) {
      return null;
    }

    let minX = points[0].x;
    let maxX = points[0].x;
    let minY = points[0].y;
    let maxY = points[0].y;

    points.forEach((pt) => {
      minX = Math.min(minX, pt.x);
      maxX = Math.max(maxX, pt.x);
      minY = Math.min(minY, pt.y);
      maxY = Math.max(maxY, pt.y);
    });

    const rangeX = maxX - minX;
    const rangeY = maxY - minY;

    const scaleX = rangeX > 0
      ? (display.width - marginX * 2) / rangeX
      : 1;
    const centerX = (minX + maxX) / 2;
    const offsetX = rangeX > 0
      ? display.width / 2 - centerX * scaleX
      : display.width / 2 - minX * scaleX;

    const scaleY = rangeY > 0
      ? (display.height - (marginTop + marginBottom)) / rangeY
      : 1;
    const offsetY = rangeY > 0
      ? display.height - marginBottom + minY * scaleY
      : display.height - marginBottom + minY * scaleY;

    return {
      scaleX,
      scaleY,
      offsetX,
      offsetY,
      displayWidth: display.width,
      displayHeight: display.height
    };
  }

  convertUnityPoint(point, mapping) {
    if (!mapping) {
      return { x: point.x, y: point.y };
    }
    return {
      x: mapping.offsetX + point.x * mapping.scaleX,
      y: mapping.offsetY - point.y * mapping.scaleY
    };
  }

  convertUnitySize(widthUnits, heightUnits, mapping) {
    if (!mapping) {
      return { width: widthUnits, height: heightUnits };
    }
    return {
      width: widthUnits * mapping.scaleX,
      height: heightUnits * mapping.scaleY
    };
  }

  buildBackground(objects, config, editorScene, sceneKey) {
    if (editorScene && Array.isArray(editorScene.displayList)) {
      const backgroundNodes = editorScene.displayList.filter((node) => node.type === 'Image' && node.data && node.data.type === 'background');
      backgroundNodes
        .sort((a, b) => (a.data?.depth || 0) - (b.data?.depth || 0))
        .forEach((node, index) => {
          if (!this.scene.textures.exists(node.texture)) {
            return;
          }
          const image = this.scene.add.image(
            node.x ?? GAME_WIDTH / 2,
            node.y ?? GAME_HEIGHT / 2,
            node.texture,
            node.frame || null
          );
          image.setOrigin(node.originX ?? 0.5, node.originY ?? 0.5);
          image.setScale(node.scaleX ?? 1, node.scaleY ?? 1);
          image.setDepth(node.data?.depth ?? (index === 0 ? -10 : -15));
          if (!objects.background) {
            objects.background = image;
          } else {
            objects.backgroundLayers.push(image);
          }
        });
      if (objects.background) {
        return;
      }
    }

    const backgroundConfig = config.background || null;
    if (!backgroundConfig) {
      return;
    }
    const mainKey = backgroundConfig.key || `bg-${sceneKey}`;
    if (this.scene.textures.exists(mainKey)) {
      const bg = this.scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, mainKey);
      bg.setDisplaySize(
        backgroundConfig.displayWidth || GAME_WIDTH,
        backgroundConfig.displayHeight || GAME_HEIGHT
      );
      bg.setDepth(backgroundConfig.depth || -10);
      objects.background = bg;
    }
    if (Array.isArray(backgroundConfig.layers)) {
      backgroundConfig.layers.forEach((layer) => {
        const layerKey = layer.key || mainKey;
        if (!this.scene.textures.exists(layerKey)) {
          return;
        }
        const layerImage = this.scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, layerKey);
        layerImage.setDisplaySize(
          layer.displayWidth || backgroundConfig.displayWidth || GAME_WIDTH,
          layer.displayHeight || backgroundConfig.displayHeight || GAME_HEIGHT
        );
        layerImage.setDepth(layer.depth || (backgroundConfig.depth || -15));
        objects.backgroundLayers.push(layerImage);
      });
    }
  }

  buildUnityPlatformsFromSources(sceneKey, mapping, unityData, editorScene) {
    const results = [];
    if (editorScene && Array.isArray(editorScene.displayList)) {
      editorScene.displayList.forEach((node) => {
        if (node.type !== 'Sprite' || !node.data || node.data.type !== 'platform') {
          return;
        }
        const prefab = node.data.prefab;
        const texture = this.getUnityPlatformTexture(prefab);
        const unityPoint = { x: node.x ?? 0, y: -(node.y ?? 0) };
        const unityWidth = node.data.width || 0;
        const unityHeight = node.data.height || 0;
        const scaleX = Number(node.scaleX) || 1.0;
        const scaleY = Number(node.scaleY) || 1.0;
        const scaledWidth = unityWidth * Math.abs(scaleX);
        const scaledHeight = unityHeight * Math.abs(scaleY);
        const position = mapping ? this.convertUnityPoint(unityPoint, mapping) : { x: node.x, y: node.y };
        const size = mapping
          ? this.convertUnitySize(scaledWidth, scaledHeight, mapping)
          : { width: scaledWidth, height: scaledHeight };
        results.push({
          editor: node,
          unity: {
            prefab_asset: prefab,
            x: unityPoint.x,
            y: unityPoint.y,
            width: unityWidth,
            height: unityHeight
          },
          phaser: position,
          size,
          texture,
          flipX: !!node.flipX || scaleX < 0,
          flipY: !!node.flipY || scaleY < 0,
          physics: {
            type: node.data.oneWay ? 'oneway' : 'solid',
            asset: prefab || null
          }
        });
      });
      if (results.length) {
        return results;
      }
    }

    if (unityData && Array.isArray(unityData.platforms)) {
      return unityData.platforms
        .filter((platform) => typeof platform.width === 'number' && typeof platform.height === 'number')
        .map((platform) => {
          // Coordinates are already converted to Phaser pixels by convert_unity_to_phaser.py
          const position = { x: platform.x, y: platform.y };
          const size = { width: platform.width, height: platform.height };
          const unityScaleX = Number(platform.scale_x) || 1.0;
          const unityScaleY = Number(platform.scale_y) || 1.0;
          const texture = this.getUnityPlatformTexture(platform.prefab_asset);
          const bodyOptions = this.mapPlatformPhysics(platform);
          return {
            unity: platform,
            phaser: position,
            size,
            texture,
            flipX: unityScaleX < 0,
            flipY: unityScaleY < 0,
            physics: bodyOptions
          };
        });
    }

    return [];
  }

  buildUnityCollidersFromSources(sceneKey, mapping, unityData) {
    if (!unityData || !Array.isArray(unityData.colliders)) {
      return [];
    }
    return unityData.colliders.map((collider) => {
      // Coordinates are already converted to Phaser pixels by convert_unity_to_phaser.py
      const position = { x: collider.x || 0, y: collider.y || 0 };
      const size = { width: collider.width || 0, height: collider.height || 0 };
      return {
        unity: collider,
        phaser: position,
        size,
        isTrigger: !!collider.is_trigger,
        gameObject: collider.game_object || null
      };
    });
  }

  getUnityPlatformTexture(prefabAsset) {
    if (!prefabAsset || !this.platformTextureMap) {
      return null;
    }
    return this.platformTextureMap[prefabAsset] || null;
  }

  mapPlatformPhysics(platform) {
    if (!platform) {
      return { type: 'solid' };
    }
    const asset = String(platform.prefab_asset || '').toLowerCase();
    if (asset.includes('floating_')) {
      return { type: 'oneway', allowDownJump: true, asset: platform.prefab_asset || null };
    }
    return { type: 'solid', asset: platform.prefab_asset || null };
  }
}
