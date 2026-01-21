class Button {
  constructor({
    parent,
    text = "Button",
    onClick = () => {}
  } = {}) {

    this.box = new Box({ parent }).el;

    this.button = document.createElement("button");
    this.button.className = "button";
    this.button.textContent = text;

    this.box.appendChild(this.button);
    this.state = false;
    this.button.onclick = e => {
      this.state = !this.state
      onClick(this.state);
    }
  }
}
