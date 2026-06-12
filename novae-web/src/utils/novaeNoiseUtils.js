import { createNoise3D } from 'simplex-noise'

export function mulberry32(seed) {
  let value = seed >>> 0

  return function random() {
    value += 0x6d2b79f5
    let result = value
    result = Math.imul(result ^ (result >>> 15), result | 1)
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61)
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296
  }
}

export function createSeededNoise(seed) {
  return createNoise3D(mulberry32(seed))
}

export function fbm(noise3D, x, y, z, octaves = 4) {
  let amplitude = 0.5
  let frequency = 1
  let value = 0
  let amplitudeSum = 0

  for (let octave = 0; octave < octaves; octave += 1) {
    value += noise3D(x * frequency, y * frequency, z * frequency) * amplitude
    amplitudeSum += amplitude
    amplitude *= 0.5
    frequency *= 2
  }

  return Math.min(1, Math.max(0, value / amplitudeSum * 0.5 + 0.5))
}
