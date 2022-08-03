class Effects {
  static load(){
    this.none = new Effect(0, (e, con) => {})
    this.splash = new Effect(30, (e, con) => {
      e.repeat(5, 30 * e.fin(), (x, y) => {
        con.fillStyle = `hsl(${Math.floor(255 * e.fin())}, 100%, 50%)`
        Draw.circle(e.position.x + x, e.position.y + y, 10 * e.fslope())
      })
      e.repeat(5, 50 * e.fin(), (x, y) => {
        con.fillStyle = `hsl(${Math.floor(255 * e.fin())}, 100%, 60%)`
        Draw.circle(e.position.x + x, e.position.y + y, 5 * e.fslope())
      })
    })
  }
}
