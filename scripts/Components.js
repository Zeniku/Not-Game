/* =========================
 * COMPONENT CORE
 * ========================= */
function Component(name, def) {
  const tag = Symbol(name);

  function mixin(Base) {
    class ComponentClass extends Base {
      constructor(...args) {
        super(...args);
      }
    }

    // 1. Handle regular methods and hooks
    for (const key of Object.keys(def)) {
      const value = def[key];

      if (typeof value === "function" && key !== "init") {
        const parentMethod = Base.prototype[key];

        if (typeof parentMethod === "function") {
          // Instead of super[key](), we call the parent's prototype method directly
          ComponentClass.prototype[key] = function(...args) {
            parentMethod.apply(this, args); // Call parent version
            return value.apply(this, args); // Call component version
          };
        } else {
          // No parent method exists, just attach it normally
          ComponentClass.prototype[key] = value;
        }
      }
    }

    // 2. Special handling for init (The Constructor Hook)
    const parentInit = Base.prototype.init;
    if (def.init) {
      ComponentClass.prototype.init = function(...args) {
        if (typeof parentInit === "function") {
          parentInit.apply(this, args);
        }
        def.init.apply(this, args);
      };
    }

    ComponentClass.prototype[tag] = true;
    ComponentClass.componentTag = tag;
    return ComponentClass;
  }

  mixin.tag = tag;
  return mixin;
}

function Components(...comps) {
  const ordered = [];
  const visited = new Set();
  const stack = new Set();

  function visit(c) {
    if (stack.has(c)) {
      throw new Error(`Circular dependency in ${c.componentName}`);
    }
    if (visited.has(c)) return;

    stack.add(c);
    for (const dep of c.requires ?? []) visit(dep);
    stack.delete(c);

    visited.add(c);
    ordered.push(c);
  }

  comps.forEach(visit);

  return Base =>
    ordered.reduce((Cls, c) => c(Cls), Base);
}


class Entity {
  constructor(config = {}) {
    this.uid = Entity._freeUIDs.length
      ? Entity._freeUIDs.pop()
      : Entity._uid++;

    this.removed = false;
    this.data = config.data || {};
    this.type = config.type || new BaseType();
    this.team = config.team || "Blue";
    this.index = 0;  // array index, updated by filter
    this.rotation = config.rotation || 0;
    
    this.init(config)
  }

  static _uid = 1;
  static _freeUIDs = [];
  static create(config = {}){
    // new this(config) bruh me
    let ent = new this(config)
    ent.entrr()
    return ent
  }
  has(component) {
    return this[component.tag] === true;
  }
  
  remove() {
    this.removed = true;
    Entity._freeUIDs.push(this.uid);
  }

  entrr(){
    this.index = Global.entities.length
    Global.entities.push(this)
  }
  init(){
    this.type.init?.(this)
  }
  
  update(dt) {
    //super.update(dt)
    this.type.update?.(this, dt)
  }
  draw(con = Global.ctx) {
    //if(this.hitbox) this.hitbox.show(con)
    this.type.draw(this, con);
  }
}

const Position = Component("Position", {
  init({ x = 0, y = 0 } = {}) {
    this.position = new Vec(x, y);
    this.lastX = x;
    this.lastY = y;
  },
  setPos(x, y) {
    this.position.setPos(x, y)
    return this
  },
  setPosv(v) {
    return this.setPos(v.x, v.y)
  },
  angleTo(p2) {
    let p2Pos = p2.position,
      pPos = this.position;
    return Math.atan2(p2Pos.y - pPos.y, p2Pos.x - pPos.x);
  },
  distanceTo(p2) {
    let p2Pos = p2.position,
      pPos = this.position;
    return Mathf.dst2(pPos.x, pPos.y, p2Pos.x, p2Pos.y);
  }
});
const Team = Component("Team", {
  init(config = {}){
    this.team = config.team || "blue"
  }
})
const Velocity = Component("Velocity", {
  requires: [Position],

  init(config = {}) {
    this.velocity = new Vec(config.velX || 0, config.velY || 0);
  },
  setVelv(v) {
    return this.setVel(v.x, v.y)
  },
  setVel(x, y) {
    this.velocity.setPos(x, y)
    return this
  },

  update(dt) {
    //console.log("h")
    
    this.lastX = this.position.x;
    this.lastY = this.position.y;

    this.velocity.scl(0.995, 0.995);
    if (this.velocity.nearZero()) this.velocity.setLength(0);

    this.position.add(
      this.velocity.x * Global.delta,
      this.velocity.y * Global.delta 
    );
  }
});

const Health = Component("Health", {
  init(config = {}) {
    this.health = config.type?.health || 0;
    this.isImmune = false;
    this.immunityTime = 0;
  },
  collision(other) {
    
  },
  loseHealth(amount){
    if(!this.isImmune){
      this.health -= amount
      this.highlight = true
      this.isImmune = true
    }
  },

  update(dt) {
    
    if (this.isImmune) {
      this.immunityTime += Global.delta;
      if (this.immunityTime >= 15) {
        this.isImmune = false;
        this.immunityTime = 0;
      }
    }

    if (this.health <= 0) {
      this.health = 0;
      this.type.deathEffect?.createEnt({
        x: this.position.x,
        y: this.position.y
      });
      this.remove();
    }
  }
});
const TimedLife = Component("TimedLife", {
  init(config) {
    this.lifetime = this.type.lifetime //|| config.lifetime || 0;
    this.time = 0;
  },

  update(dt) {

    this.time = Math.min(this.time + Global.delta, this.lifetime);
    if (this.time >= this.lifetime) this.remove();
  },
  fin() {
    return this.time / this.lifetime
  },
  fout() {
    return 1 - this.fin()
  },
  fslope(){
    return (0.5 - Math.abs(this.fin() - 0.5)) * 2
  }
});
const Hitbox = Component("Hitbox", {
  requires: [Position],

  init() {
    const s = this.type.hitSize * 2 || 0;
    this.hitBoxes = []
    this.hitbox = new Rect(
      this.position.x,
      this.position.y,
      s * 2,
      s * 2
    );
    this.maxRadius = Math.sqrt(s * s + s * s);
  },

  update(dt) {
    
    this.hitbox?.setPos(this.position.x, this.position.y);
  },
  collides(other){
    if(other.has(Position)){
      let rad = this.type.hitSize + other.type.hitSize
      return (this.distanceTo(other) <= rad * rad)
    }
    return false
  }
});

