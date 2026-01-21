class WindowPanel extends Panel{
  constructor(config) {
    
    config = Object.assign(config, {
      
    parent: document.body,
    title: "Window",
    x: 10,
    y: 220,
    width: 200,
    closable: false,
    collapsible: false,
    collapsed: false
  
    })
    super(config)
    this.inputs = [];
    this.sliders = [];
    this.texts = []
    this.collapsible = config.collapsible
    this.closable = config.closable
    this.collapsed = config.collapsed

    

    // Positioning (panel.root is the window)
    const el = this.root.el;
    el.style.position = "fixed";
    el.style.left = config.x + "px";
    el.style.top = config.y + "px";
    el.style.width = config.width + "px";
    el.style.zIndex = 1000;

    // Header (guaranteed if title exists)
  

    // Collapse button
    if (this.collapsible && this.header) {
      this.collapseBtn = document.createElement("span");
      this.collapseBtn.className = "panelCollapse";
      this.collapseBtn.textContent = "▾";
      this.collapseBtn.style.marginLeft = "auto";

      this.header.appendChild(this.collapseBtn);

      this.collapseBtn.onclick = e => {
        e.stopPropagation();
        this.toggleCollapse();
      };
    }

    // Close button
    if (this.closable && this.header) {
      this.closeBtn = document.createElement("span");
      this.closeBtn.className = "panelClose";
      this.closeBtn.textContent = "✕";
      this.header.appendChild(this.closeBtn);

      this.closeBtn.onclick = e => {
        e.stopPropagation();
        this.panel.root.el.remove();
      };
    }

    // Enable dragging via panel header
    if (this.header) {
  this.header.style.display = "flex";
  this.header.style.alignItems = "center";
}
    if (this.header) {
      this.#enableDrag(this.root.el, this.header);
    }
    this.addText("")
  }

  toggleCollapse() {
    this.collapsed = !this.collapsed;

    if (this.collapsed) {
      this.panel.content.style.display = "none";
      if (this.collapseBtn) this.collapseBtn.textContent = "▸";
    } else {
      this.panel.content.style.display = "";
      if (this.collapseBtn) this.collapseBtn.textContent = "▾";
    }
  }

  add(child) {
    this.panel.content.appendChild(child.el ?? child);
  }

  addNumberInput(label, min, max, onChange) {
    const input = new NumberInput({
      parent: this.panel.content,
      label,
      min,
      max,
      onChange
    });

    this.inputs.push(input);
  }
  addText(text, index) {
    const el = document.createElement("div");
    el.className = "panelText";
    el.textContent = text;
    this.content.appendChild(el);
    if(index) this.texts[index] = el; else this.texts.push(el)
    return el;
  }
  setText(index, text){
    if(!this.texts[index]) this.addText(text, index);
    this.texts[index].textContent = text
  }
  addSliderInput(label, min, max, value = 1, onChange) {
    const slider = new Slider({
      parent: this.content,
      label: label,
      labelPosition: "side",
      min,
      max,
      value,
      onInput: v => onChange(v)
    });

    onChange(value);
    this.sliders.push(slider);
  }
  addButton(label, onClick){
    const input = new Button({
      parent: this.content,
      text: label,
      onClick
    });

    this.inputs.push(input);
    //onClick()
  }

  #enableDrag(root, handle) {
    let dragging = false;
    let ox = 0;
    let oy = 0;
    let activePointerId = null;

    handle.style.touchAction = "none";

    handle.onpointerdown = e => {
      e.preventDefault();

      dragging = true;
      activePointerId = e.pointerId;

      const rect = root.getBoundingClientRect();
      ox = e.clientX - rect.left;
      oy = e.clientY - rect.top;

      handle.setPointerCapture(activePointerId);
    };

    handle.onpointermove = e => {
      if (!dragging || e.pointerId !== activePointerId) return;

      e.preventDefault();

      root.style.left = `${e.clientX - ox}px`;
      root.style.top = `${e.clientY - oy}px`;
    };

    handle.onpointerup =
    handle.onpointercancel = e => {
      if (e.pointerId !== activePointerId) return;

      dragging = false;
      handle.releasePointerCapture(activePointerId);
      activePointerId = null;
    };
  }
}
