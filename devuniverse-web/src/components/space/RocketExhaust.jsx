import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

const PARTICLE_COUNT = 48

function createParticles() {
  return Array.from({ length: PARTICLE_COUNT }, () => ({
    position: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
    color: new THREE.Color(),
    life: 0,
    maxLife: 1,
    size: 0.08
  }))
}

export function RocketExhaust({ isThrusting, isBraking, rocketRef }) {
  const geometryRef = useRef()
  const materialRef = useRef()
  const nextParticle = useRef(0)
  const particles = useMemo(createParticles, [])
  const positions = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), [])
  const colors = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), [])

  function emit(px, py, pz, vx, vy, vz, color, life, size) {
    const particle = particles[nextParticle.current]
    nextParticle.current = (nextParticle.current + 1) % PARTICLE_COUNT
    particle.position.set(px, py, pz)
    particle.velocity.set(vx, vy, vz)
    particle.color.set(color)
    particle.life = life
    particle.maxLife = life
    particle.size = size
  }

  useFrame((_, delta) => {
    if (!geometryRef.current || !rocketRef.current) return

    const thrusting = isThrusting.current ?? isThrusting
    const braking = isBraking.current ?? isBraking

    if (braking) {
      for (const side of [-1, 1]) {
        emit(
          side * 0.38, 0, -0.28,
          side * 0.7, (Math.random() - 0.5) * 0.08, 0.15,
          '#bdefff',
          0.35 + Math.random() * 0.2,
          0.045
        )
      }
    } else {
      const emissionCount = thrusting ? (Math.random() > 0.5 ? 4 : 3) : 1
      for (let index = 0; index < emissionCount; index += 1) {
        const spread = thrusting ? 0.05 : 0.12
        emit(
          (Math.random() - 0.5) * 0.1,
          (Math.random() - 0.5) * 0.1,
          0.75,
          (Math.random() - 0.5) * spread,
          (Math.random() - 0.5) * spread,
          thrusting ? 1.8 + Math.random() * 0.7 : 0.65 + Math.random() * 0.25,
          thrusting ? (Math.random() > 0.45 ? '#ff6b00' : '#ffcc00') : '#a9ddff',
          thrusting ? 0.7 + Math.random() * 0.35 : 0.38 + Math.random() * 0.2,
          thrusting ? 0.08 + Math.random() * 0.04 : 0.035 + Math.random() * 0.025
        )
      }
    }

    let activeParticles = 0
    let opacitySum = 0
    particles.forEach((particle, index) => {
      if (particle.life > 0) {
        particle.life -= delta
        particle.position.addScaledVector(particle.velocity, delta)
      }

      const lifeRatio = Math.max(0, particle.life / particle.maxLife)
      const offset = index * 3
      positions[offset] = particle.position.x
      positions[offset + 1] = particle.position.y
      positions[offset + 2] = particle.position.z
      colors[offset] = particle.color.r * lifeRatio
      colors[offset + 1] = particle.color.g * lifeRatio
      colors[offset + 2] = particle.color.b * lifeRatio
      if (lifeRatio > 0) {
        activeParticles += 1
        opacitySum += lifeRatio
      }
    })

    geometryRef.current.attributes.position.needsUpdate = true
    geometryRef.current.attributes.color.needsUpdate = true
    materialRef.current.size = thrusting ? 0.11 : braking ? 0.07 : 0.055
    materialRef.current.opacity = activeParticles ? Math.max(0.18, opacitySum / activeParticles) : 0
  })

  return (
    <points frustumCulled={false}>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute attach="attributes-position" array={positions} count={PARTICLE_COUNT} itemSize={3} />
        <bufferAttribute attach="attributes-color" array={colors} count={PARTICLE_COUNT} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        vertexColors
        transparent
        opacity={0}
        size={0.06}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
