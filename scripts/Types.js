let hj = 0
class BaseType {
  constructor({
    EntType = Entity,
    hitSize = 4,
    speed = 10,
    color = '#33FFFF'
  } = {}) {
    this.EntType = EntType
    this.hitSize = hitSize
    this.speed = speed
    this.color = color
  }
  init(ent) {

  }
  update(ent, time) {

  }
  draw(ent, con) {
    //con.fillStyle = ent.color || this.color
    Draw.colorHex(ent.color || this.color);
    Draw.rect
      Draw.circle(ent.position.x, ent.position.y, this.hitSize)
      //Draw.line(ent.position.x, ent.position.y, ent.lastX, ent.lastY)
  }
  createEnt(config = {}) {
    return this.EntType.create(Object.assign({
      type: this
    }, config))
  }
}
class Effect extends BaseType {
  constructor(lifetime = 60, draw = (ent, con) => {}, config = {}){
    super(config)
    this.EntType = FxEnt
    this.lifetime = lifetime
    this.draw = draw
  }
}

class BaseUnit extends BaseType{
  constructor({
    EntType = HpEnt,
    health = 200,
    deathEffect = Effects.none
  } = {}) {
    super(...arguments)
    this.EntType = EntType
    this.deathEffect = deathEffect
    this.health = health
    this.weapons = []
  }
}

class Bullet extends BaseType{
  constructor({
    EntType = BulletEnt,
    lifetime = 480,
    damage = 3,
    peirceNum = 0,
    peirces = (peirceNum > 0),
    hitEffect = Effects.none
  } = {}){
    super(...arguments)
    this.EntType = EntType
    this.lifetime = lifetime
    this.damage = damage
    this.peirceNum = peirceNum
    this.peirces = peirces
    this.hitEffect = hitEffect
  }
  draw(ent, con){
    //con.fillStyle = ent.color || this.color
    Draw.colorHex(ent.color || this.color);
    Draw.circle(ent.position.x, ent.position.y, Math.max(this.hitSize * ent.fout(), 1))
  }
  createEnt(config = {}) {
    
    return this.EntType.createBullet(Object.assign({
      type: this
    }, config))
  }
}
// Defines static properties (The "Block")
class Block {
  constructor(config = {}) {
    this.size = config.size || 1; // 1 = 1x1, 2 = 2x2, etc.
    this.solid = config.solid ?? true;
    this.region = config.region
    //this.health = config.health || 100;
  }

  // The logic runs here, but acts on the 'building' instance

  draw(tile) {
    const ts = game.world.tileSize;

    // Calculate visible tile range (Culling)
    
    const worldX = tile.x * ts + ts * 0.5;
    const worldY = tile.y * ts + ts * 0.5;
    
    Draw.colorHex("FFF");
    //if(!hj) {console.log(this.region); hj++}
    if(this.region) Draw.rect(this.region, worldX, worldY, ts, ts);
  }
}