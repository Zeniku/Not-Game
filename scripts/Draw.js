
class Draw {
  static pcircle(x, y, radius, ctx = Global.ctx, camera = Camera){
    let projected = camera.toWorldCoord(x,y)
    ctx.moveTo(Math.floor(projected.x), Math.floor(projected.y))
    ctx.arc(Math.floor(projected.x), Math.floor(projected.y), Math.floor(radius), 0, Math.PI * 2)
  }
  static circle(x, y, radius, ctx = Global.ctx, camera = Camera){
    let projected = camera.toWorldCoord(x,y)
    ctx.beginPath()
    //ctx.moveTo(Math.floor(x), Math.floor(y))
    ctx.arc(Math.floor(projected.x), Math.floor(projected.y), Math.floor(radius), 0, Math.PI * 2)
    ctx.fill()
  }
  static lineRect(x, y, width, height, center = false, ctx = Global.ctx, camera = Camera){
    let projected = camera.toWorldCoord(x,y)
    let cx = (center)? projected.x - (width/2): projected.x
    let cy = (center)? projected.y - (height/2): projected.y
    ctx.beginPath()
    ctx.strokeRect(Math.floor(cx), Math.floor(cy), width, height)
    ctx.stroke()
  }
  static line(x1, y1, x2, y2, width, ctx = Global.ctx, camera = Camera){
    let projected1 = camera.toWorldCoord(x1,y1)
    let projected2 = camera.toWorldCoord(x2,y2)
    ctx.beginPath();
    ctx.moveTo(Math.floor(projected1.x), Math.floor(projected1.y));
    ctx.lineTo(Math.floor(projected2.x), Math.floor(projected2.y));
    ctx.lineWidth = width;
    ctx.stroke();
  }
}