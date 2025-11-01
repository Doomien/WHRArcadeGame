
// You can write more code here

/* START OF COMPILED CODE */

class DevTestScene extends Phaser.Scene {

	constructor() {
		super("DevTestScene");

		/* START-USER-CTR-CODE */
		// Write your code here.
		/* END-USER-CTR-CODE */
	}

	/** @returns {void} */
	editorCreate() {

		// bg_sandbox
		this.add.image(1638, 895, "bg-sandbox");

		// bg_menu
		const bg_menu = this.add.image(483, 357, "bg-menu");
		bg_menu.scaleX = 3;
		bg_menu.scaleY = 3;

		// unity_platform_floating_1x5
		const unity_platform_floating_1x5 = this.add.image(4, 536, "unity-platform-floating-1x5");
		unity_platform_floating_1x5.setInteractive(new Phaser.Geom.Rectangle(0, 0, 80, 16), Phaser.Geom.Rectangle.Contains);

		// unity_platform_floating_1x
		this.add.image(108, 509, "unity-platform-floating-1x5");

		// unity_platform_floating_1x_1
		const unity_platform_floating_1x_1 = this.add.image(203, 499, "unity-platform-floating-1x5");
		unity_platform_floating_1x_1.setInteractive(new Phaser.Geom.Rectangle(0, 0, 80, 16), Phaser.Geom.Rectangle.Contains);

		// unity_platform_floating_1x_2
		this.add.image(186.6634228047627, 498.08785139331206, "unity-platform-floating-1x5");

		// unity_platform_floating_1x8
		const unity_platform_floating_1x8 = this.add.image(320, 500, "unity-platform-floating-1x8");
		unity_platform_floating_1x8.setInteractive(this.input.makePixelPerfect());

		// unity_platform_mesa_05_b
		this.add.image(519, 512, "unity-platform-mesa-05-b");

		// arcadesprite_1
		const arcadesprite_1 = this.physics.add.sprite(186, 332, "_MISSING");
		arcadesprite_1.body.setSize(32, 32, false);
		arcadesprite_1.play("");

		// b2body_1
		b2CreateBody(this.worldId, { 
			...b2DefaultBodyDef(), 
			position: pxmVec2(220, -481)
		});

		// rectangle_1
		const rectangle_1 = this.add.rectangle(321, 584, 640, 32);
		rectangle_1.setInteractive(new Phaser.Geom.Rectangle(0, 0, 640, 32), Phaser.Geom.Rectangle.Contains);
		rectangle_1.isFilled = true;

		// collider
		this.physics.add.collider();

		this.events.emit("scene-awake");
	}

	/* START-USER-CODE */

	// Write your code here

	create() {

		this.editorCreate();
	}

	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
