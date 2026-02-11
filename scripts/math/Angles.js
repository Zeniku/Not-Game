class Angles {
  static vec = { x: 0, y: 0 };
  static rand = new Rand();
  static _cache = new Map(); // uid -> precomputed vectors

  static randLenVector(uid, amount, length, cons) {
    
    let arr = this._cache.get(uid);

    // generate once if not cached
    if (!arr || arr.length < amount) {
      arr = new Array(amount);
      this.rand.setSeed(uid);

      for (let i = 0; i < amount; i++) {
        const len = this.rand.nextFloat();
        const ang = this.rand.nextRange(0, 360);
        arr[i] = {
          x: Mathf.cosDeg(ang) * len,
          y: Mathf.sinDeg(ang) * len,
        };
      }

      this._cache.set(uid, arr);
    }

    // apply vectors
    for (let i = 0; i < amount; i++) {
      const v = arr[i];
      
      cons(v.x * length, v.y * length);
    }
  }

  static clearCache(uid) {
    this._cache.delete(uid);
  }
  
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
  static trnsxEaxct(angle, len){
    return len * Math.cos(angle * Mathf.degToRad)
  }
  static trnsyExact(angle, len){
    return len * Math.sin(angle * Mathf.degToRad)
  }
  static trnsx(angle, len){
    return len * Mathf.cos(angle * Mathf.degToRad)
  }
  static trnsy(angle, len){
    return len * Mathf.sin(angle * Mathf.degToRad)
  }

}