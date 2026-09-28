/* ==========================================================================
   THE DRAW API
   ========================================================================== */
class Draw {
  static init(gl) {
    this.gl = gl;
    Shaders.init(gl);
    // Locate this check in your codebase and update it:
if (gl instanceof WebGLRenderingContext) { 
    // We are in WebGL 1, so the extension IS required
    const depthExt = gl.getExtension('WEBGL_depth_texture');
    if (!depthExt) {
        console.error("This browser/hardware does not support WebGL depth textures!");
    }
} else {
    // We are in WebGL 2! Core depth features are implicitly supported.
    console.log("WebGL 2 detected: Native depth textures active.");
}

    this.batch2D = new SpriteBatch(gl, 10000, Shaders.sprite2D);
    this.batch3D = new MeshBatch(gl, 10000, Shaders.mesh3D);
    this.batch = this.batch2D;
    
    this.whiteTex = new Texture(gl, null); 
    this.whiteRegion = new TextureRegion(this.whiteTex);
    
    this.updateMatrices(window.innerWidth, window.innerHeight);
    this.col = [1, 1, 1, 1];
    this.colStack = [[1, 1, 1, 1]];
  }

  static useBatch(newBatch, projection) {
  // 1. If we are swapping to a completely different batch (e.g., 2D -> 3D),
  // we must flush the old batch's geometry to the screen first.
  if (this.batch && this.batch !== newBatch) {
    this.batch.end();
  }
  
  // 2. Update our active batch reference
  this.batch = newBatch;
  
  // 3. ALWAYS call begin! This resets the index to 0 and 
  // safely caches the new projection matrix for the current frame.
  this.batch.begin(projection);
}


  static setup3DUniforms() {
    const gl = this.gl;
    const shader = Shaders.mesh3D;
    shader.bind();
    gl.uniform3f(shader.uniforms["u_lightDir"], global.lightx, 1.0, global.lightx);
    gl.uniform3f(shader.uniforms["u_fogColor"], 135/255, 206/255, 235/255);
    gl.uniform3f(shader.uniforms["u_cameraPos"], TouchHandler.tx, TouchHandler.ty, TouchHandler.tz);
  }
  static set2dMatrix(mat){
    this.proj2D = mat
  }
  static updateMatrices(wi, hi) {
    const fov = global.zoomv || 70;
    const aspect = wi / hi;
    let projection = Matrix4.perspective(fov, aspect, 0.1, 1000.0);
    
    let view = Matrix4.identity();
    view = Matrix4.rotateX(view, TouchHandler.rx);
    view = Matrix4.rotateY(view, TouchHandler.ry);
    view = Matrix4.translate(view, -TouchHandler.tx, -TouchHandler.ty, -TouchHandler.tz);

    this.proj3D = Matrix4.multiply(projection, view);
    this.proj2D = Matrix4.ortho(0, wi, hi, 0, -1, 1);
  }

  static begin2D() {
    this.gl.disable(this.gl.DEPTH_TEST);
    this.gl.disable(this.gl.CULL_FACE);
    this.useBatch(this.batch2D, this.proj2D);
  }

  static begin3D() {
    this.setup3DUniforms();
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.enable(this.gl.CULL_FACE);
    this.useBatch(this.batch3D, this.proj3D);
    this.batch.setTexture(this.whiteTex); 
  }

  static end() { this.batch.end(); }

  // --- 2D Helpers ---
  static color(r, g, b, a = 1) { 
    if (arguments.length === 1 && Array.isArray(r)) this.col = r;
    else this.col = [r, g, b, a]; 
  }

  static rect(region, x, y, w, h, rot = 0) {
  if (this.batch !== this.batch2D) this.begin2D();
  if (!region) region = this.whiteRegion;
  
  this.batch.setTexture(region.texture);
  this.batch.ensureCapacity(6);
  
  const [r,g,b,a] = this.col;

  if (rot === 0) {
    // FAST PATH: Zero trigonometry overhead for static tiles
    const left = x - w/2;
    const right = x + w/2;
    const top = y - h/2;
    const bottom = y + h/2;

    // Push directly
    this.batch.push(left, top, region.u, region.v, r,g,b,a);
    this.batch.push(left, bottom, region.u, region.v2, r,g,b,a);
    this.batch.push(right, bottom, region.u2, region.v2, r,g,b,a);
    this.batch.push(left, top, region.u, region.v, r,g,b,a);
    this.batch.push(right, bottom, region.u2, region.v2, r,g,b,a);
    this.batch.push(right, top, region.u2, region.v, r,g,b,a);
  } else {
    // SLOW PATH: Use matrix rotation for entities/bullets
    const dx = -w/2, dy = -h/2; 
    const cos = Math.cos(rot * Math.PI / 180);
    const sin = Math.sin(rot * Math.PI / 180);

    const x1 = x + (dx * cos - dy * sin), y1 = y + (dx * sin + dy * cos);
    const x2 = x + (dx * cos - (dy+h) * sin), y2 = y + (dx * sin + (dy+h) * cos);
    const x3 = x + ((dx+w) * cos - (dy+h) * sin), y3 = y + ((dx+w) * sin + (dy+h) * cos);
    const x4 = x + ((dx+w) * cos - dy * sin), y4 = y + ((dx+w) * sin + dy * cos);

    this.batch.push(x1, y1, region.u,  region.v,  r,g,b,a);
    this.batch.push(x2, y2, region.u,  region.v2, r,g,b,a);
    this.batch.push(x3, y3, region.u2, region.v2, r,g,b,a);
    this.batch.push(x1, y1, region.u,  region.v,  r,g,b,a);
    this.batch.push(x3, y3, region.u2, region.v2, r,g,b,a);
    this.batch.push(x4, y4, region.u2, region.v,  r,g,b,a);
  }
}

  static circle(x, y, rad, segments = 0) {
    this.batch = this.batch2D
    if (segments <= 0) segments = Math.floor(10 + Math.sqrt(rad) * 4);
    
    const region = this.whiteRegion;
    this.batch.setTexture(region.texture);

    // CRITICAL: We are about to push 'segments * 3' vertices.
    // We must ensure there is room for ALL of them right now.
    this.batch.ensureCapacity(segments * 3);

    const [r, g, b, a] = this.col;
    const { u, v } = region;
    const step = (Math.PI * 2) / segments;

    for (let i = 0; i < segments; i++) {
        const a1 = i * step;
        const a2 = (i + 1) * step;

        const x1 = x + Math.cos(a1) * rad;
        const y1 = y + Math.sin(a1) * rad;
        const x2 = x + Math.cos(a2) * rad;
        const y2 = y + Math.sin(a2) * rad;

        // We use this.batch.push directly. 
        // Since we ensured capacity above, this loop is now safe.
        
        // Vertex 1: Center
        this.batch.push(x, y, u, v, r, g, b, a);
        // Vertex 2: First edge
        this.batch.push(x1, y1, u, v, r, g, b, a);
        // Vertex 3: Second edge
        this.batch.push(x2, y2, u, v, r, g, b, a);
    }
}
static colorRGBA(r,g,b,a=1){ this.col=[r,g,b,a]; }
  static pushColor(){ this.colStack.push([...this.col]); }
  static popColor(){ if(this.colStack.length>1) this.col=this.colStack.pop(); }
  static resetColor(){ this.col=[1,1,1,1]; this.colStack=[[1,1,1,1]];}

  static withColor(c,a,fn){
    this.pushColor();
    if(typeof c==="string") this.colorHex(c,a);
    else if(typeof c==="number") this.colorHSL(c,1,0.5,a);
    else this.colorRGBA(...c);
    fn();
    this.popColor();
  }
  static colorHex(hex,a=1){
    hex = hex.replace("#","");
    if(hex.length===3) hex=hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    const n=parseInt(hex,16);
    this.colorRGBA(
      ((n>>16)&255)/255,
      ((n>>8)&255)/255,
      (n&255)/255,
      a
    );
  }

  static colorHSL(h,s,l,a=1){
    h=((h%360)+360)%360;
    const c=(1-Math.abs(2*l-1))*s;
    const x=c*(1-Math.abs((h/60)%2-1));
    const m=l-c/2;
    let r=0,g=0,b=0;
    if(h<60){r=c;g=x;}
    else if(h<120){r=x;g=c;}
    else if(h<180){g=c;b=x;}
    else if(h<240){g=x;b=c;}
    else if(h<300){r=x;b=c;}
    else{r=c;b=x;}
    this.colorRGBA(r+m,g+m,b+m,a);
  }
  static alpha(a) { this.col[3] = a; }
  static reset() { this.col = [1,1,1,1]; this._scl = 1; this._rot = 0; }
  
}
class Lines {
  static stroke = 1;
  static setStroke(s) { this.stroke = s; }

  static line(x1, y1, x2, y2, thickness = this.stroke) {
    Draw.batch2D.ensureCapacity(6); 
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const ang = Math.atan2(dy, dx) * 180 / Math.PI;
    Draw.rect(Draw.whiteRegion, x1 + dx / 2, y1 + dy / 2, len, thickness, ang);
  }

  static rect(x, y, width, height, thickness = this.stroke) {
    Draw.batch2D.ensureCapacity(24);
    this.line(x, y, x + width, y, thickness);
    this.line(x, y + height, x + width, y + height, thickness);
    this.line(x, y, x, y + height, thickness);
    this.line(x + width, y, x + width, y + height, thickness);
  }

  /** Draws a circle. segments * 6 vertices per line segment */
  static circle(x, y, radius, segments = 0) {

    if (segments <= 0) segments = Math.floor(10 + Math.sqrt(radius) * 4);

    // CRITICAL: Ensure capacity for every single line segment in the circle
    Draw.batch2D.ensureCapacity(segments * 6);

    const step = (Math.PI * 2) / segments;
    for (let i = 0; i < segments; i++) {
      const a1 = i * step;
      const a2 = (i + 1) * step;

      // We use the raw line logic here to avoid redundant capacity checks
      this.line(
        x + Math.cos(a1) * radius,
        y + Math.sin(a1) * radius,
        x + Math.cos(a2) * radius,
        y + Math.sin(a2) * radius,
        this.stroke
      );
    }
  }
}