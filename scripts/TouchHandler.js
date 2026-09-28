class Joystick {
  constructor(zoneWidth, zoneHeight) {
    this.zone = { w: zoneWidth, h: zoneHeight };
    this.radius = 60;
    this.innerRadius = 25;
    
    this.x = 0;
    this.y = 0;
    this.inputX = 0;
    this.inputZ = 0; 
    
    this.active = false;
    this.touchId = null;
  }

  // Now driven by events rather than polling
  touchStart(t, screenHeight) {
    if (!this.active && t.clientX < this.zone.w && t.clientY > screenHeight - this.zone.h) {
      this.active = true;
      this.touchId = t.identifier;
      this.x = t.clientX;
      this.y = t.clientY;
      return true; // Tells the manager this touch was consumed
    }
    return false;
  }

  touchMove(t) {
    if (this.active && t.identifier === this.touchId) {
      let dx = t.clientX - this.x;
      let dy = t.clientY - this.y;
      let dist = Math.sqrt(dx * dx + dy * dy);

      // Clamp movement to radius
      if (dist > this.radius) {
        dx = (dx / dist) * this.radius;
        dy = (dy / dist) * this.radius;
      }

      // Normalize inputs (-1 to 1)
      this.inputX = dx / this.radius;
      
      // THE INVERTED FIX: 
      // Usually, pushing UP on a screen (negative Y) means moving FORWARD (negative Z in most 3D engines).
      // We invert `dy` here so pushing up results in a negative Z input.
      this.inputZ = dy / this.radius; 
    }
  }

  touchEnd(t) {
    if (this.active && t.identifier === this.touchId) {
      this.active = false;
      this.touchId = null;
      this.inputX = 0;
      this.inputZ = 0;
    }
  }

  draw() {
    if (!this.active) return;

    // Draw Outer Base
    Draw.color(1, 1, 1, 0.2);
    Lines.setStroke(2);
    Lines.circle(this.x, this.y, this.radius);

    // Draw Inner Knob
    let kx = this.x + (this.inputX * this.radius);
    let ky = this.y + (this.inputZ * this.radius); // inputZ is already scaled cleanly
    
    Draw.color(1, 1, 1, 0.5);
    Draw.circle(kx, ky, this.innerRadius);
    Draw.resetColor();
  }
}


class TouchHandler {
  static {
    // Look Variables
    this.rx = 0; 
    this.ry = -0.45;
    this.lx = 0; 
    this.ly = 0;
    this.tx = 0; 
    this.ty = 10; 
    this.tz = 0; 
    this.lookTouchId = null; 
    
    // UI Elements
    this.joystick = new Joystick(250, 250); // 250px zone in bottom-left
  }

  static init() {
    // Only bind to the canvas to prevent messing with HTML UI overlays
    canvas.addEventListener("touchstart", e => { e.preventDefault(); this.touchStart(e); }, { passive: false });
    canvas.addEventListener("touchmove", e => { e.preventDefault(); this.touchMove(e); }, { passive: false });
    canvas.addEventListener("touchend", e => { e.preventDefault(); this.touchEnd(e); }, { passive: false });
    canvas.addEventListener("touchcancel", e => { e.preventDefault(); this.touchEnd(e); }, { passive: false });
  }

  static touchStart(e) {
    let halfWidth = window.innerWidth / 2;
    let screenHeight = window.innerHeight;

    for (let t of e.changedTouches) {
      // 1. Give the Joystick first dibs on the touch
      let handledByJoy = this.joystick.touchStart(t, screenHeight);

      // 2. If the joystick didn't need it, and it's on the right side, it's a look touch
      if (!handledByJoy && t.clientX >= halfWidth && this.lookTouchId === null) {
        this.lookTouchId = t.identifier;
        this.lx = t.clientX;
        this.ly = t.clientY;
      }
    }
  }

  static touchMove(e) {
    for (let t of e.changedTouches) {
      // Route touch to joystick
      this.joystick.touchMove(t);

      // Route touch to look camera
      if (t.identifier === this.lookTouchId) {
        let currentX = t.clientX;
        let currentY = t.clientY;

        this.ry += (this.lx - currentX) * 0.007; 
        this.rx += (this.ly - currentY) * 0.007;

        this.constraint();
        
        this.lx = currentX;
        this.ly = currentY;
      }
    }
  }

  static touchEnd(e) {
    for (let t of e.changedTouches) {
      // Route end events to components
      this.joystick.touchEnd(t);

      if (t.identifier === this.lookTouchId) {
        this.lookTouchId = null; 
      }
    }
  }

  static constraint() {
    // Combined and fixed constraint function
    if (this.rx > 1.5) this.rx = 1.5;
    if (this.rx < -1.5) this.rx = -1.5;
    
    // If you ever need to limit left/right turning, add ry limits here:
    // if (this.ry > Math.PI) this.ry -= Math.PI * 2;
    // if (this.ry < -Math.PI) this.ry += Math.PI * 2;
  }

  // Call this in your game's main render loop!
  static drawUI() {
    this.joystick.draw();
  }
}
