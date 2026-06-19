import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

const FLAME_COUNT = 60
const VAPOR_COUNT = 20
const WHITE = new THREE.Color('#ffffff')
const BLUE = new THREE.Color('#88ccff')
const BOOST_PURPLE = new THREE.Color('#aa66ff')
const BOOST_DARK = new THREE.Color('#6622aa')
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

function ParticleSystem({ kind, isThrusting, isBoosting, isEngineOff, verticalInput }) {
  const count = kind === 'flame' ? FLAME_COUNT : VAPOR_COUNT
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
    const boosting = isBoosting.current ?? isBoosting
    const engineOff = isEngineOff.current ?? isEngineOff
    const climbInput = Math.abs(verticalInput?.current ?? verticalInput ?? 0)

    if (kind === 'flame' && thrusting && !engineOff) {
      const burstCount = boosting ? 3 : climbInput > 0 ? 5 : 3
      for (let index = 0; index < burstCount; index += 1) {
        const engineX = index % 3 === 0 ? -0.38 : index % 3 === 1 ? 0.38 : 0
        const climbPower = climbInput > 0 ? 0.45 : 0
        emit(
          engineX + (Math.random() - 0.5) * 0.07, -0.07, 0.82,
          (Math.random() - 0.5) * 0.07, (Math.random() - 0.5) * 0.07, (boosting ? 2.1 : 1.65 + climbPower) + Math.random() * 0.55,
          (boosting ? 0.62 : 0.52 + climbPower * 0.25) + Math.random() * 0.3
        )
      }
    }

    smokeTimer.current += delta
    if (kind === 'vapor' && thrusting && !engineOff && smokeTimer.current > (boosting ? 0.03 : 0.045)) {
      smokeTimer.current = 0
      emit(
        (Math.random() - 0.5) * 0.45, -0.04, 0.78,
        (Math.random() - 0.5) * 0.18, (Math.random() - 0.5) * 0.18, 0.35 + Math.random() * 0.25,
        1.2 + Math.random() * 0.5
      )
    }

    pool.forEach((particle) => {
      if (particle.life <= 0) return
      particle.life -= delta
      particle.position.addScaledVector(particle.velocity, delta)
    })

    writePool(pool, positions, colors, (ratio) => {
      if (kind === 'vapor') return VAPOR
      if (boosting) return mixedColor.copy(BOOST_PURPLE).lerp(BOOST_DARK, 1 - ratio)
      if (ratio > 0.7) return mixedColor.copy(WHITE).lerp(BLUE, (1 - ratio) / 0.3)
      return mixedColor.copy(BLUE).lerp(COLD_BLUE, 1 - ratio / 0.7)
    })
    geometryRef.current.attributes.position.needsUpdate = true
    geometryRef.current.attributes.color.needsUpdate = true
    materialRef.current.opacity = kind === 'vapor' ? 0.1 : boosting ? 0.72 : 0.78
    materialRef.current.size = kind === 'flame' ? (boosting ? 0.108 : climbInput > 0 ? 0.12 : 0.09) : boosting ? 0.19 : 0.16
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

export function NovaeShipExhaust({ isThrusting, isBoosting, isEngineOff, verticalInput = 0 }) {
  return (
    <>
      <ParticleSystem kind="flame" isThrusting={isThrusting} isBoosting={isBoosting} isEngineOff={isEngineOff} verticalInput={verticalInput} />
      <ParticleSystem kind="vapor" isThrusting={isThrusting} isBoosting={isBoosting} isEngineOff={isEngineOff} verticalInput={verticalInput} />
    </>
  )
}
