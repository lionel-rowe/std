// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { AssertionError } from "./assertion_error.ts";

/**
 * Use this to assert that a code path is unreachable.
 *
 * @example Usage
 * ```ts ignore
 * import { unreachable } from "@std/assert";
 *
 * if (Math.random() === 1) {
 *   // This path should be unreachable, but will throw an error if ever reached.
 *   unreachable("Math.random() can never be 1");
 * }
 * ```
 *
 * @param msg Optional message to include in the error.
 * @returns Never returns, always throws.
 */
export function unreachable(msg?: string): never {
  const msgSuffix = msg ? `: ${msg}` : ".";
  throw new AssertionError(`Unreachable${msgSuffix}`);
}
