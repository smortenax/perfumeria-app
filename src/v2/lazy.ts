/**
 * Maps whose values are made the first time they are asked for and kept (Phase 6: with thousands of materials, building the IFRA
 * and the card of every one at start-up took seconds). They answer as a `Map` does: iterating them makes everything.
 */

/** A fixed set of keys; each value is made by `make` on the first `get` and kept. */
export class LazyMap<V> implements ReadonlyMap<string, V> {
  private readonly cache = new Map<string, V>();
  private readonly keySet: ReadonlySet<string>;

  constructor(
    keys: Iterable<string>,
    private readonly make: (key: string) => V,
  ) {
    this.keySet = new Set(keys);
  }

  get size(): number {
    return this.keySet.size;
  }

  /** How many values have been made so far (for tests and diagnostics). */
  get made(): number {
    return this.cache.size;
  }

  has(key: string): boolean {
    return this.keySet.has(key);
  }

  get(key: string): V | undefined {
    if (!this.keySet.has(key)) {
      return undefined;
    }
    let value = this.cache.get(key);
    if (value === undefined) {
      value = this.make(key);
      this.cache.set(key, value);
    }
    return value;
  }

  forEach(fn: (value: V, key: string, map: ReadonlyMap<string, V>) => void, thisArg?: unknown): void {
    for (const [key, value] of this) {
      fn.call(thisArg, value, key, this);
    }
  }

  entries(): MapIterator<[string, V]> {
    return new Map([...this.keySet].map((key) => [key, this.get(key) as V] as [string, V])).entries();
  }

  keys(): MapIterator<string> {
    return new Map([...this.keySet].map((key) => [key, true] as [string, boolean])).keys();
  }

  values(): MapIterator<V> {
    return new Map([...this.keySet].map((key) => [key, this.get(key) as V] as [string, V])).values();
  }

  [Symbol.iterator](): MapIterator<[string, V]> {
    return this.entries();
  }
}

/** A read-only map from three functions: what it has is asked of its sources each time, so it stays as lazy as they are. */
export function viewMap<V>(parts: {
  get(key: string): V | undefined;
  has(key: string): boolean;
  keys(): Iterable<string>;
}): ReadonlyMap<string, V> {
  const view: ReadonlyMap<string, V> = {
    get: parts.get,
    has: parts.has,
    get size() {
      return [...new Set(parts.keys())].length;
    },
    forEach(fn, thisArg) {
      for (const [key, value] of view) {
        fn.call(thisArg, value, key, view);
      }
    },
    entries: () => new Map([...new Set(parts.keys())].map((key) => [key, parts.get(key) as V] as [string, V])).entries(),
    keys: () => new Map([...new Set(parts.keys())].map((key) => [key, true] as [string, boolean])).keys(),
    values: () => new Map([...new Set(parts.keys())].map((key) => [key, parts.get(key) as V] as [string, V])).values(),
    [Symbol.iterator]() {
      return view.entries();
    },
  };
  return view;
}
