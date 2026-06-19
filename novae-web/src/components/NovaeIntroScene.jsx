import { Line } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { NovaePulse } from './NovaePulse'
import { NovaeIntroCamera } from './NovaeIntroCamera'
import { NovaeShip } from './space/NovaeShip'
import { NovaeStarObject } from './space/NovaeStarObject'
import { NovaeWorld } from './space/NovaeWorld'
import { NovaeWorldObject } from './space/NovaeWorldObject'
import { Starfield } from './space/Starfield'

const CENTRAL_STAR = {
  id: 'intro-central-star',
  github_username: 'novae-origin',
  position_x: 0,
  position_z: 0,
  star_color: '#aaddff',
  star_size: 2.2,
  star_type: 'supergiant',
  total_repos: 4,
  total_commits: 5200
}

const SYSTEM_WORLDS = [
  {
    id: 'intro-world-1',
    novae_star_id: CENTRAL_STAR.id,
    github_username: 'novae-origin',
    repo_name: 'first-light',
    repo_full_name: 'novae-origin/first-light',
    language: 'TypeScript',
    commit_count: 320,
    stars_count: 18,
    forks_count: 4,
    contributor_count: 2,
    world_type: 'rocky',
    orbit_radius: 2.6,
    orbit_speed: 0.13,
    orbit_offset: 0.4
  },
  {
    id: 'intro-world-2',
    novae_star_id: CENTRAL_STAR.id,
    github_username: 'novae-origin',
    repo_name: 'ring-array',
    repo_full_name: 'novae-origin/ring-array',
    language: 'JavaScript',
    commit_count: 1750,
    stars_count: 96,
    forks_count: 12,
    contributor_count: 4,
    world_type: 'ringed',
    orbit_radius: 4.2,
    orbit_speed: 0.09,
    orbit_offset: 2.2
  },
  {
    id: 'intro-world-3',
    novae_star_id: CENTRAL_STAR.id,
    github_username: 'novae-origin',
    repo_name: 'deep-orbit',
    repo_full_name: 'novae-origin/deep-orbit',
    language: 'Python',
    commit_count: 820,
    stars_count: 44,
    forks_count: 8,
    contributor_count: 3,
    world_type: 'rocky',
    orbit_radius: 5.8,
    orbit_speed: 0.065,
    orbit_offset: 4.1
  },
  {
    id: 'intro-world-4',
    novae_star_id: CENTRAL_STAR.id,
    github_username: 'novae-origin',
    repo_name: 'gas-cloud',
    repo_full_name: 'novae-origin/gas-cloud',
    language: 'Go',
    commit_count: 2450,
    stars_count: 180,
    forks_count: 24,
    contributor_count: 6,
    world_type: 'gaseous',
    orbit_radius: 7.4,
    orbit_speed: 0.045,
    orbit_offset: 5.3
  }
]

const FOREGROUND_WORLD_PROPS = {
  size: 3.6,
  seed: 914,
  primaryLanguage: 'Rust',
  hasRings: true,
  ringSize: 1.75,
  moons: 1,
  atmosphereThickness: 0.55
}

function seededValue(index, salt) {
  return Math.abs(Math.sin(index * 91.137 + salt * 17.71))
}

function revealProgress(timeline, start, duration) {
  const progress = THREE.MathUtils.clamp((timeline - start) / duration, 0, 1)
  return progress * progress * (3 - 2 * progress)
}

function TimedReveal({ timelineRef, start, duration = 0.9, children }) {
  const groupRef = useRef()

  useFrame(() => {
    if (!groupRef.current) return
    const progress = revealProgress(timelineRef.current, start, duration)
    groupRef.current.visible = progress > 0
    groupRef.current.scale.setScalar(Math.max(0.001, progress))
  })

  return <group ref={groupRef} visible={false}>{children}</group>
}

function IntroGalaxy({ timelineRef }) {
  const lineRefs = useRef([])
  const stars = useMemo(() => Array.from({ length: 11 }, (_, index) => ({
    id: `intro-galaxy-star-${index}`,
    position: [
      (seededValue(index, 1) - 0.5) * 150,
      (seededValue(index, 2) - 0.5) * 38,
      -35 - seededValue(index, 3) * 115
    ],
    starData: {
      github_username: `novae-star-${index}`,
      position_x: 0,
      position_z: 0,
      star_color: ['#ffffff', '#aaddff', '#ffcc88', '#bb88ff'][index % 4],
      star_size: 0.8 + seededValue(index, 4) * 1.4,
      star_type: index % 5 === 0 ? 'giant' : 'main_sequence'
    }
  })), [])
  const lines = useMemo(() => stars.slice(0, 7).map((star, index) => [
    star.position,
    stars[index + 1].position
  ]), [stars])

  useFrame(() => {
    const opacity = revealProgress(timelineRef.current, 10.2, 1) * 0.1
    lineRefs.current.forEach((line) => {
      if (line?.material) line.material.opacity = opacity
    })
  })

  return (
    <>
      <TimedReveal timelineRef={timelineRef} start={3.2} duration={2.2}>
        {stars.map((star) => (
          <group key={star.id} position={star.position}>
            <NovaeStarObject starData={star.starData} distanceFromNovaeShip={Infinity} backgroundOpacity={0.85} />
          </group>
        ))}
      </TimedReveal>
      {lines.map((points, index) => (
        <Line
          key={index}
          ref={(line) => { lineRefs.current[index] = line }}
          points={points}
          color={index % 2 ? '#7c4dff' : '#44ccdd'}
          transparent
          opacity={0}
          lineWidth={0.35}
        />
      ))}
    </>
  )
}

function ForegroundWorld({ timelineRef }) {
  const groupRef = useRef()

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const reveal = revealProgress(timelineRef.current, 6.2, 0.9)
    groupRef.current.visible = reveal > 0
    const angle = clock.elapsedTime * 0.11 + 0.8
    groupRef.current.position.set(
      11 + Math.cos(angle) * 8,
      -3 + Math.sin(angle * 0.6) * 1.4,
      -42 + Math.sin(angle) * 7
    )
    groupRef.current.rotation.y += 0.0015
    groupRef.current.scale.setScalar(Math.max(0.001, reveal))
  })

  return (
    <group ref={groupRef} visible={false}>
      <NovaeWorld
        novaeWorldProps={FOREGROUND_WORLD_PROPS}
        position={[0, 0, 0]}
        username="ring-array"
      />
    </group>
  )
}

function IntroShip({ timelineRef }) {
  const novaeShipRef = useRef()
  const speed = useRef(0.62)
  const thrusting = useRef(true)
  const boosting = useRef(false)
  const engineOff = useRef(false)
  const start = useMemo(() => new THREE.Vector3(-36, 69, -3), [])
  const control = useMemo(() => new THREE.Vector3(-2, 74, -48), [])
  const end = useMemo(() => new THREE.Vector3(34, 77, -88), [])
  const firstLeg = useMemo(() => new THREE.Vector3(), [])
  const secondLeg = useMemo(() => new THREE.Vector3(), [])

  useFrame(() => {
    if (!novaeShipRef.current) return
    const progress = THREE.MathUtils.clamp((timelineRef.current - 13) / 3, 0, 1)
    novaeShipRef.current.visible = progress > 0 && progress < 1
    if (!novaeShipRef.current.visible) return

    firstLeg.lerpVectors(start, control, progress)
    secondLeg.lerpVectors(control, end, progress)
    novaeShipRef.current.position.lerpVectors(firstLeg, secondLeg, progress)
    novaeShipRef.current.rotation.set(-0.08, -Math.PI / 2 - progress * 0.28, -0.22 + progress * 0.42)
    novaeShipRef.current.scale.setScalar(1.8)
  })

  return (
    <NovaeShip
      novaeShipRef={novaeShipRef}
      speed={speed}
      isThrusting={thrusting}
      isBoosting={boosting}
      isEngineOff={engineOff}
    />
  )
}

function IntroPulse({ timelineRef }) {
  const groupRef = useRef()
  const wave = useMemo(() => ({
    id: 'intro-pulse',
    type: 'commit',
    origin: [38, 0, -72],
    maxRadius: 65,
    progress: 0
  }), [])

  useFrame(() => {
    wave.progress = THREE.MathUtils.clamp((timelineRef.current - 10.2) / 2.5, 0, 1)
    if (groupRef.current) {
      groupRef.current.visible = timelineRef.current >= 10.2 && timelineRef.current < 12.7
    }
  })

  return <group ref={groupRef} visible={false}><NovaePulse wave={wave} /></group>
}

export function NovaeIntroScene({ timelineRef }) {
  const emptyWaves = useMemo(() => [], [])

  return (
    <>
      <NovaeIntroCamera timelineRef={timelineRef} />
      <ambientLight intensity={1.2} color="#1a2040" />
      <hemisphereLight skyColor="#1a3060" groundColor="#0a0a20" intensity={0.8} />
      <pointLight position={[0, 0, -40]} intensity={3} color="#fff5e0" distance={300} />

      <Starfield />

      <group position={[0, 0, -40]}>
        <NovaeStarObject starData={CENTRAL_STAR} isCenter distanceFromNovaeShip={25} />
        <TimedReveal timelineRef={timelineRef} start={5.8} duration={1}>
          {SYSTEM_WORLDS.map((world) => (
            <NovaeWorldObject key={world.id} planet={world} waves={emptyWaves} />
          ))}
        </TimedReveal>
      </group>

      <ForegroundWorld timelineRef={timelineRef} />
      <IntroGalaxy timelineRef={timelineRef} />
      <IntroPulse timelineRef={timelineRef} />
      <IntroShip timelineRef={timelineRef} />

      <EffectComposer multisampling={0}>
        <Bloom intensity={0.7} luminanceThreshold={0.72} luminanceSmoothing={0.65} mipmapBlur />
      </EffectComposer>
    </>
  )
}
