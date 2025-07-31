// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

export function deepMapValues(
  data: unknown,
  callback: (value: unknown, key: string | number | undefined) => unknown,
): unknown {
  const wrappers: SyncWrapper[] = [];
  const out = _deepMapValues(
    data,
    callback,
    undefined,
    new WeakMap(),
    wrappers,
  );
  for (const wrapper of wrappers) wrapper.resolve();
  return out;
}

class Ref<T> {
  out?: T;
}
class SyncWrapper<T = unknown> {
  value: Ref<T>;
  constructor(value: Ref<T>) {
    this.value = value;
  }
  #callbacks: ((value: Ref<T>) => void)[] = [];

  onResolve(callback: (value: Ref<T>) => void): void {
    this.#callbacks.push(callback);
  }
  resolve() {
    for (const callback of this.#callbacks) callback(this.value);
  }
}

function _deepMapValues(
  value: unknown,
  transformer: (value: unknown, key: string | number | undefined) => unknown,
  key: string | number | undefined,
  seen: WeakMap<WeakKey, Ref<unknown>>,
  wrappers: SyncWrapper[],
): unknown {
  const cached = seen.get(value as WeakKey);
  if (cached != null) {
    const wrapper = new SyncWrapper(cached);
    wrappers.push(wrapper);
    return wrapper;
  }

  const ref = new Ref();

  try {
    seen.set(value as WeakKey, ref);
  } catch { /* ignore if invalid WeakKey */ }

  if (value != null && typeof value === "object") {
    if (Array.isArray(value)) {
      const parent = new Array(value.length);
      ref.out = parent;

      for (const [idx, item] of value.entries()) {
        const val = _deepMapValues(item, transformer, idx, seen, wrappers);
        if (val instanceof SyncWrapper) {
          val.onResolve((x) => parent[idx] = x.out);
        } else parent[idx] = val;
      }
    } else if (
      [null, Object.prototype].includes(Object.getPrototypeOf(value))
    ) {
      // is a plain object
      const entries = Object
        .entries(value)
        .map((
          [key, value],
        ) =>
          [
            key,
            _deepMapValues(value, transformer, key, seen, wrappers),
          ] as const
        );

      const parent = Object.fromEntries(entries);
      ref.out = parent;

      for (const [key, val] of entries) {
        if (val instanceof SyncWrapper) {
          val.onResolve((x) => parent[key] = x.out);
        }
      }
    } else {
      ref.out = transformer(value, key);
    }
  } else {
    ref.out = transformer(value, key);
  }

  return ref.out;
}
