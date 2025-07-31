// deno-lint-ignore-file no-explicit-any
// Copyright 2018-2025 the Deno authors. MIT license.

import { assert, assertEquals } from "@std/assert";
import { dedent } from "@std/text/unstable-dedent";
import { deepMapValues } from "./unstable_deep_map_values.ts";

Deno.test({
  name:
    "deepMapValues() maps leaf node values, handling circular data structures",
  ignore: !globalThis.Deno?.inspect,
  fn() {
    function converter(x: unknown): unknown {
      if (x instanceof Blob) {
        return {
          $$blob: `${x.type || "application/octet-stream"}(${x.size})`,
        };
      }
      return x;
    }

    const fooBlob = new Blob(["foo"], { type: "text/plain" });
    const barBlob = new Blob(["bar"]);

    const x: any = { f: "quux" };
    x.x = x;

    const left: any = {
      a: [1, fooBlob, x, fooBlob],
      b: { c: barBlob },
    };

    left.a.push(left);
    left.b.d = left;
    left.b.x = x;

    const resolved: any = deepMapValues(left, converter);
    assertEquals(resolved.a[1], { $$blob: "text/plain(3)" });
    assertEquals(resolved.b.c, { $$blob: "application/octet-stream(3)" });

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
            { "$$blob": "text/plain(3)" },
            <ref *1> { f: "quux", x: [Circular *1] },
            { "$$blob": "text/plain(3)" },
            [Circular *2],
          ],
          b: {
            c: { "$$blob": "application/octet-stream(3)" },
            d: [Circular *2],
            x: <ref *1> { f: "quux", x: [Circular *1] },
          },
        }
      `,
    );
  },
});
