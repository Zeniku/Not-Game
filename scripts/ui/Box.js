class Box {
  constructor({
    parent = null,
    className = "box",
    style = {}
  } = {}) {
    this.el = document.createElement("div");
    this.el.className = className;

    Object.assign(this.el.style, style);

    if(parent) parent.appendChild(this.el);
  }
}