export function mustExist<T>(t: T | null): NonNullable<T> {
  if (!t) {
    throw new Error("Missing element");
  }
  return t;
}
