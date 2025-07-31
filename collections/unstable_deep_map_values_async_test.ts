// deno-lint-ignore-file no-explicit-any
// Copyright 2018-2025 the Deno authors. MIT license.

import { assert, assertEquals } from "@std/assert";
import { dedent } from "@std/text/unstable-dedent";
import { deepMapValuesAsync } from "./unstable_deep_map_values_async.ts";

Deno.test({
  name:
    "deepMapValuesAsync() maps leaf node values, handling circular data structures",
  ignore: !globalThis.Deno?.inspect,
  async fn() {
    async function converter(x: unknown): Promise<unknown> {
      if (x instanceof Blob) {
        return {
          $$blob:
            await (x.type.split("/", 1)[0] === "text" ? x.text() : x.bytes()),
        };
      }
      return x;
    }

    const fooBlob = new Blob(["foo"], { type: "text/plain" });
    const barBlob = new Blob(["bar"]);

    const x: any = { f: Promise.resolve("quux") };
    x.x = x;

    const left: any = {
      a: [1, fooBlob, x, fooBlob],
      b: { c: barBlob },
    };

    left.a.push(left);
    left.b.d = left;
    left.b.x = x;

    const resolved: any = await deepMapValuesAsync(left, converter);
    assertEquals(resolved.a[1], { $$blob: "foo" });
    assertEquals(resolved.b.c, { $$blob: new TextEncoder().encode("bar") });

    assert(resolved.a[1] === resolved.a[3]);
    assert(resolved.a[4] === resolved);

    assertEquals(
      Deno.inspect(resolved, {
        trailingComma: true,
        sorted: true,
      }),
      dedent`
        <ref *2> {
          a: [
            1,
            { "$$blob": "foo" },
            <ref *1> { f: "quux", x: [Circular *1] },
            { "$$blob": "foo" },
            [Circular *2],
          ],
          b: {
            c: { "$$blob": Uint8Array(3) [ 98, 97, 114 ] },
            d: [Circular *2],
            x: <ref *1> { f: "quux", x: [Circular *1] },
          },
        }
      `,
    );
  },
});
