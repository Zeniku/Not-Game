class Angles {
  static vec = new Vec()
  static rand = new Rand()
  static angle(x1, y1, x2, y2){
    let ang = Math.atan2(x2 - x1, y2 - y1) * Mathf.radToDeg;
    if(ang < 0) ang += 360;
    return ang;
  }
  static angleV(p1, p2){
    return this.angle(p1.x, p1.y, p2.x, p2.y)
  }
  static angleRad(x1, y1, x2, y2){
    return Mathf.atan2(x2 - x1, y2 - y1);
  }
  static trnsx(angle, len){
    return len * Math.cos(angle * Mathf.degToRad)
  }
  static trnsy(angle, len){
    return len * Math.sin(angle * Mathf.degToRad)
  }
  static randLenVector(id, amount, length, cons){
    this.rand.setSeed(id)
    for(let i = 0; i < amount; i++){
      this.vec.trns(this.rand.nextFloat() * length, this.rand.nextRange(0, 360))
      cons(this.vec.x, this.vec.y)
    }
  }
}
