// Copyright 2018-2025 the Deno authors. MIT license.

import type { Uint8Array_ } from "./_types.ts";
export type { Uint8Array_ };

const encoder = new TextEncoder();
const WHITE_SPACE = new Set(encoder.encode("\t\n\f\r "));

export const padding = "=".charCodeAt(0);
export const alphabet: Record<Base64Alphabet, Uint8Array> = {
  base64: encoder
    .encode("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"),
  base64url: encoder
    .encode("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"),
};
export const rAlphabet: Record<Base64Alphabet, Uint8Array> = {
  base64: new Uint8Array(128).fill(64), // alphabet.base64.length
  base64url: new Uint8Array(128).fill(64),
};
alphabet.base64
  .forEach((byte, i) => rAlphabet.base64[byte] = i);
alphabet.base64url
  .forEach((byte, i) => rAlphabet.base64url[byte] = i);

/**
 * Options for encoding and decoding base64 strings.
 */
export interface Base64Options {
  /** The base64 alphabet. Defaults to "base64" */
  alphabet?: Base64Alphabet;
}

/**
 * The base64 alphabets.
 */
export type Base64Alphabet = "base64" | "base64url";

/**
 * Calculate the output size needed to encode a given input size for
 * {@linkcode encodeIntoBase64}.
 *
 * @param originalSize The size of the input buffer.
 * @returns The size of the output buffer.
 *
 * @example Basic Usage
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import { calcSizeBase64 } from "@std/encoding/unstable-base64";
 *
 * assertEquals(calcSizeBase64(1), 4);
 * ```
 */
export function calcSizeBase64(originalSize: number): number {
  return ((originalSize + 2) / 3 | 0) * 4;
}

export function encode(
  buffer: Uint8Array_,
  i: number,
  o: number,
  alphabet: Uint8Array,
  padding: number,
): number {
  i += 2;
  for (; i < buffer.length; i += 3) {
    const x = (buffer[i - 2]! << 16) | (buffer[i - 1]! << 8) | buffer[i]!;
    buffer[o++] = alphabet[x >> 18]!;
    buffer[o++] = alphabet[x >> 12 & 0x3F]!;
    buffer[o++] = alphabet[x >> 6 & 0x3F]!;
    buffer[o++] = alphabet[x & 0x3F]!;
  }
  switch (i) {
    case buffer.length + 1: {
      const x = buffer[i - 2]! << 16;
      buffer[o++] = alphabet[x >> 18]!;
      buffer[o++] = alphabet[x >> 12 & 0x3F]!;
      buffer[o++] = padding;
      buffer[o++] = padding;
      break;
    }
    case buffer.length: {
      const x = (buffer[i - 2]! << 16) | (buffer[i - 1]! << 8);
      buffer[o++] = alphabet[x >> 18]!;
      buffer[o++] = alphabet[x >> 12 & 0x3F]!;
      buffer[o++] = alphabet[x >> 6 & 0x3F]!;
      buffer[o++] = padding;
      break;
    }
  }
  return o;
}

const chunk = new Uint8Array(4);

export function decode(
  buffer: Uint8Array_,
  i: number,
  o: number,
  alphabet: Uint8Array,
  padding: number,
): number {
  let expectedPaddingLength = 0;

  chunks: while (true) {
    for (let j = 0; j < 4; ++j) {
      while (WHITE_SPACE.has(buffer[i]!)) ++i;

      if (i === buffer.length || buffer[i]! === padding) {
        switch (j) {
          case 3: {
            const x = (chunk[0]! << 18) | (chunk[1]! << 12) | (chunk[2]! << 6);
            buffer[o++] = x >> 16;
            buffer[o++] = x >> 8 & 0xFF;
            expectedPaddingLength = 1;
            break;
          }
          case 2: {
            const x = (chunk[0]! << 18) | (chunk[1]! << 12);
            buffer[o++] = x >> 16;
            expectedPaddingLength = 2;
            break;
          }
          case 1: {
            throw new RangeError(
              `Cannot decode input as base64: Length (${i}), excluding padding, must not have a remainder of 1 when divided by 4`,
            );
          }
        }

        break chunks;
      }

      const char = buffer[i++]!;

      const byte = alphabet[char] ?? 64;
      if (byte === 64) { // alphabet.Base64.length
        throw new TypeError(
          `Cannot decode input as base64: Invalid character (${
            String.fromCharCode(char)
          })`,
        );
      }

      chunk[j] = byte;
    }

    const x = (chunk[0]! << 18) | (chunk[1]! << 12) | (chunk[2]! << 6) |
      chunk[3]!;
    buffer[o++] = x >> 16;
    buffer[o++] = x >> 8 & 0xFF;
    buffer[o++] = x & 0xFF;
  }

  const hasPadding = () => {
    while (WHITE_SPACE.has(buffer[i]!)) ++i;

    if (i === buffer.length) return false;

    const char = buffer[i++]!;

    if (char === padding) return true;
    throw new TypeError(
      `Cannot decode input as base64: Invalid character (${
        String.fromCharCode(char)
      })`,
    );
  };

  let paddingLength = 0;
  while (hasPadding()) ++paddingLength;

  if (paddingLength && paddingLength !== expectedPaddingLength) {
    throw new RangeError(
      `Cannot decode input as base64: Expected ${expectedPaddingLength} padding characters, but found ${paddingLength}`,
    );
  }

  return o;
}
