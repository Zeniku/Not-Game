class Game {
  init() {
  this.resize();

  const { width, height } = Global;

  this.mousePosition = new Vec(width / 2, height / 2);
  this.lastMousePosition = new Vec(width / 2, height / 2);

  this.world = new World(4000 * 2, 4000 * 2, 4000 * 4, 4000 * 4);
  let worldW = this.world.width
  let worldH = this.world.height
  this.camera = new Camera(worldW / 2, worldW / 2, width, height);
  this.camera.setMode(new SpeedFollow(this.mousePosition));

  Draw.init(Global.gl);
  Effects.load();
  Units.load();

  // entities...
  for(let i = 0; i < 2500; i++){
      Units.unit.createEnt({
        x: Angles.trnsx(Mathf.random(360), Mathf.random(worldW*0.5)) + worldW*0.5,
        y: Angles.trnsy(Mathf.random(360), Mathf.random(worldH*0.5)) + worldH*0.5,
      }).velocity.setLength(10).setAngle(Mathf.random(360))
      Units.bigUnit.createEnt({
        x: Angles.trnsx(Mathf.random(360), Mathf.random(worldW*0.5)) + worldW*0.5,
        y: Angles.trnsy(Mathf.random(360), Mathf.random(worldH*0.5)) + worldH*0.5,
      }).velocity.setLength(0.5).setAngle(Mathf.random(360))

    }
    
    let bullet = new Bullet({
      hitSize: 5,
      speed: 20,
      damage: 250,
      peirceNum: 120,
      lifetime: 420 * 5,
      hitEffect: Effects.splash,
      color: "#FFFFFF"
    })
    
    for (let i = 0; i < 20; i++) {
      bullet.createEnt({
        team: "Red",
        x: Angles.trnsx(Mathf.random(360), Mathf.random(width)) + width,
        y: Angles.trnsy(Mathf.random(360), Mathf.random(height)) + height,
      }).velocity.setFromPolar(1000).setAngle(Mathf.random(360))
    }
  for(let q of Global.qIndex){
      Global[q] = new QuadTree(this.world, 4)
    }
    
  this.resize = this.resize.bind(this);
  window.addEventListener("resize", this.resize);
}

  resize() {
  const dpr = window.devicePixelRatio || 1;

  const w = Math.floor(window.innerWidth * dpr);
  const h = Math.floor(window.innerHeight * dpr);

  Global.canvas.width  = w;
  Global.canvas.height = h;

  Global.width  = w;
  Global.height = h;

  Global.gl.viewport(0, 0, w, h);
}


  startGameLoop() {
    let step = (timestamp) => {
      Global.animationId = requestAnimationFrame(step);

      if (Global.lastTimeStamp == null) {
        Global.lastTimeStamp = timestamp;
        return;
      }

      const elapsed = timestamp - Global.lastTimeStamp;
      Global.lastTimeStamp = timestamp;

      // real delta in seconds (clamped)
      let delta = Math.min(elapsed, 100) / Global.fps;

      // apply slow/fast time
      Global.delta = delta / Global.svalue;

      this.update(Global.delta);
      this.draw(timestamp, elapsed);
    };

    requestAnimationFrame(step);
  }

  update(delta) {
    this.camera.update(Global.delta);
    this.camera.clampInside(this.world)
    DebugEntityIDs.check(Global.entities)
    if (Global.paused) return;
    this.filterEntities();
    this.updateQuads();
    EntityCollisions.update();
    EntityCollisions.simulate();
    this.updateQuads();
    this.updateEntities(delta);
  }

  updateEntities(delta) {
    this.entArrUp(Global.entities, delta);
    this.entArrUp(Global.bullets, delta);
    this.entArrUp(Global.effects, delta);
  }

  entArrUp(array, delta) {
    for (let i = 0; i < array.length; i++) {
      const e = array[i];
      e.update(delta);
      this.constraint(e);
    }
  }

  constraint(ent) {
    let { width, height } = this.world;
    let bouncedX = false
    let bouncedY = false 
    if(ent.has(Position)){
      let position = ent.position
      let hitsize = ent.type.hitSize
      
      if (position.x > width - hitsize) {
        position.x = width - hitsize;
        bouncedX = true
      } else if (position.x < 0 + hitsize) {
        position.x = 0 + hitsize;
        bouncedX = true
      }
      if (position.y > height- hitsize) {
        position.y = height - hitsize;
        bouncedY = true
      } else if (position.y < 0 + hitsize) {
        position.y = 0 + hitsize;
        bouncedY = true
      }
    }
    
    if(ent.has(Velocity)){
      let velocity = ent.velocity
      if(bouncedX) velocity.x *= -0.995
      if(bouncedY) velocity.y *= -0.995
    }
  }

  filterEntInPlace(array) {
    let write = 0;

    for (let read = 0; read < array.length; read++) {
      const e = array[read];
      if (e && !e.removed) {
        e.index = write;
        array[write++] = e;
      }
    }

    array.length = write;
  }

  filterEntities() {
    this.filterEntInPlace(Global.entities);
    this.filterEntInPlace(Global.bullets);
    this.filterEntInPlace(Global.effects);
  }

  updateQuads() {
    if (Global.paused) return;
    Global.qtreeE.update(Global.entities);
    Global.qtreeB.update(Global.bullets);
    Global.qtreeFx.update(Global.effects);
  }
  drawDebugEnt(array){
    for(let e of array){
      Draw.colorHex("FFF")
      Draw.circle(e.position.x, e.position.y, 2)
      if(e.hitbox) e.hitbox.show()
      //Draw.circle(e.position.x, e.position.y, e.type.hitSize)
    }
  }
  draw(timestamp, elapsed){
  
  Draw.setMatrix(this.camera.getMatrix());

  this.drawEntities(this.camera);

  Draw.flush();
}


  drawEntities(boundary) {
    if(Global.drawDebug){
      Global.qtreeE.draw()

      this.drawDebugEnt(Global.entities)
      this.drawDebugEnt(Global.bullets)
      this.drawDebugEnt(Global.effects)

    }
    if (Global.disableEntDraw) return;

    this.drawInsideScreen(Global.qtreeE, Global.entities, boundary);
    this.drawInsideScreen(Global.qtreeB, Global.bullets, boundary);
    this.drawInsideScreen(Global.qtreeFx, Global.effects, boundary);
  }

  drawInsideScreen(quadtree, array, cameraBoundary) {
  // Query the QuadTree for only entities within the camera's view
  const visibleItems = quadtree.query(cameraBoundary);
  
  for (let i = 0; i < visibleItems.length; i++) {
    const entity = array[visibleItems[i].index];
    if (entity) entity.draw(); // No longer passing ctx
  }
}

}
class DebugEntityIDs {
  static check(entities) {
    const seen = new Set();

    for (const e of entities) {
      if (seen.has(e.index)) {
        throw new Error(
          `[Collision Debug] Duplicate entity index: ${e.index}`
        );
      }
      seen.add(e.index);
    }
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
    e.preventDefault();

    const rect = Global.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    const canvasX = (e.touches[0].clientX - rect.left) * dpr;
    const canvasY = (e.touches[0].clientY - rect.top) * dpr;

    // save last pos
    game.lastMousePosition.setPosv(game.mousePosition);

    // convert screen → world
    const worldPos = game.camera.screenToWorld(canvasX, canvasY);
    game.mousePosition.setPos(worldPos.x, worldPos.y);
});

  
  game.startGameLoop()
}
