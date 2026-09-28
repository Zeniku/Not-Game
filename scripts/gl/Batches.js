class BaseBatch {
  constructor(gl, capacity, vertexSize, shaderInstance) {
    this.gl = gl;
    this.capacity = capacity;
    this.vertexSize = vertexSize; 
    this.data = new Float32Array(capacity * vertexSize);
    this.idx = 0;
    
    this.buffer = gl.createBuffer();
    this.currentTexture = null;
    
    // Unified Shader class instances
    this.defaultShader = shaderInstance; 
    this.currentShader = shaderInstance;
  }

  /** Safely swap out shaders (e.g., for hit-flashes, outline effects, etc.) */
  setShaderOverride(shaderInstance) {
    // Crucial: Flush any pending geometry drawn with the OLD shader first!
    if (this.idx > 0) this.flush(); 
    
    this.currentShader = shaderInstance || this.defaultShader;
  }

  begin(projMatrix) {
    this.projMatrix = projMatrix;
    this.idx = 0;
    this.currentTexture = null;
    // Always fall back to your default shader when starting a new frame pass
    this.currentShader = this.defaultShader; 
  }

  end() {
    if (this.idx > 0) this.flush();
  }

  setTexture(tex) {
    if (this.currentTexture !== tex) {
      if (this.idx > 0) this.flush();
      this.currentTexture = tex;
    }
  }

  ensureCapacity(verts) {
    if (this.idx + (verts * this.vertexSize) > this.data.length) {
      this.flush();
    }
  }

  flush() {
    if (this.idx === 0 || !this.currentTexture) return;

    const gl = this.gl;
    
    // Bind whichever shader is active (default or override)
    this.currentShader.bind(); 
    this.currentTexture.bind();
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.data.subarray(0, this.idx), gl.STREAM_DRAW);
    
    this.bindAttributes();

    // Use cached uniforms safely from the active shader wrapper
    const uProjLocation = this.currentShader.uniforms["u_projTrans"];
    if (uProjLocation) {
      gl.uniformMatrix4fv(uProjLocation, false, this.projMatrix);
    }

    const vertexCount = this.idx / this.vertexSize;
    gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
    
    this.idx = 0;
  }

  // Implemented by subclasses
  bindAttributes() {} 
}

class SpriteBatch extends BaseBatch {
  constructor(gl, capacity = 10000, shaderInstance) {
    super(gl, capacity, 8, shaderInstance);
  }
  push(x, y, u, v, r, g, b, a) {
    if (this.idx + this.vertexSize > this.data.length) this.flush();
    const d = this.data; let i = this.idx;
    d[i++] = x; d[i++] = y;
    d[i++] = u; d[i++] = v;
    d[i++] = r; d[i++] = g; d[i++] = b; d[i++] = a;
    this.idx = i;
  }
  bindAttributes() {
    const gl = this.gl;
    const STRIDE = 8 * 4;
    
    // Point to the underlying compiled program inside the Shader class instance
    const program = this.currentShader.program; 

    const locPos = gl.getAttribLocation(program, "a_pos");
    const locUv  = gl.getAttribLocation(program, "a_texCoord");
    const locCol = gl.getAttribLocation(program, "a_color");

    gl.enableVertexAttribArray(locPos);
    gl.enableVertexAttribArray(locUv);
    gl.enableVertexAttribArray(locCol);

    gl.vertexAttribPointer(locPos, 2, gl.FLOAT, false, STRIDE, 0);
    gl.vertexAttribPointer(locUv,  2, gl.FLOAT, false, STRIDE, 8);
    gl.vertexAttribPointer(locCol, 4, gl.FLOAT, false, STRIDE, 16);
  }
}
class MeshBatch extends BaseBatch {
  constructor(gl, capacity = 10000, program) {
    super(gl, capacity, 12, program); 
  }

push(x, y, z, nx, ny, nz, u, v, r, g, b, a) {
    let d = this.data; let i = this.idx;
    d[i++] = x; d[i++] = y; d[i++] = z;
    d[i++] = nx; d[i++] = ny; d[i++] = nz;
    d[i++] = u; d[i++] = v;
    d[i++] = r; d[i++] = g; d[i++] = b; d[i++] = a;
    this.idx = i;
  }

  bindAttributes() {
    const gl = this.gl;
    const STRIDE = 12 * 4; // 12 floats * 4 bytes = 48 bytes total
    const program = this.currentShader.program;
    
    const locPos = gl.getAttribLocation(program, "a_pos");
    const locNorm = gl.getAttribLocation(program, "a_normal"); 
    const locUv = gl.getAttribLocation(program, "a_texCoord");
    const locCol = gl.getAttribLocation(program, "a_color");

    gl.enableVertexAttribArray(locPos);
    gl.enableVertexAttribArray(locNorm);
    gl.enableVertexAttribArray(locUv);
    gl.enableVertexAttribArray(locCol);

    // Position (3 floats) @ offset 0
    gl.vertexAttribPointer(locPos, 3, gl.FLOAT, false, STRIDE, 0);
    
    // Normal (3 floats) @ offset 12 bytes (3 floats)
    gl.vertexAttribPointer(locNorm, 3, gl.FLOAT, false, STRIDE, 3 * 4);
    
    // UV (2 floats) @ offset 24 bytes (6 floats)
    gl.vertexAttribPointer(locUv,  2, gl.FLOAT, false, STRIDE, 6 * 4);
    
    // Color (4 floats) @ offset 32 bytes (8 floats)
    gl.vertexAttribPointer(locCol, 4, gl.FLOAT, false, STRIDE, 8 * 4);
  }
}