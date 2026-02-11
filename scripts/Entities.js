
class Ent {
  constructor(config = {}) {
    if (Ent._freeUIDs.length > 0) {
      this.uid = Ent._freeUIDs.pop();
    } else {
      this.uid = Ent._uid++;
    }

    this.index = 0;  // array index, updated by filter

    this.data = config.data || {} //for some not messy storage
    this.type =  config.type  || new BaseType()
    this.position = new Vec(config.x || 0, config.y || 0)
    this.velocity = new Vec(config.velX || 0, config.velY || 0)
    this.lastX = config.x || 0
    this.lastY = config.y || 0
    this.hitbox = new Rect(config.x || 0, config.y || 0, this.type.hitSize*2, this.type.hitSize*2)
    //this.maxRadius = this.type.hitSize * 2
    
    this.removed = false
    this.team = config.team || "Blue"
    this.rotation = config.rotation || 0
    this.init();
  }
  
  static create(config = {}){
    // new this(config) bruh me
    let ent = new this(config)
    ent.entrr()
    return ent
  }
  
  static _uid = 1;          // for permanent unique IDs
  static _freeUIDs = [];    // pool for recycling

  remove() {
    this.removed = true;
    // recycle UID
    Ent._freeUIDs.push(this.uid);
  }
  entrr(){
    this.index = Global.entities.length
    Global.entities.push(this)
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
      return (this.distanceTo(other) <= rad * rad)
    }
    return false
  }
}


class HpEnt extends Components(Position, Velocity, Hitbox, Health, Team)(Entity) {}



class FxEnt extends Components(Position, Team, TimedLife)(Entity){
  constructor(config){
  super(config)
    this.type = config.type
    this.data.angles = []
  }
  repeat(amount, length, draw){
    //console.log(this.uid)
    Angles.randLenVector(this.uid, amount, length, draw)
  }
  entrr(){
    this.index = Global.effects.length
    Global.effects.push(this)
  }
  remove() {
    super.remove();
    Angles.clearCache(this.uid); // free memory
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

class BulletEnt extends Components(
  Position,
  Velocity,
  Hitbox,
  TimedLife,
  Team
)(Entity) {
  constructor(config) {
    super(config);
    this.damage = config.type?.damage || 0;
    this.peirced = [];
  }

  update(dt) {
    this.velocity.setLength(this.type.speed);
    super.update(dt);
  }
  entrr(){
    this.index = Global.bullets.length
    Global.bullets.push(this)
  }
  collision(other){
    if(!(this.collides(other) && other.team != this.team)) return 
    if(other.has(Health)){
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
    }
  }
}