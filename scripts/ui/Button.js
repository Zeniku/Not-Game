class Button{
  constructor({
    parent,
  } = {}){
    this.box = new Box({parent: parent}).box
    this.buttonCon = new Box({parent:this.box}).box
    this.buttonCon.className = "buttonCon"
    
    this.button = document.createElement("button")
    this.button.className = "button"
    this.button.type = "button"
    
    //if (parent != null && parent != undefined) this.parent.appendChild(this.box)
    this.buttonCon.appendChild(this.button)
    //console.log(this.box, parent)
    this.button.onclick = (e) => this.on(e);
  }
  on(e){
    if(!this.state){
      this.state = true
    } else {
      this.state = false
    }
  }
}