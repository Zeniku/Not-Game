class CollData{
  constructor(o, i){
    this.o = o
    this.i = i
  }
  sameAs(other){
    return (this.o == other.o && this.i == other.i)
  }
  collide(){
    this.o.collision(this.i)
    this.i.collision(this.o)
    
  }
}

class EntityCollisions {
  static collisions = []
  static _rect = new Rect(0, 0, 0, 0)

  static update() {
    this.collisions.length = 0

    for (let i of Global.entities) {
      const r = i.maxRadius * 2

      this._rect.setRect(
        i.position.x,
        i.position.y,
        r * 2,
        r * 2
      )
      this._rect.show()

      // ENTITY vs ENTITY
      const nearbyE = Global.qtreeE.query(this._rect)
      for (let p of nearbyE) {
        const ent = Global.entities[p.index]
        if (ent === i) continue
        if (ent.index < i.index && ent.collides(i)) {
          //PhysicsHandler.ballToBall(ent, i)
          this.collisions.push(new CollData(ent, i))
        }
      }

      // ENTITY vs BULLET
      const nearbyB = Global.qtreeB.query(this._rect)
      for (let p of nearbyB) {
        const bullet = Global.bullets[p.index]
        if (bullet.collides(i)) {
          this.collisions.push(new CollData(bullet, i))
        }
      }
    }
  }

  static simulateCol() {
    for (let c of this.collisions) {
      c.collide()
      
    }
  }
}
