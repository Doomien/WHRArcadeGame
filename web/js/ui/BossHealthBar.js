class BossHealthBar {
    constructor(scene, x, y, width, height, maxHP, name = "BOSS") {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.maxHP = maxHP;
        this.currentHP = maxHP;
        this.name = name;

        this.visible = false;
        this.bar = new Phaser.GameObjects.Graphics(scene);
        this.text = scene.add.text(x, y - 20, name, {
            fontFamily: '"Press Start 2P", "Courier New", monospace',
            fontSize: '14px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5, 0.5); // Center text above bar
        this.text.visible = false;

        scene.add.existing(this.bar);
        this.bar.setScrollFactor(0);
        this.text.setScrollFactor(0);

        this.draw();
    }

    show() {
        this.visible = true;
        this.bar.visible = true;
        this.text.visible = true;
        this.draw();
    }

    hide() {
        this.visible = false;
        this.bar.visible = false;
        this.text.visible = false;
    }

    setHP(hp) {
        this.currentHP = Phaser.Math.Clamp(hp, 0, this.maxHP);
        this.draw();
    }

    setMaxHP(maxHP) {
        this.maxHP = maxHP;
        this.currentHP = Phaser.Math.Clamp(this.currentHP, 0, maxHP);
        this.draw();
    }

    setName(name) {
        this.name = name;
        this.text.setText(name);
    }

    draw() {
        if (!this.visible) return;

        this.bar.clear();

        // Background (Black border/container)
        this.bar.fillStyle(0x000000);
        this.bar.fillRect(this.x - this.width / 2 - 2, this.y - 2, this.width + 4, this.height + 4);

        // Background (Empty red/grey)
        this.bar.fillStyle(0x550000);
        this.bar.fillRect(this.x - this.width / 2, this.y, this.width, this.height);

        // Health (Red)
        const healthPercentage = this.currentHP / this.maxHP;
        if (healthPercentage > 0) {
            this.bar.fillStyle(0xff0000);
            this.bar.fillRect(
                this.x - this.width / 2,
                this.y,
                this.width * healthPercentage,
                this.height
            );
        }
    }

    destroy() {
        this.bar.destroy();
        this.text.destroy();
    }
}
