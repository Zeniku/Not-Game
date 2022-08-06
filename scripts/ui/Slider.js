/*class Slider{
  constructor({
    parent = document.querySelector(".box"),
    min = 1,
    max = 10
  } = {}){
    this.parent = parent
    
    this.sliderContainer = document.createElement("div")
    this.sliderContainer.className = "he"
    
    let sliderConf = {
      type: "range",
      min: min,
      max: max,
      value: min,
    }
    let sliderStyle = {
      height: "15px",
      width: "100%",
      "z-index": 9,
      "-webkit-appearance": "none",
      outline: "none",
      background: "linear-gradient(to right, #2E3369 0%, #2E3369 10%, #f2f2f2 10%, #f2f2f2 100%)",
      transition: "background 450ms ease-in",
      "border-radius": "25px",
    }
    
    this.slider = document.createElement("input");
    for(let i in sliderConf){
      this.slider[i] = sliderConf[i]
    }
    for(let i in sliderStyle){
      this.slider.style[i] = sliderStyle[i]
    }
    
    this.parent.appendChild(this.sliderContainer)
    this.sliderContainer.appendChild(this.slider);
    console.log(parent)
    console.log(this.slider)
  }
}
let hmm = new Slider()
console.log(Global.slider)*/
