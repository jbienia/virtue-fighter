/**
 * Parses a .ldtkl level file (single-level LDtk export).
 * Returns a simplified structure used by GameScene.
 */
export function parseLDtk(data) {
  const result = {
    width:    data.pxWid,
    height:   data.pxHei,
    worldX:   data.worldX ?? 0,
    worldY:   data.worldY ?? 0,
    bgColor:  data.__bgColor,
    intGrid:  null,
    tileLayers: [],
    entities: {},
  };

  for (const layer of data.layerInstances) {
    if (layer.__type === 'IntGrid') {
      result.intGrid = {
        gridSize: layer.__gridSize,
        cWid:     layer.__cWid,
        cHei:     layer.__cHei,
        csv:      layer.intGridCsv,
      };
    }

    // collect tiles from all auto-layer / intgrid layers that have tiles
    if (layer.autoLayerTiles?.length) {
      result.tileLayers.push({
        tiles:     layer.autoLayerTiles,
        gridSize:  layer.__gridSize,
        isIntGrid: layer.__type === 'IntGrid',
      });
    }

    if (layer.__type === 'Entities') {
      const gs = layer.__gridSize;
      for (const entity of layer.entityInstances) {
        const id     = entity.__identifier;
        const fields = {};
        for (const f of entity.fieldInstances) {
          fields[f.__identifier] = f.__value;
        }

        // patrol is an array of grid points → convert to pixel coords
        const patrol = (fields.patrol ?? [])
          .filter(Boolean)
          .map(p => ({ x: p.cx * gs, y: p.cy * gs }));

        if (!result.entities[id]) result.entities[id] = [];
        result.entities[id].push({
          id,
          iid:    entity.iid,
          x:      entity.px[0],
          y:      entity.px[1],
          width:  entity.width,
          height: entity.height,
          fields,
          patrol,
        });
      }
    }
  }

  // IntGrid layers hold the foreground collision tiles and must render on top
  result.tileLayers.sort((a, b) => (a.isIntGrid ? 1 : 0) - (b.isIntGrid ? 1 : 0));

  return result;
}
