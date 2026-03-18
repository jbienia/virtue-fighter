import Phaser from 'phaser';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    // Level data
    this.load.json('level-main',   'assets/levels/Your_typical_2D_platformer.ldtkl');
    this.load.json('level-top',    'assets/levels/Top.ldtkl');
    this.load.json('level-bottom', 'assets/levels/Bottom.ldtkl');
    this.load.json('level-right',  'assets/levels/World_Level_3.ldtkl');

    // Tileset
    this.load.image('tileset', 'assets/tileset/SunnyLand_by_Ansimuz-extended.png');

    // Player animations (Aseprite atlas format)
    this.load.atlas('player-idle', 'assets/sprites/player/player-Idle.png', 'assets/sprites/player/player-Idle.json');
    this.load.atlas('player-run',  'assets/sprites/player/player-run.png',  'assets/sprites/player/player-run.json');
    this.load.atlas('player-jump', 'assets/sprites/player/player-Jump.png', 'assets/sprites/player/player-Jump.json');
    this.load.atlas('player-fall', 'assets/sprites/player/player-Fall.png', 'assets/sprites/player/player-Fall.json');

    // NPC spritesheets
    this.load.spritesheet('ghost',  'assets/sprites/npcs/ghost.png',  { frameWidth: 31, frameHeight: 44 });
    this.load.spritesheet('spider', 'assets/sprites/npcs/spider.png', { frameWidth: 32, frameHeight: 21 });
    this.load.spritesheet('thing',  'assets/sprites/npcs/thing.png',  { frameWidth: 33, frameHeight: 45 });
  }

  create() {
    this.scene.start('GameScene');
  }
}
