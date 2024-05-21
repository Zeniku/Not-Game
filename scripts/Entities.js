class Ent {
  constructor({
    data = {},
    type = new BaseType(),
    x = 0,
    y = 0,
    velX = 0,
    velY = 0,
    rotation = 0,
    team = "Blue"
  } = {}) {
    this.data = data //for some not messy storage
    this.type = type
    this.position = new Vec(x, y)
    this.velocity = new Vec(velX, velY)
    this.lastX = x
    this.lastY = y
    this.hitbox = new Rect(x, y, this.type.hitSize * 2, this.type.hitSize * 2)
    this.removed = false
    this.team = team
    this.rotation = rotation 
    this.init();
  }
  static create(config = {}){
    // new this(config) bruh me
    let ent = new this(config)
    ent.entrr()
    return ent
  }
  entrr(){
    Global.entities.push(this)
    this.id = Global.entities.length - 1
  }
  init(){
    this.type.init(this)
  }
  update(timestamp) {
    let vel = this.velocity,
      pos = this.position
    this.lastX = pos.x
    this.lastY = pos.y
    vel.scl(0.995, 0.995) //friction i guess
    if(vel.nearZero()) vel.setLength(0)
    pos.add(vel.x * Global.delta, vel.y * Global.delta)
    if(this.hitbox) this.hitbox.setPos(pos.x, pos.y)
    this.type.update(this, timestamp)
  }
  rot() {
    return this.velocity.getAngle()
  }
  draw(con = Global.ctx) {
    //if(this.hitbox) this.hitbox.show(con)
    this.type.draw(this, con);
  }
  setPos(x, y) {
    this.position.setPos(x, y)
    return this
  }
  setPosv(v) {
    return this.setPos(v.x, v.y)
  }
  setVelv(v) {
    return this.setVel(v.x, v.y)
  }
  setVel(x, y) {
    this.velocity.setPos(x, y)
    return this
  }
  remove() {
    this.removed = true
  }
  angleTo(p2) {
    let p2Pos = p2.position,
      pPos = this.position;
    return Math.atan2(p2Pos.y - pPos.y, p2Pos.x - pPos.x);
  }
  distanceTo(p2) {
    let p2Pos = p2.position,
      pPos = this.position;
    return Mathf.dst2(pPos.x, pPos.y, p2Pos.x, p2Pos.y);
  }
  collides(other){
    if(other instanceof Ent){
      let rad = this.type.hitSize + other.type.hitSize
      return this.distanceTo(other) <= rad * rad
    }
    return false
  }
}

class HpEnt extends Ent {
  constructor(config){
    super(config)
    this.health = config.type.health || 0
    this.immunityTime = 0
    this.isImmune = false
  }
  draw(con = Global.ctx){
    con.fillStyle = (/*this.highlight*/ false)? "#FFFFFF" : this.type.color
    super.draw(con) 
  }
  update(timestamp){
    if(this.isImmune){
      this.immunityTime = Math.min(this.immunityTime + Global.delta, 15)
      if(this.immunityTime >= 15){
        this.isImmune = false
        this.immunityTime = 0
      }
    }
    this.highlight = false
    if(this.health <= 0){
      this.health = 0
      this.remove()
    }
    //this.collisions()
    super.update(timestamp)
  }
  collision(other){
    if(other instanceof BulletEnt){
      return other.collision(this)
    }
    if(other instanceof HpEnt){
      if(this.collides(other)){
        let pos = this.position,
        oPos = other.position
        
        let dx = pos.x - oPos.x, dy = pos.y - oPos.y,
        rSum = this.type.hitSize + other.type.hitSize,
        len = Math.sqrt(this.distanceTo(other)) || 1,
        ux = dx / len, uy = dy / len
        
        pos.setPos(
          oPos.x + (rSum) * ux,
          oPos.y + (rSum) * uy
        )
        this.velocity.add(ux/2, uy/2)
      }
    }
  }
  loseHealth(amount){
    if(!this.isImmune){
      this.health -= amount
      this.highlight = true
      this.isImmune = true
    }
  }
}

class TimedEnt extends Ent {
  constructor(config) {
    super(config)
    this.lifetime = this.type.lifetime || config.lifetime
    this.time = 0;
  }
  update(timestamp) {
    this.time = Math.min(this.time + Global.delta, this.lifetime)
    if (this.time >= this.lifetime) {
      this.remove()
    }
    super.update(timestamp)
  }
  fin() {
    return this.time / this.lifetime
  }
  fout() {
    return 1 - this.fin()
  }
  fslope(){
    return (0.5 - Math.abs(this.fin() - 0.5)) * 2
  }
}

class BulletEnt extends TimedEnt {
  constructor(config){
    super(config)
    this.damage = config.type.damage || 0
    this.peirced = []
  }
  update(timestamp){
    if(this.peirced.length > this.type.peirceNum){
      this.remove()
    }
    this.velocity.setLength(this.type.speed)
    super.update(timestamp)
  }
  entrr(){
    Global.bullets.push(this)
    this.id = Global.bullets.length - 1
  }
  collision(other){
    if(this.collides(other) && other.team != this.team){
      if(other instanceof HpEnt){
        //e.highlight = true
        if(!other.isImmune){
          this.type.hitEffect.createEnt({
            x: this.position.x,
            y: this.position.y
          })
        }
        other.loseHealth(this.damage)
        if(!this.peirced.includes(other)) this.peirced.push(other)
        if(!this.type.peirces && !other.isImmune) this.remove()
        return true
      }
    }
  }
}

class FxEnt extends TimedEnt {
  constructor(config){
    super(config)
    this.type = config.type
    this.data.angles = []
    delete this.hitbox
  }
  repeat(amount, length, draw){
    Angles.randLenVector(this.id, amount, length, draw)
  }
  entrr(){
    Global.effects.push(this)
    this.id = Global.effects.length - 1
  }
}

class WeaponMount {
  constructor(config){
    this.type = config.type;
    this.position = new Vec(config.x, config.y)
    this.reload = 0;
    this.shouldShoot = false
    this.rotation = config.rotation || 0; // controlled by Ai
    this.init()
  }
  draw(ent){
    this.type.draw(ent, this)
  }
  target(ent){
    
  }
  init(){
    
  }
  update(ent, timestamp){
    this.reload = Math.min(this.reload + Global.delta, this.type.reloadTime)
    if(this.shouldShoot && this.reload >= this.type.reloadTime){
      let x = Math.cos(this.rotation * Mathf.degToRad) * this.type.bulletXOffset
      let y = Math.sin(this.rotation * Mathf.degToRad) * this.type.bulletYOffset
      this.shoot(this.type.bullet, x + this.position.x, y + this.position.y)
    }
  }
  shoot(bulletType, x, y){
    bulletType.create({
      x: x,
      y: y,
      rotation: this.rotation
    })
  }
}

class WeaponEnt extends HpEnt {
  constructor(config){
    super(config) 
    this.weaponMounts = []
  }
  update(timestamp){
    this.weaponMounts.forEach(m => {
      if(m instanceof WeaponMount){
        let x = Math.cos(this.rotation * Mathf.degToRad) * m.type.x
        let y = Math.sin(this.rotation * Mathf.degToRad) * m.type.y
        m.position.setPos(x + this.position.x, y + this.position.y)
        m.update(timestamp)
      }
    })
    super.update(timestamp)
  }
}
