import Phaser from 'phaser';
import { parseLDtk } from '../loaders/LDtkLoader.js';
import Player from '../entities/Player.js';
import NPC    from '../entities/NPC.js';

const MOB_TYPES = ['ghost', 'spider', 'thing'];

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    const rawData = this.cache.json.get('level');
    const level   = parseLDtk(rawData);

    this.physics.world.setBounds(0, 0, level.width, level.height);

    this._renderTiles(level);

    this.colliders = this.physics.add.staticGroup();
    this.ladderZones = this.physics.add.staticGroup();
    this._createCollision(level.intGrid);

    // Player — LDtk pivot is top-left, so subtract half entity height to get center
    const playerData = level.entities['Player']?.[0];
    this.player = new Player(this, playerData?.x ?? 64, (playerData?.y ?? 64) - playerData?.height / 2);

    // Mobs
    this.npcs = [];
    let mobIndex = 0;
    (level.entities['Mob'] ?? []).forEach(data => {
      const type = MOB_TYPES[mobIndex % MOB_TYPES.length];
      this.npcs.push(new NPC(this, data.x, data.y - data.height, type, data.patrol));
      mobIndex++;
    });

    // Colliders
    this.physics.add.collider(this.player.sprite, this.colliders);
    this.npcs.forEach(npc => {
      this.physics.add.collider(npc.sprite, this.colliders);
    });

    // Ladder overlap — sets flag on player each frame they're touching a ladder
    this.physics.add.overlap(this.player.sprite, this.ladderZones, () => {
      this.player._touchingLadder = true;
    });

    // Camera
    this.cameras.main.setZoom(2);
    this.cameras.main.setBounds(0, 0, level.width, level.height);
    this.cameras.main.startFollow(this.player.sprite, true, 0.08, 0.08);
  }

  _renderTiles(level) {
    const texture = this.textures.get('tileset');
    const rt = this.add.renderTexture(0, 0, level.width, level.height);
    rt.setOrigin(0, 0);

    const seen = new Set();
    for (const { tiles, gridSize } of level.tileLayers) {
      tiles.forEach(tile => {
        const key = `t_${tile.src[0]}_${tile.src[1]}`;
        if (!seen.has(key)) {
          texture.add(key, 0, tile.src[0], tile.src[1], gridSize, gridSize);
          seen.add(key);
        }
        rt.drawFrame('tileset', key, tile.px[0], tile.px[1]);
      });
    }
  }

  _createCollision(intGrid) {
    const { csv, cWid, gridSize } = intGrid;

    csv.forEach((value, i) => {
      const col = i % cWid;
      const row = Math.floor(i / cWid);
      const cx  = col * gridSize + gridSize / 2;
      const cy  = row * gridSize + gridSize / 2;

      if (value === 1 || value === 3) {
        const zone = this.add.zone(cx, cy, gridSize, gridSize);
        this.physics.world.enable(zone, Phaser.Physics.Arcade.STATIC_BODY);
        this.colliders.add(zone);
      } else if (value === 2) {
        const zone = this.add.zone(cx, cy, gridSize, gridSize);
        this.physics.world.enable(zone, Phaser.Physics.Arcade.STATIC_BODY);
        this.ladderZones.add(zone);
      }
    });
  }

  update() {
    this.player.update();
    this.npcs.forEach(npc => npc.update());
  }
}
