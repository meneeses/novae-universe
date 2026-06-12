import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Starfield } from './space/Starfield'

const STAR_COLORS = ['#ffffff', '#aaddff', '#ffd27d', '#bb88ff', '#66ddff']
const NOVAE_WORLD_COLORS = ['#4466cc', '#cc6655', '#55aa88', '#aa77cc', '#d4a85f']

function seededRandom(seed) {
  let value = seed
  return () => {
    value = (value * 16807) % 2147483647
    return (value - 1) / 2147483646
  }
}

function DecorativeStar({ data }) {
  const ref = useRef()

  useFrame(({ clock }) => {
    const pulse = 1 + Math.sin(clock.elapsedTime * data.pulse + data.phase) * 0.045
    ref.current.scale.setScalar(pulse)
  })

  return (
    <group ref={ref} position={data.position}>
      <mesh>
        <sphereGeometry args={[data.size, 20, 20]} />
        <meshBasicMaterial color={data.color} />
      </mesh>
      <pointLight color={data.color} intensity={data.size * 0.8} distance={18} />
    </group>
  )
}

function DecorativePlanet({ data }) {
  const ref = useRef()

  useFrame(({ clock }) => {
    const angle = data.phase + clock.elapsedTime * data.speed
    ref.current.position.set(
      data.center[0] + Math.cos(angle) * data.orbit,
      data.center[1] + Math.sin(angle * 0.7) * 0.7,
      data.center[2] + Math.sin(angle) * data.orbit
    )
    ref.current.rotation.y += 0.002
  })

  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[data.size, 20, 20]} />
        <meshLambertMaterial color={data.color} emissive={data.color} emissiveIntensity={0.18} />
      </mesh>
      {data.rings && (
        <mesh rotation={[Math.PI / 2.4, 0, 0.35]}>
          <ringGeometry args={[data.size * 1.35, data.size * 2.05, 48]} />
          <meshBasicMaterial color={data.color} transparent opacity={0.42} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}
      {data.moon && (
        <mesh position={[data.size * 2, data.size * 0.25, 0]}>
          <sphereGeometry args={[data.size * 0.2, 10, 10]} />
          <meshBasicMaterial color="#ccd5e5" />
        </mesh>
      )}
    </group>
  )
}

function CameraDrift() {
  const camera = useThree((state) => state.camera)
  const origin = useMemo(() => new THREE.Vector3(0, 3, 34), [])
  const target = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ clock }) => {
    const time = clock.elapsedTime
    target.copy(origin)
    target.x += Math.sin(time * 0.035) * 2
    target.y += Math.cos(time * 0.028) * 1.2
    camera.position.lerp(target, 0.012)
    camera.lookAt(Math.sin(time * 0.025) * 1.5, Math.cos(time * 0.02) * 0.8, 0)
  })

  return null
}

export function NovaeLandingUniverse() {
  const { stars: novaeStars, planets: novaeWorlds } = useMemo(() => {
    const random = seededRandom(41827)
    const generatedStars = Array.from({ length: 20 }, (_, index) => ({
      position: [(random() - 0.5) * 75, (random() - 0.5) * 38, -15 - random() * 75],
      size: 0.25 + random() * 1.1,
      color: STAR_COLORS[index % STAR_COLORS.length],
      pulse: 0.35 + random() * 0.55,
      phase: random() * Math.PI * 2
    }))
    const generatedPlanets = Array.from({ length: 12 }, (_, index) => {
      const star = generatedStars[(index * 3) % generatedStars.length]
      return {
        center: star.position,
        orbit: 2.5 + random() * 5,
        size: 0.35 + random() * 1.1,
        color: NOVAE_WORLD_COLORS[index % NOVAE_WORLD_COLORS.length],
        speed: 0.025 + random() * 0.035,
        phase: random() * Math.PI * 2,
        rings: index % 4 === 0,
        moon: index % 3 === 0
      }
    })
    return { stars: generatedStars, planets: generatedPlanets }
  }, [])

  return (
    <>
      <CameraDrift />
      <ambientLight intensity={0.7} color="#5670aa" />
      <Starfield />
      {novaeStars.map((star, index) => <DecorativeStar key={index} data={star} />)}
      {novaeWorlds.map((planet, index) => <DecorativePlanet key={index} data={planet} />)}
      <mesh position={[-20, 5, -55]} rotation={[0, 0, -0.3]} scale={[18, 7, 1]}>
        <circleGeometry args={[1, 64]} />
        <meshBasicMaterial color="#553388" transparent opacity={0.06} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh position={[25, -8, -68]} rotation={[0, 0, 0.4]} scale={[22, 8, 1]}>
        <circleGeometry args={[1, 64]} />
        <meshBasicMaterial color="#225599" transparent opacity={0.055} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </>
  )
}
