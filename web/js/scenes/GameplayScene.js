/**
 * GameplayScene boots a minimal platforming testbed for Phase 1 validation.
 */
const PLATFORM_DEBUG = true;

class GameplayScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameplayScene' });
    this.inputMapper = null;
    this.player = null;
    this.ground = null;
    this.platforms = null;
    this.debugText = null;
    this.velocityBar = null;
    this.animLoader = null;
    this.sceneLoader = null;
    this.currentSceneKey = window.__WHR_SCENE_KEY || 'sandbox';
    this.nextSceneKey = this.currentSceneKey;
    this.spawnPoint = { x: GAME_WIDTH / 2, y: 300 };
    this.background = null;
    this.playerGroundCollider = null;
    this.playerPlatformCollider = null;
    this.platformDebugGraphics = null;
    this.unityPlatformRects = [];
  }

  preload() {
    // Generate placeholder textures for phase scaffolding.
    this.textures.generate('platform', { data: ['1'], pixelWidth: 1 });
    this.textures.generate('ground', { data: ['2'], pixelWidth: 1 });

    this.animLoader = new AnimationLoader(this);
    this.animLoader.loadCharacterData('ray', 'assets/sprites/characters/ray/ray.json');

    this.load.once('filecomplete-json-ray', () => {
      this.animLoader.preloadCharacterSprites('ray');
    });

    this.sceneLoader = new SceneLoader(this);
    this.sceneLoader.preloadConfig();
    this.load.once('filecomplete-json-scene-configs', () => {
      this.sceneLoader.preloadAssets(this.currentSceneKey);
    });
  }

  create() {
    this.cameras.main.setBackgroundColor('#87ceeb');
    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.drawBoundsDebug();

    this.velocityBar = this.add.graphics();
    this.debugText = this.add.text(10, 10, 'Initializing...', {
      fontSize: '14px',
      fill: '#000000',
      backgroundColor: '#ffffff',
      padding: { x: 6, y: 6 }
    });

    this.animLoader.createCharacterAnimations('ray');

    this.inputMapper = new InputMapper(this);
    this.player = new RayPlayer(this, this.spawnPoint.x, this.spawnPoint.y);
    this.player.sprite.play('ray-idle');

    this.loadScene(this.currentSceneKey);
    this.registerMessageHandlers();
  }

  update(time, delta) {
    if (!this.inputMapper || !this.player) {
      return;
    }

    const intent = this.inputMapper.update();
    this.player.update(time, delta, intent);

    const pos = this.player.getPosition();
    const vel = this.player.getVelocity();

    this.debugText.setText(
      `Scene: ${this.currentSceneKey}\n` +
      `Intent: ${intent}\n` +
      `Position: (${Math.round(pos.x)}, ${Math.round(pos.y)})\n` +
      `Velocity: (${Math.round(vel.x)}, ${Math.round(vel.y)})\n` +
      `Grounded: ${this.player.isGrounded}\n` +
      `HP: ${this.player.hp}/10\n\n` +
      `Controls:\nArrow/WASD: Move\nSpace: Jump\nX: Attack\nZ/Shift: Dig`
    );

    this.renderVelocityBar(pos, vel);
  }

  drawBoundsDebug() {
    const graphics = this.add.graphics();
    graphics.lineStyle(2, 0xff0000, 0.3);
    graphics.strokeRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  renderVelocityBar(position, velocity) {
    this.velocityBar.clear();
    this.velocityBar.fillStyle(0x00ff00, 0.7);
    this.velocityBar.fillRect(position.x, position.y - 50, velocity.x * 0.4, 5);
    this.velocityBar.fillStyle(0x0000ff, 0.7);
    this.velocityBar.fillRect(position.x - 2, position.y - 45, 5, velocity.y * 0.1);
  }

  registerMessageHandlers() {
    this.handleExternalMessage = (event) => {
      const data = event.data;
      if (!data || !data.type) {
        return;
      }

      if (data.type === 'whr:set-scene' && data.sceneKey) {
        this.loadScene(data.sceneKey);
      } else if (data.type === 'whr:update-scene-config' && data.sceneKey && data.config) {
        if (this.sceneLoader) {
          this.sceneLoader.updateSceneConfig(data.sceneKey, data.config);
          if (data.sceneKey === this.currentSceneKey) {
            this.loadScene(data.sceneKey);
          }
          window.parent?.postMessage?.({ type: 'whr:scene-updated', sceneKey: data.sceneKey }, '*');
        }
      }
    };

    window.addEventListener('message', this.handleExternalMessage);
    this.events.once('shutdown', () => {
      window.removeEventListener('message', this.handleExternalMessage);
    });
  }

  loadScene(sceneKey) {
    if (!this.sceneLoader) {
      console.warn('[GameplayScene] SceneLoader not ready yet.');
      return;
    }

    const cache = this.cache && this.cache.json;
    if (!cache || !cache.exists('scene-configs') || !cache.exists('unity-scenes')) {
      this.sceneLoader.preloadConfig();
      const onConfigLoaded = () => {
        this.loadScene(sceneKey);
      };
      if (!cache || !cache.exists('scene-configs')) {
        this.load.once('filecomplete-json-scene-configs', onConfigLoaded);
      }
      if (!cache || !cache.exists('unity-scenes')) {
        this.load.once('filecomplete-json-unity-scenes', onConfigLoaded);
      }
      if (!this.load.isLoading()) {
        this.load.start();
      }
      return;
    }

    this.nextSceneKey = sceneKey;
    const applyScene = () => {
      if (sceneKey !== this.nextSceneKey) {
        return;
      }
      const sceneObjects = this.sceneLoader.buildScene(sceneKey);
      if (!sceneObjects) {
        return;
      }
      this.clearCurrentScene();
      this.background = sceneObjects.background || null;
      if (this.background) {
        this.background.setDepth(0);
      }
      this.ground = sceneObjects.groundGroup;
      this.platforms = sceneObjects.platformGroup;
      this.currentUnityMapping = sceneObjects.unityMapping || null;
      this.spawnPoint = sceneObjects.spawn
        ? { x: sceneObjects.spawn.x, y: sceneObjects.spawn.y }
        : this.spawnPoint;

      this.resetPlayerForScene();
      this.buildUnityPlatforms(sceneObjects.unityPlatforms || []);

      this.playerGroundCollider = this.physics.add.collider(this.player.sprite, this.ground);
      this.playerPlatformCollider = this.physics.add.collider(this.player.sprite, this.platforms);
      if (PLATFORM_DEBUG) {
        this.renderPlatformDebug();
      }

      this.currentSceneKey = sceneKey;
      if (this.debugText) {
        this.debugText.setText(
          `Scene: ${sceneKey}\n` +
          `Intent: ${this.inputMapper.getIntent()}\n` +
          `Position: (${Math.round(this.player.sprite.x)}, ${Math.round(this.player.sprite.y)})\n` +
          `Velocity: (${Math.round(this.player.sprite.body.velocity.x)}, ${Math.round(this.player.sprite.body.velocity.y)})\n` +
          `Grounded: ${this.player.isGrounded}\n` +
          `HP: ${this.player.hp}/10\n\n` +
          `Controls:\nArrow/WASD: Move\nSpace: Jump\nX: Attack\nZ/Shift: Dig`
        );
      }
      window.parent?.postMessage?.({ type: 'whr:scene-loaded', sceneKey }, '*');
    };

    const queuedAssets = this.sceneLoader.preloadAssets(sceneKey);
    if (queuedAssets) {
      this.load.once('complete', applyScene);
      this.load.start();
    } else {
      applyScene();
    }
  }

  clearCurrentScene() {
    if (this.playerGroundCollider) {
      this.playerGroundCollider.destroy();
      this.playerGroundCollider = null;
    }
    if (this.playerPlatformCollider) {
      this.playerPlatformCollider.destroy();
      this.playerPlatformCollider = null;
    }
    if (this.background) {
      this.background.destroy();
      this.background = null;
    }
    if (this.platformDebugGraphics) {
      this.platformDebugGraphics.destroy();
      this.platformDebugGraphics = null;
    }
    if (this.unityPlatformRects) {
      this.unityPlatformRects.forEach((rect) => {
        if (rect.body) {
          rect.body.destroy();
        }
        rect.destroy();
      });
      this.unityPlatformRects = [];
    }
    if (this.ground) {
      this.ground.clear(true, true);
      this.ground.destroy();
      this.ground = null;
    }
    if (this.platforms) {
      this.platforms.clear(true, true);
      this.platforms.destroy();
      this.platforms = null;
    }
  }

  resetPlayerForScene() {
    if (!this.player || !this.spawnPoint) {
      return;
    }
    this.player.sprite.setPosition(this.spawnPoint.x, this.spawnPoint.y);
    this.player.sprite.setVelocity(0, 0);
    this.player.sprite.play('ray-idle', true);
  }

  buildUnityPlatforms(platforms) {
    this.unityPlatformRects.forEach((entry) => {
      if (entry.rect.body) {
        entry.rect.body.destroy();
      }
      entry.rect.destroy();
    });
    this.unityPlatformRects = [];

    platforms.forEach(({ phaser, size }) => {
      if (!size || !size.width || !size.height) {
        return;
      }
      const width = Math.max(4, size.width);
      const height = Math.max(4, size.height);
      const centerX = phaser.x - width / 2;
      const centerY = phaser.y - height / 2;
      const rect = this.add.rectangle(centerX, centerY, width, height, 0x00ffff, 0.12);
      this.physics.add.existing(rect, true);
      rect.body.setSize(width, height);
      rect.body.setOffset(-width / 2, -height / 2);
      this.unityPlatformRects.push({ rect, centerX, centerY, width, height });
    });
  }

  renderPlatformDebug() {
    if (!PLATFORM_DEBUG) return;
    if (this.platformDebugGraphics) {
      this.platformDebugGraphics.clear();
    } else {
      this.platformDebugGraphics = this.add.graphics();
    }
    this.platformDebugGraphics.lineStyle(1, 0xff0070, 0.7);
    this.platformDebugGraphics.fillStyle(0xff0070, 0.4);
    this.unityPlatformRects.forEach(({ centerX, centerY }) => {
      this.platformDebugGraphics.fillCircle(centerX, centerY, 6);
      this.platformDebugGraphics.strokeCircle(centerX, centerY, 8);
    });
  }
}
