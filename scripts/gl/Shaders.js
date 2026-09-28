/* ============================
   CORE SHADERS
   ============================ */
const ShaderSources = {
  vsDepth: `#version 300 es
    in vec3 a_pos;
    uniform mat4 u_projTrans;
    
    void main() {
        gl_Position = u_projTrans * vec4(a_pos, 1.0);
    }
  `,
  fsDepth: `#version 300 es
    precision mediump float;
    out vec4 fragColor;
    
    void main() {
        // Depth is written automatically by the GPU hardware
        fragColor = vec4(1.0); 
    }
  `,
  vs2D: `
    attribute vec2 a_pos;
    attribute vec2 a_texCoord;
    attribute vec4 a_color;
    uniform mat4 u_projTrans;
    varying vec2 v_texCoord;
    varying vec4 v_color;
    void main(){
      gl_Position = u_projTrans * vec4(a_pos, 0.0, 1.0);
      v_texCoord = a_texCoord;
      v_color = a_color;
    }
  `,
  fs2D: `
    precision mediump float;
    varying vec2 v_texCoord;
    varying vec4 v_color;
    uniform sampler2D u_texture;
    void main(){
      gl_FragColor = texture2D(u_texture, v_texCoord) * v_color;
    }
  `,

  // WebGL 2 Version of 3D Shader
  vs3D: `#version 300 es
in vec3 a_pos;
in vec3 a_normal;
in vec4 a_color;
in vec2 a_texCoord;

uniform mat4 u_model;           
uniform mat4 u_viewProj;        
uniform mat4 u_lightSpaceMatrix;

out vec3 v_normal;
out vec3 v_worldPos;
out vec4 v_color;
out vec2 v_texCoord;
out vec4 v_lightSpacePos;    

void main() {
    vec4 worldPos = u_model * vec4(a_pos, 1.0);
    v_worldPos = worldPos.xyz;
    v_normal = mat3(u_model) * a_normal;
    v_color = a_color;
    v_texCoord = a_texCoord;
    v_lightSpacePos = u_lightSpaceMatrix * worldPos; 
    gl_Position = u_viewProj * worldPos;
}
  `,
  fs3D: `#version 300 es
precision mediump float;

precision mediump sampler2DShadow;
in vec3 v_normal;
in vec3 v_worldPos;
in vec4 v_color;
in vec2 v_texCoord;
in vec4 v_lightSpacePos; 

uniform vec3 u_lightDir;
uniform vec3 u_cameraPos;
uniform vec3 u_fogColor;
uniform sampler2D u_texture;

// CRITICAL FIX: Changed sampler2D to sampler2DShadow to match JavaScript!
uniform sampler2DShadow u_shadowMap; 
uniform bool u_useTexture;

out vec4 fragColor; 

const vec2 poissonDisk[4] = vec2[](
  vec2( -0.94201624, -0.39906216 ),
  vec2(  0.94558609, -0.76890725 ),
  vec2( -0.09418410, -0.92938870 ),
  vec2(  0.34495938,  0.29387760 )
);

float ShadowCalculation(vec4 fragPosLightSpace, vec3 normal, vec3 lightDir) {
    vec3 projCoords = fragPosLightSpace.xyz / fragPosLightSpace.w;
    projCoords = projCoords * 0.5 + 0.5;

    // 1. Calculate the fade factor (0.0 at edges, 1.0 at center)
    // We look at how close we are to the 0.0 or 1.0 boundary
    float distToEdgeX = min(projCoords.x, 1.0 - projCoords.x);
    float distToEdgeY = min(projCoords.y, 1.0 - projCoords.y);
    
    // We define a "fade zone" (e.g., 10% of the shadow map size)
    float fadeZone = 0.1; 
    float fade = smoothstep(0.0, fadeZone, distToEdgeX) * smoothstep(0.0, fadeZone, distToEdgeY);

    // Guard clause: If completely outside, return 0.0 (no shadow)
    if(projCoords.x < 0.0 || projCoords.x > 1.0 || 
       projCoords.y < 0.0 || projCoords.y > 1.0 || 
       projCoords.z > 1.0) {
        return 0.0; 
    }

    float bias = max(0.002 * (1.0 - dot(normal, lightDir)), 0.0005);
    float currentDepth = projCoords.z - bias;
    
    float visibility = 0.0;
    vec2 texelSize = 1.0 / vec2(textureSize(u_shadowMap, 0));
    float blurScale = 1.0; 

    for (int i = 0; i < 4; i++) {
        vec2 offset = poissonDisk[i] * texelSize * blurScale;
        visibility += texture(u_shadowMap, vec3(projCoords.xy + offset, currentDepth));
    }
    
    // 2. Multiply the shadow intensity by the fade factor
    // As we reach the edge, 'fade' becomes 0, so shadow intensity becomes 0.
    return (1.0 - (visibility / 4.0)) * fade;
}


void main() {
    vec3 normal = normalize(v_normal);
    vec3 lightDir = normalize(u_lightDir);
    
    float diffuse = max(dot(normal, lightDir), 0.0);
    float ambient = 0.3;
    
    float shadow = ShadowCalculation(v_lightSpacePos, normal, lightDir);
    float light = ambient + (1.0 - ambient) * (1.0 - shadow) * diffuse;
    
    vec4 texColor = vec4(1.0, 1.0, 1.0, 1.0);
    if (u_useTexture) {
        texColor = texture(u_texture, v_texCoord); 
    }
    vec4 combinedColor = v_color * texColor;
    vec3 litColor = combinedColor.rgb * light; 

    float dist = distance(v_worldPos, u_cameraPos);
    float fogDensity = 0.0015; 
    float fogFactor = clamp(1.0 - exp(-dist * fogDensity), 0.0, 1.0);

    fragColor = vec4(mix(litColor, u_fogColor, fogFactor), combinedColor.a);
}
  `,
  vs3D_Opt: `#version 300 es
    in vec3 a_pos;
    in vec2 a_normalPacked; 
    in vec4 a_color;

    uniform mat4 u_projTrans;
    
    out vec3 v_worldPos;
    out vec2 v_normalPacked;
    out vec4 v_color;

    void main() {
        v_worldPos = a_pos;
        v_normalPacked = a_normalPacked;
        v_color = a_color;
        gl_Position = u_projTrans * vec4(a_pos, 1.0);
    }
  `,
  fs3D_Opt: `#version 300 es
    precision highp float;
    
    in vec3 v_worldPos;
    in vec2 v_normalPacked; 
    in vec4 v_color;

    uniform vec3 u_lightDir;
    uniform vec3 u_cameraPos;
    uniform vec3 u_fogColor;
    
    out vec4 fragColor;

    vec3 decodeNormal(vec2 p) {
        p = p * 2.0 - 1.0;
        vec3 n = vec3(p.x, 1.0 - abs(p.x) - abs(p.y), p.y);
        float t = clamp(-n.y, 0.0, 1.0);
        n.x += n.x >= 0.0 ? -t : t;
        n.z += n.z >= 0.0 ? -t : t;
        return normalize(n);
    }

    void main() {
        vec3 normal = decodeNormal(v_normalPacked);

        float diffuse = max(dot(normal, normalize(u_lightDir)), 0.0);
        float ambient = 0.3;
        float light = ambient + (1.0 - ambient) * diffuse;
        
        vec3 litColor = v_color.rgb * light;

        float dist = distance(v_worldPos, u_cameraPos);
        float fogFactor = clamp(1.0 - exp(-dist * 0.0002), 0.0, 1.0);

        fragColor = vec4(mix(litColor, u_fogColor, fogFactor), v_color.a);
    }
  `
};


class Shader {
  constructor(gl, vsSource, fsSource) {
    this.gl = gl;
    this.program = this._createProgram(vsSource, fsSource);
    this.uniforms = {};
    this._cacheUniforms();
  }

  bind() {
    this.gl.useProgram(this.program);
  }

  _cacheUniforms() {
    const gl = this.gl;
    const numUniforms = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < numUniforms; i++) {
      const info = gl.getActiveUniform(this.program, i);
      this.uniforms[info.name] = gl.getUniformLocation(this.program, info.name);
    }
  }

  _createProgram(vs, fs) {
    const gl = this.gl;
    const p = gl.createProgram();
    const compile = (type, source) => {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, source);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(sh));
      }
      return sh;
    };
    gl.attachShader(p, compile(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    return p;
  }
}


const Shaders = {
  // This will hold your actual compiled Shader class instances
  sprite2D: null,
  mesh3D: null,
  mesh3DOpt: null,
  depth: null,

  /** Compiles all shaders once at startup */
  init(gl) {
    this.sprite2D   = new Shader(gl, ShaderSources.vs2D, ShaderSources.fs2D);
    this.mesh3D     = new Shader(gl, ShaderSources.vs3D, ShaderSources.fs3D);
    this.mesh3DOpt  = new Shader(gl, ShaderSources.vs3D_Opt, ShaderSources.fs3D_Opt);
    this.depth      = new Shader(gl, ShaderSources.vsDepth, ShaderSources.fsDepth);
    console.log("All engine shaders compiled successfully.");
  }
};
