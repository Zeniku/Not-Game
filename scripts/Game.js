class Game {
  mouseX = Global.width/2
  mouseY = Global.height/2
  update(timestamp){
    this.drawBoundary.setPos(this.mouseX, this.mouseY)
    Global.paused = Global.pauseB.state
    Global.drawDebug = Global.debugD.state
    if(Global.paused) return 
    Global.updateEntities(timestamp)
    Global.filterEntities()
    Global.updateQuads()
    EntityCollisions.update()
    EntityCollisions.simulateCol()
  }
  draw(timestamp){
    let {width, height, ctx} = Global
    ctx.clearRect(0,0, width, height)
    this.drawBoundary.show()
    Global.drawEntities(this.drawBoundary)
  }
  init(){
    let {width, height} = Global
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
    
    for (let i = 0; i < 50; i++) {
      bullet.createEnt({
        team: "Red",
        x: Angles.trnsx(Mathf.random(360), Mathf.random(width/2)) + width/2,
        y: Angles.trnsy(Mathf.random(360), Mathf.random(height/2)) + height/2,
      }).velocity.setLength(100).setAngle(Mathf.random(360))
    }
    
    this.boundary = new Rect(width/2, height/2, width, height)
    this.drawBoundary = new Rect(width/2, height/2, width/2, height /2)
    
    for(let q of Global.qIndex){
      Global[q] = new QuadTree(this.boundary, 4)
    }
    
  }
  startGameLoop(){
    let step = timestamp => {
      Global.animationId = requestAnimationFrame(step)
      Global.time = timestamp
      if(Global.lastTimeStamp == undefined || Global.lastTimeStamp == null) Global.lastTimeStamp = timestamp
      let elapsed = timestamp - Global.lastTimeStamp
      Global.delta = elapsed / Global.fps / Global.slider.value
      let {width, height, ctx} = Global
      
      
      if (elapsed >= Global.fps){
        this.update(timestamp)
        this.draw(timestamp)
        text("FPS " + Math.floor(1000 / elapsed) + "    " + Math.floor(((1000/ elapsed) * 100) / 70) + "% fps ", 10, 100, Global.ctx)
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
