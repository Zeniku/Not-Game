
class EntityCollisions{
  static _results = []; // Persistent buffer
  static _searchRect = new Rect(0,0,0,0)
  static collisions = [];
  static update() {
    const { entities, bullets, qtreeE, qtreeB } = Global;

    // 1. Clear array without reallocating
    this.collisions.length = 0;

    for (let i = 0; i < entities.length; i++) {
        const entA = entities[i];
        
        // Use a static search rect to prevent object churn
        const margin = 100; // Define your max unit size here
        this._searchRect.setRect(entA.position.x, entA.position.y, margin, margin);

        // 2. Reuse the same array
        this._results.length = 0;
        qtreeE.retrieve(this._searchRect, this._results);

        for (let p of this._results) {
            const entB = entities[p.index];
            if (p.index > i && entA.collides(entB)) {
                this.collisions.push([entA, entB]);
            }
        }
        
        // 3. Keep bullet checks separate to avoid mixing logic
        this._results.length = 0;
        qtreeB.retrieve(entA.hitbox, this._results);
        for (let p of this._results) {
          const bullet = bullets[p.index];
          if (entA.collides(bullet)) {
             entA.collision(bullet);
             bullet.collision(entA);
          }
        }
    }
}
static simulate() {
  const iterations = 10; // Higher = more stable clusters, but heavier CPU
  
  for (let step = 0; step < iterations; step++) {
    // 1. Re-check the Narrow Phase (The actual distance)
    for (const col of this.collisions) {
      // Note: We don't re-run the Quadtree here, 
      // we just re-verify the math for the pairs we already found.
      PhysicsHandler.resolvePassiveCollision(col[0], col[1]);
    }
  }

  // 2. Finally, trigger logic effects (health loss, etc.) only ONCE
  for (let c = 0; c < this.collisions.length; c++) {
    //console.log(1)
    let col = this.collisions[c]
    col[0].collision(col[1]);
    col[1].collision(col[0]);
  }
}

}