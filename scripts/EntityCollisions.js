class CollData{
  constructor(o, i){
    this.o = o
    this.i = i
  }
  collide(){
    this.o.collision(this.i)
    this.i.collision(this.o)
  }
}

class EntityCollisions {
  static collisions = [];

  static update() {
    this.collisions = [];
    const { entities, qtreeE , qtreeB, bullets} = Global;

    // Use a shared rect to avoid garbage collection lag
    this._searchRect ||= new Rect(0, 0, 0, 0);

    for (let i = 0; i < entities.length; i++) {
        const entA = entities[i];
        
        // CRITICAL: Expand the search area by the largest possible unit size
        // Or at least by entA's size + a reasonable margin.
        const margin = entA.type.hitSize + 50; // 50 is a buffer for 'BigUnit'
        this._searchRect.setRect(
            entA.position.x, 
            entA.position.y, 
            entA.type.hitSize * 2 + margin, 
            entA.type.hitSize * 2 + margin
        );

        const nearby = qtreeE.retrieve(this._searchRect);

        for (let p of nearby) {
            const entB = entities[p.index];
            // Standard check
            if (p.index > i && entA.collides(entB)) {
                this.collisions.push(new CollData(entA, entB));
            }
        }
        const nearbyBullets = qtreeB.retrieve(entA.hitbox);
        
        for (let p of nearbyBullets) {
          const bullet = bullets[p.index];
          if (entA.collides(bullet)) {
            this.collisions.push(new CollData(entA, bullet));
          }
        }
    }
}


  static simulate() {
  const iterations = 20; // Higher = more stable clusters, but heavier CPU
  
  for (let step = 0; step < iterations; step++) {
    // 1. Re-check the Narrow Phase (The actual distance)
    for (const col of this.collisions) {
      // Note: We don't re-run the Quadtree here, 
      // we just re-verify the math for the pairs we already found.
      PhysicsHandler.resolvePassiveCollision(col.i, col.o);
    }
  }

  // 2. Finally, trigger logic effects (health loss, etc.) only ONCE
  for (const col of this.collisions) {
    col.o.collision(col.i);
    col.i.collision(col.o);
  }
}

}
