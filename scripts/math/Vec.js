class Vec {
  constructor(x, y){
    this.x = x || 0;
    this.y = y || 0;
  }
  
  nearZero(){
    return this.getLengthSq() <= 0.009 * 0.009
  }

  setPosv(v){
    return this.setPos(v.x, v.y)
  }
  setPos(x, y){
    this.x = x;
    this.y = y;
    return this;
  }
  cloneUnsafe(){
    return new Vec(this.x, this.y)
  }
  copyFrom(v){
    this.x = v.x
    this.y = v.y
    return this
  }
  clamp(min, max){
    let len2 = this.x * this.x + this.y * this.y;
    if (len2 == 0) return this;
    
    let max2 = max * max;
    if (len2 > max2) return this.mult(Math.sqrt(max2 / len2));
    
    let min2 = min * min;
    if (len2 < min2) return this.mult(Math.sqrt(min2 / len2));
    
    return this;
  }
  add(x, y){
    this.x += x;
    this.y += y;
    return this;
  }
  sub(x, y){
    this.x -= x;
    this.y -= y;
    return this;
  }
  scl(x, y){
    this.x *= x;
    this.y *= y;
    return this;
  }
  mult(mult){
    return this.scl(mult, mult)
  }
  div(x, y){
    this.x /= x;
    this.y /= y;
    return this;
  }
  addv(v){
    return this.add(v.x, v.y)
  }
  subv(v){
    return this.sub(v.x, v.y)
  }
  sclv(v){
    return this.scl(v.x, v.y)
  }
  divv(v){
    return this.div(v.x, v.y)
  }
  setAngleExact(angle) {
		var length = this.getLength();
		this.x = Math.cos(angle) * length;
		this.y = Math.sin(angle) * length;
		return this;
	}
  setAngle(angle){
    const len = this.getLength()
    if (len === 0) return this
    this.x = Mathf.cos(angle) * len
    this.y = Mathf.sin(angle) * len
    return this
  }

	getAngle() {
		return Math.atan2(this.y, this.x);
	}
	
	setFromPolar(length){
	  const angle = this.getAngle()
    this.x = Mathf.cos(angle) * length
    this.y = Mathf.sin(angle) * length
    return this
  }

	setLength(length){
    const len = this.getLength()
    if (len === 0) return this
    const scale = length / len
    this.x *= scale
    this.y *= scale
    return this
  }

	getLengthSq(){
    return this.x * this.x + this.y * this.y
  }

	getLength() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}
	rotateRadExact(radians){
	  let cos = Math.cos(radians);
    let sin = Math.sin(radians);

    let newX = this.x * cos - this.y * sin;
    let newY = this.x * sin + this.y * cos;
    
    this.x = newX
    this.y = newY
    return this
	}
	rotate(degree){
	  return this.rotateRadExact(degree * Mathf.degToRad)
	}
	trns(amount, degree){
	  this.setPos(amount, 0).setAngle(degree * Mathf.degToRad)
	  return this
	}
	rotateRadFast(r){
  const cos = Mathf.cos(r)
  const sin = Mathf.sin(r)

  const x = this.x
  const y = this.y

  this.x = x * cos - y * sin
  this.y = x * sin + y * cos
  return this
}

}
console.log("Vec")
