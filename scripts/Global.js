window.Global = {
  init(){
    this.qIndex = ["qtreeE", "qtreeB", "qtreeFx"]
    this.gObjIndex = ["entities", "bullets", "effects"]
    for(let gObj of this.gObjIndex){
      this[gObj] = []
    }
    this.sliderBox = document.querySelector(".box")
    this.slider = this.sliderBox.querySelector(".slidercontainer").querySelector(".slider");
    
    this.animationId = null
    this.container = document.querySelector(".game-container")
    this.canvas = this.container.querySelector(".game-canvas")
    this.ctx = this.canvas.getContext("2d")
    this.height = this.canvas.height = window.innerHeight 
    this.width = this.canvas.width = window.innerWidth
    this.delta = this.time = 0
    this.fps = 1000/60
    this.lastTimeStamp = null
    this.drawDebug = this.disableEntDraw = false
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
    for(let gObj of this.gObjIndex){
      this[gObj] = this.filterEnt(this[gObj])
    }
  },
  entArrUp(array, addon = ent => {}, condition){
    this.updateEntArr(array, e => {
      addon(e)
      e.update(this.time)
    }, condition)
  },
  entArrDraw(array, addon = ent => {}, condition){
    this.updateEntArr(array, e => {
      addon(e)
      e.draw(this.ctx)
    }, condition)
  },
  updateEntArr(array, do_ = ent => {}, condition = ent => true, doElse = ent => {}){
    for(let i of array){
      let ent = (i.Pdata != null)? i.Pdata : i
      if(condition(ent)) do_(ent)
    }
  },
  updateQuads(){
    for(let q in this.qIndex){
      this[this.qIndex[q]].update(this[this.gObjIndex[q]])
    }
  },
  drawEntities(boundary){
    if(this.drawDebug){ 
      this.qtreeE.draw()
       
      for(let q of this.gObjIndex){
        this.updateEntArr(this[q], e => {
          this.ctx.fillStyle = "#FFFFFF"
          Draw.circle(e.position.x, e.position.y, 2)
          if(e.hitbox) e.hitbox.show()
        })
      }
    }
    for(let q of this.qIndex){
      if(!this.disableEntDraw) this.entArrDraw(this[q].query(boundary))
    }
  },
  updateEntities(timestamp){
    this.entArrUp(this.entities, i => this.constraint(i))
    this.entArrUp(this.bullets, i => this.constraint(i))
    this.entArrUp(this.effects)
    
    this.filterEntities()
    this.updateQuads()
  }
}
Global.init()
Global.slider.oninput = function(){
  Global.sliderBox.querySelector(".value").innerHTML = this.value
  let percentage = this.value / 10 * 100
  //slider color illusion 
  Global.slider.style.background = `linear-gradient(to right, #2E3369 0%, #2E3369 ${percentage}%, #f2f2f2 ${percentage}%, #f2f2f2 100%)`
}