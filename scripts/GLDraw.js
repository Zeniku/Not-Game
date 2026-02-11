class Texture {
  constructor(gl, image) {
    this.gl = gl;
    this.handle = gl.createTexture();
    this.width = image ? image.width : 1;
    this.height = image ? image.height : 1;
    
    gl.bindTexture(gl.TEXTURE_2D, this.handle);
    // Standard Pixel Art settings (Nearest Neighbor)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
    if (image) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    } else {
      // Create a 1x1 white pixel for drawing solid shapes
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
    }
  }
  
  bind() {
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.handle);
  }
}

// Simulates Arc's TextureRegion
class TextureRegion {
  constructor(texture, u = 0, v = 0, u2 = 1, v2 = 1) {
    this.texture = texture;
    this.u = u;  this.v = v;
    this.u2 = u2; this.v2 = v2;
    this.width = Math.abs(u2 - u) * texture.width;
    this.height = Math.abs(v2 - v) * texture.height;
  }
  
  // Helper to split a texture
  static split(texture, cols, rows) {
      // Implementation omitted for brevity, but this is where you'd slice spritesheets
  }
}

/* ============================
   SPRITE BATCHER
   Handles Texture Switching & UVs
   ============================ */
class SpriteBatch {
  constructor(gl, capacity = 10000) {
    this.gl = gl;
    this.capacity = capacity;
    this.vertexSize = 8; 
    // Data length should be capacity * vertexSize
    this.data = new Float32Array(capacity * this.vertexSize);
    this.idx = 0; // Stick to 'idx'
    
    this.buffer = gl.createBuffer();
    this.currentTexture = null;
    this.drawing = false;
  }

  begin() {
    this.drawing = true;
    this.idx = 0;
    this.currentTexture = null;
  }

  end() {
    if (this.idx > 0) this.flush();
    this.drawing = false;
  }

  setTexture(tex) {
    if (this.currentTexture !== tex) {
      if (this.idx > 0) this.flush();
      this.currentTexture = tex;
    }
  }

  /**
   * Fixed ensureCapacity: 
   * Uses 'this.idx' and accounts for the number of vertices coming in
   */
  ensureCapacity(verts) {
    if (this.idx + (verts * this.vertexSize) > this.data.length) {
      this.flush();
    }
  }

  push(x, y, u, v, r, g, b, a) {
    // Safety check: flush if this specific vertex would overflow
    if (this.idx + this.vertexSize > this.data.length) {
      this.flush();
    }
    
    const d = this.data;
    let i = this.idx;
    d[i++] = x; d[i++] = y;
    d[i++] = u; d[i++] = v;
    d[i++] = r; d[i++] = g; d[i++] = b; d[i++] = a;
    this.idx = i;
  }

  flush() {
    if (this.idx === 0 || !this.currentTexture) return;

    this.currentTexture.bind();
    
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    // Send only the portion of the array that has been filled
    gl.bufferData(gl.ARRAY_BUFFER, this.data.subarray(0, this.idx), gl.STREAM_DRAW);
    
    // Total vertices to draw is this.idx divided by the size of one vertex
    gl.drawArrays(gl.TRIANGLES, 0, this.idx / this.vertexSize);
    
    this.idx = 0;
  }
}


/* ============================
   THE DRAW API (Arc Style)
   ============================ */
class Draw {
  static init(gl) {
    this.gl = gl;
    this.batch = new SpriteBatch(gl);
    
    // 1. Create the default "Blank" texture for solid shapes
    this.whiteTex = new Texture(gl, null); 
    this.whiteRegion = new TextureRegion(this.whiteTex);

    // 2. Shader Setup (Now includes Texture handling)
    const vs = `
      attribute vec2 a_pos;
      attribute vec2 a_texCoord;
      attribute vec4 a_color;
      uniform mat3 u_matrix;
      varying vec2 v_texCoord;
      varying vec4 v_color;
      void main(){
        gl_Position = vec4((u_matrix * vec3(a_pos, 1.0)).xy, 0.0, 1.0);
        v_texCoord = a_texCoord;
        v_color = a_color;
      }
    `;
    const fs = `
      precision mediump float;
      varying vec2 v_texCoord;
      varying vec4 v_color;
      uniform sampler2D u_texture;
      void main(){
        gl_FragColor = texture2D(u_texture, v_texCoord) * v_color;
      }
    `;

    this.program = this._createProgram(vs, fs);
    gl.useProgram(this.program);

    // 3. Attribute Locations
    const STRIDE = 8 * 4; // 8 floats * 4 bytes
    this.loc = {
      pos: gl.getAttribLocation(this.program, "a_pos"),
      uv: gl.getAttribLocation(this.program, "a_texCoord"),
      col: gl.getAttribLocation(this.program, "a_color"),
      matrix: gl.getUniformLocation(this.program, "u_matrix"),
      sampler: gl.getUniformLocation(this.program, "u_texture")
    };

    // Enable Attributes
    gl.enableVertexAttribArray(this.loc.pos);
    gl.enableVertexAttribArray(this.loc.uv);
    gl.enableVertexAttribArray(this.loc.col);

    // Bind Buffer Layout (Happens once if we use one global buffer logic, 
    // but usually better done in flush. For simplicity, we bind pointers here 
    // assuming the buffer is bound during flush)
    
    // Matrix defaults
    this.matrix = new Float32Array([1,0,0, 0,1,0, 0,0,1]); // Identity
    
    // State
    this.col = [1, 1, 1, 1];
    this.colStack = [];
    this._scl = 1;
    this._rot = 0; // Global rotation offset
    
    // Blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  // Frame Lifecycle
  static begin() { this.batch.begin(); }
  static end() { this.batch.end(); }
  static setMatrix(mat) { this.matrix = mat; } // Usually Camera.mat
  static flush() {
    this.gl.useProgram(this.program);
    this.gl.uniformMatrix3fv(this.loc.matrix, false, this.matrix);
    this.gl.uniform1i(this.loc.sampler, 0);
    
    // Pointers
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.batch.buffer);
    const STRIDE = 32; // 8 * 4
    gl.vertexAttribPointer(this.loc.pos, 2, gl.FLOAT, false, STRIDE, 0);
    gl.vertexAttribPointer(this.loc.uv,  2, gl.FLOAT, false, STRIDE, 8);
    gl.vertexAttribPointer(this.loc.col, 4, gl.FLOAT, false, STRIDE, 16);

    this.batch.flush();
  }

  /* --- State Management --- */
  static color(r, g, b, a=1) { 
    if(arguments.length === 1 && Array.isArray(r)) this.col = r;
    else this.col = [r, g, b, a]; 
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
  
  /* --- The Core Draw Logic (Arc Imitation) --- */
  
  // Standard Draw.rect(region, x, y, w, h, rotation)
  static rect(region, x, y, w, h, rot = 0) {
    if (!region) region = this.whiteRegion; // Fallback to white pixel
    
    this.batch.setTexture(region.texture);
    
    // Arc draws centered by default for sprites
    const dx = -w/2; 
    const dy = -h/2; 
    
    // Precalculate rotation (Cos/Sin)
    // Note: Arc adds a global rotation state sometimes, but usually passes it in
    const cos = Math.cos(rot * Math.PI / 180);
    const sin = Math.sin(rot * Math.PI / 180);

    const [r,g,b,a] = this.col;

    // Corner 1 (Bottom Left relative to center)
    const x1 = x + (dx * cos - dy * sin);
    const y1 = y + (dx * sin + dy * cos);
    
    // Corner 2 (Top Left)
    const x2 = x + (dx * cos - (dy+h) * sin);
    const y2 = y + (dx * sin + (dy+h) * cos);
    
    // Corner 3 (Top Right)
    const x3 = x + ((dx+w) * cos - (dy+h) * sin);
    const y3 = y + ((dx+w) * sin + (dy+h) * cos);
    
    // Corner 4 (Bottom Right)
    const x4 = x + ((dx+w) * cos - dy * sin);
    const y4 = y + ((dx+w) * sin + dy * cos);

    // Push two triangles (Quad)
    // Tri 1
    this.batch.push(x1, y1, region.u,  region.v,  r,g,b,a);
    this.batch.push(x2, y2, region.u,  region.v2, r,g,b,a);
    this.batch.push(x3, y3, region.u2, region.v2, r,g,b,a);
    // Tri 2
    this.batch.push(x1, y1, region.u,  region.v,  r,g,b,a);
    this.batch.push(x3, y3, region.u2, region.v2, r,g,b,a);
    this.batch.push(x4, y4, region.u2, region.v,  r,g,b,a);
  }

  // Draw.rect(region, x, y) - uses region dimensions
  static draw(region, x, y) {
    this.rect(region, x, y, region.width, region.height, 0);
  }
  
  // Basic fill rect (uses white pixel)
  static fillRect(x, y, w, h) {
    this.rect(this.whiteRegion, x + w/2, y + h/2, w, h);
  }
  /* --- Geometric Shapes --- */

  /** Draws a filled circle using the current color */
    /* --- Geometric Shapes --- */

  /** Draws a filled circle using the current color */
  static circle(x, y, rad, segments = 0) {
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


  /** Draws a circle outline (ring) */
  static poly(x, y, rad, segments = 0, thickness = 1) {
    if (segments <= 0) segments = Math.floor(10 + Math.sqrt(rad) * 4);
    const step = (Math.PI * 2) / segments;

    for (let i = 0; i < segments; i++) {
      const a1 = i * step;
      const a2 = (i + 1) * step;
      
      const x1 = x + Math.cos(a1) * rad;
      const y1 = y + Math.sin(a1) * rad;
      const x2 = x + Math.cos(a2) * rad;
      const y2 = y + Math.sin(a2) * rad;

      // Re-uses our Draw.line which is already optimized for the batcher
      this.line(x1, y1, x2, y2, thickness);
    }
  }


  /* --- Lines --- */
  static line(x1, y1, x2, y2, cap = false) {
     // Arc implements lines as rotated rectangles using the white texture
     const len = Math.hypot(x2 - x1, y2 - y1);
     const ang = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
     const thickness = 2; // Default thickness
     
     // Center is midpoint
     const cx = x1 + (x2 - x1)/2;
     const cy = y1 + (y2 - y1)/2;

     this.rect(this.whiteRegion, cx, cy, len, thickness, ang);
  }

  /* --- Helpers --- */
  static _createProgram(vs, fs) {
    const gl = this.gl;
    const p = gl.createProgram();
    const c = (t, s) => {
      const sh = gl.createShader(t);
      gl.shaderSource(sh, s);
      gl.compileShader(sh);
      if(!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(sh));
      return sh;
    };
    gl.attachShader(p, c(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, c(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    return p;
  }
}

/* ============================
   LINES.JS (Fixed for Overflows)
   ============================ */

class Lines {
  static stroke = 1;

  static setStroke(s) {
    this.stroke = s;
  }

  /** Draws a single line. A line is 1 quad = 6 vertices */
  static line(x1, y1, x2, y2, thickness = this.stroke) {
    Draw.batch.ensureCapacity(6); // Ensure room for 1 line
    
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const ang = Math.atan2(dy, dx) * 180 / Math.PI;
    const cx = x1 + dx / 2;
    const cy = y1 + dy / 2;

    Draw.rect(Draw.whiteRegion, cx, cy, len, thickness, ang);
  }

  /** Draws a rectangle. 4 lines * 6 vertices = 24 vertices */
  static rect(x, y, width, height, thickness = this.stroke) {
    Draw.batch.ensureCapacity(24); // Ensure room for the WHOLE rectangle
    
    this.line(x, y, x + width, y, thickness);
    this.line(x, y + height, x + width, y + height, thickness);
    this.line(x, y, x, y + height, thickness);
    this.line(x + width, y, x + width, y + height, thickness);
  }

  /** Draws a circle. segments * 6 vertices per line segment */
  static circle(x, y, radius, segments = 0) {
    if (segments <= 0) segments = Math.floor(10 + Math.sqrt(radius) * 4);

    // CRITICAL: Ensure capacity for every single line segment in the circle
    Draw.batch.ensureCapacity(segments * 6);

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
