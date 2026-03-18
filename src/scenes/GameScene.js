import Phaser from 'phaser';
import { parseLDtk } from '../loaders/LDtkLoader.js';
import Player from '../entities/Player.js';
import NPC    from '../entities/NPC.js';

const LEVEL_KEYS = ['level-main', 'level-top', 'level-bottom', 'level-right'];
const MOB_TYPES  = ['ghost', 'spider', 'thing'];

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    const levels = LEVEL_KEYS.map(key => parseLDtk(this.cache.json.get(key)));

    // Compute world bounds across all levels
    const worldLeft   = Math.min(...levels.map(l => l.worldX));
    const worldTop    = Math.min(...levels.map(l => l.worldY));
    const worldRight  = Math.max(...levels.map(l => l.worldX + l.width));
    const worldBottom = Math.max(...levels.map(l => l.worldY + l.height));
    const worldW      = worldRight  - worldLeft;
    const worldH      = worldBottom - worldTop;

    this.physics.world.setBounds(worldLeft, worldTop, worldW, worldH);

    // Render tiles for all levels
    const seenFrames = new Set();
    levels.forEach(level => this._renderTiles(level, seenFrames));

    // Build collision + ladder zones for all levels
    this.colliders   = this.physics.add.staticGroup();
    this.ladderZones = this.physics.add.staticGroup();
    levels.forEach(level => this._createCollision(level.intGrid, level.worldX, level.worldY));

    // Player — spawn from main level
    const mainLevel  = levels[0];
    const playerData = mainLevel.entities['Player']?.[0];
    const spawnX     = (playerData?.x ?? 64) + mainLevel.worldX;
    const spawnY     = (playerData?.y ?? 64) + mainLevel.worldY - (playerData?.height ?? 0) / 2;
    this.player = new Player(this, spawnX, spawnY);

    // Mobs — from all levels, positions offset by each level's world coords
    this.npcs = [];
    let mobIndex = 0;
    levels.forEach(level => {
      (level.entities['Mob'] ?? []).forEach(data => {
        const type   = MOB_TYPES[mobIndex % MOB_TYPES.length];
        const mx     = data.x + level.worldX;
        const my     = data.y + level.worldY - data.height;
        const patrol = data.patrol.map(p => ({
          x: p.x + level.worldX,
          y: p.y + level.worldY,
        }));
        this.npcs.push(new NPC(this, mx, my, type, patrol));
        mobIndex++;
      });
    });

    // Colliders
    this.physics.add.collider(this.player.sprite, this.colliders);
    this.npcs.forEach(npc => {
      this.physics.add.collider(npc.sprite, this.colliders);
    });

    // Ladder overlap
    this.physics.add.overlap(this.player.sprite, this.ladderZones, () => {
      this.player._touchingLadder = true;
    });

    // Camera
    this.cameras.main.setZoom(2);
    this.cameras.main.setBounds(worldLeft, worldTop, worldW, worldH);
    this.cameras.main.startFollow(this.player.sprite, true, 0.08, 0.08);
  }

  _renderTiles(level, seenFrames) {
    const texture = this.textures.get('tileset');
    const rt = this.add.renderTexture(level.worldX, level.worldY, level.width, level.height);
    rt.setOrigin(0, 0);

    for (const { tiles, gridSize } of level.tileLayers) {
      tiles.forEach(tile => {
        const key = `t_${tile.src[0]}_${tile.src[1]}`;
        if (!seenFrames.has(key)) {
          texture.add(key, 0, tile.src[0], tile.src[1], gridSize, gridSize);
          seenFrames.add(key);
        }
        rt.drawFrame('tileset', key, tile.px[0], tile.px[1]);
      });
    }
  }

  _createCollision(intGrid, worldX, worldY) {
    const { csv, cWid, gridSize } = intGrid;

    csv.forEach((value, i) => {
      const col = i % cWid;
      const row = Math.floor(i / cWid);
      const cx  = col * gridSize + gridSize / 2 + worldX;
      const cy  = row * gridSize + gridSize / 2 + worldY;

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
