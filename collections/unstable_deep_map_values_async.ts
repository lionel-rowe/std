// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

export async function deepMapValuesAsync(
  data: unknown,
  transformer: (value: unknown, key: string | number | undefined) => unknown,
): Promise<unknown> {
  const wrappers: AsyncWrapper[] = [];
  const out = _deepMapValuesAsync(
    data,
    transformer,
    undefined,
    new WeakMap(),
    wrappers,
  ) as Promise<unknown>;

  await Promise.all(wrappers);
  return out;
}

/**
 * Used to ensure the wrapped promise doesn't try to resolve when awaited
 * @example
 * ```ts no-assert ignore
 * import { delay } from "@std/async/delay";
 * const p = new AsyncWrapper(delay(100));
 * await p; // immediate (no 100ms delay)
 * p.onResolve(console.log); // logs after 100ms
 * ```
 */
class AsyncWrapper<T = unknown> {
  #value: Promise<T>;
  constructor(value: Promise<T>) {
    this.#value = value;
  }
  onResolve(callback: (value: T) => void): void {
    this.#value.then(callback);
  }
}

function _deepMapValuesAsync(
  value: unknown,
  transformer: (value: unknown, key: string | number | undefined) => unknown,
  key: string | number | undefined,
  seen: WeakMap<WeakKey, Promise<unknown>>,
  wrappers: AsyncWrapper[],
): Promise<unknown> | AsyncWrapper {
  const cached = seen.get(value as WeakKey);
  if (cached != null) {
    const wrapper = new AsyncWrapper(cached);
    wrappers.push(wrapper);
    return wrapper;
  }

  const p = Promise.withResolvers();

  try {
    seen.set(value as WeakKey, p.promise);
  } catch { /* ignore if invalid WeakKey */ }

  if (value != null && typeof value === "object") {
    if (Array.isArray(value)) {
      const parent = new Array(value.length);

      Promise.all(
        value.map((item, idx) =>
          _deepMapValuesAsync(item, transformer, idx, seen, wrappers)
        ),
      ).then(async (x) => {
        for (const [i, promise] of x.entries()) {
          const val = await promise;
          if (val instanceof AsyncWrapper) val.onResolve((x) => parent[i] = x);
          else parent[i] = val;
        }

        p.resolve(parent);
      });
    } else if (
      [null, Object.prototype].includes(Object.getPrototypeOf(value))
    ) {
      // is a plain object
      const parent: Record<string, unknown> = {};

      Promise.all(
        Object
          .entries(value)
          .map(async (
            [key, val],
          ) =>
            [
              key,
              await _deepMapValuesAsync(val, transformer, key, seen, wrappers),
            ] as const
          ),
      )
        .then((x) => {
          for (const [key, val] of x) {
            if (val instanceof AsyncWrapper) {
              val.onResolve((x) => parent[key] = x);
            } else parent[key] = val;
          }

          p.resolve(parent);
        });
    } else {
      p.resolve(transformer(value, key));
    }
  } else {
    p.resolve(transformer(value, key));
  }

  return p.promise;
}
