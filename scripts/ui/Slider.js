class Slider{
  constructor({
    parent = document.querySelector(".box"),
    min = 1,
    max = 10
  } = {}){
    this.parent = parent
    this.box = new Box({parent: parent}).box
    this.sliderContainer = new Box({parent: this.box}).box
    this.sliderContainer.className = "slidercontainer"
    this.slider = document.createElement("input");
    this.slider.className = "slider"
    
    this.slider.min = this.slider.value = this.value = this.min = min
    this.slider.max = this.max = max
    this.slider.type = "range"
    this.slider.step = "1"
    
    this.parent.appendChild(this.box)
    this.box.appendChild(this.sliderContainer)
    this.sliderContainer.appendChild(this.slider);
    this.slider.oninput = () => {
      this.oninput()
    }
  }
  oninput(){
    this.value = parseInt(this.slider.value)
    
    let percentage = (this.value / this.max) * 100
    this.slider.style.background = `linear-gradient(to right, #2E3369 0%, #2E3369 ${percentage - 5}%, #f2f2f2 ${percentage - 5}%, #f2f2f2 100%)`
  }
}