class HpEnt extends Components(Position, Velocity, Hitbox, Health, Team)(Entity) {}

class BulletEnt extends TimedEnt {
  constructor(config){
    super(config)
    this.damage = config.type.damage || 0
    this.peirced = []
  }
  update(timestamp){
    if(this.peirced.length > this.type.peirceNum){
      this.remove()
    }
    
    this.velocity.setLength(this.type.speed)
    
    super.update(timestamp)
  }
  entrr(){
    this.index = Global.bullets.length
    Global.bullets.push(this)
  }
  collision(other){
    if(!(this.collides(other) && other.team != this.team)) return 
    if(other instanceof HpEnt){
      //e.highlight = true
      if(!other.isImmune){
        this.type.hitEffect.createEnt({
          x: this.position.x,
          y: this.position.y
        })  
      }
      other.loseHealth(this.damage)
      if(!this.peirced.includes(other)) this.peirced.push(other)
      if(!this.type.peirces && !other.isImmune) this.remove()
    }
  }
}

