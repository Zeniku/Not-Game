class Point {
  constructor(x, y, index) {
    this.x = x
    this.y = y
    this.index = index
  }
}

/* ===================== RECT ===================== */

class Rect {
  constructor(x, y, width, height) {
    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this.setDirections()
  }
  setPos(x, y){
    this.x = x
    this.y = y
    this.setDirections()
    return this
  }
  setRect(x, y, width, height) {
    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this.setDirections()
    return this
  }

  setDirections() {
    const hw = this.width * 0.5
    const hh = this.height * 0.5
    this.left = this.x - hw
    this.right = this.x + hw
    this.top = this.y - hh
    this.bottom = this.y + hh
  }

  containsXY(x, y) {
    return (
      x >= this.left &&
      x <= this.right &&
      y >= this.top &&
      y <= this.bottom
    )
  }

  contains(p) {
    return this.containsXY(p.x, p.y)
  }

  intersect(r) {
    return !(
      r.left > this.right ||
      r.right < this.left ||
      r.top > this.bottom ||
      r.bottom < this.top
    )
  }

  subdivide(dir) {
    const hw = this.width * 0.25
    const hh = this.height * 0.25
    const w = this.width * 0.5
    const h = this.height * 0.5

    switch (dir) {
      case 0: return new Rect(this.x - hw, this.y - hh, w, h) // NW
      case 1: return new Rect(this.x + hw, this.y - hh, w, h) // NE
      case 2: return new Rect(this.x - hw, this.y + hh, w, h) // SW
      case 3: return new Rect(this.x + hw, this.y + hh, w, h) // SE
    }
  }

  show(con = Global.ctx) {
    con.strokeStyle = "#FFFFFF"
    Draw.lineRect(this.x, this.y, this.width, this.height, true)
  }
}

/* ===================== QUADTREE ===================== */

class QuadTree {
  static MAX_DEPTH = 6

  constructor(boundary, capacity = 4, depth = 0) {
    this.boundary = boundary
    this.capacity = capacity
    this.depth = depth
    this.points = []
    this.quadrants = null
  }

  divided() {
    return this.quadrants !== null
  }

  insert(point) {
    if (!this.boundary.contains(point)) return false

    if (this.points.length < this.capacity || this.depth >= QuadTree.MAX_DEPTH) {
      this.points.push(point)
      return true
    }

    if (!this.divided()) this.subdivide()

    for (let q of this.quadrants) {
      if (q.insert(point)) return true
    }

    return false
  }

  subdivide() {
    this.quadrants = new Array(4)
    for (let i = 0; i < 4; i++) {
      this.quadrants[i] = new QuadTree(
        this.boundary.subdivide(i),
        this.capacity,
        this.depth + 1
      )
    }

    // Move points into children
    for (let p of this.points) {
      for (let q of this.quadrants) {
        if (q.insert(p)) break
      }
    }

    this.points.length = 0
  }

  retrieve(range, found = [], show = false) {
    if (!this.boundary.intersect(range)) return found
    
    //this.boundary.show()
    for (let p of this.points) {
      if (range.contains(p)) found.push(p)
    }

    if (this.divided()) {
      for (let q of this.quadrants) {
        q.retrieve(range, found)
      }
    }

    return found
  }

  query(range) {
    return this.retrieve(range, [])
  }

  near(x, y, w, h, callback) {
    this._rect ||= new Rect(0, 0, 0, 0)
    this._rect.setRect(x, y, w, h)

    const result = this.query(this._rect)
    for (let p of result) callback(p.data)
  }

  circleNear(x, y, r, callback) {
    const r2 = r * r
    this.near(x, y, r * 2, r * 2, e => {
      const dx = e.position.x - x
      const dy = e.position.y - y
      if (dx * dx + dy * dy <= r2) callback(e)
    })
  }

  draw(con) {
    this.boundary.show(con)
    if (this.divided()) {
      for (let q of this.quadrants) q.draw(con)
    }
  }

  clear() {
    this.points.length = 0
    if (this.divided()) {
      for (let q of this.quadrants) q.clear()
    }
    this.quadrants = null
  }

  update(entities) {
    this.clear()
    for (let e of entities) {
      this.insert(new Point(e.position.x, e.position.y, e.index))
    }
  }
}

console.log("Optimized QuadTree")
