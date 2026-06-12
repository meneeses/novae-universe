import { Html, Line } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import {
  generatePlanetFromRepo,
  getMoonCount,
  NOVAE_WORLD_COLORS_BY_LANGUAGE
} from '../../utils/novaeWorldGenerator'
import { useNovaeWobble } from '../../hooks/useNovaeWobble'
import { NovaeWorldMoon } from './NovaeWorldMoon'

// Visual radii inside a Novae System. Even the smallest formed Novae World
// must read clearly larger than the roughly two-unit-long player ship.
const SYSTEM_NOVAE_WORLD_SIZE_BY_TYPE = {
  dwarf: 1.5,
  rocky: 2,
  large: 2.6,
  ringed: 3,
  gaseous: 3.6,
  giant: 4.5
}
const ORBIT_SCALE = 2.25
const ORBIT_PADDING = 4

function OrbitLine({ radius, visible }) {
  const points = useMemo(() => Array.from({ length: 97 }, (_, index) => {
    const angle = (index / 96) * Math.PI * 2
    return [Math.cos(angle) * radius, 0, Math.sin(angle) * radius]
  }), [radius])

  if (!visible) return null
  return <Line points={points} color="#ffffff" transparent opacity={0.04} lineWidth={0.4} />
}

function Rings({ size, count, color }) {
  if (!count) return null

  return Array.from({ length: count }, (_, index) => {
    const scales = [1.4, 1.7, 2.1, 2.6]
    const opacities = [0.5, 0.35, 0.25, 0.15]
    const scale = scales[index] ?? scales.at(-1)
    return (
      <mesh key={index} rotation={[Math.PI / 2.55, 0, Math.PI / 6]}>
        <ringGeometry args={[size * scale, size * (scale + 0.18), 64]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacities[index]}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    )
  })
}

const rockyVertexShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  void main() {
    vPosition = position;
    vNormal = normal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const rockyFragmentShader = `
  uniform vec3 uBase;
  uniform vec3 uDark;
  varying vec3 vPosition;
  varying vec3 vNormal;
  void main() {
    float terrain = sin(vPosition.x * 17.0) * sin(vPosition.y * 13.0) * sin(vPosition.z * 19.0);
    float light = 0.55 + max(dot(normalize(vNormal), normalize(vec3(0.7, 1.0, 0.4))), 0.0) * 0.45;
    gl_FragColor = vec4(mix(uDark, uBase, smoothstep(-0.25, 0.35, terrain)) * light, 1.0);
  }
`

const gaseousFragmentShader = `
  uniform vec3 uBase;
  uniform vec3 uDark;
  varying vec3 vPosition;
  varying vec3 vNormal;
  void main() {
    float bands = 0.5 + sin(vPosition.y * 42.0 + sin(vPosition.x * 8.0) * 0.8) * 0.5;
    float light = 0.5 + max(dot(normalize(vNormal), normalize(vec3(0.8, 1.0, 0.5))), 0.0) * 0.5;
    gl_FragColor = vec4(mix(uDark, uBase, bands) * light, 1.0);
  }
`

function NovaeWorldMaterial({ type, colors, dimmed }) {
  const uniforms = {
    uBase: { value: new THREE.Color(colors.base).multiplyScalar(dimmed ? 0.35 : 1) },
    uDark: { value: new THREE.Color(colors.emissive).multiplyScalar(dimmed ? 0.25 : 1) }
  }

  if (type === 'rocky') {
    return (
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={rockyVertexShader}
        fragmentShader={rockyFragmentShader}
      />
    )
  }
  if (type === 'gaseous' || type === 'giant') {
    return (
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={rockyVertexShader}
        fragmentShader={gaseousFragmentShader}
      />
    )
  }
  return (
    <meshLambertMaterial
      color={dimmed ? colors.emissive : colors.base}
      emissive={colors.emissive}
      emissiveIntensity={0.22}
    />
  )
}

export function NovaeWorldObject({ planet, novaeShipPosition, waves = [], onClick, dimmed = false }) {
  const groupRef = useRef()
  const meshRef = useRef()
  const [visibility, setVisibility] = useState({ orbit: false, label: false })
  const props = useMemo(
    () => generatePlanetFromRepo(
      { ...planet, name: planet.repo_name, stargazers_count: planet.stars_count },
      planet.novae_star_id,
      planet.github_username,
      0
    ),
    [planet]
  )
  const colors = props._colors ?? NOVAE_WORLD_COLORS_BY_LANGUAGE.default
  const moonCount = getMoonCount(planet.stars_count)
  const ringCount = planet.world_type === 'giant' ? 4 : props._rings
  const size = SYSTEM_NOVAE_WORLD_SIZE_BY_TYPE[planet.world_type] ?? 1.5
  const orbitRadius = planet.orbit_radius * ORBIT_SCALE + ORBIT_PADDING
  const wobbleOffset = useNovaeWobble({ positionRef: groupRef, waves, orbitRadius })

  useFrame(({ clock }) => {
    if (!groupRef.current || !meshRef.current) return
    const angle = clock.elapsedTime * planet.orbit_speed + planet.orbit_offset
    groupRef.current.position.x = Math.cos(angle) * orbitRadius + wobbleOffset.current.x
    groupRef.current.position.y = wobbleOffset.current.y
    groupRef.current.position.z = Math.sin(angle) * orbitRadius + wobbleOffset.current.z
    meshRef.current.rotation.y += 0.005
    if (novaeShipPosition) {
      const distance = novaeShipPosition.current.distanceTo(groupRef.current.position)
      const next = { orbit: distance < 65, label: distance < 18 }
      setVisibility((current) =>
        current.orbit === next.orbit && current.label === next.label ? current : next
      )
    }
  })

  return (
    <>
      <OrbitLine radius={orbitRadius} visible={visibility.orbit} />
      <group ref={groupRef} onClick={(event) => {
        event.stopPropagation()
        onClick?.(planet)
      }} onPointerOver={() => { document.body.style.cursor = 'pointer' }} onPointerOut={() => { document.body.style.cursor = 'default' }}>
        <mesh ref={meshRef}>
          <sphereGeometry args={[
            size,
            planet.world_type === 'dwarf' ? 16 : 32,
            planet.world_type === 'dwarf' ? 16 : 32
          ]} />
          <NovaeWorldMaterial type={planet.world_type} colors={colors} dimmed={dimmed} />
        </mesh>

        {(planet.world_type === 'large' || planet.world_type === 'gaseous' || planet.world_type === 'giant') && (
          <mesh scale={1.08}>
            <sphereGeometry args={[size, 24, 24]} />
            <meshBasicMaterial color={colors.base} transparent opacity={dimmed ? 0.03 : 0.1} depthWrite={false} />
          </mesh>
        )}

        <Rings size={size} count={ringCount} color={colors.base} />
        {Array.from({ length: moonCount }, (_, index) => (
          <NovaeWorldMoon key={index} planetSize={size} index={index} seed={props._seed} />
        ))}

        {visibility.label && (
          <Html center position={[0, size + 0.6, 0]} distanceFactor={8}>
            <div className="repo-label">
              <strong>{planet.repo_name}</strong>
              <span>{planet.language ?? 'Unknown'} · {planet.commit_count} commits · {planet.stars_count} ⭐</span>
            </div>
          </Html>
        )}
      </group>
    </>
  )
}
