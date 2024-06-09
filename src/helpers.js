export function randomInt(min, max) {
  return Math.round(Math.random() * (max - min) + min);
}

export function mapRange(v, minIn, maxIn, minOut, maxOut) {
  return ((v - minIn) / (maxIn - minIn)) * (maxOut - minOut) + minOut;
}
