class Slider {
  constructor({
    parent,
    min = 0,
    max = 1,
    step = 0.01,
    value = 1,
    label = "",
    labelPosition = "side", // "top" or "side"
    onInput = () => {}
  } = {}) {

    this.box = new Box({ parent }).el;
    this.value = 0
    this.container = document.createElement("div");
    this.container.style.display = "flex";
    this.container.style.gap = "0.5em";

    if (labelPosition === "top") {
      this.container.style.flexDirection = "column";
    } else {
      this.container.style.flexDirection = "row";
      this.container.style.alignItems = "center";
    }

    if (label) {
      this.label = document.createElement("div");
      this.label.textContent = label;
      this.label.style.whiteSpace = "nowrap";
      this.container.appendChild(this.label);
    }

    this.input = document.createElement("input");
    this.input.type = "range";
    this.input.min = min;
    this.input.max = max;
    this.input.step = step;
    this.input.value = value;

    // 🔑 IMPORTANT FIX
    this.input.style.flex = "1";
    this.input.style.minWidth = "0";

    this.container.appendChild(this.input);
    this.box.appendChild(this.container);

    this.input.oninput = () => {
      onInput(parseFloat(this.input.value))
      this.value = this.input.value
    }
  }
}
