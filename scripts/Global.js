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
    this.bigBox = new WindowPanel({
      parent: document.body
    })
    this.bigBox.addSliderInput("", 1, 10, 1, e => {
     this.svalue = e
    })
    this.bigBox.addButton("Pause", e => {
        this.paused = e
    })
    this.bigBox.addButton("Debug", e => {
        this.drawDebug = e
    })
    
  },
  
}

