# WHR Arcade Game - Asset Guide

## Directory Structure

```
web/assets/
├── sprites/
│   ├── characters/
│   │   ├── ray/                    # Ray player character sprites
│   │   ├── enemies/                # Enemy character sprites
│   │   └── npcs/                   # NPC sprites
│   ├── obstacles/                  # Terrain and platform tiles
│   ├── backgrounds/                # Level backgrounds
│   ├── doodads/                    # Environmental objects
│   └── text/                       # UI fonts and text
└── sounds/                         # Audio files (future)
```

## Ray Character Sprite Sheets

### Animation States

| Unity State | Phaser Key | Sprite Sheet | Frame Count | Frame Rate |
|-------------|------------|--------------|-------------|------------|
| STATE_IDLE (0) | ray-idle | Ray_Idle_NoShovel 1.2-Sheet.png | 4 | 8 fps |
| STATE_WALK_RIGHT (2) | ray-walk-right | Ray_Walk_Right 1.2-Sheet.png | 8 | 12 fps |
| STATE_WALK_LEFT (4) | ray-walk-left | Ray_Walk_Left 1.2-Sheet.png | 8 | 12 fps |
| STATE_JUMP_RIGHT (22) | ray-jump-right | Ray_Jump_Right-sheet.png | 6 | 10 fps |
| STATE_JUMP_LEFT (24) | ray-jump-left | Ray_Jump_Left-sheet.png | 6 | 10 fps |
| STATE_ATTACK_RIGHT (12) | ray-attack-right | Ray_Attack_Right 1.2-Sheet.png | 6 | 12 fps |
| STATE_ATTACK_LEFT (14) | ray-attack-left | Ray_Attack_Left 1.2-Sheet.png | 6 | 12 fps |
| STATE_DIG_DOWN (73) | ray-dig-down | Ray_Dig_Down 1.2-Sheet.png | 8 | 10 fps |

### Sprite Sheet Specifications

- **Default Frame Size**: 32x32 pixels
- **Format**: PNG with transparency
- **Naming Convention**: `Ray_[Action]_[Direction] [Version]-Sheet.png`
- **Source**: Unity/Assets/sprite-sheets/Characters/Ray/

## Usage in Phaser

### Loading Sprite Sheets

```javascript
this.load.spritesheet('ray-idle', 'assets/sprites/characters/ray/Ray_Idle_NoShovel 1.2-Sheet.png', {
  frameWidth: 32,
  frameHeight: 32
});
```

### Creating Animations

```javascript
this.anims.create({
  key: 'ray-idle',
  frames: this.anims.generateFrameNumbers('ray-idle', { start: 0, end: -1 }),
  frameRate: 8,
  repeat: -1
});
```

### Playing Animations

```javascript
const sprite = this.add.sprite(x, y, 'ray-idle');
sprite.play('ray-idle');
```

## Testing Assets

Use the DevTools page (`devtools.html`) to:
- View all sprite sheets
- Test animations
- Verify frame counts
- Check frame rates
- Inspect sprite rendering

## Future Asset Additions

- Enemy sprite sheets (Scorpion, Rat, Snake)
- NPC sprite sheets
- Obstacle/terrain tiles
- Background images
- UI elements and fonts
- Sound effects and music
