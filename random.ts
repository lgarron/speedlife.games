import { randomUIntBelow } from "random-uint-below";

export function selectWithoutReplacement<T>(arr: T[], n: number): T[] {
  const indices = arr.map((_, i) => i);
  const len = indices.length;
  const output: T[] = [];
  for (let i = 0; i < n; i++) {
    const j = randomUIntBelow(len - i) + i;
    output.push(arr[indices[j]]);
    indices[j] = indices[i];
  }
  return output;
}

selectWithoutReplacement([1, 2, 3, 4, 5], 3);
