/**
 * Clamps number within the inclusive lower and upper bounds.
 * @param num - The number to clamp
 * @param min - The lower bound
 * @param max - The upper bound
 * @returns - Returns the clamped number
 */

export function clamp(num, min, max) {
  return num <= min ? min : num >= max ? max : num;
}
