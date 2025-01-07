// Copyright Isaac Z. Schlueter and Contributors. All rights reserved. ISC license.
// Copyright 2018-2025 the Deno authors. MIT license.
import { assertEquals, assertThrows } from "@std/assert";
import type { ReleaseType } from "./types.ts";
import { increment } from "./increment.ts";
import { format } from "./format.ts";

interface LooseSemVer {
  major: number;
  minor: number;
  patch: number;
  prerelease?: (string | number)[] | undefined;
  build?: string[] | undefined;
}

Deno.test("increment()", async (t) => {
  const versions: [
    version: LooseSemVer,
    op: ReleaseType,
    prerelease: string | undefined,
    build: string | undefined,
    expected: string | undefined,
  ][] = [
    [
      { major: 1, minor: 2, patch: 3 },
      "major",
      undefined,
      undefined,
      "2.0.0",
    ],
    [
      { major: 1, minor: 2, patch: 3 },
      "minor",
      undefined,
      undefined,
      "1.3.0",
    ],
    [
      { major: 1, minor: 2, patch: 3 },
      "patch",
      undefined,
      undefined,
      "1.2.4",
    ],
    [
      {
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: ["tag"],
      },
      "major",
      undefined,
      undefined,
      "2.0.0",
    ],
    [
      { major: 1, minor: 2, patch: 0, prerelease: [0] },
      "patch",
      undefined,
      undefined,
      "1.2.0",
    ],
    [
      { major: 1, minor: 2, patch: 3, prerelease: [4] },
      "major",
      undefined,
      undefined,
      "2.0.0",
    ],
    [
      { major: 1, minor: 2, patch: 3, prerelease: [4] },
      "minor",
      undefined,
      undefined,
      "1.3.0",
    ],
    [
      { major: 1, minor: 2, patch: 3, prerelease: [4] },
      "patch",
      undefined,
      undefined,
      "1.2.3",
    ],
    [
      {
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: ["alpha", 0, "beta"],
      },
      "major",
      undefined,
      undefined,
      "2.0.0",
    ],
    [
      {
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: ["alpha", 0, "beta"],
      },
      "minor",
      undefined,
      undefined,
      "1.3.0",
    ],
    [
      {
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: ["alpha", 0, "beta"],
      },
      "patch",
      undefined,
      undefined,
      "1.2.3",
    ],
    [
      { major: 1, minor: 2, patch: 4 },
      "prerelease",
      undefined,
      undefined,
      "1.2.5-0",
    ],
    [
      { major: 1, minor: 2, patch: 3, prerelease: [0] },
      "prerelease",
      undefined,
      undefined,
      "1.2.3-1",
    ],
    [
      {
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: ["alpha", 0],
      },
      "prerelease",
      undefined,
      undefined,
      "1.2.3-alpha.1",
    ],
    [
      {
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: ["alpha", 1],
      },
      "prerelease",
      undefined,
      undefined,
      "1.2.3-alpha.2",
    ],
    [
      {
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: ["alpha", 2],
      },
      "prerelease",
      undefined,
      undefined,
      "1.2.3-alpha.3",
    ],
    [
      {
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: ["alpha", 0, "beta"],
      },
      "prerelease",
      undefined,
      undefined,
      "1.2.3-alpha.1.beta",
    ],
    [
      {
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: ["alpha", 1, "beta"],
      },
      "prerelease",
      undefined,
      undefined,
      "1.2.3-alpha.2.beta",
    ],
    [
      {
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: ["alpha", 2, "beta"],
      },
      "prerelease",
      undefined,
      undefined,
      "1.2.3-alpha.3.beta",
    ],
    [
      {
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: ["alpha", 10, 0, "beta"],
      },
      "prerelease",
      undefined,
      undefined,
      "1.2.3-alpha.10.1.beta",
    ],
    [
      {
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: ["alpha", 10, 1, "beta"],
      },
      "prerelease",
      undefined,
      undefined,
      "1.2.3-alpha.10.2.beta",
    ],
    [
      {
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: ["alpha", 10, 2, "beta"],
      },
      "prerelease",
      undefined,
      undefined,
      "1.2.3-alpha.10.3.beta",
    ],
    [
      {
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: ["alpha", 10, "beta", 0],
      },
      "prerelease",
      undefined,
      undefined,
      "1.2.3-alpha.10.beta.1",
    ],
    [
      {
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: ["alpha", 10, "beta", 1],
      },
      "prerelease",
      undefined,
      undefined,
      "1.2.3-alpha.10.beta.2",
    ],
    [
      {
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: ["alpha", 10, "beta", 2],
      },
      "prerelease",
      undefined,
      undefined,
      "1.2.3-alpha.10.beta.3",
    ],
    [
      {
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: ["alpha", 9, "beta"],
      },
      "prerelease",
      undefined,
      undefined,
      "1.2.3-alpha.10.beta",
    ],
    [
      {
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: ["alpha", 10, "beta"],
      },
      "prerelease",
      undefined,
      undefined,
      "1.2.3-alpha.11.beta",
    ],
    [
      {
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: ["alpha", 11, "beta"],
      },
      "prerelease",
      undefined,
      undefined,
      "1.2.3-alpha.12.beta",
    ],
    [
      { major: 1, minor: 2, patch: 0 },
      "prepatch",
      undefined,
      undefined,
      "1.2.1-0",
    ],
    [
      { major: 1, minor: 2, patch: 0, prerelease: [1] },
      "prepatch",
      undefined,
      undefined,
      "1.2.1-2",
    ],
    [
      { major: 1, minor: 2, patch: 0 },
      "preminor",
      undefined,
      undefined,
      "1.3.0-0",
    ],
    [
      { major: 1, minor: 2, patch: 3, prerelease: [1] },
      "preminor",
      undefined,
      undefined,
      "1.3.0-2",
    ],
    [
      { major: 1, minor: 2, patch: 0 },
      "premajor",
      undefined,
      undefined,
      "2.0.0-0",
    ],
    [
      { major: 1, minor: 2, patch: 3, prerelease: [1] },
      "premajor",
      undefined,
      undefined,
      "2.0.0-2",
    ],
    [
      { major: 1, minor: 2, patch: 0, prerelease: [1] },
      "minor",
      undefined,
      undefined,
      "1.2.0",
    ],
    [
      { major: 1, minor: 0, patch: 0, prerelease: [1] },
      "major",
      undefined,
      undefined,
      "1.0.0",
    ],
    [
      { major: 1, minor: 2, patch: 3 },
      "major",
      "dev",
      undefined,
      "2.0.0",
    ],
    [
      { major: 1, minor: 2, patch: 3 },
      "minor",
      "dev",
      undefined,
      "1.3.0",
    ],
    [
      { major: 1, minor: 2, patch: 3 },
      "patch",
      "dev",
      undefined,
      "1.2.4",
    ],
    [
      {
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: ["tag"],
      },
      "major",
      "dev",
      undefined,
      "2.0.0",
    ],
    [
      { major: 1, minor: 2, patch: 0, prerelease: [0] },
      "patch",
      "dev",
      undefined,
      "1.2.0",
    ],
    [
      { major: 1, minor: 2, patch: 3, prerelease: [4] },
      "major",
      "dev",
      undefined,
      "2.0.0",
    ],
    [
      { major: 1, minor: 2, patch: 3, prerelease: [4] },
      "minor",
      "dev",
      undefined,
      "1.3.0",
    ],
    [
      { major: 1, minor: 2, patch: 3, prerelease: [4] },
      "patch",
      "dev",
      undefined,
      "1.2.3",
    ],
    [
      {
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: ["alpha", 0, "beta"],
      },
      "major",
      "dev",
      undefined,
      "2.0.0",
    ],
    [
      {
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: ["alpha", 0, "beta"],
      },
      "minor",
      "dev",
      undefined,
      "1.3.0",
    ],
    [
      {
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: ["alpha", 0, "beta"],
      },
      "patch",
      "dev",
      undefined,
      "1.2.3",
    ],
    [
      { major: 1, minor: 2, patch: 4 },
      "prerelease",
      "dev",
      undefined,
      "1.2.5-dev.0",
    ],
    [
      { major: 1, minor: 2, patch: 3, prerelease: [0] },
      "prerelease",
      "dev",
      undefined,
      "1.2.3-dev.0",
    ],
    [
      {
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: ["alpha", 0],
      },
      "prerelease",
      "dev",
      undefined,
      "1.2.3-dev.0",
    ],
    [
      {
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: ["alpha", 0],
      },
      "prerelease",
      "alpha",
      undefined,
      "1.2.3-alpha.1",
    ],
    [
      {
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: ["alpha", 0, "beta"],
      },
      "prerelease",
      "dev",
      undefined,
      "1.2.3-dev.0",
    ],
    [
      {
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: ["alpha", 0, "beta"],
      },
      "prerelease",
      "alpha",
      undefined,
      "1.2.3-alpha.1.beta",
    ],
    [
      {
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: ["alpha", 10, 0, "beta"],
      },
      "prerelease",
      "dev",
      undefined,
      "1.2.3-dev.0",
    ],
    [
      {
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: ["alpha", 10, 0, "beta"],
      },
      "prerelease",
      "alpha",
      undefined,
      "1.2.3-alpha.10.1.beta",
    ],
    [
      {
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: ["alpha", 10, 1, "beta"],
      },
      "prerelease",
      "alpha",
      undefined,
      "1.2.3-alpha.10.2.beta",
    ],
    [
      {
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: ["alpha", 10, 2, "beta"],
      },
      "prerelease",
      "alpha",
      undefined,
      "1.2.3-alpha.10.3.beta",
    ],
    [
      {
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: ["alpha", 10, "beta", 0],
      },
      "prerelease",
      "dev",
      undefined,
      "1.2.3-dev.0",
    ],
    [
      {
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: ["alpha", 10, "beta", 0],
      },
      "prerelease",
      "alpha",
      undefined,
      "1.2.3-alpha.10.beta.1",
    ],
    [
      {
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: ["alpha", 10, "beta", 1],
      },
      "prerelease",
      "alpha",
      undefined,
      "1.2.3-alpha.10.beta.2",
    ],
    [
      {
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: ["alpha", 10, "beta", 2],
      },
      "prerelease",
      "alpha",
      undefined,
      "1.2.3-alpha.10.beta.3",
    ],
    [
      {
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: ["alpha", 9, "beta"],
      },
      "prerelease",
      "dev",
      undefined,
      "1.2.3-dev.0",
    ],
    [
      {
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: ["alpha", 9, "beta"],
      },
      "prerelease",
      "alpha",
      undefined,
      "1.2.3-alpha.10.beta",
    ],
    [
      {
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: ["alpha", 10, "beta"],
      },
      "prerelease",
      "alpha",
      undefined,
      "1.2.3-alpha.11.beta",
    ],
    [
      {
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: ["alpha", 11, "beta"],
      },
      "prerelease",
      "alpha",
      undefined,
      "1.2.3-alpha.12.beta",
    ],
    [
      { major: 1, minor: 2, patch: 0 },
      "prepatch",
      "dev",
      undefined,
      "1.2.1-dev.0",
    ],
    [
      { major: 1, minor: 2, patch: 0, prerelease: [1] },
      "prepatch",
      "dev",
      undefined,
      "1.2.1-dev.0",
    ],
    [
      { major: 1, minor: 2, patch: 0 },
      "preminor",
      "dev",
      undefined,
      "1.3.0-dev.0",
    ],
    [
      { major: 1, minor: 2, patch: 3, prerelease: [1] },
      "preminor",
      "dev",
      undefined,
      "1.3.0-dev.0",
    ],
    [
      { major: 1, minor: 2, patch: 0 },
      "premajor",
      "dev",
      undefined,
      "2.0.0-dev.0",
    ],
    [
      { major: 1, minor: 2, patch: 3, prerelease: [1] },
      "premajor",
      "dev",
      undefined,
      "2.0.0-dev.0",
    ],
    [
      { major: 1, minor: 2, patch: 0, prerelease: [1] },
      "minor",
      "dev",
      undefined,
      "1.2.0",
    ],
    [
      {
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: ["dev", "bar"],
      },
      "prerelease",
      "dev",
      undefined,
      "1.2.3-dev.0",
    ],
    // Add build metadata
    [
      { major: 1, minor: 2, patch: 3 },
      "major",
      undefined,
      "1",
      "2.0.0+1",
    ],
    [
      { major: 1, minor: 2, patch: 3 },
      "minor",
      undefined,
      "1",
      "1.3.0+1",
    ],
    [
      { major: 1, minor: 2, patch: 3 },
      "patch",
      undefined,
      "1",
      "1.2.4+1",
    ],
    [
      { major: 1, minor: 2, patch: 3 },
      "premajor",
      "dev",
      "1",
      "2.0.0-dev.0+1",
    ],
    [
      { major: 1, minor: 2, patch: 3 },
      "preminor",
      "dev",
      "1",
      "1.3.0-dev.0+1",
    ],
    [
      { major: 1, minor: 2, patch: 3 },
      "prepatch",
      "dev",
      "1",
      "1.2.4-dev.0+1",
    ],
    [
      { major: 1, minor: 2, patch: 3 },
      "pre",
      "dev",
      "1",
      "1.2.3-dev.0+1",
    ],
    // Update build metadata
    [
      { major: 1, minor: 2, patch: 3, build: ["1"] },
      "major",
      undefined,
      "2",
      "2.0.0+2",
    ],
    [
      { major: 1, minor: 2, patch: 3, build: ["1"] },
      "minor",
      undefined,
      "2",
      "1.3.0+2",
    ],
    [
      { major: 1, minor: 2, patch: 3, build: ["1"] },
      "patch",
      undefined,
      "2",
      "1.2.4+2",
    ],
    [
      { major: 1, minor: 2, patch: 3, build: ["1"] },
      "premajor",
      "dev",
      "2",
      "2.0.0-dev.0+2",
    ],
    [
      { major: 1, minor: 2, patch: 3, build: ["1"] },
      "preminor",
      "dev",
      "2",
      "1.3.0-dev.0+2",
    ],
    [
      { major: 1, minor: 2, patch: 3, build: ["1"] },
      "prepatch",
      "dev",
      "2",
      "1.2.4-dev.0+2",
    ],
    // Retain build metadata
    [
      { major: 1, minor: 2, patch: 3, build: ["1"] },
      "major",
      undefined,
      undefined,
      "2.0.0+1",
    ],
    [
      { major: 1, minor: 2, patch: 3, build: ["1"] },
      "minor",
      undefined,
      undefined,
      "1.3.0+1",
    ],
    [
      { major: 1, minor: 2, patch: 3, build: ["1"] },
      "patch",
      undefined,
      undefined,
      "1.2.4+1",
    ],
    [
      { major: 1, minor: 2, patch: 3, build: ["1"] },
      "premajor",
      "dev",
      undefined,
      "2.0.0-dev.0+1",
    ],
    [
      { major: 1, minor: 2, patch: 3, build: ["1"] },
      "preminor",
      "dev",
      undefined,
      "1.3.0-dev.0+1",
    ],
    [
      { major: 1, minor: 2, patch: 3, build: ["1"] },
      "prepatch",
      "dev",
      undefined,
      "1.2.4-dev.0+1",
    ],
    [
      { major: 1, minor: 2, patch: 3, build: ["1"] },
      "pre",
      "dev",
      undefined,
      "1.2.3-dev.0+1",
    ],
    // Remove build metadata
    [
      { major: 1, minor: 2, patch: 3, build: ["1"] },
      "major",
      undefined,
      "",
      "2.0.0",
    ],
    [
      { major: 1, minor: 2, patch: 3, build: ["1"] },
      "minor",
      undefined,
      "",
      "1.3.0",
    ],
    [
      { major: 1, minor: 2, patch: 3, build: ["1"] },
      "patch",
      undefined,
      "",
      "1.2.4",
    ],
    [
      { major: 1, minor: 2, patch: 3, build: ["1"] },
      "premajor",
      "dev",
      "",
      "2.0.0-dev.0",
    ],
    [
      { major: 1, minor: 2, patch: 3, build: ["1"] },
      "preminor",
      "dev",
      "",
      "1.3.0-dev.0",
    ],
    [
      { major: 1, minor: 2, patch: 3, build: ["1"] },
      "prepatch",
      "dev",
      "",
      "1.2.4-dev.0",
    ],
    [
      { major: 1, minor: 2, patch: 3, build: ["1"] },
      "pre",
      "dev",
      "",
      "1.2.3-dev.0",
    ],
    [
      { major: 1, minor: 2, patch: 3, prerelease: undefined },
      "pre",
      undefined,
      undefined,
      "1.2.3-0",
    ],
    [
      { major: 1, minor: 2, patch: 3, prerelease: [] },
      "pre",
      undefined,
      undefined,
      "1.2.3-0",
    ],
    [
      { major: 1, minor: 2, patch: 3, build: undefined },
      "pre",
      undefined,
      undefined,
      "1.2.3-0",
    ],
    [
      { major: 1, minor: 2, patch: 3, build: [] },
      "pre",
      undefined,
      undefined,
      "1.2.3-0",
    ],
    [
      {
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: undefined,
        build: undefined,
      },
      "pre",
      undefined,
      undefined,
      "1.2.3-0",
    ],
    [
      { major: 1, minor: 2, patch: 3, prerelease: [], build: [] },
      "pre",
      undefined,
      undefined,
      "1.2.3-0",
    ],
  ];

  for (const [version, op, prerelease, build, expected] of versions) {
    await t.step({
      // @ts-expect-error: explicitly giving undefined
      name: `${op} ${format(version)}`,
      fn: () => {
        // @ts-expect-error: explicitly giving undefined
        const actual = increment(version, op, { prerelease, build });
        assertEquals(format(actual), expected);
      },
    });
  }
});

Deno.test("increment() throws on invalid input", () => {
  assertThrows(() =>
    increment({ major: 1, minor: 2, patch: 3 }, "invalid" as ReleaseType)
  );
});
