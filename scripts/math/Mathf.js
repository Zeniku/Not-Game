class Mathf {
  static rand = new Rand()
  static dst2(x1, y1, x2, y2){
    let dx = x2 - x1, dy = y2 - y1
    return (dx * dx) + (dy * dy)
  }
  static dst(x1, y1, x2, y2){
    return Math.sqrt(this.dst2(x1, y1, x2, y2))
  }
  static random(range = 1){
    return this.rand.nextFloat() * range
  }
  static randomM(min, max){
    return min + this.random(max - min)
  }
  static chance(range = 0.5){
    this.rand.nextFloat() < range
  }
  static range(r){
    return this.randomM(-r, r)
  }
  static rangeM(min, max){
    let v = this.randomM(args[0], args[1])
    return (this.chance())? v : -v
  }
  static lerp(min, max, v){
    return this.lerpUnclamped(min, max, this.clamp(v))
  }
  static lerpUnclamped(min, max, v){
    return min + ((max - min) * v)
  }
  static clamp(value, min = 0, max = 1){
    Math.max(Math.min(value, max), min);
  }
  static degToRad = 180 / Math.PI
  static radToDeg = Math.PI / 180
}
