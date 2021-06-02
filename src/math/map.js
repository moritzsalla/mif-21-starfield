/**
 * Re-maps a number from one range to another.
 * @param n - Number: the incoming value to be converted
 * @param start1 - Number: lower bound of the value's current range
 * @param stop1 - Number: upper bound of the value's current range
 * @param start2 - Number: lower bound of the value's target range
 * @param stop2 - Number: upper bound of the value's target range
 * @returns - Number: remapped number
 */

export function map(n, start1, stop1, start2, stop2) {
  return ((n - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
}
