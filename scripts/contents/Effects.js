class Effects {
  static load(){
    this.none = new Effect(0, (e, con) => {})
    this.splash = new Effect(30, (e, con) => {
    //con.beginPath()
      e.repeat(5, 10 * 8 * e.fin(), (x, y) => {
        //con.fillStyle = `hsl(${Math.floor(255 * e.fin())}, 100%, 50%)`
        Draw.colorHSL(Math.floor(360 * e.fin()), 1, 0.5);
        Draw.circle(e.position.x + x, e.position.y + y, 25 * e.fslope())
      })
      e.repeat(5, 30 * 8 * e.fin(), (x, y) => {
        //con.fillStyle = `hsl(${Math.floor(255 * e.fin())}, 100%, 60%)`
        Draw.colorHSL(Math.floor(360 * e.fin()), 1, 0.5);
        Draw.circle(e.position.x + x, e.position.y + y, 15 * e.fslope())
      })
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
