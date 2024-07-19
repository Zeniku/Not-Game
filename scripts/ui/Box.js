class Box{
  constructor({
    parent,
  } = {}){
    this.parent = parent 
    this.box = document.createElement("div")
    this.box.type = "box"
    this.box.className = "box"
    if (parent != null && parent != undefined) this.parent.appendChild(this.box)
  }
}