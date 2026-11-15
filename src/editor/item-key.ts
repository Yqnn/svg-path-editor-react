const keys = new WeakMap<object, number>();
let nextKey = 0;

/** Stable React key for mutable path item instances. */
export function getItemKey(item: object): number {
  let key = keys.get(item);
  if (key === undefined) {
    key = nextKey++;
    keys.set(item, key);
  }
  return key;
}
