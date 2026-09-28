class Material {
  constructor(shader) {
    this.shader = shader;
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.texture = null;
    this.useTexture = false; // New property
  }

  bind(gl, projMatrix) {
    this.shader.bind();

    // Upload matrix
    if (this.shader.uniforms["u_projTrans"]) {
      gl.uniformMatrix4fv(this.shader.uniforms["u_projTrans"], false, projMatrix);
    }

    // Upload the boolean flag
    // gl.uniform1i expects 0 for false, 1 for true
    if (this.shader.uniforms["u_useTexture"]) {
      gl.uniform1i(this.shader.uniforms["u_useTexture"], this.useTexture ? 1 : 0);
    }
    
    // Upload texture if enabled
    if (this.useTexture && this.texture && this.shader.uniforms["u_texture"]) {
      this.texture.bind(0);
      gl.uniform1i(this.shader.uniforms["u_texture"], 0);
    }
  }
}
