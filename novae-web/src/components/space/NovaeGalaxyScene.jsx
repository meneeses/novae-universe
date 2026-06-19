import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { useCallback, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useNovaeShip } from '../../hooks/useNovaeShip'
import { useNovaeStore } from '../../store/novaeStore'
import { NOVAE_GATES, SPAWN_POSITION } from '../../utils/solarSystem'
import { MOCK_NOVAE_STARS, MOCK_NOVAE_SYSTEMS } from '../../utils/mockNovaeGalaxy'
import { EmptyZoneWarning } from '../ui/EmptyZoneWarning'
import { CelestialDetailsPanel } from '../ui/CelestialDetailsPanel'
import { DimensionTunnel } from './DimensionTunnel'
import { NovaeGalaxyEnvironment } from './NovaeGalaxyEnvironment'
import { NovaeHUD } from '../ui/NovaeHUD'
import { NovaeMap } from '../ui/NovaeMap'
import { NovaeWelcome } from '../ui/NovaeWelcome'
import { NovaeGate } from './NovaeGate'
import { NovaeShip } from './NovaeShip'
import { SolarSystem } from './SolarSystem'
import { NovaeStarObject } from './NovaeStarObject'
import { Starfield } from './Starfield'
import { NovaeSystem } from './NovaeSystem'
import { NovaeSupernova } from './NovaeSupernova'
import { SpacePhenomena } from './SpacePhenomena'
import { NovaeWeaponProjectiles } from './NovaeWeaponProjectiles'
import { MultiplayerPresence } from './MultiplayerPresence'

const ENTER_THRESHOLD = 6
const INITIAL_FLIGHT = {
  position: { x: SPAWN_POSITION[0], y: SPAWN_POSITION[1], z: SPAWN_POSITION[2] },
  speed: 0.04,
  yaw: 0,
  isThrusting: false,
  isBoosting: false,
  isEngineOff: false,
  engineEnabled: true,
  verticalInput: 0,
}

function getMultiplayerArea(dimension, galaxyMode, activeNovaeStarUsername) {
  if (galaxyMode === 'system' && activeNovaeStarUsername) return `${activeNovaeStarUsername}_system`
  return dimension === 'solar' ? 'solar_system' : 'dev_universe'
}

function SystemDetector({ mode, stars, novaeShipPosition, onEnter }) {
  const checkingRef = useRef(false)

  useFrame(() => {
    if (checkingRef.current) return

    if (mode === 'system') return

    for (const star of stars) {
      const distance = novaeShipPosition.current.distanceTo(star.vectorPosition)
      if (distance < ENTER_THRESHOLD) {
        checkingRef.current = true
        Promise.resolve(onEnter(star)).finally(() => {
          window.setTimeout(() => { checkingRef.current = false }, 500)
        })
        break
      }
    }
  })

  return null
}

function SceneContent({
  stars,
  mode,
  activeStar,
  activeSystemWorlds,
  novaeShipController,
  onFlightUpdate,
  onEnter,
  onExitSystem,
  onNovaeGate,
  onSelectObject,
  hasShield,
  dimension,
  novaeGateTransit,
  onSpaceAlert,
  onWeaponStatus,
  localUsername,
  localArea,
  isInvisible,
  onPresenceUpdate,
  onPlayerPassBy
}) {
  const novaeShipRef = useRef()
  const camera = useThree((state) => state.camera)
  const cameraRef = useRef(camera)
  const novaeShip = useNovaeShip(novaeShipRef, cameraRef, onFlightUpdate, novaeShipController)

  return (
    <>
      <fog attach="fog" args={['#050818', 200, 600]} />
      <ambientLight intensity={mode === 'system' ? 0.45 : 1.1} color="#334466" />
      <Starfield />
      <SpacePhenomena dimension={dimension} novaeShipPosition={novaeShip.position} onAlert={onSpaceAlert} />

      {mode === 'galaxy' ? (
        <>
          {dimension === 'solar' && (
            <SolarSystem novaeShipPosition={novaeShip.position} onSelectObject={onSelectObject} />
          )}
          {dimension === 'developers' && stars.map((star) => (
            <group key={star.username}>
              {star.starData.status === 'supernova' ? (
                <group position={star.position}>
                  <NovaeSupernova starData={star.starData} />
                </group>
              ) : (
                <NovaeStarObject
                  starData={star.starData}
                  isCurrentUser={star.isCurrentUser}
                  distanceFromNovaeShip={novaeShip.position.current.distanceTo(star.vectorPosition)}
                  onClick={() => onSelectObject({
                    type: 'star',
                    username: star.username,
                    displayName: star.starData.display_name,
                    description: 'A developer represented as a Novae Star in Novae Galaxy.',
                    primaryLanguage: star.starData.primary_language,
                    commits: star.starData.total_commits,
                    followers: star.starData.followers,
                    repos: star.starData.total_repos,
                    githubUrl: `https://github.com/${star.username}`
                  })}
                />
              )}
            </group>
          ))}
          {dimension === 'developers' && (
            <NovaeGalaxyEnvironment stars={stars} onSelectObject={onSelectObject} />
          )}
          {NOVAE_GATES.filter((novaeGate) => novaeGate.sourceDimension === dimension).map((novaeGate) => (
            <NovaeGate
              key={novaeGate.id}
              config={novaeGate}
              novaeShipPosition={novaeShip.position}
              onTeleport={onNovaeGate}
              onSelectObject={onSelectObject}
            />
          ))}
        </>
      ) : (
        <>
          {activeStar && (
            <>
              <group scale={0.16}>
                {stars
                  .filter((star) => star.username !== activeStar.username)
                  .map((star) => (
                    <NovaeStarObject
                      key={star.username}
                      starData={star.starData}
                      distanceFromNovaeShip={Infinity}
                      backgroundOpacity={0.07}
                    />
                  ))}
              </group>
              <NovaeSystem
                starData={activeStar.starData}
                planets={activeSystemWorlds}
                stars={stars}
                novaeShipPosition={novaeShip.position}
                onExitSystem={onExitSystem}
                onRepoClick={(planet) => onSelectObject({
                  type: 'novae-world',
                  username: planet.github_username,
                  name: planet.repo_name,
                  description: planet.description,
                  primaryLanguage: planet.language,
                  biome: `${planet.world_type} planet`,
                  worldType: planet.world_type,
                  stars: planet.stars_count,
                  commits: planet.commit_count,
                  forks: planet.forks_count,
                  contributors: planet.contributor_count,
                  orbitRadius: planet.orbit_radius,
                  orbitSpeed: planet.orbit_speed,
                  isCollab: planet.is_collab,
                  collabUsername: planet.collab_username,
                  followers: activeStar.starData.followers,
                  repos: activeStar.starData.total_repos,
                  githubUrl: planet.html_url
                })}
                onSelectObject={onSelectObject}
              />
            </>
          )}
        </>
      )}

      <NovaeShip
        novaeShipRef={novaeShipRef}
        speed={novaeShip.speed}
        isThrusting={novaeShip.isThrusting}
        isBoosting={novaeShip.isBoosting}
        isEngineOff={novaeShip.isEngineOff}
        verticalInput={novaeShip.verticalInput}
        hasShield={hasShield}
      />
      <NovaeWeaponProjectiles
        fireSequence={novaeShip.fireSequence}
        novaeShipPosition={novaeShip.position}
        novaeShipForward={novaeShip.forward}
        dimension={dimension}
        stars={stars}
        onWeaponStatus={onWeaponStatus}
      />
      <MultiplayerPresence
        localUsername={localUsername}
        localPosition={novaeShip.position}
        localYaw={novaeShip.yaw}
        speed={novaeShip.speed}
        isThrusting={novaeShip.isThrusting}
        isBoosting={novaeShip.isBoosting}
        area={localArea}
        isInvisible={isInvisible}
        onPresenceUpdate={onPresenceUpdate}
        onPassBy={onPlayerPassBy}
      />
      <DimensionTunnel transit={novaeGateTransit} />
      <SystemDetector
        mode={mode}
        stars={dimension === 'developers' ? stars : []}
        novaeShipPosition={novaeShip.position}
        onEnter={onEnter}
      />
      <EffectComposer multisampling={0}>
        <Bloom intensity={mode === 'system' ? 1.15 : 0.8} luminanceThreshold={0.45} luminanceSmoothing={0.7} mipmapBlur />
      </EffectComposer>
    </>
  )
}

export function NovaeGalaxyScene() {
  const stars = useNovaeStore((state) => state.novaeStars)
  const currentUser = useNovaeStore((state) => state.currentUser)
  const galaxyMode = useNovaeStore((state) => state.galaxyMode)
  const activeNovaeStarUsername = useNovaeStore((state) => state.activeNovaeStarUsername)
  const activeSystemWorlds = useNovaeStore((state) => state.activeSystemWorlds)
  const systemTransition = useNovaeStore((state) => state.systemTransition)
  const isGuest = useNovaeStore((state) => state.isGuest)
  const emptyZoneWarning = useNovaeStore((state) => state.emptyZoneWarning)
  const setLoginOpen = useNovaeStore((state) => state.setLoginOpen)
  const selectedObject = useNovaeStore((state) => state.selectedObject)
  const isInvisible = useNovaeStore((state) => state.isInvisible)
  const toggleInvisible = useNovaeStore((state) => state.toggleInvisible)
  const setSelectedObject = useNovaeStore((state) => state.setSelectedObject)
  const clearSelectedObject = useNovaeStore((state) => state.clearSelectedObject)
  const novaeShipController = useRef()
  const exitPositionRef = useRef(null)
  const [flight, setFlight] = useState(INITIAL_FLIGHT)
  const [arrival, setArrival] = useState(null)
  const [novaeGateTransit, setNovaeGateTransit] = useState(null)
  const [dimension, setDimension] = useState('solar')
  const [spaceAlert, setSpaceAlert] = useState(null)
  const [weaponStatus, setWeaponStatus] = useState({ cooldownProgress: 1, ready: true })
  const [presence, setPresence] = useState({ playerCount: 0, nearbyPlayers: [], remotePlayers: [] })
  const [passByNotice, setPassByNotice] = useState(null)
  const alertTimeoutRef = useRef(null)
  const weaponStatusRef = useRef({ blocks: 10, ready: true })
  const passByTimeoutRef = useRef(null)

  const displayStars = useMemo(() => {
    const realUsernames = new Set(stars.map((star) => (star.github_username ?? star.username).toLowerCase()))
    return [...stars, ...MOCK_NOVAE_STARS.filter((star) => !realUsernames.has(star.github_username))]
  }, [stars])

  const galaxyStars = useMemo(() => displayStars.map((star) => {
    const username = (star.github_username ?? star.username).toLowerCase()
    return {
      username,
      starData: star,
      position: [star.position_x, 0, star.position_z],
      vectorPosition: new THREE.Vector3(star.position_x, 0, star.position_z),
      isCurrentUser: username === currentUser?.username?.toLowerCase(),
      novaeWorldProps: { size: star.star_size ?? 1 }
    }
  }), [currentUser?.username, displayStars])

  const activeStar = galaxyStars.find((star) => star.username === activeNovaeStarUsername) ?? null
  const localArea = getMultiplayerArea(dimension, galaxyMode, activeNovaeStarUsername)
  const localUsername = currentUser?.username ?? currentUser?.github_username ?? null

  const handleFlightUpdate = useCallback((nextFlight) => {
    setFlight({
      position: {
        x: nextFlight.position.x,
        y: nextFlight.position.y,
        z: nextFlight.position.z
      },
      speed: nextFlight.speed,
      yaw: nextFlight.yaw,
      isThrusting: nextFlight.isThrusting,
      isBoosting: nextFlight.isBoosting,
      isEngineOff: nextFlight.isEngineOff,
      engineEnabled: nextFlight.engineEnabled,
      verticalInput: nextFlight.verticalInput,
    })
  }, [])

  const enterSystem = useCallback(async (star) => {
    if (useNovaeStore.getState().galaxyMode === 'system') return
    exitPositionRef.current = star.vectorPosition.clone()
    if (star.starData.is_mock) {
      useNovaeStore.setState({
        systemTransition: true,
        galaxyMode: 'system',
        activeNovaeStarUsername: star.username,
        activeSystemWorlds: MOCK_NOVAE_SYSTEMS[star.username] ?? []
      })
      window.setTimeout(() => useNovaeStore.setState({ systemTransition: false }), 350)
    } else {
      await useNovaeStore.getState().enterSystem(star.username)
    }
    novaeShipController.current?.teleport([0, 0, 20])
    novaeShipController.current?.stop()
    setArrival(`[ @${star.username}'s system ]`)
    window.setTimeout(() => setArrival(null), 2500)
  }, [])

  const exitSystem = useCallback(() => {
    const destination = exitPositionRef.current
      ? [exitPositionRef.current.x + 8, 0, exitPositionRef.current.z + 8]
      : [20, 0, 10]
    useNovaeStore.getState().exitSystem()
    clearSelectedObject()
    novaeShipController.current?.teleport(destination)
    novaeShipController.current?.stop()
    setArrival('Returned to galaxy')
    window.setTimeout(() => setArrival(null), 2200)
  }, [clearSelectedObject])

  const teleportTo = useCallback((destination, label) => {
    novaeShipController.current?.teleport(destination)
    setArrival(`Arrived at ${label}`)
    window.setTimeout(() => setArrival(null), 2200)
  }, [])

  const travelThroughNovaeGate = useCallback((novaeGate) => {
    if (novaeGateTransit) return
    clearSelectedObject()
    setNovaeGateTransit(novaeGate)
    window.setTimeout(() => {
      if (novaeGate.targetDimension === 'solar') useNovaeStore.getState().exitSystem()
      setDimension(novaeGate.targetDimension)
      novaeShipController.current?.teleport(novaeGate.destination)
      novaeShipController.current?.stop()
      setArrival(`Entered ${novaeGate.dimension}`)
    }, 900)
    window.setTimeout(() => {
      setNovaeGateTransit(null)
      window.setTimeout(() => setArrival(null), 1800)
    }, 2200)
  }, [clearSelectedObject, novaeGateTransit])

  const returnToSolarSystem = useCallback(() => {
    useNovaeStore.getState().exitSystem()
    setDimension('solar')
    teleportTo([20, 0, 10], 'Solar System')
  }, [teleportTo])

  const handleSpaceAlert = useCallback((message) => {
    setSpaceAlert(message)
    if (alertTimeoutRef.current) window.clearTimeout(alertTimeoutRef.current)
    alertTimeoutRef.current = window.setTimeout(() => setSpaceAlert(null), 1400)
  }, [])

  const handleWeaponStatus = useCallback((status) => {
    const blocks = Math.round((status.cooldownProgress ?? 1) * 10)
    if (weaponStatusRef.current.blocks === blocks && weaponStatusRef.current.ready === status.ready) return
    weaponStatusRef.current = { blocks, ready: status.ready }
    setWeaponStatus(status)
  }, [])

  const handlePlayerPassBy = useCallback((player) => {
    setPassByNotice(`● @${player.uid}`)
    if (passByTimeoutRef.current) window.clearTimeout(passByTimeoutRef.current)
    passByTimeoutRef.current = window.setTimeout(() => setPassByNotice(null), 2200)
  }, [])

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
      >
        <SceneContent
          stars={galaxyStars}
          mode={galaxyMode}
          activeStar={activeStar}
          activeSystemWorlds={activeSystemWorlds}
          novaeShipController={novaeShipController}
          onFlightUpdate={handleFlightUpdate}
          onEnter={enterSystem}
          onExitSystem={exitSystem}
          onNovaeGate={travelThroughNovaeGate}
          onSelectObject={setSelectedObject}
          hasShield={(currentUser?.followers ?? 0) > 1000}
          dimension={dimension}
          novaeGateTransit={novaeGateTransit}
          onSpaceAlert={handleSpaceAlert}
          onWeaponStatus={handleWeaponStatus}
          localUsername={localUsername}
          localArea={localArea}
          isInvisible={isInvisible}
          onPresenceUpdate={setPresence}
          onPlayerPassBy={handlePlayerPassBy}
        />
      </Canvas>

      <NovaeHUD
        speed={flight.speed}
        yaw={flight.yaw}
        position={flight.position}
        isThrusting={flight.isThrusting}
        isBoosting={flight.isBoosting}
        isEngineOff={flight.isEngineOff}
        isGuest={isGuest}
        galaxyMode={galaxyMode}
        activeNovaeStarUsername={activeNovaeStarUsername}
        dimension={dimension}
        spaceAlert={spaceAlert}
        engineEnabled={flight.engineEnabled}
        weaponStatus={weaponStatus}
        presence={presence}
        isInvisible={isInvisible}
        onToggleInvisible={toggleInvisible}
      />
      {galaxyMode === 'galaxy' && (
        <NovaeMap position={flight.position} rotation={flight.yaw} planets={galaxyStars} dimension={dimension} />
      )}
      {isGuest && <NovaeWelcome onLogin={() => setLoginOpen(true)} />}
      {emptyZoneWarning && (
        <EmptyZoneWarning
          onStay={() => novaeShipController.current?.suppressEmptyZoneWarning(10000)}
          onReturn={returnToSolarSystem}
        />
      )}
      {arrival && <div className="arrival-banner">{arrival}</div>}
      {passByNotice && <div className="pass-by-notice">{passByNotice}</div>}
      <div className={`space-alert-vignette${spaceAlert ? ' space-alert-vignette--active' : ''}`} />
      <aside className="navigation-guide">
        <span>{dimension === 'solar' ? 'ORIGIN DIMENSION' : 'DEVELOPER GALAXY'}</span>
        <b>›</b>
        <strong>{galaxyMode === 'system' ? `@${activeNovaeStarUsername} SYSTEM` : 'GALAXY MAP'}</strong>
        <em>{galaxyMode === 'system'
          ? 'Explore Novae Worlds. Use the cyan Novae Gate to return.'
          : dimension === 'developers'
            ? 'Approach a Novae Star to enter its Novae System.'
            : 'Use the violet gate to reach the Novae Galaxy.'}
        </em>
      </aside>
      <div
        className={`dimension-transit${novaeGateTransit ? ' dimension-transit--active' : ''}`}
        style={{
          '--novae-gate-color': novaeGateTransit?.color ?? '#ffffff',
          '--novae-gate-accent': novaeGateTransit?.accentColor ?? '#ffffff'
        }}
      >
        {novaeGateTransit && (
          <>
            <i className="dimension-transit__rift" />
            <i className="dimension-transit__flare" />
            <span>
            <strong>DIMENSIONAL JUMP</strong>
            <em>{novaeGateTransit.dimension.toUpperCase()}</em>
            </span>
          </>
        )}
      </div>
      {selectedObject && (
        <CelestialDetailsPanel object={selectedObject} onClose={clearSelectedObject} />
      )}
      <div className={`teleport-flash${systemTransition ? ' teleport-flash--active' : ''}`} />
      <div className={`system-mode-overlay${galaxyMode === 'system' ? ' system-mode-overlay--active' : ''}`}>
        {activeNovaeStarUsername
          ? `[ @${activeNovaeStarUsername}'s system ]`
          : dimension === 'solar' ? '[ ORIGIN DIMENSION ]' : '[ DEVELOPER GALAXY ]'}
      </div>
    </main>
  )
}
