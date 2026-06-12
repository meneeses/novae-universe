import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'

const PROXIMITY_THRESHOLD = 8

export function NovaeProximity({ novaeShipPosition, planets, onNearPlanet, onLeavePlanet }) {
  const frameCounter = useRef(0)
  const currentPlanet = useRef(null)

  useFrame(() => {
    frameCounter.current += 1
    if (frameCounter.current % 10 !== 0) return

    let nearest = null
    let nearestDistance = Infinity

    for (const planet of planets) {
      const distance = novaeShipPosition.current.distanceTo(planet.vectorPosition)
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
        novaeWorldData: nearest.novaeWorldData,
        novaeWorldProps: nearest.novaeWorldProps
      })
    } else if (currentPlanet.current) {
      currentPlanet.current = null
      onLeavePlanet()
    }
  })

  return null
}
