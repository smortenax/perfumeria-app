/**
 * Exact rational numbers on BigInt.
 *
 * The core never uses floating point. Weighed masses are integers (micrograms)
 * and everything derived from them — pure matter, breakdowns of a formula used
 * as a material, rescaling when a vial is reweighed — is an exact fraction.
 * Rounding happens only when a number is formatted for display.
 */
export class Ratio {
  /** Numerator; carries the sign. */
  readonly num: bigint;
  /** Denominator; always positive, and coprime with the numerator. */
  readonly den: bigint;

  private constructor(num: bigint, den: bigint) {
    this.num = num;
    this.den = den;
  }

  static of(num: bigint | number, den: bigint | number = 1n): Ratio {
    const n = toBig(num);
    const d = toBig(den);
    if (d === 0n) {
      throw new RangeError("Ratio with a zero denominator");
    }
    const sign = d < 0n ? -1n : 1n;
    const g = gcd(abs(n), abs(d)) || 1n;
    return new Ratio((sign * n) / g, (sign * d) / g);
  }

  static readonly ZERO = Ratio.of(0n);
  static readonly ONE = Ratio.of(1n);

  /**
   * Parses an exact decimal written by a person: "12", "12,5", "0.996", "-3".
   * Both the comma and the point are accepted as the decimal separator.
   */
  static fromDecimal(text: string): Ratio {
    const clean = text.trim().replace(",", ".");
    const match = /^([+-]?)(\d+)(?:\.(\d+))?$/.exec(clean);
    if (!match) {
      throw new SyntaxError(`Not a decimal number: "${text}"`);
    }
    const [, signText, intPart, fracPart = ""] = match;
    const scale = 10n ** BigInt(fracPart.length);
    const magnitude = BigInt(intPart) * scale + (fracPart ? BigInt(fracPart) : 0n);
    return Ratio.of(signText === "-" ? -magnitude : magnitude, scale);
  }

  /** Parses the canonical form written by `toString`: "7/3", "-2", "0". */
  static parse(text: string): Ratio {
    const match = /^(-?\d+)(?:\/(\d+))?$/.exec(text.trim());
    if (!match) {
      throw new SyntaxError(`Not a ratio: "${text}"`);
    }
    return Ratio.of(BigInt(match[1]), match[2] ? BigInt(match[2]) : 1n);
  }

  static sum(values: Iterable<Ratio>): Ratio {
    let total = Ratio.ZERO;
    for (const value of values) {
      total = total.add(value);
    }
    return total;
  }

  add(other: Ratio): Ratio {
    return Ratio.of(this.num * other.den + other.num * this.den, this.den * other.den);
  }

  sub(other: Ratio): Ratio {
    return Ratio.of(this.num * other.den - other.num * this.den, this.den * other.den);
  }

  mul(other: Ratio): Ratio {
    return Ratio.of(this.num * other.num, this.den * other.den);
  }

  div(other: Ratio): Ratio {
    if (other.num === 0n) {
      throw new RangeError("Division by zero");
    }
    return Ratio.of(this.num * other.den, this.den * other.num);
  }

  neg(): Ratio {
    return Ratio.of(-this.num, this.den);
  }

  /** -1, 0 or 1. */
  cmp(other: Ratio): number {
    const diff = this.num * other.den - other.num * this.den;
    return diff < 0n ? -1 : diff > 0n ? 1 : 0;
  }

  eq(other: Ratio): boolean {
    return this.num === other.num && this.den === other.den;
  }

  lt(other: Ratio): boolean {
    return this.cmp(other) < 0;
  }

  gt(other: Ratio): boolean {
    return this.cmp(other) > 0;
  }

  isZero(): boolean {
    return this.num === 0n;
  }

  sign(): number {
    return this.num < 0n ? -1 : this.num > 0n ? 1 : 0;
  }

  isInteger(): boolean {
    return this.den === 1n;
  }

  /** Canonical, exact text: "num/den", or just "num" for integers. */
  toString(): string {
    return this.den === 1n ? this.num.toString() : `${this.num}/${this.den}`;
  }

  /**
   * Rounds to a fixed number of decimals with round-half-even and returns the
   * text with a point as separator. This is for display only.
   */
  toFixed(digits: number): string {
    if (!Number.isInteger(digits) || digits < 0) {
      throw new RangeError(`Invalid number of digits: ${digits}`);
    }
    const scale = 10n ** BigInt(digits);
    const scaled = abs(this.num) * scale;
    let quotient = scaled / this.den;
    const twiceRemainder = (scaled % this.den) * 2n;
    if (twiceRemainder > this.den || (twiceRemainder === this.den && quotient % 2n === 1n)) {
      quotient += 1n;
    }
    const negative = this.num < 0n && quotient !== 0n;
    const text = quotient.toString().padStart(digits + 1, "0");
    const intPart = digits === 0 ? text : text.slice(0, -digits);
    const fracPart = digits === 0 ? "" : `.${text.slice(-digits)}`;
    return `${negative ? "-" : ""}${intPart}${fracPart}`;
  }
}

function toBig(value: bigint | number): bigint {
  if (typeof value === "bigint") {
    return value;
  }
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`Only safe integers can become a Ratio exactly: ${value}`);
  }
  return BigInt(value);
}

function abs(value: bigint): bigint {
  return value < 0n ? -value : value;
}

function gcd(a: bigint, b: bigint): bigint {
  while (b !== 0n) {
    [a, b] = [b, a % b];
  }
  return a;
}
