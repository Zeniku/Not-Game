class BaseType {
  constructor({
    EntType = Ent,
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
    Draw.circle(ent.position.x, ent.position.y, this.hitSize)
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
  } = {}) {
    super(...arguments)
    this.EntType = EntType
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
    hitEffect = new Effect(0,() => {})
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
    con.fillStyle = ent.color || this.color
    Draw.circle(ent.position.x, ent.position.y, Math.max(this.hitSize * ent.fout(), 1))
  }
}
