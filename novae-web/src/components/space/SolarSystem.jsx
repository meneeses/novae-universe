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

export function SolarSystem({ novaeShipPosition, onSelectObject }) {
  const glowTexture = useMemo(createGlowTexture, [])
  const sunRadius = SOLAR_SYSTEM.sun.radius
  const selectSun = (event) => {
    event.stopPropagation()
    onSelectObject?.({
      type: 'sun',
      name: 'Sun',
      description: 'The central star of the Solar System.',
      energy: 'High luminosity',
      radius: SOLAR_SYSTEM.sun.radius,
      color: SOLAR_SYSTEM.sun.color
    })
  }

  return (
    <group>
      <mesh onClick={selectSun} onPointerOver={() => { document.body.style.cursor = 'pointer' }} onPointerOut={() => { document.body.style.cursor = 'default' }}>
        <sphereGeometry args={[sunRadius, 48, 48]} />
        <meshBasicMaterial color="#ffdd44" />
      </mesh>
      <mesh scale={1.05}>
        <sphereGeometry args={[sunRadius, 48, 48]} />
        <meshBasicMaterial color="#ff8800" transparent opacity={0.3} depthWrite={false} />
      </mesh>
      <sprite scale={[sunRadius * 4.5, sunRadius * 4.5, 1]}>
        <spriteMaterial
          map={glowTexture}
          color="#ffaa00"
          transparent
          opacity={0.12}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
      <sprite scale={[sunRadius * 2.8, sunRadius * 2.8, 1]}>
        <spriteMaterial
          map={glowTexture}
          color="#ffdd88"
          transparent
          opacity={0.2}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
      <sprite scale={[sunRadius * 1.5, sunRadius * 1.5, 1]}>
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
          <SolarPlanet data={planet} novaeShipPosition={novaeShipPosition} onSelectObject={onSelectObject} />
        </group>
      ))}
    </group>
  )
}
