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
let h = 3
class EntityCollisions{
  static collisions = []
  
  static update(){
    let qtreeE = Global.qtreeE,
      qtreeB = Global.qtreeB
    
    for(let i of Global.entities){
      let bullets = qtreeB.retrieve(i.hitbox)
      let other = qtreeE.retrieve(i.hitbox)
      for(let p of other){
        let ent = Global.entities[p.index]
        if(ent.collides(i)) this.collisions.push(new CollData(ent, i))
      }
      for(let p of bullets){
        let ent = Global.bullets[p.index]
        if(ent.collides(i)) this.collisions.push(new CollData(ent, i))
      }
    }
  }
  static simulateCol(){
    let filtered = this.collisions.filter((val,i,arr) => {
      if(arr[i+1] == undefined) return true;
      return !val.sameAs(arr[i+1])
    })
    for(let i of filtered){
      i.collide()
    }
    this.collisions = []
  }
}
