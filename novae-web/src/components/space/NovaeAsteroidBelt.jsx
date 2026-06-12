import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { hashString } from '../../utils/novaeWorldGenerator'

const COLORS = ['#776b61', '#8d7966', '#655d57', '#9a866f']

export function NovaeAsteroidBelt({ count, starSize, starColor }) {
  const beltRef = useRef()
  const asteroids = useMemo(() => Array.from({ length: count * 3 }, (_, index) => {
    const seed = hashString(`${starColor}:${count}:${index}`)
    return {
      angle: ((seed % 628) / 100),
      radiusX: 2.5 + (seed % 100) / 100,
      radiusZ: 2.2 + ((seed >> 3) % 100) / 115,
      size: 0.02 + ((seed >> 5) % 40) / 1000,
      y: (((seed >> 7) % 30) - 15) / 100,
      color: COLORS[seed % COLORS.length]
    }
  }), [count, starColor])

  useFrame((_, delta) => {
    if (beltRef.current) beltRef.current.rotation.y += delta * 0.045
  })

  if (!count) return null

  return (
    <group ref={beltRef} scale={Math.max(1, starSize * 0.9)}>
      {asteroids.map((asteroid, index) => (
        <mesh
          key={index}
          position={[
            Math.cos(asteroid.angle) * asteroid.radiusX,
            asteroid.y,
            Math.sin(asteroid.angle) * asteroid.radiusZ
          ]}
          scale={asteroid.size}
        >
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={asteroid.color} roughness={1} />
        </mesh>
      ))}
    </group>
  )
}
