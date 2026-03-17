/**
 * Parses a .ldtkl level file (single-level LDtk export).
 * Returns a simplified structure used by GameScene.
 */
export function parseLDtk(data) {
  const result = {
    width:   data.pxWid,
    height:  data.pxHei,
    bgColor: data.__bgColor,
    intGrid: null,
    tiles:   [],
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
      result.tiles = layer.autoLayerTiles;

    } else if (layer.__type === 'Entities') {
      for (const entity of layer.entityInstances) {
        const id = entity.__identifier;
        if (!result.entities[id]) result.entities[id] = [];
        result.entities[id].push({
          id,
          iid:    entity.iid,
          x:      entity.px[0],
          y:      entity.px[1],
          width:  entity.width,
          height: entity.height,
        });
      }
    }
  }

  return result;
}
