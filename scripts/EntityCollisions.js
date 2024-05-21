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
class EntityCollisions{
  static collisions = []
  
  static update(){
    let qtreeE = Global.qtreeE,
      qtreeB = Global.qtreeB
    
    for(let i of Global.entities){
      let bullets = qtreeB.retrieve(i.hitbox)
      let other = qtreeE.retrieve(i.hitbox)
      for(let p of other){
        let o = p.Pdata
        if(o != i){
          let collided = new CollData(o, i)
          this.collisions.push(collided)
        }
      }
      for(let p of bullets){
          let collided = new CollData(p.Pdata, i)
          this.collisions.push(collided)
      }
    }
  }
  static simulateCol(){
    let filtered = this.collisions.filter((v,i,a) => {
      if(a[i+1] == undefined) return true;
      return !v.sameAs(a[i+1])
    })
    this.collisions = filtered
    for(let i of this.collisions){
      i.collide()
    }
    this.collisions = []
  }
}
