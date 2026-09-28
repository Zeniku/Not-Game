
let container = document.querySelector(".game-container")
let canvas = container.querySelector(".game-canvas")

let gl = canvas.getContext("webgl2", { alpha: false }) || 
         canvas.getContext("webgl", { alpha: false }) || 
         canvas.getContext("experimental-webgl");
let global = {
  lightx: 0.2
}



// Setup Dimensions
w = innerWidth;
h = innerHeight;
canvas.width = w;
canvas.height = h;



let abs = Math.abs;
let view = 0;
let seed = 0;

let before, now, fps;
before = Date.now();
fps = 0;


function craterFunction(n, x, y, centerX, centerY, radius, minDepth) {
  let cx = x - centerX,
    cy = y - centerY;
  const distance = Math.sqrt(cx * cx + cy * cy);
  let px = ((cx * cx) / radius) - (radius / 2);
  let py = ((cy * cy) / radius) - (radius / 2);
  const normalizedDistance = radius / distance;
  let craterShape = Math.max((px) + (py), -minDepth)
  if (normalizedDistance < 1) craterShape *= normalizedDistance * 0.01
  return (craterShape);
}

function ridge(x, y) {
  return Math.pow((Math.abs(x) * -1) + 1, y)
}

window.Global = {
  init(){
    this.qIndex = ["qtreeE", "qtreeB", "qtreeFx"]
    this.gObjIndex = ["entities", "bullets", "effects"]
    this.entities = []
    this.bullets = []
    this.effects = []
    
    this.container = container
    this.canvas = this.container.querySelector(".game-canvas")
    this.gl = gl
    //this.ctx = this.canvas.getContext("2d")
    
    this.height = this.canvas.height = window.innerHeight 
    this.width = this.canvas.width = window.innerWidth
    this.delta = this.time = 0
    this.fps = 1000/60
    this.lastTimeStamp = this.animationId = null
    this.drawDebug = this.disableEntDraw = this.paused = false
    this.atlas = new TextureAtlas(this.gl);

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
        this.disableEntDraw = e
    })
    this.bigBox.addButton("Step", e => {
      this.paused = false
      game.update(this.delta)
      this.paused = true
    })
  },
  
}