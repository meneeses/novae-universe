import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { interpolatePlayer, lerpAngle } from '../../utils/interpolation'
import { GhostExhaust } from './GhostExhaust'

function hashString(value) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(index)
    hash |= 0
  }
  return Math.abs(hash)
}

export function colorForPlayer(uid) {
  const hue = hashString(uid) % 360
  return new THREE.Color().setHSL(hue / 360, 0.7, 0.65)
}

function createSpriteTexture(color) {
  const canvas = document.createElement('canvas')
  canvas.width = 96
  canvas.height = 96
  const context = canvas.getContext('2d')
  const gradient = context.createRadialGradient(48, 48, 0, 48, 48, 48)
  gradient.addColorStop(0, 'rgba(255,255,255,0.95)')
  gradient.addColorStop(0.35, `${color}aa`)
  gradient.addColorStop(1, `${color}00`)
  context.fillStyle = gradient
  context.fillRect(0, 0, 96, 96)
  return new THREE.CanvasTexture(canvas)
}

function GhostSprite({ playerColor, opacity }) {
  const texture = useMemo(() => createSpriteTexture(playerColor.getStyle()), [playerColor])
  return (
    <sprite scale={[1.6, 1.6, 1]}>
      <spriteMaterial map={texture} color={playerColor} transparent opacity={opacity * 0.85} depthWrite={false} blending={THREE.AdditiveBlending} />
    </sprite>
  )
}

function FullGhostShip({ playerColor, opacity, isThrusting, isBoosting, simplified }) {
  return (
    <>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.18, 0.88, 6, 12]} />
        <meshStandardMaterial color="#cfd6e4" metalness={0.7} roughness={0.22} transparent opacity={opacity * 0.72} />
      </mesh>
      <mesh position={[0, 0, -0.68]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.18, 0.42, 12]} />
        <meshStandardMaterial color="#d8ddea" metalness={0.7} roughness={0.18} transparent opacity={opacity * 0.72} />
      </mesh>
      {!simplified && (
        <>
          <mesh position={[0, 0.14, -0.18]} scale={[1, 0.62, 1]}>
            <sphereGeometry args={[0.15, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
            <meshStandardMaterial color={playerColor} emissive={playerColor} emissiveIntensity={0.8} transparent opacity={opacity * 0.76} />
          </mesh>
          <pointLight position={[0, 0.16, -0.18]} color={playerColor} intensity={opacity * 0.8} distance={2} />
        </>
      )}
      {[-0.43, 0.43].map((x) => (
        <mesh key={x} position={[x, -0.04, 0.12]} rotation={[0, 0, x < 0 ? -0.18 : 0.18]}>
          <boxGeometry args={[0.46, 0.035, 0.38]} />
          <meshStandardMaterial color="#ccd3de" metalness={0.65} roughness={0.25} transparent opacity={opacity * 0.65} />
        </mesh>
      ))}
      {[-0.32, 0.32].map((x) => (
        <mesh key={x} position={[x, -0.06, 0.42]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.09, 0.36, 10]} />
          <meshStandardMaterial color={playerColor} emissive={playerColor} emissiveIntensity={isBoosting ? 1.8 : 0.8} transparent opacity={opacity * 0.76} />
        </mesh>
      ))}
      <mesh scale={1.8}>
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshBasicMaterial color={playerColor} transparent opacity={opacity * 0.04} depthWrite={false} side={THREE.BackSide} />
      </mesh>
      <GhostExhaust color={playerColor} isThrusting={isThrusting} isBoosting={isBoosting} opacity={opacity} />
    </>
  )
}

export function GhostRocket({ player, localPosition, isLeaving = false, onPassBy }) {
  const groupRef = useRef()
  const yawRef = useRef(player.yaw)
  const opacity = useRef(0)
  const passedClose = useRef(false)
  const playerColor = useMemo(() => colorForPlayer(player.uid), [player.uid])

  useFrame((_, delta) => {
    if (!groupRef.current) return
    const local = localPosition?.current ?? localPosition
    const distance = local ? groupRef.current.position.distanceTo(local) : Infinity
    const now = performance.now()
    const interpolated = distance < 80
      ? interpolatePlayer(player, now)
      : { position: player.position, yaw: player.yaw }

    opacity.current = THREE.MathUtils.lerp(opacity.current, isLeaving ? 0 : 1, Math.min(1, delta * 3.2))
    groupRef.current.position.copy(interpolated.position)
    yawRef.current = lerpAngle(yawRef.current, interpolated.yaw, Math.min(1, delta * 10))
    groupRef.current.rotation.set(0, yawRef.current, 0)
    groupRef.current.traverse((object) => {
      const material = object.material
      if (!material) return
      if (material.userData.baseOpacity == null) material.userData.baseOpacity = material.opacity
      material.opacity = material.userData.baseOpacity * opacity.current
    })

    if (distance < 8 && !passedClose.current) {
      passedClose.current = true
      onPassBy?.(player, distance)
    } else if (distance > 12) {
      passedClose.current = false
    }
  })

  const local = localPosition?.current ?? localPosition
  const distance = local ? player.position.distanceTo(local) : Infinity
  const lod = distance > 50 ? 'sprite' : distance > 15 ? 'simple' : 'full'

  return (
    <group ref={groupRef}>
      {lod === 'sprite' ? (
        <GhostSprite playerColor={playerColor} opacity={1} />
      ) : (
        <FullGhostShip
          playerColor={playerColor}
          opacity={1}
          isThrusting={player.isThrusting}
          isBoosting={player.isBoosting}
          simplified={lod === 'simple'}
        />
      )}
      <Html position={[0, lod === 'sprite' ? 1.2 : 1.45, 0]} center occlude distanceFactor={8}>
        <div
          className="ghost-player-label"
          style={{
            '--ghost-color': playerColor.getStyle(),
            opacity: 0.92
          }}
        >
          @{player.uid}
        </div>
      </Html>
    </group>
  )
}
