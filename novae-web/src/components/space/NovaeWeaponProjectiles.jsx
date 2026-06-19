import { Line } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { SOLAR_SYSTEM } from '../../utils/solarSystem'

export const WEAPON_COOLDOWN = 280

const PROJECTILE_COUNT = 18
const PROJECTILE_SPEED = 2.2
const PROJECTILE_LIFE = 1.8
const FORWARD = new THREE.Vector3(0, 0, -1)

function createGlowTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const context = canvas.getContext('2d')
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.3, 'rgba(0,255,204,0.8)')
  gradient.addColorStop(1, 'rgba(0,255,204,0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(canvas)
}

function playLaserSound() {
  const AudioContext = window.AudioContext || window.webkitAudioContext
  if (!AudioContext) return
  const context = new AudioContext()
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.type = 'sawtooth'
  oscillator.frequency.setValueAtTime(820, context.currentTime)
  oscillator.frequency.exponentialRampToValueAtTime(260, context.currentTime + 0.11)
  gain.gain.setValueAtTime(0.0001, context.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.13)
  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start()
  oscillator.stop(context.currentTime + 0.14)
  window.setTimeout(() => context.close(), 220)
}

function getSolarTargets(elapsedTime) {
  const sun = [{ position: new THREE.Vector3(0, 0, 0), radius: SOLAR_SYSTEM.sun.radius, name: 'Sun' }]
  const planets = SOLAR_SYSTEM.planets.map((planet) => {
    const initialAngle = planet.name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) * 0.1
    const angle = initialAngle + elapsedTime * planet.orbitSpeed * 0.3
    return {
      name: planet.name,
      radius: planet.radius,
      position: new THREE.Vector3(
        Math.cos(angle) * planet.orbitRadius,
        0,
        Math.sin(angle) * planet.orbitRadius
      )
    }
  })
  return [...sun, ...planets]
}

function getGalaxyTargets(stars) {
  return stars.map((star) => ({
    name: star.username,
    radius: Math.max(1.4, star.novaeWorldProps?.size ?? star.starData?.star_size ?? 1),
    position: star.vectorPosition
  }))
}

export function NovaeWeaponProjectiles({
  fireSequence,
  novaeShipPosition,
  novaeShipForward,
  dimension,
  stars,
  onWeaponStatus
}) {
  const texture = useMemo(createGlowTexture, [])
  const groupRefs = useRef([])
  const impactRefs = useRef([])
  const lastFireSequence = useRef(fireSequence)
  const lastFireTime = useRef(-Infinity)
  const poolCursor = useRef(0)
  const projectilePool = useMemo(() => Array.from({ length: PROJECTILE_COUNT }, () => ({
    active: false,
    position: new THREE.Vector3(0, 0, 1000),
    direction: new THREE.Vector3(),
    life: 0,
    impactLife: 0,
    impactPosition: new THREE.Vector3()
  })), [])

  useFrame(({ clock }, delta) => {
    const now = performance.now()
    const cooldownProgress = THREE.MathUtils.clamp((now - lastFireTime.current) / WEAPON_COOLDOWN, 0, 1)
    onWeaponStatus?.({ cooldownProgress, ready: cooldownProgress >= 1 })

    if (fireSequence !== lastFireSequence.current) {
      lastFireSequence.current = fireSequence
      if (now - lastFireTime.current >= WEAPON_COOLDOWN) {
        lastFireTime.current = now
        const projectile = projectilePool[poolCursor.current]
        poolCursor.current = (poolCursor.current + 1) % PROJECTILE_COUNT
        const shipPosition = novaeShipPosition.current.clone()
        const direction = novaeShipForward.current.clone().normalize()
        projectile.active = true
        projectile.life = PROJECTILE_LIFE
        projectile.position.copy(shipPosition).addScaledVector(direction, 1.25)
        projectile.direction.copy(direction)
        playLaserSound()
      }
    }

    const targets = dimension === 'solar'
      ? getSolarTargets(clock.elapsedTime)
      : getGalaxyTargets(stars)

    projectilePool.forEach((projectile, index) => {
      const group = groupRefs.current[index]
      const impact = impactRefs.current[index]
      if (!group || !impact) return

      if (projectile.active) {
        projectile.life -= delta
        projectile.position.addScaledVector(projectile.direction, PROJECTILE_SPEED * delta * 60)
        for (const target of targets) {
          if (projectile.position.distanceTo(target.position) <= target.radius + 0.35) {
            projectile.active = false
            projectile.impactLife = 0.22
            projectile.impactPosition.copy(projectile.position)
            break
          }
        }
        if (projectile.life <= 0) projectile.active = false
      }

      group.visible = projectile.active
      if (projectile.active) {
        group.position.copy(projectile.position)
        group.quaternion.setFromUnitVectors(FORWARD, projectile.direction)
      }

      projectile.impactLife = Math.max(0, projectile.impactLife - delta)
      impact.visible = projectile.impactLife > 0
      if (impact.visible) {
        const pulse = projectile.impactLife / 0.22
        impact.position.copy(projectile.impactPosition)
        impact.scale.setScalar(0.5 + (1 - pulse) * 1.5)
        impact.material.opacity = pulse * 0.8
      }
    })
  })

  return (
    <group>
      {projectilePool.map((_, index) => (
        <group key={index}>
          <group ref={(node) => { groupRefs.current[index] = node }} visible={false}>
            <mesh>
              <sphereGeometry args={[0.08, 12, 12]} />
              <meshBasicMaterial color="#00ffcc" />
            </mesh>
            <sprite scale={[0.75, 0.75, 1]}>
              <spriteMaterial map={texture} color="#00ffcc" transparent opacity={0.7} depthWrite={false} blending={THREE.AdditiveBlending} />
            </sprite>
            <Line points={[[0, 0, 0], [0, 0, 1.8]]} color="#00ffcc" transparent opacity={0.55} lineWidth={1.4} />
          </group>
          <sprite ref={(node) => { impactRefs.current[index] = node }} visible={false} scale={[1, 1, 1]}>
            <spriteMaterial map={texture} color="#00ffcc" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
          </sprite>
        </group>
      ))}
    </group>
  )
}
