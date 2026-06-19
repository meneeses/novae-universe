import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useMultiplayer } from '../../hooks/useMultiplayer'
import { colorForPlayer, GhostRocket } from './GhostRocket'

function EncounterFlash({ encounter }) {
  const groupRef = useRef()
  const particles = useMemo(() => Array.from({ length: 6 }, (_, index) => ({
    direction: new THREE.Vector3(
      Math.cos(index * 1.7),
      (index % 2 ? 1 : -1) * 0.35,
      Math.sin(index * 1.7)
    ).normalize(),
    speed: 0.4 + index * 0.08
  })), [])

  useFrame(() => {
    if (!groupRef.current) return
    const age = (performance.now() - encounter.startedAt) / 1000
    const fade = Math.max(0, 1 - age / 0.32)
    groupRef.current.children.forEach((child, index) => {
      if (child.isPointLight) {
        child.intensity = fade * 3
      } else {
        child.position.copy(particles[index - 1]?.direction ?? new THREE.Vector3()).multiplyScalar(age * (particles[index - 1]?.speed ?? 0))
        child.material.opacity = fade * 0.7
      }
    })
  })

  return (
    <group ref={groupRef} position={encounter.position}>
      <pointLight color="#ffffff" intensity={3} distance={8} />
      {particles.map((particle, index) => (
        <mesh key={index}>
          <sphereGeometry args={[0.035, 6, 6]} />
          <meshBasicMaterial color="#ccffee" transparent opacity={0.7} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
    </group>
  )
}

function getDistance(localPosition, player) {
  const local = localPosition?.current ?? localPosition
  if (!local) return Infinity
  return local.distanceTo(player.position)
}

function describePlayers(players, localPosition) {
  return players
    .map((player) => ({
      uid: player.uid,
      color: colorForPlayer(player.uid).getStyle(),
      distance: getDistance(localPosition, player),
      area: player.area
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 6)
}

export function MultiplayerPresence({
  localUsername,
  localPosition,
  localYaw,
  speed,
  isThrusting,
  isBoosting,
  area,
  isInvisible,
  onPresenceUpdate,
  onPassBy
}) {
  const { getPlayers, getAllPlayers } = useMultiplayer({
    localUsername,
    rocketPosition: localPosition,
    rocketYaw: localYaw,
    speed,
    isThrusting,
    isBoosting,
    area,
    isInvisible
  })
  const [visiblePlayers, setVisiblePlayers] = useState([])
  const [leavingPlayers, setLeavingPlayers] = useState(() => new Set())
  const [encounters, setEncounters] = useState([])
  const visibleRef = useRef([])
  const leavingRef = useRef(new Set())
  const updateTimer = useRef(0)
  const cleanupTimer = useRef(0)
  const encounterCooldown = useRef(new Map())

  useFrame((_, delta) => {
    updateTimer.current += delta
    cleanupTimer.current += delta
    const players = getPlayers()
    const currentIds = new Set(players.map((player) => player.uid))

    players.forEach((player) => {
      if (leavingRef.current.delete(player.uid)) setLeavingPlayers(new Set(leavingRef.current))
    })

    visibleRef.current.forEach((player) => {
      if (currentIds.has(player.uid) || leavingRef.current.has(player.uid)) return
      leavingRef.current.add(player.uid)
      setLeavingPlayers(new Set(leavingRef.current))
      window.setTimeout(() => {
        leavingRef.current.delete(player.uid)
        setLeavingPlayers(new Set(leavingRef.current))
        visibleRef.current = visibleRef.current.filter((visiblePlayer) => visiblePlayer.uid !== player.uid)
        setVisiblePlayers(visibleRef.current)
      }, 1200)
    })

    visibleRef.current = [
      ...players,
      ...visibleRef.current.filter((player) => leavingRef.current.has(player.uid))
    ]

    const local = localPosition?.current ?? localPosition
    if (local) {
      players.forEach((player) => {
        const distance = local.distanceTo(player.position)
        const lastEncounter = encounterCooldown.current.get(player.uid) ?? 0
        if (distance < 5 && performance.now() - lastEncounter > 3500) {
          encounterCooldown.current.set(player.uid, performance.now())
          const position = player.position.clone().add(local).multiplyScalar(0.5)
          setEncounters((current) => [...current.slice(-4), { id: `${player.uid}-${performance.now()}`, position, startedAt: performance.now() }])
          onPassBy?.(player, distance)
        }
      })
    }

    if (updateTimer.current >= 0.25) {
      setVisiblePlayers(visibleRef.current)
      const allPlayers = getAllPlayers()
      onPresenceUpdate?.({
        playerCount: players.length,
        nearbyPlayers: describePlayers(players, localPosition),
        remotePlayers: allPlayers.map((player) => ({
          uid: player.uid,
          area: player.area,
          color: colorForPlayer(player.uid).getStyle(),
          distance: getDistance(localPosition, player)
        }))
      })
      updateTimer.current = 0
    }

    if (cleanupTimer.current >= 0.2) {
      setEncounters((current) => current.filter((encounter) => performance.now() - encounter.startedAt < 420))
      cleanupTimer.current = 0
    }
  })

  return (
    <>
      {visiblePlayers.map((player) => (
        <GhostRocket
          key={player.uid}
          player={player}
          localPosition={localPosition}
          isLeaving={leavingPlayers.has(player.uid)}
          onPassBy={onPassBy}
        />
      ))}
      {encounters.map((encounter) => <EncounterFlash key={encounter.id} encounter={encounter} />)}
    </>
  )
}
