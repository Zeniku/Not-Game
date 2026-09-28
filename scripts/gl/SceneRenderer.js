/* ==========================================================================
   SCENE RENDERER ENGINE PIPELINE
   ========================================================================== */
class SceneRenderer {
  static init(gl) {
    this.gl = gl;
    this.renderQueue = [];
    
    // Use the unified class instead of reinventing it
    this.shadowFBO = new ShadowMapFBO(gl, 2048, 2048); 
    
    // Global shader for the shadow pass
    this.depthShader = new Shader(gl, ShaderSources.vsDepth, ShaderSources.fsDepth); 
  }

  // Store the mesh AND its specific transform matrix
  static submit(meshInstance, modelMatrix) {
    this.renderQueue.push({ mesh: meshInstance, transform: modelMatrix });
  }

    
static renderScene(cameraProjViewMatrix, lightProjViewMatrix) {
    const gl = this.gl;

    // ==========================================
    // PASS 1: DEPTH / SHADOW PASS
    // ==========================================
    this.shadowFBO.bind();
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.FRONT); // Render back-faces to shadow map to fix acne
    gl.clear(gl.DEPTH_BUFFER_BIT);
    
        // Inside SceneRenderer.renderScene() -> PASS 1:
    this.depthShader.bind();
    for (let item of this.renderQueue) {
        let lightMvp = Matrix4.multiply(lightProjViewMatrix, item.transform);
        gl.uniformMatrix4fv(this.depthShader.uniforms["u_projTrans"], false, lightMvp);
        
        // CRITICAL: Pass the depth shader here so the mesh doesn't hijack it!
        item.mesh.render(this.depthShader); 
    }

    this.shadowFBO.unbind(gl.canvas.width, gl.canvas.height);

    // ==========================================
    // PASS 2: MAIN COLOR PASS
    // ==========================================
    gl.clearColor(135/255, 206/255, 235/255, 1.0); 
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE); 
    gl.cullFace(gl.BACK); 
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const shader = Shaders.mesh3D;
    shader.bind();

    // Bind Depth Map
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.shadowFBO.depthTexture);
    gl.uniform1i(Shaders.mesh3D.uniforms["u_shadowMap"], 1);


    // Compute dynamic light direction vector

// Pass the global sun direction to your main shader so the lighting matches the shadows
//Shaders.mesh3D.bind();
    gl.uniform3f(Shaders.mesh3D.uniforms["u_lightDir"], global.sunDirection[0], global.sunDirection[1], global.sunDirection[2]);
    gl.uniform3f(shader.uniforms["u_fogColor"], 135/255, 206/255, 235/255); 
    gl.uniform3f(shader.uniforms["u_cameraPos"], TouchHandler.tx, TouchHandler.ty, TouchHandler.tz); 
    
    // Pass the raw Light View-Projection Matrix directly
    gl.uniformMatrix4fv(shader.uniforms["u_lightSpaceMatrix"], false, lightProjViewMatrix);
    // Pass the raw Camera View-Projection Matrix directly
    gl.uniformMatrix4fv(shader.uniforms["u_viewProj"], false, cameraProjViewMatrix);

    for (let item of this.renderQueue) {
        // Pass the individual object's transform directly as the model matrix
        gl.uniformMatrix4fv(shader.uniforms["u_model"], false, item.transform);
      
        if (item.mesh.material) {
            // If your material binding system forces an old matrix update, 
            // ensure it doesn't overwrite your active uniform setups.
            item.mesh.material.bind(gl, Matrix4.multiply(cameraProjViewMatrix, item.transform)); 
        }
      
        if(item.mesh.render) item.mesh.render(); 
    }

    this.renderQueue = [];
}



}

