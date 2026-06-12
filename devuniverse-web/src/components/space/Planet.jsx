import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { getBiome } from '../../utils/planetGenerator'
import { PlanetAtmosphere } from './PlanetAtmosphere'
import { PlanetGlow } from './PlanetGlow'
import { PlanetLabel } from './PlanetLabel'
import { PlanetMoon } from './PlanetMoon'
import { PlanetRings } from './PlanetRings'

const BIOME_MATERIALS = {
  ocean: { color: '#1a7fc4', emissive: '#0a3a6a', emissiveIntensity: 0.4 },
  forest: { color: '#2d8c3a', emissive: '#0a2a10', emissiveIntensity: 0.3 },
  volcanic: { color: '#cc3311', emissive: '#441100', emissiveIntensity: 0.5 },
  arctic: { color: '#88ccee', emissive: '#224466', emissiveIntensity: 0.4 },
  tundra: { color: '#88ccee', emissive: '#224466', emissiveIntensity: 0.4 },
  desert: { color: '#d4922a', emissive: '#442200', emissiveIntensity: 0.3 },
  crystal: { color: '#9955dd', emissive: '#330066', emissiveIntensity: 0.5 },
  crimson: { color: '#cc2244', emissive: '#440011', emissiveIntensity: 0.4 },
  alien: { color: '#44ddcc', emissive: '#004433', emissiveIntensity: 0.5 }
}

export function Planet({ planetProps, position, username, isMyPlanet = false, onClick }) {
  const planetRef = useRef()
  const biome = getBiome(planetProps.primaryLanguage)
  const material = BIOME_MATERIALS[biome.name] ?? BIOME_MATERIALS.alien
  const thickness = planetProps.atmosphereThickness ?? planetProps.atmosphere ?? 0.3

  useFrame((_, delta) => {
    if (planetRef.current) planetRef.current.rotation.y += 0.001 * delta
  })

  function handleClick(event) {
    event.stopPropagation()
    onClick?.(event)
  }

  return (
    <group position={position} onClick={handleClick}>
      <mesh ref={planetRef}>
        <sphereGeometry args={[
          planetProps.size,
          biome.name === 'crystal' ? 12 : 32,
          biome.name === 'crystal' ? 8 : 32
        ]} />
        <meshLambertMaterial
          color={material.color}
          emissive={material.emissive}
          emissiveIntensity={material.emissiveIntensity}
          flatShading={biome.name === 'crystal'}
        />
      </mesh>

      <PlanetAtmosphere size={planetProps.size} color={material.color} thickness={thickness} />

      {planetProps.hasRings && (
        <PlanetRings
          size={planetProps.size}
          ringSize={planetProps.ringSize}
          color={biome.colors[2]}
        />
      )}

      {Array.from({ length: planetProps.moons }).map((_, index) => (
        <PlanetMoon
          key={`${planetProps.seed}-${index}`}
          planetSize={planetProps.size}
          index={index}
          seed={planetProps.seed}
        />
      ))}

      <PlanetLabel username={username} size={planetProps.size} isMyPlanet={isMyPlanet} />
      <PlanetGlow size={planetProps.size} color={material.color} isMyPlanet={isMyPlanet} />
    </group>
  )
}
