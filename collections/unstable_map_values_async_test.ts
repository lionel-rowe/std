// Copyright 2018-2025 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { mapValuesAsync } from "./unstable_map_values_async.ts";

Deno.test({
  name: "mapValuesAsync() does not mutate its input",
  async fn() {
    const object = { a: 5, b: true };
    await mapValuesAsync(object, () => 999);

    assertEquals(object, { a: 5, b: true });
  },
});

Deno.test({
  name: "mapValuesAsync() handles empty input",
  async fn() {
    const result = await mapValuesAsync({}, (x) => x);
    assertEquals(result, {});
  },
});

Deno.test({
  name: "mapValuesAsync() preserves mapped type with no transformer callback",
  async fn() {
    const result: { foo: boolean; bar: string; 1: number } =
      await mapValuesAsync(
        {
          foo: true,
          bar: "lorem",
          1: -5,
        },
      );

    assertEquals(
      result,
      {
        foo: true,
        bar: "lorem",
        1: -5,
      },
    );
  },
});

Deno.test({
  name: "mapValuesAsync() awaits mapped type with no transformer callback",
  async fn() {
    const result: { foo: boolean; bar: string; 1: number } =
      await mapValuesAsync(
        {
          foo: Promise.resolve(true),
          bar: Promise.resolve("lorem"),
          1: Promise.resolve(-5),
        },
      );

    assertEquals(
      result,
      {
        foo: true,
        bar: "lorem",
        1: -5,
      },
    );
  },
});

Deno.test({
  name: "mapValuesAsync() preserves key type (Record)",
  async fn() {
    type Variants = "a" | "b";
    const input: Record<Variants, string | Promise<string>> = {
      a: "a",
      b: Promise.resolve("b"),
    };
    const actual = await mapValuesAsync(input, () => 1);
    const expected = { a: 1, b: 1 };

    assertEquals(actual, expected);
  },
});

Deno.test({
  name: "mapValuesAsync() preserves key type (Partial Record)",
  async fn() {
    type Variants = "a" | "b";
    const input: Partial<Record<Variants, string | Promise<string>>> = {
      a: Promise.resolve("a"),
    };
    const actual = await mapValuesAsync(input, () => 1);
    const expected = { a: 1 };

    assertEquals(actual, expected);
  },
});

Deno.test({
  name: "mapValuesAsync() pass key to transformer",
  async fn() {
    const key = "key";
    const actual = await mapValuesAsync({ [key]: "value" }, (_, k) => k);
    const expected = { [key]: key };

    assertEquals(actual, expected);
  },
});
