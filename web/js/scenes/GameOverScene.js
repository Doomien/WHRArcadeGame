class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    create() {
        console.log('[GameOverScene] Created');

        // Semi-transparent red/black background
        const graphics = this.add.graphics();
        graphics.fillStyle(0x330000, 0.8);
        graphics.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);

        // GAME OVER Text
        this.add.text(this.cameras.main.width / 2, this.cameras.main.height * 0.4, 'GAME OVER', {
            fontFamily: '"Press Start 2P", "Courier New", monospace',
            fontSize: '64px',
            color: '#ff0000',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5);

        // Restart instruction
        this.add.text(this.cameras.main.width / 2, this.cameras.main.height * 0.6, 'PRESS SPACE TO RESTART', {
            fontFamily: '"Press Start 2P", "Courier New", monospace',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Quit instruction
        this.add.text(this.cameras.main.width / 2, this.cameras.main.height * 0.7, 'PRESS ESC TO QUIT', {
            fontFamily: '"Press Start 2P", "Courier New", monospace',
            fontSize: '18px',
            color: '#aaaaaa'
        }).setOrigin(0.5);

        // Input
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    }

    update() {
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.restartGame();
        }
        if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
            this.quitGame();
        }
    }

    restartGame() {
        this.scene.stop('HUDScene');
        this.scene.start('GameplayScene');
    }

    quitGame() {
        this.scene.stop('HUDScene');
        this.scene.stop('GameplayScene'); // Just in case
        this.scene.start('MenuScene');
    }
}
