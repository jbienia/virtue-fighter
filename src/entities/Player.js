import Phaser from 'phaser';

export default class Player {
  constructor(scene, x, y, projectiles) {
    this.scene = scene;
    this.projectiles = projectiles;

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
      down:  Phaser.Input.Keyboard.KeyCodes.S,
    });
    this.spaceBar = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this._touchingLadder = false;
    this._climbingLadder = false;
    this._shootCooldown  = 0;
  }

  _shoot() {
    const bullet = this.projectiles.get();
    if (!bullet) return;
    bullet.enableBody(true, this.sprite.x, this.sprite.y, true, true);
    bullet.body.allowGravity = false;
    const vx = this.sprite.flipX ? -400 : 400;
    bullet.setVelocity(vx, 0);
    this.scene.sound.play('shoot');
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

    if (this._shootCooldown > 0) this._shootCooldown--;
    if (Phaser.Input.Keyboard.JustDown(this.spaceBar) && this._shootCooldown === 0) {
      this._shoot();
      this._shootCooldown = 15;
    }

    const goLeft  = cursors.left.isDown  || wasd.left.isDown;
    const goRight = cursors.right.isDown || wasd.right.isDown;
    const goUp    = cursors.up.isDown    || wasd.up.isDown;
    const goDown  = cursors.down.isDown  || wasd.down.isDown;
    const jump    = Phaser.Input.Keyboard.JustDown(cursors.up) ||
                    Phaser.Input.Keyboard.JustDown(wasd.up);

    // Consume the ladder touch flag set by the scene overlap
    const touchingLadder   = this._touchingLadder;
    this._touchingLadder   = false;

    // Enter climb mode by pressing up/down on a ladder
    if (touchingLadder && (goUp || goDown)) {
      this._climbingLadder = true;
    }
    // Exit climb mode: jump, walk sideways off the ladder, or reach the top/bottom
    if (jump || ((goLeft || goRight) && !touchingLadder) || (this._climbingLadder && !touchingLadder)) {
      this._climbingLadder = false;
    }

    if (this._climbingLadder) {
      sprite.body.allowGravity = false;
      if (goLeft) {
        sprite.setVelocityX(-100);
        sprite.setFlipX(true);
      } else if (goRight) {
        sprite.setVelocityX(100);
        sprite.setFlipX(false);
      } else {
        sprite.setVelocityX(0);
      }
      if (goUp)        sprite.setVelocityY(-120);
      else if (goDown) sprite.setVelocityY(120);
      else             sprite.setVelocityY(0);
      sprite.play('idle', true);
      return;
    }

    sprite.body.allowGravity = true;

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
      sprite.setVelocityY(-200);
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
