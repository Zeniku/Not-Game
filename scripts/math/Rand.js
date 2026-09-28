class Rand {
  constructor(seed) {
    this.seed0 = 0n;
    this.seed1 = 0n;
    this.setSeed(seed === undefined ? BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)) : seed);
  }

  // --- Internal Core (XorShift128+) ---
  
  murmurHash3(x) {
    x = BigInt.asIntN(64, BigInt(x));
    x ^= BigInt.asUintN(64, x) >> 33n;
    x = BigInt.asIntN(64, x * -49064778989728563n);
    x ^= BigInt.asUintN(64, x) >> 33n;
    x = BigInt.asIntN(64, x * -4265267296055464877n);
    x ^= BigInt.asUintN(64, x) >> 33n;
    return x;
  }

  setSeed(seed) {
    let bigSeed = BigInt.asIntN(64, BigInt(seed));
    let s0 = this.murmurHash3(bigSeed === 0n ? 1n : bigSeed);
    this.seed0 = s0;
    this.seed1 = this.murmurHash3(s0);
  }

  nextLong() {
    let s1 = this.seed0;
    let s0 = this.seed1;
    this.seed0 = s0;
    s1 ^= s1 << 23n;
    s1 = BigInt.asIntN(64, s1);
    this.seed1 = s1 ^ s0 ^ (BigInt.asUintN(64, s1) >> 17n) ^ (BigInt.asUintN(64, s0) >> 26n);
    this.seed1 = BigInt.asIntN(64, this.seed1);
    return BigInt.asIntN(64, this.seed1 + s0);
  }

  // --- Arc Java Methods ---

  /** Returns a value between 0.0 and 1.0 */
  nextFloat() {
    let unsignedLong = BigInt.asUintN(64, this.nextLong());
    return Number(unsignedLong >> 40n) / (1 << 24);
  }

  /** Returns a value between -1.0 and 1.0 */
  nextGaussian() {
    // Implementation of Box-Muller transform used in Java's Random
    let u = 0, v = 0, s = 0;
    do {
      u = 2 * this.nextFloat() - 1;
      v = 2 * this.nextFloat() - 1;
      s = u * u + v * v;
    } while (s >= 1 || s === 0);
    let mul = Math.sqrt(-2.0 * Math.log(s) / s);
    return u * mul;
  }

  /** nextInt(bound) -> 0 to bound (exclusive) */
  nextInt(bound) {
    if (bound === undefined) return Number(BigInt.asIntN(32, this.nextLong()));
    if (bound <= 0) return 0;
    let res = Number(BigInt.asUintN(64, this.nextLong()) >> 33n) % bound;
    return res;
  }

  /** random(max) or random(min, max) */
  random(min, max) {
    if (max === undefined) return this.nextFloat() * min;
    return min + this.nextFloat() * (max - min);
  }

  /** range(amount) returns a value between -amount and amount */
  range(amount) {
    return (this.nextFloat() - 0.5) * 2.0 * amount;
  }

  /** chance(0.5) returns true 50% of the time */
  chance(chance) {
    return this.nextFloat() < chance;
  }

  /** Returns true or false */
  nextBoolean() {
    return (this.nextLong() & 1n) !== 0n;
  }

  /** Pick a random element from an array */
  choose(...args) {
    let items = (args.length === 1 && Array.isArray(args[0])) ? args[0] : args;
    return items[this.nextInt(items.length)];
  }
}
