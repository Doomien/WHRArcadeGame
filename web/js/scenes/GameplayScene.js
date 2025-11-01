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
    this.currentMovementMode = 'platformer';
    this.defaultGravityY = 0;
    this.unityColliderShapes = [];
    this.adventureBlockerColliders = [];
    this.adventureTriggerOverlaps = [];
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
    this.defaultGravityY = this.physics.world.gravity.y;
    this.cameras.main.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);

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
    this.cameras.main.startFollow(this.player.sprite, true, 0.15, 0.15);
    this.cameras.main.setZoom(4);
    this.cameras.main.roundPixels = true;
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
    if (
      !cache
      || !cache.exists('scene-configs')
      || !cache.exists('unity-scenes')
      || !cache.exists('unity-platform-textures')
    ) {
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
      if (!cache || !cache.exists('unity-platform-textures')) {
        this.load.once('filecomplete-json-unity-platform-textures', onConfigLoaded);
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
      this.applyMovementMode(sceneObjects.movementMode || 'platformer');

      this.resetPlayerForScene();
      this.buildUnityPlatforms(sceneObjects.unityPlatforms || []);
      this.buildUnityColliders(sceneObjects.unityColliders || []);

      this.playerGroundCollider = this.physics.add.collider(this.player.sprite, this.ground);
      this.playerPlatformCollider = this.physics.add.collider(
        this.player.sprite,
        this.platforms,
        null,
        this.shouldCollideWithUnityPlatform,
        this
      );
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
    this.unityPlatformRects = [];
    if (this.adventureBlockerColliders.length) {
      this.adventureBlockerColliders.forEach((collider) => collider?.destroy?.());
      this.adventureBlockerColliders = [];
    }
    if (this.adventureTriggerOverlaps.length) {
      this.adventureTriggerOverlaps.forEach((overlap) => overlap?.destroy?.());
      this.adventureTriggerOverlaps = [];
    }
    if (this.unityColliderShapes.length) {
      this.unityColliderShapes.forEach((shape) => {
        if (shape.body) {
          shape.body.destroy();
        }
        shape.destroy();
      });
      this.unityColliderShapes = [];
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

  applyMovementMode(mode) {
    this.currentMovementMode = mode;
    const world = this.physics.world;
    if (mode === 'adventure') {
      world.gravity.y = 0;
      this.cameras.main.setZoom(2);
      if (this.player?.setMovementMode) {
        this.player.setMovementMode('adventure');
      }
    } else {
      world.gravity.y = this.defaultGravityY;
      this.cameras.main.setZoom(4);
      if (this.player?.setMovementMode) {
        this.player.setMovementMode('platformer');
      }
    }
  }

  buildUnityPlatforms(platforms) {
    this.unityPlatformRects = [];

    if (!this.platforms) {
      this.platforms = this.physics.add.staticGroup();
    }

    platforms.forEach(({ phaser, size, texture, flipX, flipY, physics }) => {
      if (!size || !size.width || !size.height) {
        return;
      }
      // Use minimum of 1 instead of 4 to preserve small platforms
      const width = Math.max(1, size.width);
      const height = Math.max(1, size.height);
      const textureKey = texture && texture.textureKey && this.textures.exists(texture.textureKey)
        ? texture.textureKey
        : 'platform';
      const frame = texture && texture.frame ? texture.frame : undefined;
      const sprite = this.platforms.create(phaser.x, phaser.y, textureKey, frame);
      sprite.setOrigin(0.5, 0.5);
      sprite.setDisplaySize(width, height);
      if (flipX) {
        sprite.setFlipX(true);
      }
      if (flipY) {
        sprite.setFlipY(true);
      }
      const body = sprite.body;
      if (body && body.setSize) {
        // With origin at 0.5, 0.5, the body centers automatically
        // No offset needed unless we want to adjust the collision box
        body.setSize(width, height);
      }
      if (physics && physics.type === 'oneway') {
        if (body && body.checkCollision) {
          body.checkCollision.down = false;
          body.checkCollision.left = false;
          body.checkCollision.right = false;
          body.checkCollision.up = true;
        }
      }
      sprite.refreshBody();
      const meta = {
        type: physics?.type || 'solid',
        asset: physics?.asset || null,
        width,
        height
      };
      sprite.setData('unityPlatform', meta);
      this.unityPlatformRects.push({
        centerX: phaser.x,
        centerY: phaser.y,
        width,
        height,
        type: meta.type
      });
    });
  }

  buildUnityColliders(colliders) {
    this.unityColliderShapes.forEach((shape) => {
      if (shape.body) {
        shape.body.destroy();
      }
      shape.destroy();
    });
    this.unityColliderShapes = [];
    this.adventureBlockerColliders.forEach((collider) => collider?.destroy?.());
    this.adventureBlockerColliders = [];
    this.adventureTriggerOverlaps.forEach((overlap) => overlap?.destroy?.());
    this.adventureTriggerOverlaps = [];

    if (!Array.isArray(colliders) || !colliders.length) {
      return;
    }

    const enablePhysics = this.currentMovementMode === 'adventure';
    colliders.forEach((data) => {
      const width = Math.max(4, data.size?.width || 0);
      const height = Math.max(4, data.size?.height || 0);
      const color = data.isTrigger ? 0x31c854 : 0x1971ff;
      const alpha = PLATFORM_DEBUG ? 0.2 : 0.0;
      const rect = this.add.rectangle(data.phaser.x, data.phaser.y, width, height, color, alpha);
      rect.setData('unityCollider', data);
      this.physics.add.existing(rect, true);
      if (rect.body?.setSize) {
        rect.body.setSize(width, height);
        rect.body.setOffset(-width / 2, -height / 2);
      }
      if (!PLATFORM_DEBUG) {
        rect.setVisible(false);
      }

      if (enablePhysics) {
        if (data.isTrigger) {
          if (rect.body) {
            rect.body.checkCollision.none = true;
          }
          const overlap = this.physics.add.overlap(
            this.player.sprite,
            rect,
            (_, triggerShape) => this.handleAdventureTrigger(triggerShape),
            undefined,
            this
          );
          this.adventureTriggerOverlaps.push(overlap);
        } else {
          const collider = this.physics.add.collider(this.player.sprite, rect);
          this.adventureBlockerColliders.push(collider);
        }
      }

      this.unityColliderShapes.push(rect);
    });
  }

  handleAdventureTrigger(triggerShape) {
    const data = triggerShape?.getData?.('unityCollider');
    if (!data) {
      return;
    }
    const name = data.gameObject || 'trigger';
    // Placeholder behaviour: report trigger activation. Replace with adventure interactions.
    console.log(`[Adventure] Trigger activated: ${name}`);
  }

  shouldCollideWithUnityPlatform(playerSprite, platformSprite) {
    const meta = platformSprite?.getData?.('unityPlatform');
    if (!meta || meta.type !== 'oneway') {
      return true;
    }
    const playerBody = playerSprite.body;
    const platformBody = platformSprite.body;
    if (!playerBody || !platformBody) {
      return true;
    }

    // Dynamic tolerance based on velocity and zoom to prevent fall-through issues
    const zoom = this.cameras.main.zoom || 1;
    const baseTolerance = 2.0;  // Base tolerance in world units
    const velocityFactor = Math.abs(playerBody.velocity.y) * 0.016;  // Scale with falling speed
    const tolerance = (baseTolerance + velocityFactor) / zoom;  // Account for zoom level

    const isFalling = playerBody.velocity.y >= 0;
    const platformTop = platformBody.top;
    const playerBottom = playerBody.bottom;
    const prevBottom = playerBody.prev ? playerBody.prev.y + playerBody.halfHeight : playerBottom;

    if (isFalling && playerBottom >= platformTop - tolerance && prevBottom <= platformTop + tolerance) {
      return true;
    }
    return false;
  }

  renderPlatformDebug() {
    if (!PLATFORM_DEBUG) return;
    if (this.platformDebugGraphics) {
      this.platformDebugGraphics.clear();
    } else {
      this.platformDebugGraphics = this.add.graphics();
    }
    this.unityPlatformRects.forEach(({ centerX, centerY, width, height, type }) => {
      const halfW = width / 2;
      const halfH = height / 2;
      const strokeColor = type === 'oneway' ? 0xffa000 : 0x00ffff;
      this.platformDebugGraphics.lineStyle(1, strokeColor, 0.8);
      this.platformDebugGraphics.strokeRect(centerX - halfW, centerY - halfH, width, height);
      this.platformDebugGraphics.fillStyle(0xff0070, 0.5);
      this.platformDebugGraphics.fillCircle(centerX, centerY, 4);
    });
    this.unityColliderShapes.forEach((shape) => {
      const data = shape.getData('unityCollider') || {};
      const width = shape.width || shape.displayWidth || 0;
      const height = shape.height || shape.displayHeight || 0;
      const halfW = width / 2;
      const halfH = height / 2;
      const strokeColor = data.isTrigger ? 0x31c854 : 0x1971ff;
      this.platformDebugGraphics.lineStyle(1, strokeColor, 0.9);
      this.platformDebugGraphics.strokeRect(shape.x - halfW, shape.y - halfH, width, height);
      this.platformDebugGraphics.fillStyle(strokeColor, 0.25);
      this.platformDebugGraphics.fillCircle(shape.x, shape.y, 3);
    });
  }
}
