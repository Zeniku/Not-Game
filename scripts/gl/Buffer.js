/* ==========================================================================
   VERTEX BUFFER OBJECT (VBO)
   ========================================================================== */
class VertexBuffer {
  constructor(gl, usage = gl.STATIC_DRAW) {
    this.gl = gl;
    this.handle = gl.createBuffer();
    this.usage = usage;
    this.isBound = false;
  }

  bind() {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.handle);
    this.isBound = true;
  }

  unbind() {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
    this.isBound = false;
  }

  upload(data) {
    if (!this.isBound) this.bind();
    this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.usage);
  }

  uploadSubData(data, offset = 0) {
    if (!this.isBound) this.bind();
    this.gl.bufferSubData(this.gl.ARRAY_BUFFER, offset, data);
  }

  destroy() {
    this.gl.deleteBuffer(this.handle);
    this.handle = null;
  }
}

/* ==========================================================================
   SHADOW FRAMEBUFFER (FBO)
   ========================================================================== */
class ShadowMapFBO {
  constructor(gl, width = 2048, height = 2048) {
    this.gl = gl;
    this.width = width;
    this.height = height;

    // 1. Create the Framebuffer
    this.handle = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.handle);

    // 2. Create the Depth Texture
    this.depthTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.depthTexture);
    
    // Inside your ShadowMapFBO constructor:


// Keep your hardware linear filtering lines!
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

// ==========================================================================
// ADD THESE TWO LINES TO ACTIVATE HARDWARE DEPTH COMPARISON:
// ==========================================================================
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);

    // Allocating WebGL 2 optimized 24-bit depth storage 
    // (Provides sharper shadow edges than 16-bit)
    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, 
      width, height, 0, 
      gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null
    );

    // 3. Attach the texture to the Framebuffer's depth attachment point
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, 
      gl.TEXTURE_2D, this.depthTexture, 0
    );

    // CRITICAL WEBGL 2 STEP: Explicitly tell the FBO there are no color attachments
    gl.drawBuffers([gl.NONE]);
    gl.readBuffer(gl.NONE);

    // Double-check everything is configured perfectly
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
        console.error("Shadow Framebuffer is broken! Status code:", status);
    }

    // 4. Clean up state
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  bind() {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.handle);
    gl.viewport(0, 0, this.width, this.height);
    
    // Explicitly shut off color writing for this pass
    gl.drawBuffers([gl.NONE]);
    gl.readBuffer(gl.NONE);
  }

  unbind(screenWidth, screenHeight) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, screenWidth, screenHeight);
    
    // CRITICAL FIX: Restore normal color drawing capabilities for the main screen
    gl.drawBuffers([gl.BACK]);
  }
}
