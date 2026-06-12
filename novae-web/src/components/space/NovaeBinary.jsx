import { Line } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { NovaeStarObject } from './NovaeStarObject'

export function NovaeBinary({ primaryStar, companionStar }) {
  const groupRef = useRef()
  const points = useMemo(() => [[-2.4, 0, 0], [2.4, 0, 0]], [])
  const primary = { ...primaryStar, position_x: -2.4, position_z: 0 }
  const companion = { ...companionStar, position_x: 2.4, position_z: 0 }

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.12
  })

  return (
    <group ref={groupRef}>
      <Line points={points} color="#99aaff" transparent opacity={0.16} lineWidth={0.5} />
      <NovaeStarObject starData={primary} isCenter distanceFromNovaeShip={0} />
      <NovaeStarObject starData={companion} isCenter distanceFromNovaeShip={0} />
    </group>
  )
}
