import { createPortal, useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

const RING_COUNT = 18
const STREAK_COUNT = 120

function TunnelRings({ color, accentColor }) {
  const groupRef = useRef()
  const rings = useMemo(() => Array.from({ length: RING_COUNT }, (_, index) => ({
    z: -4 - index * 2.1,
    scale: 1.1 + index * 0.09,
    rotation: index * 0.31
  })), [])

  useFrame((state, delta) => {
    if (!groupRef.current) return
    groupRef.current.rotation.z += delta * 0.42
    groupRef.current.children.forEach((ring, index) => {
      ring.position.z += delta * 26
      ring.rotation.z += delta * (index % 2 ? -1.8 : 1.4)
      if (ring.position.z > 1.5) ring.position.z = -38
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 5 + index) * 0.08
      ring.scale.setScalar(rings[index].scale * pulse)
    })
  })

  return (
    <group ref={groupRef}>
      {rings.map((ring, index) => (
        <mesh key={index} position={[0, 0, ring.z]} rotation={[0, 0, ring.rotation]}>
          <torusGeometry args={[2.4, index % 3 === 0 ? 0.055 : 0.022, 8, 48]} />
          <meshBasicMaterial
            color={index % 2 ? color : accentColor}
            transparent
            opacity={0.28 + (index % 4) * 0.08}
            depthWrite={false}
            depthTest={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  )
}

function TunnelStreaks({ color }) {
  const geometryRef = useRef()
  const positions = useMemo(() => new Float32Array(STREAK_COUNT * 6), [])
  const seeds = useMemo(() => Array.from({ length: STREAK_COUNT }, () => ({
    angle: Math.random() * Math.PI * 2,
    radius: 0.7 + Math.random() * 3.8,
    z: -2 - Math.random() * 36,
    speed: 12 + Math.random() * 22
  })), [])

  useFrame((_, delta) => {
    seeds.forEach((seed, index) => {
      seed.z += delta * seed.speed
      if (seed.z > 1) seed.z = -38
      const offset = index * 6
      const x = Math.cos(seed.angle) * seed.radius
      const y = Math.sin(seed.angle) * seed.radius
      positions[offset] = x
      positions[offset + 1] = y
      positions[offset + 2] = seed.z
      positions[offset + 3] = x * 1.08
      positions[offset + 4] = y * 1.08
      positions[offset + 5] = seed.z - 2.2
    })
    geometryRef.current.attributes.position.needsUpdate = true
  })

  return (
    <lineSegments frustumCulled={false}>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute attach="attributes-position" array={positions} count={STREAK_COUNT * 2} itemSize={3} />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={0.72} depthWrite={false} depthTest={false} blending={THREE.AdditiveBlending} />
    </lineSegments>
  )
}

export function DimensionTunnel({ transit }) {
  const camera = useThree((state) => state.camera)
  if (!transit) return null

  return createPortal(
    <group position={[0, 0, -0.5]}>
      <TunnelRings color={transit.color} accentColor={transit.accentColor} />
      <TunnelStreaks color={transit.accentColor} />
      <pointLight position={[0, 0, -3]} color={transit.color} intensity={8} distance={18} />
    </group>,
    camera
  )
}
