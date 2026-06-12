import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'

const PARTICLE_COUNT = 40

export function NovaeGateParticles({ color, radius = 1.2, intensity = 1 }) {
  const geometryRef = useRef()
  const angles = useMemo(
    () => Array.from({ length: PARTICLE_COUNT }, (_, index) => (index / PARTICLE_COUNT) * Math.PI * 2),
    []
  )
  const positions = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), [])

  useFrame(({ clock }, delta) => {
    for (let index = 0; index < PARTICLE_COUNT; index += 1) {
      angles[index] += (0.02 + index * 0.001) * delta * 60
      const noise = Math.sin(clock.elapsedTime * 2 + index) * 0.2
      const particleRadius = radius + noise * intensity
      positions[index * 3] = Math.cos(angles[index]) * particleRadius
      positions[index * 3 + 1] = Math.sin(angles[index]) * particleRadius
      positions[index * 3 + 2] = Math.sin(clock.elapsedTime + index) * 0.18 * intensity
    }
    geometryRef.current.attributes.position.needsUpdate = true
  })

  return (
    <points>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute attach="attributes-position" array={positions} count={PARTICLE_COUNT} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color={color} size={0.07} sizeAttenuation transparent opacity={0.75} depthWrite={false} />
    </points>
  )
}
