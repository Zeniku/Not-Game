class Game {
  mouseX = Global.width/2
  mouseY = Global.height/2
  init(){
    let {width, height} = Global
    this.world = new World().setRect(width, height, width * 2, height * 2)
    
    Camera.camera.setRect(width/2, height/2, width, height)
    Effects.load()
    let unit = new BaseUnit({
      hitSize: 15,
      health: 300,
    })

    for(let i = 0; i < 3000; i++){
      unit.createEnt({
        x: Angles.trnsx(Mathf.random(360), Mathf.random(width)) + width/2,
        y: Angles.trnsy(Mathf.random(360), Mathf.random(height)) + height/2,
      }).velocity.setLength(10).setAngle(Mathf.random(360))
    }
    
    let bullet = new Bullet({
      hitSize: 5,
      speed: 10,
      damage: 250,
      peirceNum: 1200,
      lifetime: 420 * 5,
      hitEffect: Effects.splash,
      color: "#FFFFFF"
    })
    
    for (let i = 0; i < 10; i++) {
      bullet.createEnt({
        team: "Red",
        x: Angles.trnsx(Mathf.random(360), Mathf.random(width/2)) + width/2,
        y: Angles.trnsy(Mathf.random(360), Mathf.random(height/2)) + height/2,
      }).velocity.setLength(100).setAngle(Mathf.random(360))
    }
    
  
    
    for(let q of Global.qIndex){
      Global[q] = new QuadTree(this.world, 4)
    }
    
  }
  update(timestamp){
    Camera.camera.setPos(this.mouseX * 2, this.mouseY * 2)
    
    if(Global.paused) return 
    this.updateEntities(timestamp)
    this.filterEntities()
    this.updateQuads()
    EntityCollisions.update()
    EntityCollisions.simulateCol()
  }
  constraint({position, velocity}){
    let {width, height} = this.world
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
  }
  filterEnt(array){
    let filtered = array.filter(e => e != null && !e.removed)
    if(filtered.length == array.length) return array
    filtered.forEach((p, i) => {
      p.index = i
    })
    return filtered
  }
  filterEntities(){
    Global.entities = this.filterEnt(Global.entities)
    Global.bullets = this.filterEnt(Global.bullets)
    Global.effects = this.filterEnt(Global.effects)
  }
  entArrUp(array, addon = ent => {}){
    array.forEach((e, i) => {
      addon(e)
      e.update(Global.time)
      this.constraint(e)
    })
  }
  updateQuads(){
    Global.qtreeE.update(Global.entities)
    Global.qtreeB.update(Global.bullets)
    Global.qtreeFx.update(Global.effects)
  }
  drawDebugEnt(array){
    for(let e of array){
      Global.ctx.fillStyle = "#FFFFFF"
      Draw.circle(e.position.x, e.position.y, 2)
      if(e.hitbox) e.hitbox.show()
    }
  }
  drawInsideScreen(quadtree, array, boundary){
    let query = quadtree.query(boundary)
    for(let i of query){
      array[i.index].draw(Global.ctx)
    }
  }
  drawEntities(boundary){
    if(Global.drawDebug){
      Global.qtreeE.draw()
       
      this.drawDebugEnt(Global.entities)
      this.drawDebugEnt(Global.bullets)
      this.drawDebugEnt(Global.effects)
      
    }
      if(Global.disableEntDraw) return 
      this.drawInsideScreen(Global.qtreeE, Global.entities, boundary)
      this.drawInsideScreen(Global.qtreeB, Global.bullets, boundary)
      this.drawInsideScreen(Global.qtreeFx, Global.effects, boundary)
  }
  updateEntities(timestamp){
    this.entArrUp(Global.entities, i => this.constraint(i))
    this.entArrUp(Global.bullets, i => this.constraint(i))
    this.entArrUp(Global.effects)
  }
  draw(timestamp, elapsed){
    let {width, height} = this.world
    Global.ctx.clearRect(0,0, width * 2, height * 2)
    Camera.camera.show()
    text("FPS " + Math.floor(1000 / elapsed) + "    " + Math.floor(((1000/ elapsed) * 100) / 70) + "% fps ", 10, 100, Global.ctx)
    this.drawEntities(Camera.camera)
  }
  
  
  startGameLoop(){
    let step = timestamp => {
      Global.animationId = requestAnimationFrame(step)
      Global.time = timestamp
      if(Global.lastTimeStamp == undefined || Global.lastTimeStamp == null) Global.lastTimeStamp = timestamp
      let elapsed = timestamp - Global.lastTimeStamp
      Global.delta = elapsed / Global.fps / Global.svalue
      let {width, height, ctx} = Global
      

      if (elapsed >= Global.fps){
        this.update(timestamp)
        this.draw(timestamp,elapsed)
        Global.lastTimeStamp = timestamp
      }

    }
    requestAnimationFrame(step)
  }
}
function text(t, x, y, draw){
  draw.fillStyle = "white"
  draw.font = "10px Arial";
  draw.fillText(t, x, y);
};

window.onload = () => {
 Global.init()
  window.game = new Game()
  game.init()

  Global.canvas.addEventListener("touchmove", e => {
    e.preventDefault()
    game.lmouseX = game.mouseX
    game.lmouseY = game.mouseY
    game.mouseX = e.touches[0].clientX
    game.mouseY = e.touches[0].clientY
    //console.log(game.mouseX, game.mouseY)
  })
  
  game.startGameLoop()
}
