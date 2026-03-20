const NPC_CONFIG = {
  ghost:  { frameCount: 4, bodyW: 14, bodyH: 30, offsetX: 8,  offsetY: 0 },
  spider: { frameCount: 4, bodyW: 20, bodyH: 21, offsetX: 5,  offsetY: 0 },
  thing:  { frameCount: 4, bodyW: 15, bodyH: 45, offsetX: 12, offsetY: 0 },
};

const PATROL_SPEED = 60;

export default class NPC {
  constructor(scene, x, y, type, patrol) {
    this.scene = scene;
    this.type  = type;

    const cfg = NPC_CONFIG[type];
    this.sprite = scene.physics.add.sprite(x, y, type, 0);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.body.setSize(cfg.bodyW, cfg.bodyH);
    this.sprite.body.setOffset(cfg.offsetX, cfg.offsetY);

    const animKey = `${type}-walk`;
    if (!scene.anims.exists(animKey)) {
      scene.anims.create({
        key:       animKey,
        frames:    scene.anims.generateFrameNumbers(type, {
          start: 0,
          end:   NPC_CONFIG[type].frameCount - 1,
        }),
        frameRate: 8,
        repeat:    -1,
      });
    }

    this.sprite.play(animKey);

    // patrol is an array of waypoints; prepend spawn as point 0
    if (patrol?.length) {
      this._waypoints     = [{ x, y }, ...patrol];
      this._waypointIndex = 1;
      this._waypointDir   = 1;
    }

    this._initFrames = 20;
    this.health = 3;
  }

  hit() {
    this.health -= 1;
    if (this.health <= 0) {
      this._dead = true;
      this.scene.sound.play('death');
      this.sprite.destroy();
    } else {
      // Flash white to indicate a hit
      this.scene.tweens.add({
        targets: this.sprite,
        alpha: 0.2,
        duration: 60,
        yoyo: true,
      });
    }
  }

  _moveToward(target) {
    const dx = target.x - this.sprite.x;
    this.sprite.setVelocityX(dx >= 0 ? PATROL_SPEED : -PATROL_SPEED);
    this.sprite.setFlipX(dx >= 0);
  }

  update() {
    if (this._dead || !this._waypoints) return;

    const { body } = this.sprite;
    const target = this._waypoints[this._waypointIndex];
    const dist   = Math.abs(this.sprite.x - target.x);

    if (this._initFrames > 0) { this._initFrames--; this._moveToward(target); return; }

    const movingRight = target.x > this.sprite.x;
    const hitWall = (movingRight && body.blocked.right) ||
                    (!movingRight && body.blocked.left);

    if (dist < 4 || hitWall) {
      this._waypointIndex += this._waypointDir;
      if (this._waypointIndex >= this._waypoints.length) {
        this._waypointIndex = this._waypoints.length - 2;
        this._waypointDir = -1;
      } else if (this._waypointIndex < 0) {
        this._waypointIndex = 1;
        this._waypointDir = 1;
      }
    }

    this._moveToward(this._waypoints[this._waypointIndex]);
  }
}
