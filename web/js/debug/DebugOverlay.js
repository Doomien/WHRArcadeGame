/**
 * DebugOverlay - Comprehensive debug visualization system
 *
 * Features:
 * - Hitbox/hurtbox visualization
 * - State machine state display
 * - Timer countdowns
 * - Attack range circles
 * - Physics body visualization
 *
 * Toggle with 'D' key
 */

class DebugOverlay {
  constructor(scene) {
    this.scene = scene;
    this.enabled = false;
    this.graphics = null;
    this.textObjects = [];
    this.rangeCircles = new Map();

    // Layer for debug visuals
    this.debugLayer = null;

    // Register toggle key
    this.registerHotkey();

    console.log('[DebugOverlay] Initialized. Press D to toggle debug overlays.');
  }

  registerHotkey() {
    this.scene.input.keyboard.on('keydown-D', () => {
      this.toggle();
    });
  }

  toggle() {
    this.enabled = !this.enabled;
    console.log(`[DebugOverlay] Debug overlays ${this.enabled ? 'ENABLED' : 'DISABLED'}`);

    if (!this.enabled) {
      this.clear();
    }
  }

  update(time, delta) {
    if (!this.enabled) {
      return;
    }

    this.clear();
    this.ensureGraphics();

    // Draw combat system visualizations
    if (this.scene.combatSystem) {
      this.drawHitboxes();
      this.drawHurtboxes();
    }

    // Draw enemy state machines
    if (this.scene.enemies && this.scene.enemies.length) {
      this.drawEnemyStates();
      this.drawAttackRanges();
    }

    // Draw timer countdowns
    this.drawTimers();
  }

  ensureGraphics() {
    if (!this.graphics) {
      this.graphics = this.scene.add.graphics();
      this.graphics.setDepth(10000); // Above everything
    }
  }

  clear() {
    if (this.graphics) {
      this.graphics.clear();
    }

    // Clean up text objects
    this.textObjects.forEach(text => text.destroy());
    this.textObjects = [];
  }

  drawHitboxes() {
    const combatSystem = this.scene.combatSystem;

    // Draw temporary hitboxes (active attacks)
    combatSystem.tempHitboxes.forEach(hitbox => {
      if (!hitbox.rect || !hitbox.rect.body) return;

      const body = hitbox.rect.body;
      const x = body.x;
      const y = body.y;
      const width = body.width;
      const height = body.height;

      // Red outline for hitboxes
      this.graphics.lineStyle(2, 0xff0000, 1.0);
      this.graphics.strokeRect(x, y, width, height);

      // Semi-transparent red fill
      this.graphics.fillStyle(0xff0000, 0.2);
      this.graphics.fillRect(x, y, width, height);

      // Label
      const payload = hitbox.payload;
      const label = `Hitbox\nDMG: ${payload.damage}\nTeam: ${payload.sourceTeam}`;
      const text = this.scene.add.text(x + width / 2, y - 20, label, {
        fontSize: '10px',
        fill: '#ff0000',
        backgroundColor: '#000000',
        padding: { x: 4, y: 2 },
        align: 'center'
      });
      text.setOrigin(0.5, 1);
      text.setDepth(10001);
      this.textObjects.push(text);
    });
  }

  drawHurtboxes() {
    const combatSystem = this.scene.combatSystem;

    // Draw registered hurtboxes
    combatSystem.hurtboxes.forEach((data, id) => {
      const sprite = data.sprite;
      if (!sprite || !sprite.body) return;

      const body = sprite.body;
      const x = body.x;
      const y = body.y;
      const width = body.width;
      const height = body.height;

      // Blue outline for hurtboxes
      this.graphics.lineStyle(2, 0x00ff00, 1.0);
      this.graphics.strokeRect(x, y, width, height);

      // Semi-transparent blue fill
      this.graphics.fillStyle(0x00ff00, 0.1);
      this.graphics.fillRect(x, y, width, height);

      // Label
      const label = `Hurtbox: ${id}\nTeam: ${data.team}`;
      const text = this.scene.add.text(x + width / 2, y + height + 5, label, {
        fontSize: '10px',
        fill: '#00ff00',
        backgroundColor: '#000000',
        padding: { x: 4, y: 2 },
        align: 'center'
      });
      text.setOrigin(0.5, 0);
      text.setDepth(10001);
      this.textObjects.push(text);
    });
  }

  drawEnemyStates() {
    this.scene.enemies.forEach((enemy, index) => {
      if (!enemy || !enemy.sprite) return;

      const sprite = enemy.sprite;
      const x = sprite.x;
      const y = sprite.y - 60;

      // Get state machine info
      const stateName = enemy.getCurrentState ? enemy.getCurrentState() : 'unknown';
      const hp = enemy.hp !== undefined ? enemy.hp : '?';
      const maxHp = enemy.maxHp !== undefined ? enemy.maxHp : '?';

      // Build state display
      let stateInfo = `${enemy.constructor.name}\nState: ${stateName}\nHP: ${hp}/${maxHp}`;

      // Add freestyle flag if available
      if (enemy.freeStyle !== undefined) {
        stateInfo += `\nMode: ${enemy.freeStyle ? 'Freestyle' : 'Scripted'}`;
      }

      const text = this.scene.add.text(x, y, stateInfo, {
        fontSize: '11px',
        fill: '#ffff00',
        backgroundColor: '#000000',
        padding: { x: 6, y: 4 },
        align: 'center'
      });
      text.setOrigin(0.5, 1);
      text.setDepth(10001);
      this.textObjects.push(text);
    });
  }

  drawAttackRanges() {
    this.scene.enemies.forEach(enemy => {
      if (!enemy || !enemy.sprite || !enemy.config) return;

      const sprite = enemy.sprite;
      const config = enemy.config;

      // Draw different range circles based on enemy type
      // Scorpion has multiple attack ranges
      if (enemy.constructor.name === 'Scorpion') {
        // Jab range
        const jabRange = 80;
        this.graphics.lineStyle(1, 0xff00ff, 0.3);
        this.graphics.strokeCircle(sprite.x, sprite.y, jabRange);

        // Tail strike range (vertical)
        const tailRange = 40;
        this.graphics.lineStyle(1, 0xff8800, 0.3);
        this.graphics.strokeRect(
          sprite.x - tailRange / 2,
          sprite.y - 100,
          tailRange,
          100
        );
      }
    });
  }

  drawTimers() {
    // Draw active timer countdowns for enemies
    this.scene.enemies.forEach((enemy, index) => {
      if (!enemy || !enemy.timers || !enemy.sprite) return;

      const timers = enemy.timers;
      const sprite = enemy.sprite;

      // Get scheduled timers count
      const scheduledCount = timers.scheduled ? timers.scheduled.size : 0;
      const repeatingCount = timers.repeating ? timers.repeating.size : 0;

      if (scheduledCount === 0 && repeatingCount === 0) return;

      const x = sprite.x + 80;
      const y = sprite.y - 40;

      let timerInfo = `Timers:\nScheduled: ${scheduledCount}\nRepeating: ${repeatingCount}`;

      const text = this.scene.add.text(x, y, timerInfo, {
        fontSize: '9px',
        fill: '#00ffff',
        backgroundColor: '#000000',
        padding: { x: 4, y: 2 },
        align: 'left'
      });
      text.setOrigin(0, 0.5);
      text.setDepth(10001);
      this.textObjects.push(text);
    });
  }

  destroy() {
    this.clear();

    if (this.graphics) {
      this.graphics.destroy();
      this.graphics = null;
    }

    // Remove event listeners
    this.scene.input.keyboard.off('keydown-D');
  }
}
