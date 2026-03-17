import Phaser from 'phaser';
import { parseLDtk } from '../loaders/LDtkLoader.js';
import Player from '../entities/Player.js';
import NPC    from '../entities/NPC.js';

const NPC_TYPES = ['ghost', 'spider', 'thing'];

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
    this._createCollision(level.intGrid);

    // Player
    const playerData = level.entities['Player']?.[0];
    this.player = new Player(this, playerData?.x ?? 128, playerData?.y ?? 23);

    // NPCs — cycle through ghost/spider/thing
    this.npcs = [];
    let npcIndex = 0;
    for (const [key, instances] of Object.entries(level.entities)) {
      if (!key.startsWith('Npc')) continue;
      instances.forEach(data => {
        const type = NPC_TYPES[npcIndex % NPC_TYPES.length];
        this.npcs.push(new NPC(this, data.x, data.y, type));
        npcIndex++;
      });
    }

    // Colliders
    this.physics.add.collider(this.player.sprite, this.colliders);
    this.npcs.forEach(npc => this.physics.add.collider(npc.sprite, this.colliders));

    // Camera — zoom 2x to make 8px tiles readable
    this.cameras.main.setZoom(2);
    this.cameras.main.setBounds(0, 0, level.width, level.height);
    this.cameras.main.startFollow(this.player.sprite, true, 0.08, 0.08);
  }

  _renderTiles(level) {
    const TILE = level.intGrid.gridSize; // 8
    const texture = this.textures.get('tileset');

    // Register each unique source region as a named frame on the tileset texture
    const seen = new Set();
    level.tiles.forEach(tile => {
      const key = `t_${tile.src[0]}_${tile.src[1]}`;
      if (!seen.has(key)) {
        texture.add(key, 0, tile.src[0], tile.src[1], TILE, TILE);
        seen.add(key);
      }
    });

    // Composite all tiles onto a single RenderTexture
    const rt = this.add.renderTexture(0, 0, level.width, level.height);
    rt.setOrigin(0, 0);

    level.tiles.forEach(tile => {
      const key = `t_${tile.src[0]}_${tile.src[1]}`;
      // drawFrame places the frame with its center at (x, y), so offset by half-tile
      rt.drawFrame('tileset', key, tile.px[0] + TILE / 2, tile.px[1] + TILE / 2);
    });
  }

  _createCollision(intGrid) {
    const { csv, cWid, gridSize } = intGrid;

    csv.forEach((value, i) => {
      if (value !== 1) return; // only solid tiles for now
      const col = i % cWid;
      const row = Math.floor(i / cWid);
      const zone = this.add.zone(
        col * gridSize + gridSize / 2,
        row * gridSize + gridSize / 2,
        gridSize,
        gridSize,
      );
      this.physics.world.enable(zone, Phaser.Physics.Arcade.STATIC_BODY);
      this.colliders.add(zone);
    });
  }

  update() {
    this.player.update();
  }
}
