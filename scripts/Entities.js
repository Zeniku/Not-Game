


class HpEnt extends Components(Position, Velocity, Hitbox, Health, Team)(Entity) {
  update(){
    super.update()
    this.velocity.scl(0.995, 0.995)
  }
}



class FxEnt extends Components(Position, Team, TimedLife)(Entity){
  constructor(config){
  super(config)
    this.type = config.type
    this.data.angles = []
  }
  repeat(amount, length, draw){
    //console.log(this.uid)
    Angles.randLenVectors(this.uid, amount, length, draw)
  }
  repeatAngles(amount, angle, range, length, draw){
    Angles.randLenVectorsAngle(this.uid, amount, length, angle, range, draw)
  }
  entrr(){
    this.index = Global.effects.length
    Global.effects.push(this)
  }
  remove() {
    super.remove();
    //Angles.clearCache(this.uid); // free memory
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
    bulletType.createEnt({
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
  
  static createBullet(config = {}){
    // new this(config) bruh me
    let bullet = this.create(config)
    bullet.setPos(config.x, config.y)
    bullet.velocity.trns(config.rotation, config.type.speed)
    return bullet
  }
  update(dt) {
    //this.velocity.setLength(this.type.speed);
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
        //console.log(this.type)
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

class Building extends Components(Position, Health, Team)(Entity) {
  constructor(config) {
    super(config);
    this.block = config.block; // Reference to the BlockType
    this.tileX = config.tileX;
    this.tileY = config.tileY;
    
    // Center the entity in the middle of the multi-tile area
    const size = this.block.size * Global.world.tileSize;
    this.position.set(
      this.tileX * Global.world.tileSize + size / 2,
      this.tileY * Global.world.tileSize + size / 2
    );
    
    // Set Hitbox to match the full block size
    this.hitbox = new Rect(
      this.position.x, 
      this.position.y, 
      size, 
      size
    );
  }

  // Override remove to clean up the grid
  remove() {
    super.remove();
    Global.world.removeBlock(this.tileX, this.tileY);
  }

  update(dt) {
    // Buildings don't move, so we only update logic (Health, Shooting, etc.)
    super.update(dt);
    this.block.updateBuilding(this, dt); // Call the specific block logic
  }

  draw(con) {
    this.block.drawBuilding(this, con);
  }
}
