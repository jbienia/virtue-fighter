export default class Player {
  constructor(scene, x, y) {
    this.scene = scene;

    this.sprite = scene.physics.add.sprite(x, y, 'player-idle', 'player #Idle 0.ase');
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setScale(0.4);
    this.sprite.body.setSize(20, 36);
    this.sprite.body.setOffset(21, 12);

    this._registerAnims(scene);

    this.sprite.play('idle');

    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wasd = scene.input.keyboard.addKeys({
      up:    Phaser.Input.Keyboard.KeyCodes.W,
      left:  Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });
  }

  _registerAnims(scene) {
    scene.anims.create({
      key: 'idle',
      frames: scene.anims.generateFrameNames('player-idle', {
        prefix: 'player #Idle ', suffix: '.ase', start: 0, end: 5,
      }),
      frameRate: 10,
      repeat: -1,
    });

    scene.anims.create({
      key: 'run',
      frames: scene.anims.generateFrameNames('player-run', {
        prefix: 'player #run ', suffix: '.ase', start: 0, end: 13,
      }),
      frameRate: 14,
      repeat: -1,
    });

    scene.anims.create({
      key: 'jump',
      frames: scene.anims.generateFrameNames('player-jump', {
        prefix: 'player #Jump ', suffix: '.ase', start: 0, end: 1,
      }),
      frameRate: 8,
      repeat: 0,
    });

    scene.anims.create({
      key: 'fall',
      frames: scene.anims.generateFrameNames('player-fall', {
        prefix: 'player #Fall ', suffix: '.ase', start: 0, end: 1,
      }),
      frameRate: 8,
      repeat: -1,
    });
  }

  update() {
    const { sprite, cursors, wasd } = this;
    const onGround = sprite.body.blocked.down;

    const goLeft  = cursors.left.isDown  || wasd.left.isDown;
    const goRight = cursors.right.isDown || wasd.right.isDown;
    const jump    = Phaser.Input.Keyboard.JustDown(cursors.up) ||
                    Phaser.Input.Keyboard.JustDown(wasd.up);

    if (goLeft) {
      sprite.setVelocityX(-100);
      sprite.setFlipX(true);
    } else if (goRight) {
      sprite.setVelocityX(100);
      sprite.setFlipX(false);
    } else {
      sprite.setVelocityX(0);
    }

    if (jump && onGround) {
      sprite.setVelocityY(-260);
    }

    // Animation state
    if (!onGround) {
      sprite.play(sprite.body.velocity.y < 0 ? 'jump' : 'fall', true);
    } else if (goLeft || goRight) {
      sprite.play('run', true);
    } else {
      sprite.play('idle', true);
    }
  }
}
