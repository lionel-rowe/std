// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Returns a Promise that resolves to an object with all its Promise values awaited.
 *
 * @typeParam T The type of the input object.
 *
 * @param record The record to map values from.
 * @param transformer The function to transform each value.
 * @returns A new record with all its Promise values awaited.
 *
 * @example Basic usage
 * ```ts
 * import { mapValuesAsync } from "@std/collections/unstable-map-values-async";
 * import { assertEquals } from "@std/assert";
 *
 * const result: { foo: boolean; bar: string; 1: number } =
 *   await mapValuesAsync(
 *     {
 *       foo: Promise.resolve(true),
 *       bar: Promise.resolve("lorem"),
 *       1: Promise.resolve(-5),
 *     },
 *   );
 *
 * assertEquals(
 *   result,
 *   {
 *     foo: true,
 *     bar: "lorem",
 *     1: -5,
 *   },
 * );
 * ```
 */
export function mapValuesAsync<T extends Record<string, unknown>>(
  record: T,
  transformer?: undefined,
): Promise<
  {
    [K in keyof T]: Awaited<T[K]>;
  }
>;
/**
 * Applies the given transformer to all values in the given record and returns a
 * new record containing the resulting keys associated to the last value that
 * produced them.
 *
 * @typeParam I The type of the values in the input record.
 * @typeParam O The type of the values in the output record.
 * @typeParam K The type of the keys in the input and output records.
 *
 * @param record The record to map values from.
 * @param transformer The function to transform each value.
 * @returns A new record with all values transformed by the given transformer.
 *
 * @example Basic usage
 * ```ts
 * import { mapValuesAsync } from "@std/collections/unstable-map-values-async";
 * import { assertEquals } from "@std/assert";
 *
 * const usersById = {
 *   a5ec: { name: Promise.resolve("Mischa") },
 *   de4f: { name: Promise.resolve("Kim") },
 * };
 * const namesById = await mapValuesAsync(usersById, (user) => user.name);
 *
 * assertEquals(
 *   namesById,
 *   { a5ec: "Mischa", de4f: "Kim" },
 * );
 * ```
 */
export function mapValuesAsync<I, O, K extends string>(
  record: Readonly<Record<K, I>>,
  transformer: (value: Awaited<I>, key: K) => O,
): Promise<Record<K, Awaited<O>>>;
export function mapValuesAsync<I, O, K extends string>(
  record: Readonly<Partial<Record<K, I>>>,
  transformer: (value: Awaited<I>, key: K) => O,
): Promise<Partial<Record<K, Awaited<O>>>>;
export async function mapValuesAsync(
  record: Record<string, unknown>,
  transformer?: (value: unknown, key: string) => unknown,
): Promise<unknown> {
  transformer ??= (value: unknown) => value;

  return Object.fromEntries(
    await Promise.all(
      Object.entries(record).map(async ([key, value]) => [
        key,
        await transformer(await value, key),
      ]),
    ),
  );
}

const x = mapValuesAsync(
  {
    html: fetch("https://example.com"),
    bytes: fetch("https://example.com/bin"),
  },
  (value, key) => {
    return key === "html" ? value.text() : value.bytes();
    // if (key === "html") {
    //   return value.text();
    // }
    // return value.bytes();
  },
);
