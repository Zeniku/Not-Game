// --- 1. ARC POLYFILLS ---
// JavaScript lacks Arc's Mathf, Vec2, and Rand classes, so we provide lightweight equivalents.

const radDeg = 180 / Math.PI;
const degRad = Math.PI / 180;

// Proper modulo for negative numbers, mimicking Arc's Mathf.mod()
function mod(n, m) {
    return ((n % m) + m) % m;
}

function cosDeg(deg) {
    return Math.cos(deg * degRad);
}

function sinDeg(deg) {
    return Math.sin(deg * degRad);
}

// Minimal Vec2 replica
class Vec2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }
    rotate(degrees) {
        const rad = degrees * degRad;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const newX = this.x * cos - this.y * sin;
        const newY = this.x * sin + this.y * cos;
        this.x = newX;
        this.y = newY;
        return this;
    }
    trns(angle, len) {
        this.x = len * cosDeg(angle);
        this.y = len * sinDeg(angle);
        return this;
    }
}

// Minimal Seeded PRNG replica (Simple Linear Congruential Generator)
class Rand {
    constructor(seed = 0) {
        this.seed = seed;
    }
    setSeed(seed) {
        this.seed = seed >>> 0; // Ensure 32-bit unsigned integer
    }
    next() {
        // Basic LCG algorithm
        this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
        return this.seed / 4294967296;
    }
    nextFloat() {
        return this.next();
    }
    random(range) {
        return this.next() * range;
    }
    range(range) {
        return (this.next() - 0.5) * 2 * range;
    }
}

// Internal static instances
const rand = new Rand();
const rv = new Vec2();

// --- 2. ANGLES MODULE ---
// Replaces the Angles.java public static methods.

const Angles = {
    forwardDistance(angle1, angle2) {
        return Math.abs(angle1 - angle2);
    },

    backwardDistance(angle1, angle2) {
        return 360 - Math.abs(angle1 - angle2);
    },

    within(a, b, margin) {
        return Angles.angleDist(a, b) <= margin;
    },

    angleDist(a, b) {
        a = mod(a, 360);
        b = mod(b, 360);
        return Math.min(a - b < 0 ? a - b + 360 : a - b, b - a < 0 ? b - a + 360 : b - a);
    },

    near(a, b, range) {
        return Angles.angleDist(a, b) < range;
    },

    clampRange(angle, dest, range) {
        const dst = Angles.angleDist(angle, dest);
        return dst <= range ? angle : Angles.moveToward(angle, dest, dst - range);
    },

    moveToward(angle, to, speed) {
        if (Math.abs(Angles.angleDist(angle, to)) < speed) return to;
        angle = mod(angle, 360);
        to = mod(to, 360);

        if ((angle > to) === (Angles.backwardDistance(angle, to) > Angles.forwardDistance(angle, to))) {
            angle -= speed;
        } else {
            angle += speed;
        }

        return angle;
    },

    // Overloaded angle() methods combined
    angle(x, y, x2 = null, y2 = null) {
        if (x2 === null || y2 === null) {
            return Angles.angle(0, 0, x, y);
        }
        // In standard JS Math, atan2 takes (dy, dx).
        let ang = Math.atan2(y2 - y, x2 - x) * radDeg;
        if (ang < 0) ang += 360;
        return ang;
    },

    angleRad(x, y, x2, y2) {
        return Math.atan2(y2 - y, x2 - x);
    },

    // Handles both trnsx(angle, len) AND trnsx(angle, x, y)
    trnsx(angle, lenOrX, y = null) {
        if (y === null) {
            return lenOrX * cosDeg(angle);
        }
        return rv.set(lenOrX, y).rotate(angle).x;
    },

    // Handles both trnsy(angle, len) AND trnsy(angle, x, y)
    trnsy(angle, lenOrX, y = null) {
        if (y === null) {
            return lenOrX * sinDeg(angle);
        }
        return rv.set(lenOrX, y).rotate(angle).y;
    },

    // NOTE: Adapted to require explicit passing of standard core dependencies
    mouseAngle(cx, cy, cameraProjectCallback, mouseX, mouseY) {
        const avector = cameraProjectCallback(cx, cy); // Should return a vector object {x, y}
        return Angles.angle(avector.x, avector.y, mouseX, mouseY);
    },

    // --- Vector/Particle Iterators ---
    // Note: Java's Floatc2 is translated to a standard callback function: (x, y) => { ... }
    
    circleVectors(points, length, offsetOrCallback, posCallback) {
        const hasOffset = typeof offsetOrCallback === "number";
        const offset = hasOffset ? offsetOrCallback : 0;
        const callback = hasOffset ? posCallback : offsetOrCallback;

        for (let i = 0; i < points; i++) {
            let f = (i * 360 / points) + offset;
            callback(Angles.trnsx(f, length), Angles.trnsy(f, length));
        }
    },

    randVectors(seed, amount, length, cons) {
        rand.setSeed(seed);
        for (let i = 0; i < amount; i++) {
            rv.trns(rand.random(360), length);
            cons(rv.x, rv.y);
        }
    },

    // In Java these are heavily overloaded. We use explicit suffixes in JS to avoid brittle argument-sniffing.

    randLenVectors(seed, amount, length, cons) {
        rand.setSeed(seed);
        for (let i = 0; i < amount; i++) {
            rv.trns(rand.random(360), rand.random(length));
            cons(rv.x, rv.y);
        }
    },

    randLenVectorsMin(seed, amount, minLength, length, cons) {
        rand.setSeed(seed);
        for (let i = 0; i < amount; i++) {
            rv.trns(rand.random(360), minLength + rand.random(length));
            cons(rv.x, rv.y);
        }
    },

    randLenVectorsAngle(seed, amount, length, angle, range, cons) {
        rand.setSeed(seed);
        for (let i = 0; i < amount; i++) {
            rv.trns(angle + rand.range(range), rand.random(length));
            cons(rv.x, rv.y);
        }
    },

    randLenVectorsSpread(seed, amount, length, angle, range, spread, cons) {
        rand.setSeed(seed);
        for (let i = 0; i < amount; i++) {
            rv.trns(angle + rand.range(range), rand.random(length));
            cons(rv.x + rand.range(spread), rv.y + rand.range(spread));
        }
    },

    // ParticleConsumer equivalents: callback looks like (x, y, fin, fout) => { ... }

    randParticleVectors(seed, fin, amount, length, cons) {
        rand.setSeed(seed);
        for (let i = 0; i < amount; i++) {
            let l = rand.nextFloat();
            rv.trns(rand.random(360), length * l * fin);
            cons(rv.x, rv.y, fin * l, (1 - fin) * l);
        }
    },

    randParticleVectorsAngle(seed, fin, amount, length, angle, range, cons) {
        rand.setSeed(seed);
        for (let i = 0; i < amount; i++) {
            rv.trns(angle + rand.range(range), rand.random(length * fin));
            cons(rv.x, rv.y, fin * rand.nextFloat(), 0);
        }
    }
};
// 1️⃣ Load assets first
async function loadAssets() {
    Global.atlas = new TextureAtlas(Global.gl);

    const manifest = {
        "grass": "assets/bluonixite-stone1.png"
    };

    console.log("Loading assets...");
    await Global.atlas.load(manifest);
    console.log("Assets loaded:", Global.atlas.getNames());
}

// 2️⃣ Define blocks after atlas is ready
class Blocks {
    static load() {
        this.air = new BlockType({ solid: false });
        this.grass = new BlockType({
            solid: false,
            region: Global.atlas.find("grass")
        });

        console.log("Blocks loaded. Grass region:", this.grass.region);
    }
}

// 3️⃣ Setup world
const world = new World(256, 256, 32); // width, height, tileSize

// 4️⃣ Camera (world position in pixels)
const camera = { x: 0, y: 0 };

// 5️⃣ Main draw function
function drawWorld() {
    Draw.begin();

    for (let y = 0; y < world.wHeight; y++) {
        for (let x = 0; x < world.wWidth; x++) {
            const tile = world.getTile(x, y);
            const tx = x * world.tileSize + world.tileSize / 2;
            const ty = y * world.tileSize + world.tileSize / 2;

            // Draw tile using its region, or white fallback if undefined
            Draw.rect(tile.floor.region, tx, ty, world.tileSize, world.tileSize);
        }
    }

    Draw.end();
}

// 6️⃣ Run everything
(async () => {
    await loadAssets();
    Blocks.load();

    // Set identity matrix (or your camera matrix)
    Draw.setMatrix(new Float32Array([1,0,0, 0,1,0, 0,0,1]));

    // Draw the world
    drawWorld();
})();


class Vec2{
  constructor(x, y){
    this.x = x || 0;
    this.y = y || 0;
  }
  
  nearZero(){
    return this.getLengthSq() <= 0.009 * 0.009
  }

  setPosv(v){
    return this.setPos(v.x, v.y)
  }
  setPos(x, y){
    this.x = x;
    this.y = y;
    return this;
  }
  cloneUnsafe(){
    return new Vec(this.x, this.y)
  }
  copyFrom(v){
    this.x = v.x
    this.y = v.y
    return this
  }
  clamp(min, max){
    let len2 = this.x * this.x + this.y * this.y;
    if (len2 == 0) return this;
    
    let max2 = max * max;
    if (len2 > max2) return this.mult(Math.sqrt(max2 / len2));
    
    let min2 = min * min;
    if (len2 < min2) return this.mult(Math.sqrt(min2 / len2));
    
    return this;
  }
  add(x, y){
    this.x += x;
    this.y += y;
    return this;
  }
  sub(x, y){
    this.x -= x;
    this.y -= y;
    return this;
  }
  scl(x, y){
    this.x *= x;
    this.y *= y;
    return this;
  }
  mult(mult){
    return this.scl(mult, mult)
  }
  div(x, y){
    this.x /= x;
    this.y /= y;
    return this;
  }
  addv(v){
    return this.add(v.x, v.y)
  }
  subv(v){
    return this.sub(v.x, v.y)
  }
  sclv(v){
    return this.scl(v.x, v.y)
  }
  divv(v){
    return this.div(v.x, v.y)
  }
  setAngleExact(angle) {
		var length = this.getLength();
		this.x = Math.cos(angle) * length;
		this.y = Math.sin(angle) * length;
		return this;
	}
  setAngle(angle){
    const len = this.getLength()
    if (len === 0) return this
    this.x = Mathf.cos(angle) * len
    this.y = Mathf.sin(angle) * len
    return this
  }

	getAngle() {
		return Math.atan2(this.y, this.x);
	}
	
	setFromPolar(length){
	  const angle = this.getAngle()
    this.x = Mathf.cos(angle) * length
    this.y = Mathf.sin(angle) * length
    return this
  }

	setLength(length){
    const len = this.getLength()
    if (len === 0) return this
    const scale = length / len
    this.x *= scale
    this.y *= scale
    return this
  }

	getLengthSq(){
    return this.x * this.x + this.y * this.y
  }

	getLength() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}
	rotateRadExact(radians){
	  let cos = Math.cos(radians);
    let sin = Math.sin(radians);

    let newX = this.x * cos - this.y * sin;
    let newY = this.x * sin + this.y * cos;
    
    this.x = newX
    this.y = newY
    return this
	}
	rotate(degree){
	  return this.rotateRadExact(degree * Mathf.degToRad)
	}
	trns(amount, degree){
	  this.setPos(amount, 0).setAngle(degree * Mathf.degToRad)
	  return this
	}
	rotateRadFast(r){
  const cos = Mathf.cos(r)
  const sin = Mathf.sin(r)

  const x = this.x
  const y = this.y

  this.x = x * cos - y * sin
  this.y = x * sin + y * cos
  return this
}

}