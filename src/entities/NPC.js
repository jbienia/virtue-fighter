const NPC_CONFIG = {
  ghost:  { frameCount: 4 },
  spider: { frameCount: 4 },
  thing:  { frameCount: 4 },
};

export default class NPC {
  constructor(scene, x, y, type) {
    this.scene = scene;
    this.type  = type;

    this.sprite = scene.physics.add.sprite(x, y, type, 0);
    this.sprite.setCollideWorldBounds(true);

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
  }
}
