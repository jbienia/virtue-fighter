import Phaser from 'phaser';
import PreloadScene from './scenes/PreloadScene.js';
import GameScene from './scenes/GameScene.js';

new Phaser.Game({
  type: Phaser.AUTO,
  width: 800,
  height: 480,
  backgroundColor: '#1B2037',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 400 },
      debug: true,
    },
  },
  scene: [PreloadScene, GameScene],
});
