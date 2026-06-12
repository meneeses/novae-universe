import { Canvas, useThree } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useRocket } from '../../hooks/useRocket'
import { useUniverseStore } from '../../store/universeStore'
import { generatePlanetProps } from '../../utils/planetGenerator'
import { PORTALS, SPAWN_POSITION } from '../../utils/solarSystem'
import { HUD } from '../ui/HUD'
import { EmptyZoneWarning } from '../ui/EmptyZoneWarning'
import { MiniMap } from '../ui/MiniMap'
import { PlanetCard } from '../ui/PlanetCard'
import { WelcomeBanner } from '../ui/WelcomeBanner'
import { Planet } from './Planet'
import { Portal } from './Portal'
import { ProximityDetector } from './ProximityDetector'
import { Rocket } from './Rocket'
import { SolarSystem } from './SolarSystem'
import { Starfield } from './Starfield'

const INITIAL_FLIGHT = {
  position: { x: SPAWN_POSITION[0], y: SPAWN_POSITION[1], z: SPAWN_POSITION[2] },
  speed: 0.04,
  yaw: 0,
  isThrusting: false,
  isBraking: false,
  isTurning: false
}

function SceneContent({
  allPlanets,
  rocketController,
  onFlightUpdate,
  onNearPlanet,
  onLeavePlanet,
  onPortal
}) {
  const rocketRef = useRef()
  const camera = useThree((state) => state.camera)
  const cameraRef = useRef(camera)
  const rocket = useRocket(rocketRef, cameraRef, onFlightUpdate, rocketController)

  return (
    <>
      <fog attach="fog" args={['#050818', 200, 600]} />
      <ambientLight intensity={1.2} color="#334466" />
      <pointLight position={[0, 0, 0]} intensity={6} color="#fff5cc" distance={600} decay={1} />
      <Starfield />
      <SolarSystem rocketPosition={rocket.position} />

      {allPlanets.map((planet) => (
        <Planet
          key={planet.username}
          username={planet.username}
          planetProps={planet.planetProps}
          position={planet.position}
          isMyPlanet={planet.isMyPlanet}
          onClick={() => onNearPlanet({
            username: planet.username,
            distance: rocket.position.current.distanceTo(planet.vectorPosition),
            planetData: planet.planetData,
            planetProps: planet.planetProps
          })}
        />
      ))}

      {PORTALS.map((portal) => (
        <Portal
          key={portal.id}
          config={portal}
          rocketPosition={rocket.position}
          onTeleport={onPortal}
        />
      ))}

      <Rocket
        rocketRef={rocketRef}
        isThrusting={rocket.isThrusting}
        isBraking={rocket.isBraking}
      />
      <ProximityDetector
        rocketPosition={rocket.position}
        planets={allPlanets}
        onNearPlanet={onNearPlanet}
        onLeavePlanet={onLeavePlanet}
      />
      <EffectComposer multisampling={0}>
        <Bloom intensity={0.8} luminanceThreshold={0.6} luminanceSmoothing={0.7} mipmapBlur />
      </EffectComposer>
    </>
  )
}

export function SpaceScene({ login }) {
  const myPlanet = useUniverseStore((state) => state.myPlanet)
  const myPlanetProps = useUniverseStore((state) => state.myPlanetProps)
  const planets = useUniverseStore((state) => state.planets)
  const planetsProps = useUniverseStore((state) => state.planetsProps)
  const nearPlanet = useUniverseStore((state) => state.nearPlanet)
  const isGuest = useUniverseStore((state) => state.isGuest)
  const emptyZoneWarning = useUniverseStore((state) => state.emptyZoneWarning)
  const setPlanetProps = useUniverseStore((state) => state.setPlanetProps)
  const setNearPlanet = useUniverseStore((state) => state.setNearPlanet)
  const setLoginOpen = useUniverseStore((state) => state.setLoginOpen)
  const rocketController = useRef()
  const [flight, setFlight] = useState(INITIAL_FLIGHT)
  const [isTeleporting, setIsTeleporting] = useState(false)
  const [arrival, setArrival] = useState(null)

  useEffect(() => {
    for (const planet of planets) {
      const username = planet.github_username ?? planet.username
      if (!planetsProps[username.toLowerCase()]) {
        setPlanetProps(username, generatePlanetProps(planet))
      }
    }
  }, [planets, planetsProps, setPlanetProps])

  const allPlanets = useMemo(() => {
    const myUsername = myPlanet?.github_username ?? myPlanet?.username
    const byUsername = new Map()

    for (const planet of planets) {
      const username = planet.github_username ?? planet.username
      byUsername.set(username.toLowerCase(), {
        username,
        planetData: planet,
        planetProps: planetsProps[username.toLowerCase()] ?? generatePlanetProps(planet),
        position: [planet.position_x, 0, planet.position_z],
        vectorPosition: new THREE.Vector3(planet.position_x, 0, planet.position_z),
        isMyPlanet: username.toLowerCase() === myUsername?.toLowerCase()
      })
    }

    if (myPlanet && myPlanetProps) {
      const username = myUsername
      byUsername.set(username.toLowerCase(), {
        username,
        planetData: myPlanet,
        planetProps: myPlanetProps,
        position: [myPlanet.position_x, 0, myPlanet.position_z],
        vectorPosition: new THREE.Vector3(myPlanet.position_x, 0, myPlanet.position_z),
        isMyPlanet: true
      })
    }

    return [...byUsername.values()]
  }, [myPlanet, myPlanetProps, planets, planetsProps])

  const handleFlightUpdate = useCallback(({ position, speed, yaw, isThrusting, isBraking, isTurning }) => {
    setFlight({
      position: { x: position.x, y: position.y, z: position.z },
      speed,
      yaw,
      isThrusting,
      isBraking,
      isTurning
    })
  }, [])

  const handleNearPlanet = useCallback((nextPlanet) => {
    const current = useUniverseStore.getState().nearPlanet
    if (current?.username === nextPlanet.username && Math.abs(current.distance - nextPlanet.distance) < 0.1) return
    setNearPlanet(nextPlanet)
  }, [setNearPlanet])

  const handleLeavePlanet = useCallback(() => setNearPlanet(null), [setNearPlanet])

  const teleportTo = useCallback((destination, label) => {
    if (isTeleporting) return
    setIsTeleporting(true)
    window.setTimeout(() => {
      rocketController.current?.teleport(destination)
      setIsTeleporting(false)
      setArrival(`Arrived at ${label}`)
      window.setTimeout(() => setArrival(null), 3000)
    }, 400)
  }, [isTeleporting])

  const handlePortal = useCallback(
    (portal) => teleportTo(portal.destination, portal.label.replace('→ ', '')),
    [teleportTo]
  )

  const returnToSolarSystem = useCallback(
    () => teleportTo([20, 0, 10], 'Solar System'),
    [teleportTo]
  )

  const stayInEmptyZone = useCallback(() => {
    rocketController.current?.suppressEmptyZoneWarning(10000)
  }, [])

  const distanceFromCenter = Math.hypot(flight.position.x, flight.position.y, flight.position.z)
  const vignetteOpacity = Math.min(0.6, Math.max(0, (distanceFromCenter - 120) / 60) * 0.6)

  return (
    <main className="space-screen">
      <Canvas
        camera={{ position: [0, 8, 20], fov: 55, near: 0.1, far: 2000 }}
        gl={{
          antialias: true,
          toneMapping: THREE.NoToneMapping,
          outputColorSpace: THREE.SRGBColorSpace
        }}
        scene={{ background: new THREE.Color('#050818') }}
        onCreated={({ gl }) => {
          gl.getContext().enable(gl.getContext().DITHER)
        }}
      >
        <SceneContent
          allPlanets={allPlanets}
          rocketController={rocketController}
          onFlightUpdate={handleFlightUpdate}
          onNearPlanet={handleNearPlanet}
          onLeavePlanet={handleLeavePlanet}
          onPortal={handlePortal}
        />
      </Canvas>

      <HUD
        speed={flight.speed}
        yaw={flight.yaw}
        position={flight.position}
        isThrusting={flight.isThrusting}
        isBraking={flight.isBraking}
        isTurning={flight.isTurning}
        nearPlanet={nearPlanet}
        isGuest={isGuest}
        login={login}
      />
      <MiniMap position={flight.position} rotation={flight.yaw} planets={allPlanets} />
      {isGuest && <WelcomeBanner onLogin={() => setLoginOpen(true)} />}
      {nearPlanet && <PlanetCard planet={nearPlanet} onClose={() => setNearPlanet(null)} />}
      {emptyZoneWarning && (
        <EmptyZoneWarning onStay={stayInEmptyZone} onReturn={returnToSolarSystem} />
      )}
      {arrival && <div className="arrival-banner">{arrival}</div>}
      <div
        className="empty-zone-vignette"
        style={{
          background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${vignetteOpacity}) 100%)`
        }}
      />
      <div className={`teleport-flash${isTeleporting ? ' teleport-flash--active' : ''}`} />
    </main>
  )
}
