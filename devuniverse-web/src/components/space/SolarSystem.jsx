import { Line } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'
import { SOLAR_SYSTEM } from '../../utils/solarSystem'
import { SolarPlanet } from './SolarPlanet'

function Orbit({ radius }) {
  const points = useMemo(
    () => Array.from({ length: 97 }, (_, index) => {
      const angle = (index / 96) * Math.PI * 2
      return [Math.cos(angle) * radius, 0, Math.sin(angle) * radius]
    }),
    [radius]
  )

  return <Line points={points} color="#7080aa" transparent opacity={0.15} lineWidth={0.5} />
}

function createGlowTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const context = canvas.getContext('2d')
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.35, 'rgba(255,255,255,0.65)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(canvas)
}

export function SolarSystem({ rocketPosition }) {
  const glowTexture = useMemo(createGlowTexture, [])

  return (
    <group>
      <mesh>
        <sphereGeometry args={[4, 32, 32]} />
        <meshBasicMaterial color="#ffdd44" />
      </mesh>
      <mesh scale={1.05}>
        <sphereGeometry args={[4, 32, 32]} />
        <meshBasicMaterial color="#ff8800" transparent opacity={0.3} depthWrite={false} />
      </mesh>
      <sprite scale={[18, 18, 1]}>
        <spriteMaterial
          map={glowTexture}
          color="#ffaa00"
          transparent
          opacity={0.12}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
      <sprite scale={[11, 11, 1]}>
        <spriteMaterial
          map={glowTexture}
          color="#ffdd88"
          transparent
          opacity={0.2}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
      <sprite scale={[6, 6, 1]}>
        <spriteMaterial
          map={glowTexture}
          color="#ffffff"
          transparent
          opacity={0.25}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
      <pointLight intensity={6} color="#fff5cc" distance={600} decay={1} />

      {SOLAR_SYSTEM.planets.map((planet) => (
        <group key={planet.name}>
          <Orbit radius={planet.orbitRadius} />
          <SolarPlanet data={planet} rocketPosition={rocketPosition} />
        </group>
      ))}
    </group>
  )
}
