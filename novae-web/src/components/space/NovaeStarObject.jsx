import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

function createGlowTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const context = canvas.getContext('2d')
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.25, 'rgba(255,255,255,0.75)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(canvas)
}

export function NovaeStarObject({
  starData,
  isCurrentUser = false,
  onClick,
  distanceFromNovaeShip = Infinity,
  backgroundOpacity = 1,
  isCenter = false
}) {
  const groupRef = useRef()
  const sphereRef = useRef()
  const pointMaterialRef = useRef()
  const glowTexture = useMemo(createGlowTexture, [])
  const type = starData.star_type ?? 'main_sequence'
  const size = starData.star_size ?? 0.9
  const visualSize = isCenter ? Math.max(2.6, size * 1.6) : size
  const color = starData.star_color ?? '#ffffff'
  const username = starData.github_username ?? starData.username
  const isDistant = distanceFromNovaeShip > 30
  const showLabel = distanceFromNovaeShip < 20
  const coronaScale = type === 'supergiant' ? 6 : type === 'giant' ? 4.2 : 3.2
  const centerScale = isCenter ? 1.35 : 1
  const handleClick = (event) => {
    event.stopPropagation()
    onClick?.(event)
  }
  const pointerOn = () => { document.body.style.cursor = 'pointer' }
  const pointerOff = () => { document.body.style.cursor = 'default' }

  useFrame(({ clock }) => {
    if (!groupRef.current || !sphereRef.current) return
    const proximityScale = distanceFromNovaeShip > 30
      ? 0.12
      : distanceFromNovaeShip < 10
        ? 1
        : THREE.MathUtils.lerp(1, 0.12, (distanceFromNovaeShip - 10) / 20)
    const pulse = type === 'supergiant'
      ? 1 + Math.sin(clock.elapsedTime * 0.65) * 0.06
      : type === 'giant'
        ? 1 + Math.sin(clock.elapsedTime * 0.4) * 0.03
        : 1

    sphereRef.current.scale.setScalar(THREE.MathUtils.lerp(
      sphereRef.current.scale.x,
      proximityScale * pulse * centerScale,
      0.08
    ))
    if (pointMaterialRef.current) {
      pointMaterialRef.current.opacity = THREE.MathUtils.lerp(
        pointMaterialRef.current.opacity,
        isDistant ? backgroundOpacity : 0,
        0.1
      )
    }
  })

  if (type === 'nebula') {
    return (
      <group position={[starData.position_x ?? 0, 0, starData.position_z ?? 0]} onClick={handleClick} onPointerOver={pointerOn} onPointerOut={pointerOff}>
        <sprite scale={[isCenter ? 10 : 4, isCenter ? 10 : 4, 1]}>
          <spriteMaterial
            map={glowTexture}
            color="#7755cc"
            transparent
            opacity={0.25 * backgroundOpacity}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
        {showLabel && (
          <Html center position={[0, 2, 0]} distanceFactor={12}>
            <div className="novae-star-label">[ remnant of @{username} ]</div>
          </Html>
        )}
      </group>
    )
  }

  return (
    <group ref={groupRef} position={[starData.position_x ?? 0, 0, starData.position_z ?? 0]} onClick={handleClick} onPointerOver={pointerOn} onPointerOut={pointerOff}>
      <sprite scale={[1.2, 1.2, 1]}>
        <spriteMaterial
          ref={pointMaterialRef}
          map={glowTexture}
          color={color}
          transparent
          opacity={backgroundOpacity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>

      <group ref={sphereRef}>
        <mesh>
          <sphereGeometry args={[visualSize, type === 'dwarf' ? 16 : 32, type === 'dwarf' ? 16 : 32]} />
          <meshBasicMaterial color={color} />
        </mesh>

        {type !== 'dwarf' && (
          <>
            <sprite scale={[visualSize * coronaScale, visualSize * coronaScale, 1]}>
              <spriteMaterial
                map={glowTexture}
                color={color}
                transparent
                opacity={0.28 * backgroundOpacity}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </sprite>
            <sprite scale={[visualSize * coronaScale * 0.62, visualSize * coronaScale * 0.62, 1]}>
              <spriteMaterial
                map={glowTexture}
                color="#ffffff"
                transparent
                opacity={0.2 * backgroundOpacity}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </sprite>
          </>
        )}

        {type === 'supergiant' && (
          <pointLight color={color} intensity={7} distance={45} decay={1.2} />
        )}
      </group>

      {showLabel && (
        <Html center position={[0, visualSize + 1.1, 0]} distanceFactor={12}>
          <div className={`novae-star-label${isCurrentUser ? ' novae-star-label--current' : ''}`}>
            <strong>@{username}</strong>
            <span>{starData.total_repos ?? 0} repos · {starData.total_commits ?? 0} commits</span>
            {distanceFromNovaeShip < 10 && <em>Approach to enter</em>}
          </div>
        </Html>
      )}
    </group>
  )
}
