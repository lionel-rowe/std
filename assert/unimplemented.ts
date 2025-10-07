// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { AssertionError } from "./assertion_error.ts";

/**
 * Use this to stub out methods or functions that will throw when invoked.
 *
 * @example Usage
 * ```ts ignore
 * import { unimplemented } from "@std/assert";
 *
 * class Calculator {
 *   add(a: number, b: number): number {
 *     return a + b;
 *   }
 *   subtract(a: number, b: number): number {
 *     unimplemented("TODO implement subtract method");
 *   }
 * }
 * ```
 *
 * @param msg Optional message to include in the error.
 * @returns Never returns, always throws.
 */
export function unimplemented(msg?: string): never {
  const msgSuffix = msg ? `: ${msg}` : ".";
  throw new AssertionError(`Unimplemented${msgSuffix}`);
}
