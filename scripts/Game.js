/**
 * Main Game Controller
 */

class Game {
  // --- 1. Setup & Lifecycle ---

  async loadAssets() {
    console.log("Loading assets...");
    Global.atlas = new TextureAtlas(Global.gl);
    
    const manifest = { "grass": "assets/bluonixite-stone1.png" };
    await Global.atlas.load(manifest);
    
    console.log("Assets loaded:", Global.atlas.getNames());
    
    // Dependencies that require assets to be loaded first
    await Blocks.load();
  }

  init() {
    this.resize();
    const { width, height } = Global;

   
    Draw.init(Global.gl);
    Effects.load();
    Units.load();

    // Initialize World & Camera
    this.world = new World(400, 400);
    const worldW = this.world.width;
    const worldH = this.world.height;
    // Initialize Input & Rendering
    this.mousePosition = new Vec(worldW / 2, worldH / 2);
    this.lastMousePosition = new Vec(worldW / 2, height / 2);
    this.playerCamPosition = new Vec(worldW / 2, worldH / 2)
    
    this.camera = new Camera(worldW / 2, worldH / 2, width, height);
    this.camera.setMode(new SpeedFollow(this.playerCamPosition));

    // Spawn Entities
    let bullet = new Bullet({
      peirceNum: 200,
      lifetime: 3000,
      hitSize: 10,
      speed: 20,
      hitEffect: Effects.splash
    })
    for(let i = 0; i < 100; i++){
    bullet.createEnt({
        x: Angles.trnsx(Mathf.random(360), Mathf.random(worldW * 0.5)) + worldW * 0.5,
        y: Angles.trnsy(Mathf.random(360), Mathf.random(worldH * 0.5)) + worldH * 0.5,
        rotation: Mathf.random(360)
      }).team = "Red"
    }
    this.spawnInitialUnits(200);

    // Initialize Spatial Partitioning (QuadTrees)
    for (let q of Global.qIndex) {
      Global[q] = new QuadTree(this.world.bounds, 4);
    }

    // Bind events
    this.resize = this.resize.bind(this);
    window.addEventListener("resize", this.resize);
  }

  spawnInitialUnits(count) {
    const worldW = this.world.width;
    const worldH = this.world.height;

    for (let i = 0; i < count; i++) {
      // Standard Units
      Units.unit.createEnt({
        x: Angles.trnsx(Mathf.random(360), Mathf.random(worldW * 0.5)) + worldW * 0.5,
        y: Angles.trnsy(Mathf.random(360), Mathf.random(worldH * 0.5)) + worldH * 0.5,
      }).velocity.setLength(10).setAngle(Mathf.random(360));

      // Heavy Units
      Units.bigUnit.createEnt({
        x: Angles.trnsx(Mathf.random(360), Mathf.random(worldW * 0.5)) + worldW * 0.5,
        y: Angles.trnsy(Mathf.random(360), Mathf.random(worldH * 0.5)) + worldH * 0.5,
      }).velocity.setLength(0.5).setAngle(Mathf.random(360));
    }
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = Math.floor(window.innerWidth * dpr);
    const h = Math.floor(window.innerHeight * dpr);

    Global.canvas.width = w;
    Global.canvas.height = h;
    Global.width = w;
    Global.height = h;

    Global.gl.viewport(0, 0, w, h);
  }

  // --- 2. Game Loop & Logic ---

  startGameLoop() {
    const step = (timestamp) => {
      Global.animationId = requestAnimationFrame(step);

      if (Global.lastTimeStamp == null) {
        Global.lastTimeStamp = timestamp;
        return;
      }

      const elapsed = timestamp - Global.lastTimeStamp;
      Global.lastTimeStamp = timestamp;

      // Calculate Delta (seconds, clamped to avoid massive jumps)
      let delta = Math.min(elapsed, 100) / Global.fps;
      Global.delta = delta / Global.svalue; // Apply time-scale (slow-mo/fast)

      this.update(Global.delta);
      this.draw(timestamp, elapsed);
    };

    requestAnimationFrame(step);
  }

  update(delta) {
    let joy = TouchHandler.joystick
    this.playerCamPosition.add(joy.inputX * 200, -joy.inputZ * 200)
    
    this.camera.update(Global.delta);
    this.camera.clampInside(this.world.bounds);
    //  console.log(this.camera)
    
    if (Global.paused) return;

    // 1. Clean up dead entities
    this.filterEntities();

    // 2. Refresh spatial data for collisions
    this.updateQuads();

    // 3. Physics & Collisions
    EntityCollisions.update();
    EntityCollisions.simulate();

    // 4. Final positioning
    this.updateQuads();
    this.updateEntities(delta);
  }

  updateEntities(delta) {
    const groups = [Global.entities, Global.bullets, Global.effects];
    for (const group of groups) {
      for (let i = 0; i < group.length; i++) {
        const e = group[i];
        e.update(delta);
        this.applyWorldConstraints(e);
      }
    }
  }

  /**
   * Keeps entities inside world bounds and handles wall bouncing
   */
  applyWorldConstraints(ent) {
    if (!ent.has(Position)) return;

    const { width, height } = this.world;
    const pos = ent.position;
    const hit = ent.type.hitSize;
    let bouncedX = false;
    let bouncedY = false;

    // X-Axis Bounds
    if (pos.x > width - hit) { pos.x = width - hit; bouncedX = true; }
    else if (pos.x < hit) { pos.x = hit; bouncedX = true; }

    // Y-Axis Bounds
    if (pos.y > height - hit) { pos.y = height - hit; bouncedY = true; }
    else if (pos.y < hit) { pos.y = hit; bouncedY = true; }

    // Reverse velocity on bounce
    if (ent.has(Velocity)) {
      if (bouncedX) ent.velocity.x *= -1;
      if (bouncedY) ent.velocity.y *= -1;
    }
  }

  // --- 3. Rendering ---

  draw(timestamp, elapsed) {
    const gl = Global.gl;
    gl.clear(gl.COLOR_BUFFER_BIT);
  
    // Get the camera matrix
    const camMat = this.camera.getMatrix();
    
    // Set the global projection
    Draw.set2dMatrix(camMat); 
  
    Draw.begin2D();
    //this.world.drawGrid(this.camera);
    this.drawEntities(this.camera);
    Draw.end();
    
    // UI usually needs a fixed matrix (no camera movement)
    Draw.set2dMatrix(Matrix4.ortho(0, w, h, 0, -1, 1));
    Draw.begin2D();
    TouchHandler.drawUI();
    Draw.end();
  }

  drawEntities(boundary) {
    if (Global.drawDebug) {
      Global.qtreeE.draw();
      this.drawDebugEntList(Global.entities);
      this.drawDebugEntList(Global.bullets);
      this.drawDebugEntList(Global.effects);
    }

    if (Global.disableEntDraw) return;

    // Query QuadTree to only draw what the camera sees
    this.drawVisibleFromQuad(Global.qtreeE, Global.entities, boundary);
    this.drawVisibleFromQuad(Global.qtreeB, Global.bullets, boundary);
    this.drawVisibleFromQuad(Global.qtreeFx, Global.effects, boundary);
  }

  drawVisibleFromQuad(qtree, array, boundary) {
    const visibleItems = qtree.query(boundary);
    for (let i = 0; i < visibleItems.length; i++) {
      const entity = array[visibleItems[i].index];
      
      if (entity) entity.draw();
    }
  }

  drawDebugEntList(array) {
    for (let e of array) {
      Draw.colorHex("FFF");
      Draw.circle(e.position.x, e.position.y, 2);
      if (e.hitbox) e.hitbox.show();
    }
  }

  // --- 4. Data Management ---
  //removes dead entities
  filterEntities() {
    this.filterArrayInPlace(Global.entities);
    this.filterArrayInPlace(Global.bullets);
    this.filterArrayInPlace(Global.effects);
  }

  filterArrayInPlace(array) {
    let writeIndex = 0;
    for (let readIndex = 0; readIndex < array.length; readIndex++) {
      const e = array[readIndex];
      if (e && !e.removed) {
        e.index = writeIndex;
        array[writeIndex++] = e;
      }
    }
    array.length = writeIndex;
  }

  updateQuads() {
    
    Global.qtreeE.update(Global.entities);
    Global.qtreeB.update(Global.bullets);
    Global.qtreeFx.update(Global.effects);
  }
}

/**
 * Utility for verifying entity integrity
 */
class DebugEntityIDs {
  static check(entities) {
    const seen = new Set();
    for (const e of entities) {
      if (seen.has(e.index)) {
        throw new Error(`[Collision Debug] Duplicate entity index: ${e.index}`);
      }
      seen.add(e.index);
    }
  }
}

// --- Entry Point ---

window.onload = async () => {
  Global.init();
  const game = new Game();
  window.game = game;

  await game.loadAssets();
  game.init();
  TouchHandler.init()

  // Input Handling
  Global.canvas.addEventListener("touchmove", e => {
    e.preventDefault();
    const rect = Global.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    const canvasX = (e.touches[0].clientX - rect.left) * dpr;
    const canvasY = (e.touches[0].clientY - rect.top) * dpr;
    game.lastMousePosition.set(game.mousePosition);
    const worldPos = game.camera.screenToWorld(canvasX, canvasY);
    game.mousePosition.set(worldPos.x, worldPos.y);
  }, { passive: false });

  game.startGameLoop();
};
