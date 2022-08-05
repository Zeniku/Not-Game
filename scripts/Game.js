class Game {
  mouseX = Global.width/2
  mouseY = Global.height/2
  update(timestamp){
    Global.updateEntities(timestamp)
    this.drawBoundary.setPos(this.mouseX, this.mouseY)
    EntityCollisions.update()
  }
  draw(timestamp){
    let {width, height, ctx} = Global
    ctx.clearRect(0,0, width, height)
    this.drawBoundary.show()
    Global.drawEntities(this.drawBoundary)
  }
  init(){
    let {width, height} = Global
    Global.drawDebug = true
    Effects.load()
    let unit = new BaseUnit({
      hitSize: 10,
      health: 1000,
    })

    for(let i = 0; i < 2000; i++){
      unit.createEnt({
        x: Angles.trnsx(Mathf.random(360), Mathf.random(width/2)) + width/2,
        y: Angles.trnsy(Mathf.random(360), Mathf.random(height/2)) + height/2,
      }).velocity.setLength(1).setAngle(Mathf.random(360))
    }
    
    let bullet = new Bullet({
      hitSize: 5,
      speed: 5,
      damage: 250,
      peirceNum: 120,
      lifetime: 420 * 2,
      hitEffect: Effects.splash,
      color: "#FFFFFF"
    })
    
    for (let i = 0; i < 100; i++) {
      bullet.createEnt({
        team: "Red",
        x: Angles.trnsx(Mathf.random(360), Mathf.random(width/2)) + width/2,
        y: Angles.trnsy(Mathf.random(360), Mathf.random(height/2)) + height/2,
      }).velocity.setLength(10).setAngle(Mathf.random(360))
    }
    
    this.boundary = new Rect(width/2, height/2, width, height)
    this.drawBoundary = new Rect(width/2, height/2, width/2, height /2)
    
    for(let q of Global.qIndex){
      Global[q] = new QuadTree(this.boundary, 4)
    }
    Global.updateQuads()
  }
  startGameLoop(){
    let step = timestamp => {
      Global.animationId = requestAnimationFrame(step)
      Global.time = timestamp
      if(!Global.lastTimeStamp) Global.lastTimeStamp = timestamp
      let elapsed = timestamp - Global.lastTimeStamp
      Global.delta = elapsed / Global.fps / Global.slider.value
      
      if(elapsed > Global.fps){
        this.update(timestamp)
        this.draw(timestamp)
        Global.lastTimeStamp = timestamp
      }
    }
    requestAnimationFrame(step)
  }
}

window.onload = () => {
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
