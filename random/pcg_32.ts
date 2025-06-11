// Copyright 2018-2025 the Deno authors. MIT license.
// Based on Rust `rand` crate (https://github.com/rust-random/rand). Apache-2.0 + MIT license.

import { platform } from "./_platform.ts";
import { seedBytesFromUint64 } from "./_seed_bytes_from_uint64.ts";
import type { IntegerTypedArray } from "./_types.ts";

const b4 = new Uint8Array(4);
const dv4 = new DataView(b4.buffer);

/**
 * A pseudo-random number generator that generates 32-bit unsigned integers.
 *
 * @example Usage
 * ```ts no-assert ignore
 * import { Prng32 } from "@std/random";
 *
 * class MyPrng extends Prng32 {
 *  nextUint32(): number {
 *    // Implement 32-bit uint generation logic here
 *  }
 * }
 * ```
 */
export abstract class Prng32 {
  /**
   * Generates a pseudo-random 32-bit unsigned integer.
   * @returns The generated pseudo-random 32-bit unsigned integer.
   */
  abstract nextUint32(): number;

  /**
   * Mutates the provided typed array with pseudo-random values.
   * @typeParam T - The type of the integer typed array.
   * @param arr An integer typed array
   * @returns The same typed array `arr`, now populated with random values.
   *
   * @example Usage
   * ```ts
   * import { Pcg32 } from "@std/random";
   * import { assert, assertEquals } from "@std/assert";
   *
   * const prng = new Pcg32(1644304675764660139n);
   * const u8 = new Uint8Array(10);
   * const values = prng.getRandomValues(u8);
   * assert(values === u8);
   * assertEquals([...values], [177, 144, 176, 110, 241, 123, 190, 143, 1, 150]);
   * ```
   */
  getRandomValues<T extends IntegerTypedArray>(arr: T): T {
    const { buffer, byteLength, byteOffset } = arr;
    const rem = byteLength % 4;
    const cutoffLen = byteLength - rem;

    const dv = new DataView(buffer, byteOffset, byteLength);
    for (let i = 0; i < cutoffLen; i += 4) {
      dv.setUint32(i, this.nextUint32(), true);
    }

    if (rem !== 0) {
      dv4.setUint32(0, this.nextUint32(), true);
      for (let i = 0; i < rem; ++i) {
        dv.setUint8(cutoffLen + i, b4[i]!);
      }
    }

    if (arr.BYTES_PER_ELEMENT !== 1 && !platform.littleEndian) {
      const bits = arr.BYTES_PER_ELEMENT * 8;
      const name = bits > 32
        ? `BigUint${bits as 64}` as const
        : `Uint${bits as 16 | 32}` as const;
      for (let i = 0; i < arr.length; ++i) {
        const idx = i * arr.BYTES_PER_ELEMENT;
        dv[`set${name}`](idx, dv[`get${name}`](idx, true) as never, false);
      }
    }

    return arr;
  }
}

/** u64 variables used for `advance` */
const vars = new BigUint64Array(5) as { [Index in VarIndex]: bigint };
type VarIndex = number & { readonly AdvIndex: unique symbol };
const ACC_MULT = 0 as VarIndex;
const ACC_PLUS = 1 as VarIndex;
const CUR_MULT = 2 as VarIndex;
const CUR_PLUS = 3 as VarIndex;
const DELTA = 4 as VarIndex;

/**
 * PCG32 seeded pseudo-random number generator.
 *
 * @example Usage
 * ```ts
 * import { Pcg32 } from "@std/random";
 * import { assertEquals } from "@std/assert";
 *
 * const prng = new Pcg32(1644304675764660139n);
 * assertEquals(prng.nextUint32(), 1857065137);
 * ```
 */
// See https://github.com/rust-random/rand/blob/f7bbcca/rand_pcg/src/pcg64.rs#L140-L153
export class Pcg32 extends Prng32 {
  /** Multiplier for the PCG32 algorithm. */
  // deno-lint-ignore deno-style-guide/naming-convention
  static readonly MULTIPLIER = 6364136223846793005n;
  // Constants are for 64-bit state, 32-bit output
  // deno-lint-ignore deno-style-guide/naming-convention
  static readonly #ROTATE = 59n; // 64 - 5
  // deno-lint-ignore deno-style-guide/naming-convention
  static readonly #XSHIFT = 18n; // (5 + 32) / 2
  // deno-lint-ignore deno-style-guide/naming-convention
  static readonly #SPARE = 27n; // 64 - 32 - 5

  #state = new BigUint64Array(2);
  /** The state of the generator */
  get state(): bigint {
    return this.#state[0]!;
  }
  set state(val) {
    this.#state[0] = val;
  }
  /** The increment value used in the generator */
  get increment(): bigint {
    return this.#state[1]!;
  }
  set #increment(val: bigint) {
    // https://www.pcg-random.org/posts/critiquing-pcg-streams.html#changing-the-increment
    // > Increments have just one rule: they must be odd.
    // We OR the increment with 1 upon setting to ensure this.
    this.#state[1] = val | 1n;
  }

  /**
   * Creates a new `Pcg32` instance with entropy generated from the seed.
   * @param seed A 64-bit unsigned integer used to seed the generator.
   */
  constructor(seed: bigint);
  /**
   * Creates a new `Pcg32` instance with the given `state` and `increment` values.
   * @param state The current state of the generator.
   * @param increment The increment value used in the generator.
   *
   * > [!NOTE]
   * > It is typically better to use the constructor that takes a single `seed` value.
   * > However, this constructor can be useful for resuming from a saved state.
   */
  constructor({ state, increment }: { state: bigint; increment: bigint });
  /** implementation */
  constructor(arg: bigint | { state: bigint; increment: bigint }) {
    if (typeof arg === "bigint") {
      const pcg = Pcg32.#seedFromUint64(arg);
      if (new.target === Pcg32) return pcg;
      arg = pcg;
    }

    super();
    this.state = arg.state;
    this.#increment = arg.increment;
  }

  /**
   * Generates the next pseudo-random 32-bit unsigned integer.
   * @returns The next pseudo-random 32-bit unsigned integer.
   *
   * @example Usage
   * ```ts
   * import { Pcg32 } from "@std/random";
   * import { assertEquals } from "@std/assert";
   *
   * const prng = new Pcg32(1644304675764660139n);
   * assertEquals(prng.nextUint32(), 1857065137);
   * ```
   */
  nextUint32(): number {
    // Output function XSH RR: xorshift high (bits), followed by a random rotate
    const rot = this.state >> Pcg32.#ROTATE;
    const xsh = BigInt.asUintN(
      32,
      (this.state >> Pcg32.#XSHIFT ^ this.state) >> Pcg32.#SPARE,
    );
    this.step();
    return Number(this.#rotateRightUint32(xsh, rot));
  }

  /**
   * Mutates `pcg` by advancing `pcg.state`.
   * @returns `this`
   *
   * @example Usage
   * ```ts
   * import { Pcg32 } from "@std/random";
   * import { assertEquals } from "@std/assert";
   *
   * const prng = new Pcg32(1644304675764660139n);
   * assertEquals(prng.step().nextUint32(), 2411625457);
   * ```
   */
  step(): this {
    this.state = this.state * Pcg32.MULTIPLIER + this.increment;
    return this;
  }

  // `n`, `rot`, and return val are all u32
  #rotateRightUint32(n: bigint, rot: bigint): bigint {
    const left = BigInt.asUintN(32, n << (-rot & 31n));
    const right = n >> rot;
    return left | right;
  }

  /**
   * Multi-step advance (jump-ahead, jump-back)
   * @param delta The number of steps to advance. Negative values are allowed.
   * @returns `this`
   *
   * @example Usage
   * ```ts
   * import { Pcg32 } from "@std/random";
   * import { assertEquals } from "@std/assert";
   *
   * const prng = new Pcg32(1644304675764660139n);
   * assertEquals(prng.advance(1000n).nextUint32(), 298923276);
   * ```
   */
  // See https://github.com/rust-random/rand/blob/f7bbcca/rand_pcg/src/pcg64.rs#L60
  advance(delta: bigint): this {
    vars[ACC_MULT] = 1n;
    vars[ACC_PLUS] = 0n;
    vars[CUR_MULT] = Pcg32.MULTIPLIER;
    vars[CUR_PLUS] = this.increment;

    // If a negative value was passed, it gets wrapped to positive, giving the correct result
    vars[DELTA] = delta;

    while (vars[DELTA] > 0n) {
      if (vars[DELTA] & 1n) {
        vars[ACC_MULT] *= vars[CUR_MULT];
        vars[ACC_PLUS] = vars[ACC_PLUS] * vars[CUR_MULT] + vars[CUR_PLUS];
      }
      vars[CUR_PLUS] = (vars[CUR_MULT] + 1n) * vars[CUR_PLUS];
      vars[CUR_MULT] *= vars[CUR_MULT];
      // Floor-halving each iteration, max 64 iterations for initial wrapped delta in [2^63, 2^64)
      vars[DELTA] /= 2n;
    }

    this.state = this.state * vars[ACC_MULT] + vars[ACC_PLUS];

    return this;
  }

  static #seedFromUint64(seed: bigint): Pcg32 {
    return this.#fromSeed(seedBytesFromUint64(seed, new Uint8Array(16)));
  }

  /**
   * Modified from https://github.com/rust-random/rand/blob/f7bbcca/rand_pcg/src/pcg64.rs#L129-L135
   */
  static #fromSeed(seed: Uint8Array) {
    const d = new DataView(seed.buffer);
    return this.#fromStateIncr(
      d.getBigUint64(0, true),
      d.getBigUint64(8, true) | 1n,
    );
  }

  /**
   * Modified from https://github.com/rust-random/rand/blob/f7bbcca/rand_pcg/src/pcg64.rs#L99-L105
   */
  static #fromStateIncr(state: bigint, increment: bigint): Pcg32 {
    // Move state away from initial value
    return new Pcg32({ state: state + increment, increment }).step();
  }
}
