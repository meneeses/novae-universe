import { Html, Line } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { MOCK_LANDMARKS } from '../../utils/mockNovaeGalaxy'

function createGlowTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const context = canvas.getContext('2d')
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64)
  gradient.addColorStop(0, 'rgba(255,255,255,0.95)')
  gradient.addColorStop(0.2, 'rgba(255,255,255,0.55)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(canvas)
}

function Landmark({ data, onSelectObject }) {
  const groupRef = useRef()
  const texture = useMemo(createGlowTexture, [])

  useFrame(({ clock }, delta) => {
    groupRef.current.rotation.y += delta * 0.08
    groupRef.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 0.7 + data.size) * 0.035)
  })

  return (
    <group
      ref={groupRef}
      position={data.position}
      onClick={(event) => {
        event.stopPropagation()
        onSelectObject?.({ ...data })
      }}
      onPointerOver={() => { document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { document.body.style.cursor = 'default' }}
    >
      <sprite scale={[data.size * 2.4, data.size * 2.4, 1]}>
        <spriteMaterial map={texture} color={data.accent} transparent opacity={0.18} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <sprite scale={[data.size, data.size, 1]}>
        <spriteMaterial map={texture} color={data.color} transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[data.size * 0.42, 0.035, 8, 64]} />
        <meshBasicMaterial color={data.accent} transparent opacity={0.4} blending={THREE.AdditiveBlending} />
      </mesh>
      <pointLight color={data.accent} intensity={3} distance={data.size * 5} />
      <Html center position={[0, data.size * 0.72, 0]} distanceFactor={18}>
        <div className="galaxy-landmark-label"><span>LANDMARK</span><strong>{data.name}</strong></div>
      </Html>
    </group>
  )
}

function GalacticRoutes({ stars }) {
  const routes = useMemo(() => stars.slice(0, 8).map((star, index) => {
    const next = stars[(index + 1) % Math.min(stars.length, 8)]
    return [
      [star.position[0], 0, star.position[2]],
      [(star.position[0] + next.position[0]) / 2, 2 + (index % 3), (star.position[2] + next.position[2]) / 2],
      [next.position[0], 0, next.position[2]]
    ]
  }), [stars])

  return routes.map((points, index) => (
    <Line key={index} points={points} color={index % 2 ? '#7c4dff' : '#44ccdd'} transparent opacity={0.12} lineWidth={0.45} dashed dashScale={3} dashSize={0.6} gapSize={0.8} />
  ))
}

export function NovaeGalaxyEnvironment({ stars, onSelectObject }) {
  return (
    <group>
      <GalacticRoutes stars={stars} />
      {MOCK_LANDMARKS.map((landmark) => (
        <Landmark key={landmark.id} data={landmark} onSelectObject={onSelectObject} />
      ))}
    </group>
  )
}
