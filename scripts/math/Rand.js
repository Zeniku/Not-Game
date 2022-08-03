class Rand {
  m = 0x80000000; // 2**31;
  a = 1103515245;
  c = 12345;
  constructor(seed){
    this.state = seed ? seed : Math.floor(Math.random() * (this.m - 1));
  }
  setSeed(seed){
    this.state = seed
  }
  nextInt(){
    this.state = (this.a * this.state + this.c) % this.m;
    return this.state;
  }
  nextFloat(){
    return this.nextInt() / (this.m - 1)
  }
  nextRange(start, end){
    var rangeSize = end - start;
    var randomUnder1 = this.nextInt() / this.m;
    return start + Math.floor(randomUnder1 * rangeSize);
  }
}
