class Camera extends Rect{
  constructor(x, y, width, height) {
    super(x, y, width, height)
    this.vel = new Vec(0, 0);

    this.mode = null;
    this.zoom = 1
    // shake
    this.shakeTime = 0;
    this.shakeStrength = 0;
  }

  setMode(mode) {
    this.mode = mode;
    mode?.onEnter?.(this);
  }

  addShake(strength, time) {
    this.shakeStrength = Math.max(this.shakeStrength, strength);
    this.shakeTime = Math.max(this.shakeTime, time);
  }

  update(dt) {
    if (this.mode) {
      this.mode.update(this, dt);
    }

    // camera shake (layered on top)
    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
    }
  }
  getMatrix() {
  const w = Global.width;
  const h = Global.height;

  const pos = this.getRenderPosition();

  const sx = 2 / w;
  const sy = 2 / h;

  return new Float32Array([
    sx * this.zoom,  0,  0,
    0, -sy * this.zoom, 0,

    // THIS IS THE IMPORTANT PART
    -pos.x * sx * this.zoom,
     pos.y * sy * this.zoom,

    1
  ]);
}


  getRenderPosition() {
    let x = this.x;
    let y = this.y;

    if (this.shakeTime > 0) {
      x += (Math.random() * 2 - 1) * this.shakeStrength;
      y += (Math.random() * 2 - 1) * this.shakeStrength;
    }

    return { x, y };
  }
  zoom = 1

  // optional goodies
  shakeX = 0
  shakeY = 0
  // still useful for mouse picking
  screenToWorld(x, y){
    return {
      x: (x - Global.width * 0.5) / this.zoom + this.x,
      y: (y - Global.height * 0.5) / this.zoom + this.y
    }
  }
}

//////////////////////////////
// Gameplay Spring + Dead Zone
//////////////////////////////

class SpringFollow {
  constructor(target) {
    this.target = target;

    this.stiffness = 30;
    this.damping = 5;

    // dead zone (camera doesn't move inside this)
    this.deadZone = {
      x: 80,
      y: 50
    };
  }

  update(camera, dt) {
    let dx = this.target.x - camera.x;
    let dy = this.target.y - camera.y;

    // apply dead zone
    if (Math.abs(dx) < this.deadZone.x) dx = 0;
    else dx -= Math.sign(dx) * this.deadZone.x;

    if (Math.abs(dy) < this.deadZone.y) dy = 0;
    else dy -= Math.sign(dy) * this.deadZone.y;

    // spring physics
    camera.vel.x += dx * this.stiffness * dt;
    camera.vel.y += dy * this.stiffness * dt;

    const damp = Math.exp(-this.damping * dt);
    camera.vel.x *= damp;
    camera.vel.y *= damp;

    camera.setPos(camera.x + camera.vel.x * dt, camera.y += camera.vel.y * dt)
  }
}

//////////////////////////////
// Cinematic Camera Mode
//////////////////////////////

class CinematicMove {
  constructor(from, to, duration, easeFn = Mathf.easeInOutCubic, onDone = null) {
    this.from = { ...from };
    this.to = { ...to };
    this.duration = duration;
    this.ease = easeFn;
    this.t = 0;
    this.onDone = onDone;
  }

  onEnter(camera) {
    camera.vel.x = 0;
    camera.vel.y = 0;
  }

  update(camera, dt) {
    this.t += dt / this.duration;
    const p = Mathf.clamp(this.t, 0, 1);
    const e = this.ease(p);

    camera.setPos(
      Mathf.lerp(this.from.x, this.to.x, e),
      Mathf.lerp(this.from.y, this.to.y, e)
    )

    if (p >= 1) {
      this.onDone?.();
    }
  }
  
}

class SpeedFollow {
  constructor(target) {
    this.target = target;

    this.maxSpeed = 150;      // px/sec
    this.accel = 75;        // how fast speed changes
    this.slowRadius = 500;    // start slowing down here
    this.stopRadius = 10;      // snap threshold
  }

  update(camera, dt) {
    const dx = this.target.x - camera.x;
    const dy = this.target.y - camera.y;
    const dist = Math.hypot(dx, dy);

    if (dist < this.stopRadius) {
      camera.vel.x *= 0.9;
      camera.vel.y *= 0.9;
      return;
    }

    // direction
    const nx = dx / dist;
    const ny = dy / dist;

    // desired speed (distance → speed)
    let desiredSpeed = this.maxSpeed;

    if (dist < this.slowRadius) {
      desiredSpeed *= dist / this.slowRadius;
    }

    // desired velocity
    const desiredVx = nx * desiredSpeed;
    const desiredVy = ny * desiredSpeed;

    // accelerate velocity toward desired velocity
    camera.vel.x += Mathf.clamp(desiredVx - camera.vel.x, -this.accel * dt, this.accel * dt);
    camera.vel.y += Mathf.clamp(desiredVy - camera.vel.y, -this.accel * dt, this.accel * dt);

    // integrate
    camera.setPos(
      camera.x + camera.vel.x * dt,
      camera.y + camera.vel.y * dt
    )
  }
}


//////////////////////////////
// Example Usage
//////////////////////////////

/*
const camera = new Camera();

// Gameplay
camera.setMode(new SpringFollow(player.position));

// Trigger cinematic
camera.setMode(
  new CinematicMove(
    camera.pos,
    { x: 1200, y: 300 },
    3,
    easeOutBack,
    () => camera.setMode(new SpringFollow(player.position))
  )
);

// In your game loop
camera.update(deltaTime);
const camPos = camera.getRenderPosition();
*/