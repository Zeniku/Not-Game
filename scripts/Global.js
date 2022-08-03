window.Global = {
  init(){
    this.entities = []
    this.bullets = []
    this.effects = []
    this.animationId = null
    this.container = document.querySelector(".game-container")
    this.canvas = this.container.querySelector(".game-canvas")
    this.ctx = this.canvas.getContext("2d")
    this.canvas.height = this.height = window.innerHeight
    this.canvas.width = this.width = window.innerWidth
    
    this.delta = this.time = 0
    this.fps = 1000/60
    this.lastTimeStamp = null
    this.drawDebug = false
  },
  constraint({position, velocity}){
    let {width, height} = Global
    if (position.x > width) {
      position.x = width;
      velocity.x *= -0.995
    }else if (position.x < 0) {
      position.x = 0;
      velocity.x *= -0.995
    }
    if (position.y > height) {
      position.y = height;
      velocity.y *= -0.995
    }else if (position.y < 0) {
      position.y = 0;
      velocity.y *= -0.995
    }
  },
  filterEnt(array){
    let filtered = array.filter(e => e != null && !e.removed)
    if(filtered.length != array.length) return filtered
    return array
  },
  filterEntities(){
    this.entities = this.filterEnt(this.entities)
    this.bullets = this.filterEnt(this.bullets)
    this.effects = this.filterEnt(this.effects)
  },
  entArrUp(array, addon = ent => {}, condition = ent => true, draw = false){
    for(let i of array){
      if(condition(i)){
        addon(i)
        if(!draw){
          i.update(this.time)
        } else i.draw()
      } else if(this.drawDebug){
        let pos = i.position
        this.ctx.fillStyle = "#FFFFFF"
        Draw.circle(pos.x, pos.y, 2)
        if(i.hitbox) i.hitbox.show()
      }
    }
  },
  updateQuads(){
    this.qtreeE.update(this.entities)
    this.qtreeB.update(this.bullets)
    this.qtreeFx.update(this.effects)
  },
  drawEntities(boundary){
    if(this.drawDebug) this.qtreeE.draw(this.ctx)
    let cond = e => boundary.containsXY(e.position.x, e.position.y)
    this.entArrUp(this.entities, e => {}, cond, true)
    this.entArrUp(this.bullets, e => {}, cond, true)
    this.entArrUp(this.effects, e => {}, cond, true)
  },
  updateEntities(timestamp){
    this.entArrUp(this.entities, i => {
      this.constraint(i)
    })
    this.entArrUp(this.bullets, i => {
      this.constraint(i)
    })
    this.entArrUp(this.effects)
    
    this.filterEntities()
    this.updateQuads()
  }
}
Global.init()
