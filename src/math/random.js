/**
 * Random function adapted from p5.
 * @param min - Number: the lower bound (inclusive) (Optional)
 * @param max - Number: the upper bound (exclusive) (Optional)
 * @returns - Number: the random number
 */

export function random(min, max) {
  const rand = Math.random();

  if (typeof min === 'undefined') {
    return rand;
  } else if (typeof max === 'undefined') {
    if (min instanceof Array) {
      return min[Math.floor(rand * min.length)];
    } else {
      return rand * min;
    }
  } else {
    if (min > max) {
      const tmp = min;
      min = max;
      max = tmp;
    }

    return rand * (max - min) + min;
  }
}
