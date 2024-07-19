window.Global = {
  init(){
    this.qIndex = ["qtreeE", "qtreeB", "qtreeFx"]
    this.gObjIndex = ["entities", "bullets", "effects"]
    this.entities = []
    this.bullets = []
    this.effects = []
    
    this.container = document.querySelector(".game-container")
    this.canvas = this.container.querySelector(".game-canvas")
    this.ctx = this.canvas.getContext("2d")
    this.height = this.canvas.height = window.innerHeight 
    this.width = this.canvas.width = window.innerWidth
    this.delta = this.time = 0
    this.fps = 1000/60
    this.lastTimeStamp = this.animationId = null
    this.drawDebug = this.disableEntDraw = this.paused = false
    
    this.initB()
  },
  initB(){
    this.bigBox = document.querySelector("#bigbox")
    
    this.slider = new Slider()
  
    this.pauseB = new Button({
      parent: this.bigBox
    })
    this.debugD = new Button({
      parent: this.bigBox
    })
    
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
    if(filtered.length == array.length) return array
    filtered.forEach((p, i) => {
      p.index = i
    })
    return filtered
  },
  filterEntities(){
    this.entities = this.filterEnt(this.entities)
    this.bullets = this.filterEnt(this.bullets)
    this.effects = this.filterEnt(this.effects)
  },
  entArrUp(array, addon = ent => {}){
    array.forEach((e, i) => {
      addon(e)
      e.update(this.time)
      this.constraint(e)
    })
  },
  updateQuads(){
    this.qtreeE.update(this.entities)
    this.qtreeB.update(this.bullets)
    this.qtreeFx.update(this.effects)
  },
  drawDebugEnt(array){
    for(let e of array){
      this.ctx.fillStyle = "#FFFFFF"
      Draw.circle(e.position.x, e.position.y, 2)
      if(e.hitbox) e.hitbox.show()
    }
  },
  drawInsideScreen(quadtree, array, boundary){
    let query = quadtree.query(boundary)
    for(let i of query){
      array[i.index].draw(this.ctx)
    }
  },
  drawEntities(boundary){
    if(this.drawDebug){
      this.qtreeE.draw()
       
      this.drawDebugEnt(this.entities)
      this.drawDebugEnt(this.bullets)
      this.drawDebugEnt(this.effects)
    }
      if(this.disableEntDraw) return 
      this.drawInsideScreen(this.qtreeE, this.entities, boundary)
      this.drawInsideScreen(this.qtreeB, this.bullets, boundary)
      this.drawInsideScreen(this.qtreeFx, this.effects, boundary)
  },
  updateEntities(timestamp){
    this.entArrUp(this.entities, i => this.constraint(i))
    this.entArrUp(this.bullets, i => this.constraint(i))
    this.entArrUp(this.effects)
  }
}

