/**
 * SceneLoader reads JSON-driven scene definitions and spawns Phaser objects accordingly.
 */
class SceneLoader {
  constructor(scene) {
    this.scene = scene;
    this.sceneData = null;
    this.unityScenes = null;
  }

  preloadConfig() {
    const cache = this.scene.cache && this.scene.cache.json;
    if (!cache || !cache.exists('scene-configs')) {
      this.scene.load.json('scene-configs', 'data/scenes.json');
    }
    if (!cache || !cache.exists('unity-scenes')) {
      this.scene.load.json('unity-scenes', 'data/unity_scene_snapshot.json');
    }
  }

  ensureDataLoaded() {
    const cache = this.scene.cache && this.scene.cache.json;
    if (!this.sceneData && cache && cache.exists('scene-configs')) {
      this.sceneData = cache.get('scene-configs');
    }
    if (!this.unityScenes && cache && cache.exists('unity-scenes')) {
      const raw = cache.get('unity-scenes');
      this.unityScenes = {};
      if (Array.isArray(raw)) {
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
      spawn: config.spawn || { x: 0, y: 0 }
    };

    const backgroundConfig = config.background || null;
    if (backgroundConfig) {
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
    if (config.spawnUnity && mapping) {
      objects.spawn = this.convertUnityPoint(
        config.spawnUnity,
        mapping
      );
    }
    if (mapping && unityData && Array.isArray(unityData.platforms)) {
      objects.unityPlatforms = unityData.platforms
        .filter((platform) => typeof platform.width === 'number' && typeof platform.height === 'number')
        .map((platform) => {
          const position = this.convertUnityPoint(platform, mapping);
          const size = this.convertUnitySize(platform.width, platform.height, mapping);
          return {
            unity: platform,
            phaser: position,
            size
          };
        });
    } else {
      objects.unityPlatforms = [];
    }
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
}
