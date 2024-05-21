class EntityCollisions{
  static update(){
    let qtreeE = Global.qtreeE,
      qtreeB = Global.qtreeB
    
    for(let i of Global.entities){
      let bullets = qtreeB.retrieve(i.hitbox)
      let other = qtreeE.retrieve(i.hitbox)
      for(let p of other){
        let o = p.Pdata
        if(o != i){
          o.collision(i)
        }
      }
      for(let p of bullets){
        p.Pdata.collision(i)
      }
    }
    for(let i of Global.bullets){
      let entities = qtreeE.retrieve(i.hitbox)
      for(let p of entities){
        p.Pdata.collision(i)
      }
    }
  }
}
