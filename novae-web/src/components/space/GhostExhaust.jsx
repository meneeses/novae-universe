import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

const PARTICLE_COUNT = 34
const WHITE = new THREE.Color('#ffffff')
const BOOST = new THREE.Color('#ccddff')

function createPool() {
  return Array.from({ length: PARTICLE_COUNT }, () => ({
    position: new THREE.Vector3(0, 0, 100),
    velocity: new THREE.Vector3(),
    life: 0,
    maxLife: 1
  }))
}

export function GhostExhaust({ color, isThrusting, isBoosting, opacity }) {
  const pool = useMemo(createPool, [])
  const positions = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), [])
  const colors = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), [])
  const geometryRef = useRef()
  const materialRef = useRef()
  const cursor = useRef(0)
  const playerColor = useMemo(() => color.clone(), [color])
  const mixedColor = useMemo(() => new THREE.Color(), [])

  function emit(x, z, power) {
    const particle = pool[cursor.current]
    cursor.current = (cursor.current + 1) % PARTICLE_COUNT
    particle.position.set(x + (Math.random() - 0.5) * 0.04, -0.05, z)
    particle.velocity.set((Math.random() - 0.5) * 0.04, (Math.random() - 0.5) * 0.04, 1.2 + power * 1.2)
    particle.life = 0.45 + Math.random() * 0.25
    particle.maxLife = particle.life
  }

  useFrame((_, delta) => {
    if (!geometryRef.current || !materialRef.current) return
    const active = isThrusting || isBoosting
    if (active) {
      const burst = isBoosting ? 5 : 2
      for (let i = 0; i < burst; i += 1) emit(i % 2 ? 0.18 : -0.18, 0.48, isBoosting ? 1 : 0.35)
    }

    pool.forEach((particle, index) => {
      if (particle.life > 0) {
        particle.life -= delta
        particle.position.addScaledVector(particle.velocity, delta)
      }
      const ratio = Math.max(0, particle.life / particle.maxLife)
      const offset = index * 3
      positions[offset] = particle.position.x
      positions[offset + 1] = particle.position.y
      positions[offset + 2] = particle.position.z
      const particleColor = isBoosting
        ? mixedColor.copy(WHITE).lerp(BOOST, 1 - ratio)
        : mixedColor.copy(playerColor).lerp(WHITE, ratio * 0.35)
      colors[offset] = particleColor.r * ratio
      colors[offset + 1] = particleColor.g * ratio
      colors[offset + 2] = particleColor.b * ratio
    })

    geometryRef.current.attributes.position.needsUpdate = true
    geometryRef.current.attributes.color.needsUpdate = true
    materialRef.current.opacity = opacity * (isBoosting ? 0.9 : 0.48)
    materialRef.current.size = isBoosting ? 0.13 : 0.075
  })

  return (
    <points frustumCulled={false}>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute attach="attributes-position" array={positions} count={PARTICLE_COUNT} itemSize={3} />
        <bufferAttribute attach="attributes-color" array={colors} count={PARTICLE_COUNT} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial ref={materialRef} vertexColors transparent opacity={0.4} size={0.08} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}
