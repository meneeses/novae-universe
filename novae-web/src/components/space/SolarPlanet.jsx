import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import * as THREE from 'three'
import { Earth } from './Earth'

function SaturnRings({ radius }) {
  return (
    <>
      <mesh rotation={[Math.PI / 2, 0, 0.48]}>
        <ringGeometry args={[radius * 1.38, radius * 2.3, 64]} />
        <meshBasicMaterial
          color="#c8a850"
          transparent
          opacity={0.65}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0.48]}>
        <ringGeometry args={[radius * 1.08, radius * 1.38, 64]} />
        <meshBasicMaterial
          color="#a08840"
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </>
  )
}

export function SolarPlanet({ data, novaeShipPosition, onSelectObject }) {
  const groupRef = useRef()
  const meshRef = useRef()
  const angle = useRef(data.name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) * 0.1)
  const frame = useRef(0)
  const [showLabel, setShowLabel] = useState(false)

  useFrame((_, delta) => {
    angle.current += data.orbitSpeed * 0.005 * delta * 60
    groupRef.current.position.set(
      Math.cos(angle.current) * data.orbitRadius,
      0,
      Math.sin(angle.current) * data.orbitRadius
    )
    if (meshRef.current) meshRef.current.rotation.y += data.rotationSpeed * delta * 60
    frame.current += 1
    if (frame.current % 15 === 0) setShowLabel(groupRef.current.position.distanceTo(novaeShipPosition.current) < 25)
  })

  return (
    <group
      ref={groupRef}
      onClick={(event) => {
        event.stopPropagation()
        onSelectObject?.(data.isEarth ? {
          type: 'earth',
          name: 'Earth',
          description: 'The origin point of your journey.',
          orbitRadius: data.orbitRadius,
          radius: data.radius,
          color: data.color,
          hasRings: data.hasRings,
          moons: data.hasMoon ? 1 : 0
        } : {
          type: 'solar-planet',
          name: data.name,
          description: `${data.name} is a planet orbiting the Sun.`,
          orbitRadius: data.orbitRadius,
          radius: data.radius,
          color: data.color,
          hasRings: data.hasRings,
          moons: data.hasMoon ? 1 : 0
        })
      }}
      onPointerOver={() => { document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { document.body.style.cursor = 'default' }}
    >
      {data.isEarth ? (
        <Earth data={data} />
      ) : (
        <mesh ref={meshRef}>
          <sphereGeometry args={[data.radius, 32, 32]} />
          <meshLambertMaterial color={data.color} emissive={data.color} emissiveIntensity={0.15} />
        </mesh>
      )}
      {data.hasRings && <SaturnRings radius={data.radius} />}
      {showLabel && (
        <Html position={[0, data.radius * 1.8, 0]} center>
          <span className="solar-label">{data.name}</span>
        </Html>
      )}
    </group>
  )
}
