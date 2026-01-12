class HUDScene extends Phaser.Scene {
    constructor() {
        super({ key: 'HUDScene' });
        this.heartsDisplay = null;
        this.scoreText = null;
        this.bossHealthBar = null;
        this.gameScene = null; // Reference to GameplayScene
    }

    create() {
        console.log('[HUDScene] Created');

        // Get reference to GameplayScene
        this.gameScene = this.scene.get('GameplayScene');

        // 1. Health Display (Top Left)
        // We pass 'this' (HUDScene) so hearts are drawn on the HUD overlay
        this.heartsDisplay = new HeartsDisplay(this, 30, 30, 10);

        // 2. Score Display (Top Right)
        this.scoreText = this.add.text(this.cameras.main.width - 20, 20, 'SCORE: 0000000', {
            fontFamily: '"Press Start 2P", "Courier New", monospace',
            fontSize: '20px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(1, 0); // Align right

        // 3. Boss Health Bar (Bottom Center, initially hidden)
        this.bossHealthBar = new BossHealthBar(
            this,
            this.cameras.main.width / 2,
            this.cameras.main.height - 50,
            400, // Width
            20,  // Height
            100, // Max HP
            "BOSS"
        );

        // Listen for events from GameplayScene
        this.setupEventListeners();
    }

    setupEventListeners() {
        if (!this.gameScene) return;

        // Listen for player health updates
        this.gameScene.events.on('player-health-changed', (currentHP) => {
            if (this.heartsDisplay) {
                this.heartsDisplay.updateDisplay(currentHP);
                // Add flash effect if damage taken (logic to track prev hp could be added here)
                this.heartsDisplay.flashDamage();
            }
        });

        // Listen for score updates
        this.gameScene.events.on('score-changed', (newScore) => {
            this.updateScore(newScore);
        });

        // Listen for boss events
        this.gameScene.events.on('boss-spawned', (data) => {
            if (this.bossHealthBar) {
                this.bossHealthBar.setMaxHP(data.maxHP);
                this.bossHealthBar.setHP(data.currentHP);
                this.bossHealthBar.setName(data.name || "BOSS");
                this.bossHealthBar.show();
            }
        });

        this.gameScene.events.on('boss-damaged', (data) => {
            if (this.bossHealthBar) {
                this.bossHealthBar.setHP(data.currentHP);
            }
        });

        this.gameScene.events.on('boss-defeated', () => {
            if (this.bossHealthBar) {
                this.bossHealthBar.hide();
            }
        });

        // Cleanup on shutdown
        this.events.on('shutdown', () => {
            if (this.gameScene) {
                this.gameScene.events.off('player-health-changed');
                this.gameScene.events.off('score-changed');
                this.gameScene.events.off('boss-spawned');
                this.gameScene.events.off('boss-damaged');
                this.gameScene.events.off('boss-defeated');
            }
        });
    }

    updateScore(score) {
        const paddedScore = String(score).padStart(7, '0');
        this.scoreText.setText(`SCORE: ${paddedScore}`);
    }
}
