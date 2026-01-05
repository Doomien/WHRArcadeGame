/**
 * MenuScene.js
 * Main menu with title, background, and navigation options
 */

class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
    this.selectedOption = 0;
    this.menuOptions = ['Start Game', 'Options', 'Credits'];
  }

  preload() {
    // Base path for assets
    const basePath = 'assets/sprites/';

    // Title screen backgrounds
    this.load.image('menu-background', basePath + 'backgrounds/menu/title_screen_background_only.png');
    this.load.image('menu-full', basePath + 'backgrounds/menu/title_screen_menu_alt1.png');

    // Title logo
    this.load.image('title-logo', basePath + 'text/menu/title_only.png');

    // Menu option images
    this.load.image('menu-options-0', basePath + 'text/menu/menu_options_only_00.png');
    this.load.image('menu-options-1', basePath + 'text/menu/menu_options_only_01.png');
    this.load.image('menu-options-2', basePath + 'text/menu/menu_options_only_02.png');
    this.load.image('menu-options-3', basePath + 'text/menu/menu_options_only_03.png');

    // Crystal menu selectors
    this.load.image('crystal-selector-3', basePath + 'doodads/crystals/Crystal_Menu_Select_03.png');
    this.load.image('crystal-selector-4', basePath + 'doodads/crystals/Crystal_Menu_Select_04.png');
    this.load.image('crystal-selector-5', basePath + 'doodads/crystals/Crystal_Menu_Select_05.png');
  }

  create() {
    const { width, height } = this.cameras.main;

    // Add background
    const background = this.add.image(width / 2, height / 2, 'menu-background');
    background.setDisplaySize(width, height);

    // Add title logo at top
    const titleLogo = this.add.image(width / 2, height * 0.25, 'title-logo');
    titleLogo.setScale(2); // Scale up for visibility

    // Menu options positions
    const menuStartY = height * 0.55;
    const menuSpacing = 60;

    // Create menu option sprites
    this.menuSprites = [];
    for (let i = 0; i < 3; i++) {
      const sprite = this.add.image(
        width / 2,
        menuStartY + (i * menuSpacing),
        `menu-options-${i}`
      );
      sprite.setScale(2);
      sprite.setAlpha(0.6); // Unselected state
      this.menuSprites.push(sprite);
    }

    // Create crystal selector (initially at first option)
    this.crystalSelector = this.add.image(
      width / 2 - 150,
      menuStartY,
      'crystal-selector-3'
    );
    this.crystalSelector.setScale(2);

    // Highlight first option
    this.updateMenuSelection();

    // Keyboard input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Track key press timing to prevent rapid selection
    this.lastKeyPress = 0;
    this.keyPressDelay = 150; // ms
  }

  update(time, delta) {
    // Check for up/down navigation
    if (time - this.lastKeyPress > this.keyPressDelay) {
      if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
        this.selectedOption = (this.selectedOption + 1) % this.menuOptions.length;
        this.updateMenuSelection();
        this.lastKeyPress = time;
      } else if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
        this.selectedOption = (this.selectedOption - 1 + this.menuOptions.length) % this.menuOptions.length;
        this.updateMenuSelection();
        this.lastKeyPress = time;
      }
    }

    // Check for selection (Enter or Space)
    if (Phaser.Input.Keyboard.JustDown(this.enterKey) || Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.selectOption();
    }
  }

  updateMenuSelection() {
    // Update menu option alphas
    this.menuSprites.forEach((sprite, index) => {
      if (index === this.selectedOption) {
        sprite.setAlpha(1.0); // Fully visible when selected
      } else {
        sprite.setAlpha(0.6); // Dimmed when not selected
      }
    });

    // Move crystal selector to selected option
    const menuStartY = this.cameras.main.height * 0.55;
    const menuSpacing = 60;
    this.crystalSelector.y = menuStartY + (this.selectedOption * menuSpacing);
  }

  selectOption() {
    console.log(`Selected: ${this.menuOptions[this.selectedOption]}`);

    switch (this.selectedOption) {
      case 0: // Start Game
        // Transition to gameplay scene
        this.scene.start('GameplayScene');
        break;

      case 1: // Options
        console.log('Options menu not yet implemented');
        break;

      case 2: // Credits
        console.log('Credits scene not yet implemented');
        break;
    }
  }
}
