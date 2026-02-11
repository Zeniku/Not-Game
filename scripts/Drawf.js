
class Drawf {
  static circle(x, y, radius){
    Draw.circle(x, y, radius)
  }

  static pcircle(x, y){
    Draw.circle(x, y, 1)
  }

  static lineRect(x, y, width, height, center = false){
    let cx = x, cy = y
    if(center){
      cx = x - width * 0.5
      cy = y - height * 0.5
    }

    Lines.rect(cx, cy, width, height)
  }
}