import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'

const WOBBLE_DURATION = 0.8
const originVector = new THREE.Vector3()
const radialDirection = new THREE.Vector3()

export function useNovaeWobble({ positionRef, waves, orbitRadius }) {
  const offset = useRef(new THREE.Vector3())
  const activeWobbles = useRef([])
  const touchedWaves = useRef(new Set())

  useFrame((_, delta) => {
    const position = positionRef.current?.position
    if (!position) return

    waves.forEach((wave) => {
      if (touchedWaves.current.has(wave.id)) return

      originVector.fromArray(wave.origin)
      const distance = position.distanceTo(originVector)
      const waveRadius = wave.progress * wave.maxRadius
      const crossingMargin = Math.max(1.5, wave.maxRadius * 0.025)

      if (Math.abs(waveRadius - distance) <= crossingMargin || waveRadius > distance) {
        touchedWaves.current.add(wave.id)
        radialDirection.copy(position).sub(originVector).setY(0).normalize()
        const distanceFalloff = THREE.MathUtils.lerp(
          1,
          0.45,
          THREE.MathUtils.clamp(distance / wave.maxRadius, 0, 1)
        )

        activeWobbles.current.push({
          elapsed: 0,
          amplitude: orbitRadius * 0.045 * distanceFalloff,
          direction: radialDirection.clone()
        })
      }
    })

    offset.current.set(0, 0, 0)
    activeWobbles.current = activeWobbles.current.filter((wobble) => {
      wobble.elapsed += delta
      const progress = wobble.elapsed / WOBBLE_DURATION
      if (progress >= 1) return false

      const displacement = Math.sin(progress * Math.PI) * wobble.amplitude
      offset.current.addScaledVector(wobble.direction, displacement)
      offset.current.y += Math.sin(progress * Math.PI * 2) * wobble.amplitude * 0.16
      return true
    })

    const activeIds = new Set(waves.map((wave) => wave.id))
    touchedWaves.current.forEach((id) => {
      if (!activeIds.has(id)) touchedWaves.current.delete(id)
    })
  })

  return offset
}
