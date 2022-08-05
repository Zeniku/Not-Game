class Point {
  constructor(x, y, data){
    this.x = x
    this.y = y
    this.Pdata = data
  }
}
class Rect {
  constructor(x, y, width, height){
    this.x = x
    this.y = y 
    this.width = width
    this.height = height
    this.color = "#FFFFFF"
    this.setDirections()
  }
  setRect(x, y, width, height){
    return this.setPos(x,y).setSize(width, height)
  }
  setPos(x, y){
    this.x = x
    this.y = y
    this.setDirections()
    return this
  }
  setSize(width, height){
    this.width = width
    this.height = height 
    this.setDirections()
    return this
  }
  setDirections(){
    this.left = this.x - (this.width/2)
    this.right = this.x + (this.width/2)
    this.top = this.y - (this.height/2)
    this.bottom = this.y + (this.height/2)
  }
  subdivide(quadrant){
    let left = this.x - this.width / 4,
      right = this.x + this.width / 4,
      top = this.y - this.height / 4,
      bottom = this.y + this.height / 4;
    let comb = {
      ne: [right, top],
      nw: [left, top],
      se: [right, bottom],
      sw: [left, bottom]
    }

    for(let i in comb){
      if(comb[quadrant] == comb[i]) {
        return new Rect(
          comb[i][0], 
          comb[i][1], 
          this.width/2,
          this.height/2)
      }
    }
  }
  containsXY(x, y){
    return (
      x > this.left && x < this.right &&
      y > this.top && y < this.bottom
    )
  }
  contains(point){
    if(point instanceof Point){
      return this.containsXY(point.x, point.y)
    }
  }
  intersect(range){
    if(range instanceof Rect){
      let {left, right, top, bottom} = range
      return !(
        left > this.right || right < this.left ||
        top > this.bottom || bottom < this.top
      )
    }
  }
  show(con = Global.ctx){
    con.strokeStyle = "#FFFFFF"
    Draw.lineRect(this.x, this.y, this.width, this.height, true)
  }
}
class QuadTree {
  MAX_DEPTH = 6
  constructor(boundary, capacity, depth = 0){
    this.boundary = boundary
    this.capacity = capacity || 4
    this.points = []
    this.quadrants = []
    this.depth = depth
  }
  insert(point){
    if(this.boundary.contains(point)){
      if(
        this.points.length < this.capacity ||
        this.depth >= this.MAX_DEPTH
      ){
        this.points.push(point)
        return true
      } else {
        if(!this.divided()) this.subdivide();
        
        for(let i of this.quadrants){
          if(i.insert(point)) return true
        }
      }
    }
    return false
  }
  subdivide(){
    let q = ["nw", "ne", "sw", "se"]
    for(let i in q){
      this.quadrants[i] = new QuadTree(this.boundary.subdivide(q[i]), this.capacity, this.depth + 1)
    }
  }
  retrieve(range, found, inside = false){
    if(!found) found = []
    if(this.boundary.intersect(range)){
      for(let p of this.points){
        if(inside){
          if(range.contains(p)) found.push(p)
        } else found.push(p)
      }
      
      if(this.divided()){
        for(let i of this.quadrants){
          i.retrieve(range, found, inside)
        }
      }
    }
    return found
  }
  query(range, found = []){
    return this.retrieve(range, found, true)
  }
  near(x, y, width, height, ent){
    let near = this.query(new Rect(x, y, width, height))
    for(let i of near){
      ent(i.data)
    }
  }
  circleNear(x, y, radius, ent){
    this.near(x, y, radius, radius, e => {
      let pos = e.position
      if(Mathf.dst2(x, y, pos.x, pos.y) < radius*radius) ent(e)
    })
  }
  divided(){
    return this.quadrants.length > 0
  }
  draw(con){
    this.boundary.show(con)
    if(this.divided()){
      for (let i of this.quadrants) {
        i.draw(con)
      }
    }
  }
  clear(){
    this.points = []
    if(this.divided()){
      for(let i of this.quadrants){
        i.clear()
      }
    }
    this.quadrants = []
  }
  update(entities){
    this.clear()
    for(let e of entities){
      let p = new Point(e.position.x, e.position.y, e)
      this.insert(p)
    }
  }
}
console.log("QuadTree")
