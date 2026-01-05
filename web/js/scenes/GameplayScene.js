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
    this.platformDebugGraphics = false;
    this.unityPlatformRects = [];
    this.currentMovementMode = 'platformer';
    this.defaultGravityY = 0;
    this.unityColliderShapes = [];
    this.adventureBlockerColliders = [];
    this.adventureTriggerOverlaps = [];

    // Phase 4: Combat & Enemies
    this.combatSystem = null;
    this.enemies = [];
    this.scorpion = null;
    this.rats = [];
    this.snakes = [];

    // Collectibles
    this.crystals = [];
    this.score = 0;

    // NPCs
    this.npcs = [];

    // Doodads (decorative objects)
    this.doodads = [];

    // UI
    this.heartsDisplay = null;

    // Debug Tools
    this.debugOverlay = null;
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

    // Load enemy assets
    this.loadScorpionAssets();
    this.loadRatAssets();
    this.loadSnakeAssets();

    // Load collectible assets
    this.loadCrystalAssets();

    // Load UI assets
    this.loadUIAssets();

    // Load NPC assets
    this.loadNPCAssets();

    // Load doodad assets
    this.loadDoodadAssets();
  }

  loadScorpionAssets() {
    const basePath = 'assets/sprites/characters/enemies/scorpion/';

    // Load sprite sheets
    this.load.spritesheet('scorpion-idle', basePath + 'Scorpion_Idle 1.0 - Sheet.png', {
      frameWidth: 160,
      frameHeight: 160
    });
    this.load.spritesheet('scorpion-forward-hop', basePath + 'Scorpion_Forward_Hop 1.0 - Sheet.png', {
      frameWidth: 160,
      frameHeight: 160
    });
    this.load.spritesheet('scorpion-backward-hop', basePath + 'Scorpion_Backward_Hop 1.0 - Sheet.png', {
      frameWidth: 160,
      frameHeight: 160
    });
    this.load.spritesheet('scorpion-left-jab', basePath + 'Scorpion_Left_Jab 1.0 - Sheet.png', {
      frameWidth: 160,
      frameHeight: 160
    });
    this.load.spritesheet('scorpion-right-jab', basePath + 'Scorpion_Right_Jab 1.0 - Sheet.png', {
      frameWidth: 160,
      frameHeight: 160
    });
    this.load.spritesheet('scorpion-left-snap', basePath + 'Scorpion_Left_Snap 1.0 - Sheet.png', {
      frameWidth: 160,
      frameHeight: 160
    });
    this.load.spritesheet('scorpion-right-snap', basePath + 'Scorpion_Right_Snap 1.0 - Sheet.png', {
      frameWidth: 160,
      frameHeight: 160
    });
    this.load.spritesheet('scorpion-stomp', basePath + 'Scorpion_Stomp 1.0 - Sheet.png', {
      frameWidth: 160,
      frameHeight: 160
    });
    this.load.spritesheet('scorpion-tail-strike', basePath + 'Scorpion_Tail_Strike 1.0 - Sheet.png', {
      frameWidth: 160,
      frameHeight: 160
    });

    // Load audio
    this.load.audio('scorpion_claw', 'assets/sounds/enemies/scorpion_claw.wav');
    this.load.audio('scorpion_sting', 'assets/sounds/enemies/scorpion_sting.wav');

    // Load config
    this.load.json('scorpion-config', 'js/content/enemies/scorpion.json');
  }

  loadRatAssets() {
    const basePath = 'assets/sprites/characters/enemies/rat/';

    // Load master sprite sheet
    this.load.spritesheet('rat-master', basePath + 'Rat Master Sprite Sheet.png', {
      frameWidth: 16,
      frameHeight: 16
    });

    // Load config
    this.load.json('rat-config', 'js/content/enemies/rat.json');
  }

  loadSnakeAssets() {
    const basePath = 'assets/sprites/characters/enemies/snake/';

    // Load master sprite sheet
    this.load.spritesheet('snake-master', basePath + 'Snake Master Sprite Sheet.png', {
      frameWidth: 16,
      frameHeight: 16
    });

    // Load config
    this.load.json('snake-config', 'js/content/enemies/snake.json');
  }

  loadCrystalAssets() {
    const basePath = 'assets/sprites/doodads/crystals/';

    // Load crystal spritesheet (900x75 = 12 frames @ 75x75 each)
    this.load.spritesheet('crystal-pickup', basePath + 'crystal_pickup-sheet.png', {
      frameWidth: 75,
      frameHeight: 75
    });

    // Load static crystal image for idle state
    this.load.image('crystal-idle', basePath + 'Crystal 1.png');
  }

  loadUIAssets() {
    const basePath = 'assets/sprites/ui/hearts/';

    // Load heart sprites
    this.load.image('heart-left', basePath + 'heart-left.png');
    this.load.image('heart-right', basePath + 'heart-right.png');
  }

  loadNPCAssets() {
    const basePath = 'assets/sprites/characters/npcs/';

    // Load Joe sprite (192x128)
    this.load.image('joe-idle', basePath + 'joe.png');
  }

  loadDoodadAssets() {
    const basePath = 'assets/sprites/doodads/';

    // Load truck sprite
    this.load.image('truck', basePath + 'truck/truck.png');
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

    // Initialize combat system
    this.combatSystem = new InteractionSystem(this);

    // Initialize debug overlay
    this.debugOverlay = new DebugOverlay(this);

    // Initialize hearts display (top-left corner, fixed to camera)
    this.heartsDisplay = new HeartsDisplay(this, 20, 30, 10);

    // Create enemy animations
    this.createScorpionAnimations();
    this.createRatAnimations();
    this.createSnakeAnimations();
    this.createCrystalAnimations();

    this.inputMapper = new InputMapper(this);
    this.player = new RayPlayer(this, this.spawnPoint.x, this.spawnPoint.y);
    this.cameras.main.startFollow(this.player.sprite, true, 0.15, 0.15);
    this.cameras.main.setFollowOffset(0, 75); // Shift camera up by 200 pixels
    this.cameras.main.setZoom(3);
    this.cameras.main.roundPixels = true;
    this.player.sprite.play('ray-idle');

    // Register player hurtbox
    this.combatSystem.registerHurtbox('player', this.player.sprite, (payload) => {
      this.player.applyDamage(payload.damage, payload);
    }, 'player');

    this.loadScene(this.currentSceneKey);
    this.registerMessageHandlers();
    this.registerSceneHotkeys();
  }

  registerSceneHotkeys() {
    // Map Command/Ctrl + number keys to scenes
    const sceneMap = {
      ONE: 'sandbox',
      TWO: 'desert_1',
      THREE: 'desert_cave',
      FOUR: 'diner',
      FIVE: 'menu'
    };

    // Listen for keyboard events
    this.input.keyboard.on('keydown', (event) => {
      // Check for Command (Meta) on Mac or Ctrl on Windows/Linux
      if (event.metaKey || event.ctrlKey) {
        const keyMap = {
          '1': 'ONE',
          '2': 'TWO',
          '3': 'THREE',
          '4': 'FOUR',
          '5': 'FIVE'
        };

        const sceneKey = sceneMap[keyMap[event.key]];
        if (sceneKey) {
          console.log(`[Hotkey] Switching to scene: ${sceneKey}`);
          this.loadScene(sceneKey);
          event.preventDefault();
        }
      }
    });
  }

  createScorpionAnimations() {
    // Idle (5 frames)
    this.anims.create({
      key: 'scorpion-idle',
      frames: this.anims.generateFrameNumbers('scorpion-idle', { start: 0, end: 4 }),
      frameRate: 8,
      repeat: -1
    });

    // Forward hop (3 frames)
    this.anims.create({
      key: 'scorpion-forward-hop',
      frames: this.anims.generateFrameNumbers('scorpion-forward-hop', { start: 0, end: 2 }),
      frameRate: 12,
      repeat: 0
    });

    // Backward hop (3 frames)
    this.anims.create({
      key: 'scorpion-backward-hop',
      frames: this.anims.generateFrameNumbers('scorpion-backward-hop', { start: 0, end: 2 }),
      frameRate: 12,
      repeat: 0
    });

    // Left jab (2 frames)
    this.anims.create({
      key: 'scorpion-left-jab',
      frames: this.anims.generateFrameNumbers('scorpion-left-jab', { start: 0, end: 1 }),
      frameRate: 10,
      repeat: 0
    });

    // Right jab (2 frames)
    this.anims.create({
      key: 'scorpion-right-jab',
      frames: this.anims.generateFrameNumbers('scorpion-right-jab', { start: 0, end: 1 }),
      frameRate: 10,
      repeat: 0
    });

    // Left snap (3 frames)
    this.anims.create({
      key: 'scorpion-left-snap',
      frames: this.anims.generateFrameNumbers('scorpion-left-snap', { start: 0, end: 2 }),
      frameRate: 12,
      repeat: 0
    });

    // Right snap (3 frames)
    this.anims.create({
      key: 'scorpion-right-snap',
      frames: this.anims.generateFrameNumbers('scorpion-right-snap', { start: 0, end: 2 }),
      frameRate: 12,
      repeat: 0
    });

    // Stomp (8 frames)
    this.anims.create({
      key: 'scorpion-stomp',
      frames: this.anims.generateFrameNumbers('scorpion-stomp', { start: 0, end: 7 }),
      frameRate: 16,
      repeat: 0
    });

    // Tail strike (2 frames)
    this.anims.create({
      key: 'scorpion-tail-strike',
      frames: this.anims.generateFrameNumbers('scorpion-tail-strike', { start: 0, end: 1 }),
      frameRate: 8,
      repeat: 0
    });

    // Charge (uses idle animation)
    this.anims.create({
      key: 'scorpion-charge',
      frames: this.anims.generateFrameNumbers('scorpion-idle', { start: 0, end: 4 }),
      frameRate: 12,
      repeat: -1
    });
  }

  createRatAnimations() {
    // Move left (frames 0-3)
    this.anims.create({
      key: 'rat-move-left',
      frames: this.anims.generateFrameNumbers('rat-master', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1
    });

    // Move right (frames 4-7)
    this.anims.create({
      key: 'rat-move-right',
      frames: this.anims.generateFrameNumbers('rat-master', { start: 4, end: 7 }),
      frameRate: 8,
      repeat: -1
    });

    // Stun left (frame 8)
    this.anims.create({
      key: 'rat-stun-left',
      frames: [{ key: 'rat-master', frame: 8 }],
      frameRate: 8,
      repeat: 0
    });

    // Stun right (frame 9)
    this.anims.create({
      key: 'rat-stun-right',
      frames: [{ key: 'rat-master', frame: 9 }],
      frameRate: 8,
      repeat: 0
    });
  }

  createSnakeAnimations() {
    // Move left (frames 0-3)
    this.anims.create({
      key: 'snake-move-left',
      frames: this.anims.generateFrameNumbers('snake-master', { start: 0, end: 3 }),
      frameRate: 6,
      repeat: -1
    });

    // Move right (frames 4-7)
    this.anims.create({
      key: 'snake-move-right',
      frames: this.anims.generateFrameNumbers('snake-master', { start: 4, end: 7 }),
      frameRate: 6,
      repeat: -1
    });

    // Attack left (frames 8-10)
    this.anims.create({
      key: 'snake-attack-left',
      frames: this.anims.generateFrameNumbers('snake-master', { start: 8, end: 10 }),
      frameRate: 10,
      repeat: 0
    });

    // Attack right (frames 11-13)
    this.anims.create({
      key: 'snake-attack-right',
      frames: this.anims.generateFrameNumbers('snake-master', { start: 11, end: 13 }),
      frameRate: 10,
      repeat: 0
    });

    // Stun (frame 14)
    this.anims.create({
      key: 'snake-stun',
      frames: [{ key: 'snake-master', frame: 14 }],
      frameRate: 8,
      repeat: 0
    });

    // Die (frames 15-17)
    this.anims.create({
      key: 'snake-die',
      frames: this.anims.generateFrameNumbers('snake-master', { start: 15, end: 17 }),
      frameRate: 6,
      repeat: 0
    });
  }

  createCrystalAnimations() {
    // Idle animation (just the static crystal image)
    // Already loaded as 'crystal-idle' image

    // Pickup animation (all 12 frames)
    this.anims.create({
      key: 'crystal-pickup-anim',
      frames: this.anims.generateFrameNumbers('crystal-pickup', { start: 0, end: 11 }),
      frameRate: 24,
      repeat: 0
    });

    // Idle animation using first frame of pickup sheet
    this.anims.create({
      key: 'crystal-idle-anim',
      frames: this.anims.generateFrameNumbers('crystal-pickup', { start: 0, end: 3 }),
      frameRate: 6,
      repeat: -1
    });
  }

  update(time, delta) {
    if (!this.inputMapper || !this.player) {
      return;
    }

    const intent = this.inputMapper.update();
    this.player.update(time, delta, intent);

    // Update combat system
    if (this.combatSystem) {
      this.combatSystem.update(time);
    }

    // Update all enemies
    for (const enemy of this.enemies) {
      if (enemy && enemy.update) {
        enemy.update(time, delta);
      }
    }

    // Update all NPCs
    for (const npc of this.npcs) {
      if (npc && npc.update) {
        npc.update(time, delta);
      }
    }

    // Update debug overlay
    if (this.debugOverlay) {
      this.debugOverlay.update(time, delta);
    }

    const pos = this.player.getPosition();
    const vel = this.player.getVelocity();

    let debugInfo = `Scene: ${this.currentSceneKey}\n` +
      `Intent: ${intent}\n` +
      `Position: (${Math.round(pos.x)}, ${Math.round(pos.y)})\n` +
      `Velocity: (${Math.round(vel.x)}, ${Math.round(vel.y)})\n` +
      `Grounded: ${this.player.isGrounded}\n` +
      `HP: ${this.player.hp}/10\n\n`;

    // Add Scorpion debug info if active
    if (this.scorpion && this.scorpion.isAlive) {
      debugInfo += `Scorpion HP: ${this.scorpion.hp}/${this.scorpion.maxHp}\n`;
      debugInfo += `Scorpion State: ${this.scorpion.getCurrentState() || 'none'}\n\n`;
    }

    debugInfo += `Score: ${this.score}\n\n`;
    debugInfo += `Controls:\nArrow/WASD: Move\nSpace: Jump\nX: Attack\nZ/Shift: Dig\nD: Debug Overlay\n\nSpawn:\nS:Scorpion R:Rat N:Snake\nC:Crystal J:Joe T:Truck\n\nScenes (Cmd+#):\n1:Sandbox 2:Desert 3:Cave 4:Diner 5:Menu`;

    this.debugText.setText(debugInfo);

    this.renderVelocityBar(pos, vel);

    // Debug keys: Spawn enemies
    if (this.input.keyboard.addKey('S').isDown && !this.scorpionSpawned) {
      this.spawnScorpion();
      this.scorpionSpawned = true;
    }

    const ratKey = this.input.keyboard.addKey('R');
    if (Phaser.Input.Keyboard.JustDown(ratKey)) {
      this.spawnRat();
    }

    const snakeKey = this.input.keyboard.addKey('N');
    if (Phaser.Input.Keyboard.JustDown(snakeKey)) {
      this.spawnSnake();
    }

    const crystalKey = this.input.keyboard.addKey('C');
    if (Phaser.Input.Keyboard.JustDown(crystalKey)) {
      this.spawnCrystal();
    }

    const joeKey = this.input.keyboard.addKey('J');
    if (Phaser.Input.Keyboard.JustDown(joeKey)) {
      this.spawnJoe();
    }

    const truckKey = this.input.keyboard.addKey('T');
    if (Phaser.Input.Keyboard.JustDown(truckKey)) {
      this.spawnTruck();
    }
  }

  spawnScorpion() {
    if (this.scorpion) {
      console.log('[GameplayScene] Scorpion already spawned');
      return;
    }

    // Load config
    const config = this.cache.json.get('scorpion-config');
    if (!config) {
      console.error('[GameplayScene] Scorpion config not loaded');
      return;
    }

    // Spawn to the right of player
    const spawnX = this.player.sprite.x + 200;
    const spawnY = this.player.sprite.y;

    console.log(`[GameplayScene] Spawning Scorpion at (${spawnX}, ${spawnY})`);

    this.scorpion = new Scorpion(this, spawnX, spawnY, config);
    this.scorpion.player = this.player;
    this.scorpion.audioManager = this.sound;

    // Register with combat system
    this.combatSystem.registerHurtbox('scorpion', this.scorpion.sprite, (payload) => {
      this.scorpion.applyDamage(payload.damage, payload);
    }, 'enemy');

    // Add physics colliders for ground and platforms
    if (this.ground) {
      this.physics.add.collider(this.scorpion.sprite, this.ground);
    }
    if (this.platforms) {
      this.physics.add.collider(
        this.scorpion.sprite,
        this.platforms,
        null,
        this.shouldCollideWithUnityPlatform,
        this
      );
    }

    // Add to enemies list
    this.enemies.push(this.scorpion);

    // Activate boss AI
    this.scorpion.activate();

    console.log('[GameplayScene] Scorpion spawned and activated');
  }

  spawnRat() {
    const config = this.cache.json.get('rat-config');
    if (!config) {
      console.error('[GameplayScene] Rat config not loaded');
      return;
    }

    // Spawn to the left of player
    const spawnX = this.player.sprite.x - 150;
    const spawnY = this.player.sprite.y;

    console.log(`[GameplayScene] Spawning Rat at (${spawnX}, ${spawnY})`);

    const rat = new Rat(this, spawnX, spawnY, config);
    rat.player = this.player;
    rat.audioManager = this.sound;

    // Register with combat system
    this.combatSystem.registerHurtbox(`rat-${this.rats.length}`, rat.sprite, (payload) => {
      rat.applyDamage(payload.damage, payload);
    }, 'enemy');

    // Add physics colliders
    if (this.ground) {
      this.physics.add.collider(rat.sprite, this.ground);
    }
    if (this.platforms) {
      this.physics.add.collider(
        rat.sprite,
        this.platforms,
        null,
        this.shouldCollideWithUnityPlatform,
        this
      );
    }

    // Add to enemies lists
    this.rats.push(rat);
    this.enemies.push(rat);

    // Activate AI
    rat.activate();

    console.log('[GameplayScene] Rat spawned and activated');
  }

  spawnSnake() {
    const config = this.cache.json.get('snake-config');
    if (!config) {
      console.error('[GameplayScene] Snake config not loaded');
      return;
    }

    // Spawn ahead of player
    const spawnX = this.player.sprite.x + 250;
    const spawnY = this.player.sprite.y;

    console.log(`[GameplayScene] Spawning Snake at (${spawnX}, ${spawnY})`);

    const snake = new Snake(this, spawnX, spawnY, config);
    snake.player = this.player;
    snake.audioManager = this.sound;

    // Register with combat system
    this.combatSystem.registerHurtbox(`snake-${this.snakes.length}`, snake.sprite, (payload) => {
      snake.applyDamage(payload.damage, payload);
    }, 'enemy');

    // Add physics colliders
    if (this.ground) {
      this.physics.add.collider(snake.sprite, this.ground);
    }
    if (this.platforms) {
      this.physics.add.collider(
        snake.sprite,
        this.platforms,
        null,
        this.shouldCollideWithUnityPlatform,
        this
      );
    }

    // Add to enemies lists
    this.snakes.push(snake);
    this.enemies.push(snake);

    // Activate AI
    snake.activate();

    console.log('[GameplayScene] Snake spawned and activated');
  }

  spawnCrystal() {
    // Spawn near player
    const spawnX = this.player.sprite.x + 100 + (Math.random() * 100 - 50);
    const spawnY = this.player.sprite.y - 50;

    console.log(`[GameplayScene] Spawning Crystal at (${spawnX}, ${spawnY})`);

    const crystal = new Crystal(this, spawnX, spawnY, 100);

    // Set up collision with player
    this.physics.add.overlap(
      this.player.sprite,
      crystal.sprite,
      () => {
        if (crystal.sprite && crystal.sprite.crystalInstance) {
          crystal.sprite.crystalInstance.collect(this.player);
        }
      },
      null,
      this
    );

    this.crystals.push(crystal);
    console.log('[GameplayScene] Crystal spawned');
  }

  addScore(points) {
    this.score += points;
    console.log(`[GameplayScene] Score: ${this.score} (+${points})`);
  }

  spawnJoe() {
    // Spawn near player
    const spawnX = this.player.sprite.x + 150;
    const spawnY = this.player.sprite.y;

    console.log(`[GameplayScene] Spawning Joe at (${spawnX}, ${spawnY})`);

    const joe = new Joe(this, spawnX, spawnY);

    // Add physics colliders
    if (this.ground) {
      this.physics.add.collider(joe.sprite, this.ground);
    }
    if (this.platforms) {
      this.physics.add.collider(joe.sprite, this.platforms);
    }

    // Set up interaction overlap with player
    this.physics.add.overlap(
      this.player.sprite,
      joe.sprite,
      () => {
        if (joe.sprite && joe.sprite.joeInstance) {
          // Could trigger dialog here
          console.log('[GameplayScene] Player near Joe');
        }
      },
      null,
      this
    );

    this.npcs.push(joe);
    console.log('[GameplayScene] Joe spawned');
  }

  spawnTruck() {
    // Spawn to the right of player
    const spawnX = this.player.sprite.x + 200;
    const spawnY = this.player.sprite.y + 50; // Place on ground

    console.log(`[GameplayScene] Spawning Truck at (${spawnX}, ${spawnY})`);

    const truck = new Doodad(this, spawnX, spawnY, 'truck', {
      scale: 3,
      depth: -5,
      hasPhysics: true,
      immovable: true,
      collides: false
    });

    // Add collision with player and ground
    if (this.ground) {
      this.physics.add.collider(truck.sprite, this.ground);
    }
    if (this.platforms) {
      this.physics.add.collider(truck.sprite, this.platforms);
    }

    // Player can collide with truck
    this.physics.add.collider(this.player.sprite, truck.sprite);

    this.doodads.push(truck);
    console.log('[GameplayScene] Truck spawned');
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
    // Special case: Switch to MenuScene (separate Phaser scene)
    if (sceneKey === 'menu') {
      console.log('[GameplayScene] Switching to MenuScene');
      this.scene.start('MenuScene');
      return;
    }

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
      this.cameras.main.setZoom(3);
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
        // Center the body on the sprite (origin is 0.5, 0.5)
        body.setSize(width, height, true); // true = center body on sprite position
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
