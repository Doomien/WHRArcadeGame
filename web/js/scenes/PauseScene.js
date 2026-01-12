class PauseScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PauseScene' });
        this.selectedOption = 0;
        this.options = ['RESUME', 'QUIT TO MENU'];
    }

    create() {
        console.log('[PauseScene] Created');

        // Semi-transparent black background
        const graphics = this.add.graphics();
        graphics.fillStyle(0x000000, 0.7);
        graphics.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);

        // "PAUSED" Text
        this.add.text(this.cameras.main.width / 2, this.cameras.main.height * 0.3, 'PAUSED', {
            fontFamily: '"Press Start 2P", "Courier New", monospace',
            fontSize: '48px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Menu Options
        this.menuTexts = [];
        const startY = this.cameras.main.height * 0.5;
        const padding = 60;

        this.options.forEach((opt, index) => {
            const text = this.add.text(this.cameras.main.width / 2, startY + index * padding, opt, {
                fontFamily: '"Press Start 2P", "Courier New", monospace',
                fontSize: '24px',
                color: '#ffffff'
            }).setOrigin(0.5);
            this.menuTexts.push(text);
        });

        this.updateSelection();

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Prevent immediate re-trigger from game loop
        this.input.keyboard.resetKeys();
    }

    update() {
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            this.selectedOption = (this.selectedOption - 1 + this.options.length) % this.options.length;
            this.updateSelection();
        } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
            this.selectedOption = (this.selectedOption + 1) % this.options.length;
            this.updateSelection();
        }

        if (Phaser.Input.Keyboard.JustDown(this.enterKey) || Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.selectOption();
        }
    }

    updateSelection() {
        this.menuTexts.forEach((text, index) => {
            if (index === this.selectedOption) {
                text.setColor('#ffff00');
                text.setText(`> ${this.options[index]} <`);
            } else {
                text.setColor('#ffffff');
                text.setText(this.options[index]);
            }
        });
    }

    selectOption() {
        switch (this.selectedOption) {
            case 0: // RESUME
                this.resumeGame();
                break;
            case 1: // QUIT
                this.quitGame();
                break;
        }
    }

    resumeGame() {
        this.scene.resume('GameplayScene');
        this.scene.stop();
    }

    quitGame() {
        this.scene.stop('GameplayScene');
        this.scene.stop('HUDScene');
        this.scene.start('MenuScene');
    }
}
