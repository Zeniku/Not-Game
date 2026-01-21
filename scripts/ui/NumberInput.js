class NumberInput {
  constructor({
    parent,
    label = "",
    value = 0,
    step = 1,
    min = -Infinity,
    max = Infinity,
    onChange = () => {}
  } = {}) {

    this.value = value;

    this.box = new Box({ parent }).el;

    if(label){
      this.label = document.createElement("div");
      this.label.textContent = label;
      this.label.style.marginBottom = "4px";
      this.box.appendChild(this.label);
    }

    this.input = document.createElement("input");
    this.input.type = "number";
    this.input.value = value;
    this.input.step = step;
    this.input.min = min;
    this.input.max = max;

    this.input.style.width = "100%";
    this.input.style.padding = "4px";
    this.input.style.background = "#0f172a";
    this.input.style.color = "white";
    this.input.style.border = "1px solid #334155";
    this.input.style.borderRadius = "4px";

    this.box.appendChild(this.input);

    this.input.oninput = () => {
      this.value = parseFloat(this.input.value) || 0;
      onChange(this.value);
    };
  }
}
