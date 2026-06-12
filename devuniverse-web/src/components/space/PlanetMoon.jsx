import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'

export function PlanetMoon({ planetSize, index, seed }) {
  const moonRef = useRef()
  const moonRadius = planetSize * 0.12 + index * 0.03
  const orbitRadius = planetSize * (2.2 + index * 0.8)
  const speed = 0.3 + (seed % 10) * 0.05
  const offset = ((seed % 360) * Math.PI) / 180 + index * (Math.PI / 2)

  useFrame(({ clock }) => {
    if (!moonRef.current) return

    const angle = clock.elapsedTime * speed + offset
    moonRef.current.position.x = Math.cos(angle) * orbitRadius
    moonRef.current.position.z = Math.sin(angle) * orbitRadius
    moonRef.current.position.y = Math.sin(angle * 0.35 + index) * planetSize * 0.25
  })

  return (
    <mesh ref={moonRef}>
      <sphereGeometry args={[moonRadius, 16, 16]} />
      <meshLambertMaterial color="#aaaaaa" emissive="#333344" emissiveIntensity={0.2} />
    </mesh>
  )
}
