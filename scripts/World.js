class Tile {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.floor = Blocks.grass; // Default floor
    this.block = Blocks.air;   // Default content (empty)
    this.building = null;      // If it's a turret, this holds the HP/Entity
  }
}

class World {
  constructor(width, height, tileSize = 64) {
    this.tileSize = tileSize;

    this.width = width * tileSize;
    this.height = height * tileSize;

    this.wWidth = Math.floor(width);
    this.wHeight = Math.floor(height);

    // 👇 centered boundary for QuadTree
    this.bounds = new Rect(this.width * 0.5, this.height * 0.5, this.width, this.height);
    this.buildings = [];
    this.tiles = new Array(this.wWidth * this.wHeight);

    for (let i = 0; i < this.tiles.length; i++) {
      const x = i % this.wWidth;
      const y = Math.floor(i / this.wWidth);
      this.tiles[i] = new Tile(x, y);
    }
  }
  drawGrid(camera) {
    const ts = this.tileSize;

    // Calculate visible tile range (Culling)
    const startX = Math.max(0, Math.floor(camera.left / ts));
    const endX = Math.min(this.wWidth, Math.floor(camera.right / ts) + 1);
    const startY = Math.max(0, Math.floor(camera.top / ts));
    const endY = Math.min(this.wHeight, Math.floor(camera.bottom / ts) + 1);

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const tile = this.getTile(x, y);
        if (!tile) continue;

        const worldX = x * ts + ts * 0.5;
        const worldY = y * ts + ts * 0.5;
        
        tile.floor.draw(tile)
        tile.block.draw(tile)
        //Draw.rect(tile.floor.region, worldX, worldY, ts, ts);
      }
    }
  }
  idx(x, y) {
    if (x < 0 || y < 0 || x >= this.wWidth || y >= this.wHeight) return -1;
    return x + y * this.wWidth;
  }

  getTile(x, y) {
    const i = this.idx(x, y);
    return i !== -1 ? this.tiles[i] : null;
  }

  worldToTileX(x) { return Math.floor(x / this.tileSize); }
  worldToTileY(y) { return Math.floor(y / this.tileSize); }

  getTileAtWorldPos(wx, wy) {
    return this.getTile(
      this.worldToTileX(wx),
      this.worldToTileY(wy)
    );
  }
  placeBlock(x, y, blockType, team = "Blue") {
    // 1. Check bounds
    if (x < 0 || y < 0 || x + blockType.size > this.wWidth || y + blockType.size > this.wHeight) return null;

    // 2. Check if area is clear (Multi-tile check)
    for (let ix = 0; ix < blockType.size; ix++) {
      for (let iy = 0; iy < blockType.size; iy++) {
        const tile = this.getTile(x + ix, y + iy);
        if (tile.block !== Blocks.air || tile.building) {
            return null; // Obstructed
        }
      }
    }

    // 3. Create the ONE Building instance
    const building = new Building({
      block: blockType,
      tileX: x,
      tileY: y,
      team: team,
      type: blockType // For the Health component
    });

    // 4. Link ALL covered tiles to this single building
    for (let ix = 0; ix < blockType.size; ix++) {
      for (let iy = 0; iy < blockType.size; iy++) {
        const tile = this.getTile(x + ix, y + iy);
        tile.block = blockType;
        tile.building = building; // LINKING HERE
      }
    }

    this.buildings.push(building);
    return building;
  }

  removeBlock(x, y) {
    const tile = this.getTile(x, y);
    const building = tile.building;

    if (!building) return;

    const size = building.block.size;
    const originX = building.tileX;
    const originY = building.tileY;

    // Clear all tiles
    for (let ix = 0; ix < size; ix++) {
      for (let iy = 0; iy < size; iy++) {
        const t = this.getTile(originX + ix, originY + iy);
        t.block = Blocks.air;
        t.building = null;
      }
    }

    // Remove from array
    this.buildings = this.buildings.filter(b => b !== building);
    building.removed = true; 
  }
}