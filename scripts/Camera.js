class Camera extends Rect{
  static {
    this.camera = new Camera(0,0,0,0)
  }
  static toWorldCoord(x,y){
    const cx = x - this.camera.x + game.world.width/2 - Global.width/2;
    const cy = y - this.camera.y + game.world.height/2 - Global.height/2;
    return {x:cx,y:cy};
  }
  static fromWorldCoord(cx,cy){
    const x = cx + this.camera.x;
    const y = cy + this.camera.y;
      return {x,y};
  }
}