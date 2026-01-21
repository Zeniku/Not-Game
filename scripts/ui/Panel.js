class Panel {
  constructor({
    parent = document.body,
    title = ""
  } = {}) {
    this.root = new Box({ parent, className: "panel" });

    if(title){
      this.header = document.createElement("div");
      this.header.className = "panelHeader";
      this.header.textContent = title;
      this.root.el.appendChild(this.header);
    }

    this.content = document.createElement("div");
    this.content.className = "panelContent";
    this.root.el.appendChild(this.content);
  }
}
