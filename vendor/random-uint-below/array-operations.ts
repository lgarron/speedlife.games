import { randomUIntBelowSeeded } from "./randomUIntBelow";

// Inspired by https://reference.wolfram.com/language/ref/RandomChoice.html
// TODO: `randomSample()` without replacement? https://reference.wolfram.com/language/ref/RandomSample.html
export function randomChoice<T>(arr: T[]): T {
  return arr[randomUIntBelowSeeded(arr.length)];
}

// Fisher-Yates
export async function randomPermuteInPlace<T>(arr: T[]): Promise<void> {
  for (let i = 1; i < arr.length; i++) {
    const j = randomUIntBelowSeeded(i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
