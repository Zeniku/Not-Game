
class Mesh {
  constructor(gl, positions, normals, colors, indices, defaultMaterial = null) {
    this.gl = gl;
    this.vertexCount = indices.length;
    this.material = defaultMaterial; // Optional fallback material
    
    // ... [VAO and VBO setup remains the same] ...
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);

    // Setup positions, normals, and colors sequentially or interleaved
    // (Assuming standard manual sequential buffering for example brevity)
    this._setupAttribute(positions, "a_pos", 3);
    this._setupAttribute(normals, "a_normal", 3); // Octahedral packed normal
    this._setupAttribute(colors, "a_color", 4);

    // Index Buffer
    this.ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), gl.STATIC_DRAW);

    gl.bindVertexArray(null); // Unbind VAO
  }
  _setupAttribute(data, attribName, size) {
    const gl = this.gl;
    const loc = gl.getAttribLocation(this.material.shader.program, attribName);
    
// DEBUG: Is the attribute active in your vertex shader?
if (loc === -1) {
  console.error(`Attribute ${attribName} not found in shader!`);
  return;
}
    if (loc !== -1) {
      const vbo = new VertexBuffer(gl);
      vbo.upload(new Float32Array(data));
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    }
  }
  // The new flexible render method!
    // Replace your existing Mesh.render method with this:
  render(overrideShader = null, drawMode = this.gl.TRIANGLES) {
    const gl = this.gl;
    
    // 1. Decide which shader to use (Override takes absolute priority)
    const activeShader = overrideShader || (this.material ? this.material.shader : null);
    if (!activeShader) return; 

    // 2. Only bind the shader if the engine hasn't already bound it
    // (This saves massive performance in loops!)
    activeShader.bind();

    // 3. Handle Texture Mapping ONLY if we are in the main color pass
    // (We don't want to waste time binding textures during a shadow depth pass)
    if (!overrideShader && this.material && this.material.texture) {
        this.material.texture.bind();
        if (activeShader.uniforms["u_texture"]) {
            gl.uniform1i(activeShader.uniforms["u_texture"], 0);
        }
    }

    // 4. Draw Geometry
    gl.bindVertexArray(this.vao);
    gl.drawElements(drawMode, this.vertexCount, gl.UNSIGNED_INT, 0);
    gl.bindVertexArray(null);
  }

}

/* ==========================================================================
   OPTIMIZED TERRAIN MESH (Heights Only)
   ========================================================================== */
class TerrainMesh{
  constructor(gl, heights, material) {
    this.gl = gl;
    this.vertexCount = heights.length;
    this.material = material;

    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);

    // Only bind height array
    const locHeight = gl.getAttribLocation(this.material.shader.program, "a_height");
    if (locHeight !== -1) {
      this.vbo = new VertexBuffer(gl);
      this.vbo.upload(new Float32Array(heights));
      gl.enableVertexAttribArray(locHeight);
      gl.vertexAttribPointer(locHeight, 1, gl.FLOAT, false, 0, 0);
    }

    gl.bindVertexArray(null);
  }

  render(projMatrix) {
    this.material.bind(this.gl, projMatrix);
    this.gl.bindVertexArray(this.vao);
    // Render using dynamic triangle strips evaluated on the GPU via gl_VertexID
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.vertexCount);
    this.gl.bindVertexArray(null);
  }
}
