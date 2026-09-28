class Lerp {
  static repeat(x, times){
    return (x % (1/times)) * times
  }
  static delay(x, s){
    return Math.max(0, (x - s)/(1 - s))
  }
}
class Effects {
  static load(){
    this.none = new Effect(0, (e, con) => {})
    this.splash = new Effect(180, (e, con) => {
    //con.beginPath()
    let h = Lerp.repeat(e.fin(), 2)
    let fslope = (0.5 - Math.abs(h - 0.5)) * 2
    let fslop = Math.min(1, Math.pow(fslope * 4, 2))
    
      e.repeatAngles(10, 360 * e.fin(), 360, 50 + 80 * e.fin(), (x, y) => {
        //con.fillStyle = `hsl(${Math.floor(255 * e.fin())}, 100%, 50%)`
        Draw.colorHSL(Math.floor(360 * h), 1, 0.5);
        Draw.circle(e.position.x + x, e.position.y + y, 30 * e.fslop())
      })

      e.repeatAngles(3, 360 * h * 2, 360, 50 + 320 * h, (x, y) => {
        //con.fillStyle = `hsl(${Math.floor(255 * e.fin())}, 100%, 60%)`
        Draw.colorHSL(Math.floor(360 * h), 1, 0.5);
        Draw.circle(e.position.x + x, e.position.y + y, 10 * fslop)
      })
    Draw.colorHSL(0,0,0)
    Draw.circle(e.position.x, e.position.y, 50 * e.fslop())
    //con.fill()
    })
    this.boom = new Effect(20, (e, con) => {
      //con.beginPath()
      e.repeat(5, e.type.hitSize * 10 * e.fin(), (x, y) => {
        //con.fillStyle = `hsl(${Math.floor(255 * e.fin())}, 100%, 60%)`
        Draw.colorHSL(Math.floor(360 * e.fin()), 1, 0.6);
        Draw.circle(e.position.x + x, e.position.y + y, e.type.hitSize * 5 * e.fslope())
      })
      //con.fill()
    })
  }
}
