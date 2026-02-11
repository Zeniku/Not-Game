class Units {
  static load(){
    this.unit = new BaseUnit({
      hitSize: 25,
      health: 300,
    })
    this.bigUnit = new BaseUnit({
      hitSize: 45,
      health: 500,
      deathEffect: Effects.boom
    })
  }
}
