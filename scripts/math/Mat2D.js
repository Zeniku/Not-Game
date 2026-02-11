class Mat2D {
  constructor(){
    this.a = 1; this.b = 0;
    this.c = 0; this.d = 1;
    this.tx = 0; this.ty = 0;
  }

  setTransform(x, y, rot){
    const r = rot * Mathf.degToRad
    const cos = Mathf.cos(r)
    const sin = Mathf.sin(r)

    this.a = cos
    this.b = sin
    this.c = -sin
    this.d = cos
    this.tx = x
    this.ty = y
  }

  transformPoint(v){
    return new Vec(
      v.x * this.a + v.y * this.c + this.tx,
      v.x * this.b + v.y * this.d + this.ty
    )
  }
}
