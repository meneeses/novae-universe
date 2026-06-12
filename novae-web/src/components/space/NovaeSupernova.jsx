import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

function createNebulaTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const context = canvas.getContext('2d')
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64)
  gradient.addColorStop(0, 'rgba(255,170,68,0.8)')
  gradient.addColorStop(0.35, 'rgba(110,60,210,0.55)')
  gradient.addColorStop(1, 'rgba(30,10,90,0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(canvas)
}

export function NovaeSupernova({ starData }) {
  const starRef = useRef()
  const lightRef = useRef()
  const pointsRef = useRef()
  const startedAt = useRef(null)
  const initialAge = starData.supernova_at
    ? Math.max(0, (Date.now() - new Date(starData.supernova_at).getTime()) / 1000)
    : 0
  const [phase, setPhase] = useState(initialAge >= 6 ? 'nebula' : 'expansion')
  const nebulaTexture = useMemo(createNebulaTexture, [])
  const particles = useMemo(() => {
    const positions = new Float32Array(300 * 3)
    const colors = new Float32Array(300 * 3)
    const velocities = []
    const orange = new THREE.Color('#ffaa44')
    const purple = new THREE.Color('#4422aa')
    for (let index = 0; index < 300; index += 1) {
      const direction = new THREE.Vector3(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
      ).normalize()
      velocities.push(direction.multiplyScalar(0.8 + Math.random() * 2.4))
      colors.set(orange.clone().lerp(purple, Math.random()).toArray(), index * 3)
    }
    return { positions, colors, velocities }
  }, [])

  useFrame(({ clock }, delta) => {
    if (phase === 'nebula') return
    startedAt.current ??= clock.elapsedTime - initialAge
    const elapsed = clock.elapsedTime - startedAt.current
    const nextPhase = elapsed < 1.5 ? 'expansion' : elapsed < 2 ? 'flash' : elapsed < 6 ? 'particles' : 'nebula'
    if (nextPhase !== phase) setPhase(nextPhase)

    if (starRef.current) {
      if (elapsed < 1.5) {
        starRef.current.scale.setScalar(1 + Math.sin(elapsed * elapsed * 30) * 0.14)
      } else if (elapsed < 2) {
        starRef.current.scale.setScalar(1 + ((elapsed - 1.5) / 0.5) * 7)
      }
    }
    if (lightRef.current) lightRef.current.intensity = elapsed < 1.5 ? 8 : Math.max(0, 50 - (elapsed - 1.5) * 20)
    if (pointsRef.current && elapsed >= 2 && elapsed < 6) {
      const positions = pointsRef.current.geometry.attributes.position.array
      particles.velocities.forEach((velocity, index) => {
        positions[index * 3] += velocity.x * delta
        positions[index * 3 + 1] += velocity.y * delta
        positions[index * 3 + 2] += velocity.z * delta
      })
      pointsRef.current.geometry.attributes.position.needsUpdate = true
      pointsRef.current.material.opacity = Math.max(0, 1 - (elapsed - 2) / 4)
    }
  })

  if (phase === 'nebula') {
    return (
      <group>
        <sprite scale={[8, 8, 1]}>
          <spriteMaterial map={nebulaTexture} color="#7755cc" transparent opacity={0.25} depthWrite={false} />
        </sprite>
        <Html center position={[0, 2.4, 0]} distanceFactor={10}>
          <div className="novae-star-label">[ remnant of @{starData.github_username ?? starData.username} ]</div>
        </Html>
      </group>
    )
  }

  return (
    <group>
      {phase !== 'particles' && (
        <mesh ref={starRef}>
          <sphereGeometry args={[starData.star_size ?? 1, 32, 32]} />
          <meshBasicMaterial color={phase === 'flash' ? '#ffffff' : starData.star_color} />
        </mesh>
      )}
      <pointLight ref={lightRef} color="#ffffff" intensity={8} distance={100} />
      {(phase === 'particles') && (
        <points ref={pointsRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" array={particles.positions} count={300} itemSize={3} />
            <bufferAttribute attach="attributes-color" array={particles.colors} count={300} itemSize={3} />
          </bufferGeometry>
          <pointsMaterial vertexColors size={0.12} transparent opacity={1} depthWrite={false} blending={THREE.AdditiveBlending} />
        </points>
      )}
      {phase === 'flash' && <Html fullscreen><div className="supernova-screen-flash" /></Html>}
    </group>
  )
}
