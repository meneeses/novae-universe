import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'

const PROXIMITY_THRESHOLD = 8

export function ProximityDetector({ rocketPosition, planets, onNearPlanet, onLeavePlanet }) {
  const frameCounter = useRef(0)
  const currentPlanet = useRef(null)

  useFrame(() => {
    frameCounter.current += 1
    if (frameCounter.current % 10 !== 0) return

    let nearest = null
    let nearestDistance = Infinity

    for (const planet of planets) {
      const distance = rocketPosition.current.distanceTo(planet.vectorPosition)
      if (distance < PROXIMITY_THRESHOLD && distance < nearestDistance) {
        nearest = planet
        nearestDistance = distance
      }
    }

    if (nearest) {
      currentPlanet.current = nearest.username
      onNearPlanet({
        username: nearest.username,
        distance: nearestDistance,
        planetData: nearest.planetData,
        planetProps: nearest.planetProps
      })
    } else if (currentPlanet.current) {
      currentPlanet.current = null
      onLeavePlanet()
    }
  })

  return null
}
