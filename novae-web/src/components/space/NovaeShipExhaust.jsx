import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

const FLAME_COUNT = 60
const VAPOR_COUNT = 20
const RETRO_COUNT = 16
const WHITE = new THREE.Color('#ffffff')
const BLUE = new THREE.Color('#88ccff')
const COLD_BLUE = new THREE.Color('#2244aa')
const VAPOR = new THREE.Color('#334466')

function createPool(count) {
  return Array.from({ length: count }, () => ({
    position: new THREE.Vector3(0, 0, 100),
    velocity: new THREE.Vector3(),
    life: 0,
    maxLife: 1
  }))
}

function writePool(pool, positions, colors, colorForLife) {
  pool.forEach((particle, index) => {
    const ratio = Math.max(0, particle.life / particle.maxLife)
    const offset = index * 3
    positions[offset] = particle.position.x
    positions[offset + 1] = particle.position.y
    positions[offset + 2] = particle.position.z
    const color = colorForLife(ratio)
    colors[offset] = color.r * ratio
    colors[offset + 1] = color.g * ratio
    colors[offset + 2] = color.b * ratio
  })
}

function ParticleSystem({ kind, isThrusting, isBraking }) {
  const count = kind === 'flame' ? FLAME_COUNT : kind === 'vapor' ? VAPOR_COUNT : RETRO_COUNT
  const pool = useMemo(() => createPool(count), [count])
  const positions = useMemo(() => new Float32Array(count * 3), [count])
  const colors = useMemo(() => new Float32Array(count * 3), [count])
  const geometryRef = useRef()
  const materialRef = useRef()
  const cursor = useRef(0)
  const smokeTimer = useRef(0)
  const mixedColor = useMemo(() => new THREE.Color(), [])

  const emit = (px, py, pz, vx, vy, vz, life) => {
    const particle = pool[cursor.current]
    cursor.current = (cursor.current + 1) % count
    particle.position.set(px, py, pz)
    particle.velocity.set(vx, vy, vz)
    particle.life = life
    particle.maxLife = life
  }

  useFrame((_, delta) => {
    if (!geometryRef.current || !materialRef.current) return
    const thrusting = isThrusting.current ?? isThrusting
    const braking = isBraking.current ?? isBraking

    if (kind === 'flame' && thrusting && !braking) {
      for (let index = 0; index < 4; index += 1) {
        const engineX = index % 3 === 0 ? -0.38 : index % 3 === 1 ? 0.38 : 0
        emit(
          engineX + (Math.random() - 0.5) * 0.05, -0.07, 0.82,
          (Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.05, 1.8 + Math.random() * 0.8,
          0.6 + Math.random() * 0.4
        )
      }
    }

    smokeTimer.current += delta
    if (kind === 'vapor' && smokeTimer.current > 0.045) {
      smokeTimer.current = 0
      emit(
        (Math.random() - 0.5) * 0.45, -0.04, 0.78,
        (Math.random() - 0.5) * 0.18, (Math.random() - 0.5) * 0.18, 0.35 + Math.random() * 0.25,
        1.2 + Math.random() * 0.5
      )
    }

    if (kind === 'retro' && braking) {
      for (const side of [-1, 1]) {
        emit(
          side * 0.3, 0, -0.62,
          side * 1.1, (Math.random() - 0.5) * 0.15, -0.3,
          0.18 + Math.random() * 0.08
        )
      }
    }

    pool.forEach((particle) => {
      if (particle.life <= 0) return
      particle.life -= delta
      particle.position.addScaledVector(particle.velocity, delta)
    })

    writePool(pool, positions, colors, (ratio) => {
      if (kind === 'vapor') return VAPOR
      if (ratio > 0.7) return mixedColor.copy(WHITE).lerp(BLUE, (1 - ratio) / 0.3)
      return mixedColor.copy(BLUE).lerp(COLD_BLUE, 1 - ratio / 0.7)
    })
    geometryRef.current.attributes.position.needsUpdate = true
    geometryRef.current.attributes.color.needsUpdate = true
    materialRef.current.opacity = kind === 'vapor' ? 0.12 : 0.9
    materialRef.current.size = kind === 'flame' ? 0.1 : kind === 'retro' ? 0.055 : 0.18
  })

  return (
    <points frustumCulled={false}>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute attach="attributes-position" array={positions} count={count} itemSize={3} />
        <bufferAttribute attach="attributes-color" array={colors} count={count} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        vertexColors
        transparent
        opacity={kind === 'vapor' ? 0.12 : 0.9}
        size={kind === 'vapor' ? 0.18 : 0.08}
        sizeAttenuation
        depthWrite={false}
        blending={kind === 'vapor' ? THREE.NormalBlending : THREE.AdditiveBlending}
      />
    </points>
  )
}

export function NovaeShipExhaust({ isThrusting, isBraking }) {
  return (
    <>
      <ParticleSystem kind="flame" isThrusting={isThrusting} isBraking={isBraking} />
      <ParticleSystem kind="vapor" isThrusting={isThrusting} isBraking={isBraking} />
      <ParticleSystem kind="retro" isThrusting={isThrusting} isBraking={isBraking} />
    </>
  )
}
