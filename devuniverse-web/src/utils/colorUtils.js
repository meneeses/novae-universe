export function hexToRgb(hex) {
  const normalized = hex.replace('#', '')
  const expanded =
    normalized.length === 3
      ? normalized
          .split('')
          .map((character) => character + character)
          .join('')
      : normalized
  const value = Number.parseInt(expanded, 16)

  return [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255
  ]
}

export function lerpColor(colorA, colorB, t) {
  const amount = Math.min(1, Math.max(0, t))
  const start = hexToRgb(colorA)
  const end = hexToRgb(colorB)
  return start.map((channel, index) => channel + (end[index] - channel) * amount)
}

export function colorRamp(t, stops) {
  if (!stops.length) return [0, 0, 0]

  const value = Math.min(1, Math.max(0, t))
  const sortedStops = [...stops].sort((a, b) => a.t - b.t)

  if (value <= sortedStops[0].t) return hexToRgb(sortedStops[0].color)

  for (let index = 1; index < sortedStops.length; index += 1) {
    const previous = sortedStops[index - 1]
    const current = sortedStops[index]

    if (value <= current.t) {
      const amount = (value - previous.t) / (current.t - previous.t)
      return lerpColor(previous.color, current.color, amount)
    }
  }

  return hexToRgb(sortedStops.at(-1).color)
}
