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


class TextureAtlas {
  constructor(gl) {
    this.gl = gl;
    this.regions = {};
    this.texture = null;
  }
async load(images) {
    // images = { name: "url" }
    const loaded = {};

  for (let name in images) {
    try {
      loaded[name] = await this._loadImage(images[name]);
    } catch (e) {
      console.warn(`Skipping ${name}: Image not found at ${images[name]}`);
      // Create a tiny 2x2 red/pink canvas as a placeholder
      const placeholder = document.createElement("canvas");
      placeholder.width = 8; placeholder.height = 8;
      const ctx = placeholder.getContext("2d");
      ctx.fillStyle = "magenta";
      ctx.fillRect(0,0,8,8);
      loaded[name] = placeholder;
    }
  }

    // 2. Pack (simple row packing)
    const padding = 2;
    let atlasWidth = 0;
    let atlasHeight = 0;

    let x = 0;
    let y = 0;
    let rowHeight = 0;

    const positions = {};

    for (let name in loaded) {
      const img = loaded[name];

      if (x + img.width > 2048) {
        x = 0;
        y += rowHeight + padding;
        rowHeight = 0;
      }

      positions[name] = { x, y, w: img.width, h: img.height };

      x += img.width + padding;
      rowHeight = Math.max(rowHeight, img.height);

      atlasWidth = Math.max(atlasWidth, x);
      atlasHeight = Math.max(atlasHeight, y + img.height);
    }

    // 3. Draw atlas to canvas
    const canvas = document.createElement("canvas");
    canvas.width = this._nextPow2(atlasWidth);
    canvas.height = this._nextPow2(atlasHeight);

    const ctx = canvas.getContext("2d");

    for (let name in loaded) {
      const pos = positions[name];
      ctx.drawImage(loaded[name], pos.x, pos.y);
    }

    // 4. Upload to GPU
    this.texture = new Texture(this.gl, canvas);

    // 5. Create regions
    for (let name in positions) {
      const p = positions[name];

      const u = p.x / canvas.width;
      const v = p.y / canvas.height;
      const u2 = (p.x + p.w) / canvas.width;
      const v2 = (p.y + p.h) / canvas.height;

      this.regions[name] =
        new TextureRegion(this.texture, u, v, u2, v2);
    }

    return this;
  }
  

  find(name) {
    return this.regions[name];
  }

  _loadImage(src) {
  return new Promise(res => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => {
      console.warn("Failed to load:", src);
      // Return a tiny transparent canvas so the atlas can still "pack" it
      const fallback = document.createElement("canvas");
      fallback.width = 1; fallback.height = 1;
      res(fallback); 
    };
    img.src = src;
  });
}


  _nextPow2(v) {
  if (v <= 0) return 1; // Safety first!
  return 2 ** Math.ceil(Math.log2(v));
}

  
  has(name) {
    return name in this.regions;
  }
  
  getNames() {
    return Object.keys(this.regions);
  }
}