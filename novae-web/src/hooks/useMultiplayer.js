import { useCallback, useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getSupabase } from '../db/supabase'

const CHANNEL_NAME = 'novae:presence'
const BROADCAST_RATE = 100
const TIMEOUT_REMOVE = 8000
const MAX_PLAYERS = 50
const MAX_UPDATES_PER_FRAME = 5
const IDLE_STOP_AFTER = 5000

function valueOf(input, fallback = 0) {
  return input?.current ?? input ?? fallback
}

function vectorOf(input) {
  return input?.current ?? input
}

function sanitizePayload(payload) {
  if (!payload?.uid || typeof payload.uid !== 'string') return null
  if (!Number.isFinite(payload.x) || !Number.isFinite(payload.y) || !Number.isFinite(payload.z)) return null
  if (Math.abs(payload.x) > 10000 || Math.abs(payload.y) > 10000 || Math.abs(payload.z) > 10000) return null

  return {
    uid: payload.uid.slice(0, 64),
    x: payload.x,
    y: payload.y,
    z: payload.z,
    yaw: Number.isFinite(payload.yaw) ? payload.yaw : 0,
    speed: Number.isFinite(payload.speed) ? Math.max(0, Math.min(payload.speed, 5)) : 0,
    isThrusting: Boolean(payload.isThrusting),
    isBoosting: Boolean(payload.isBoosting),
    area: typeof payload.area === 'string' ? payload.area.slice(0, 80) : 'unknown',
    timestamp: Number.isFinite(payload.timestamp) ? payload.timestamp : performance.now()
  }
}

export function useMultiplayer({
  localUsername,
  rocketPosition,
  rocketYaw,
  speed,
  isThrusting,
  isBoosting,
  area,
  isInvisible = false
}) {
  const channel = useRef(null)
  const players = useRef(new Map())
  const pendingUpdates = useRef([])
  const lastBroadcast = useRef(0)
  const lastPosition = useRef(new THREE.Vector3())
  const lastYaw = useRef(0)
  const idleSince = useRef(null)
  const activeArea = useRef(area)

  useEffect(() => {
    activeArea.current = area
  }, [area])

  useEffect(() => {
    let mounted = true

    async function connect() {
      if (!localUsername) return
      const supabase = await getSupabase()
      if (!mounted || !supabase) return

      const realtimeChannel = supabase.channel(CHANNEL_NAME, {
        config: { broadcast: { self: false } }
      })

      realtimeChannel.on('broadcast', { event: 'pos' }, ({ payload }) => {
        const cleanPayload = sanitizePayload(payload)
        if (!cleanPayload || cleanPayload.uid === localUsername) return
        pendingUpdates.current.push(cleanPayload)
        if (pendingUpdates.current.length > 100) pendingUpdates.current.splice(0, pendingUpdates.current.length - 100)
      })

      realtimeChannel.on('broadcast', { event: 'leave' }, ({ payload }) => {
        if (payload?.uid && payload.uid !== localUsername) players.current.delete(payload.uid)
      })

      realtimeChannel.subscribe()
      channel.current = realtimeChannel
    }

    connect()

    return () => {
      mounted = false
      const currentChannel = channel.current
      channel.current = null
      if (!currentChannel) return
      currentChannel.send({
        type: 'broadcast',
        event: 'leave',
        payload: { uid: localUsername }
      })
      getSupabase().then((supabase) => supabase?.removeChannel(currentChannel))
    }
  }, [localUsername])

  useFrame(() => {
    const now = performance.now()
    let processed = 0

    while (pendingUpdates.current.length > 0 && processed < MAX_UPDATES_PER_FRAME) {
      const payload = pendingUpdates.current.shift()
      const existing = players.current.get(payload.uid)
      const position = new THREE.Vector3(payload.x, payload.y, payload.z)

      players.current.set(payload.uid, {
        ...payload,
        receivedAt: now,
        prevPosition: existing?.position ?? position.clone(),
        prevYaw: existing?.yaw ?? payload.yaw,
        prevTime: existing?.receivedAt ?? now - 150,
        position
      })
      processed += 1
    }

    players.current.forEach((player, uid) => {
      if (now - player.receivedAt > TIMEOUT_REMOVE) players.current.delete(uid)
    })
  })

  useFrame(() => {
    const currentChannel = channel.current
    const position = vectorOf(rocketPosition)
    if (!currentChannel || !localUsername || isInvisible || !position) return

    const now = performance.now()
    if (now - lastBroadcast.current < BROADCAST_RATE) return

    const yaw = valueOf(rocketYaw)
    const currentSpeed = valueOf(speed)
    const posDiff = position.distanceTo(lastPosition.current)
    const yawDiff = Math.abs(yaw - lastYaw.current)
    const moved = posDiff > 0.08 || yawDiff > 0.04

    if (!moved) {
      if (idleSince.current == null) idleSince.current = now
      if (currentSpeed <= 0.001 && now - idleSince.current > IDLE_STOP_AFTER) return
      if (posDiff < 0.08 && yawDiff < 0.04) return
    } else {
      idleSince.current = null
    }

    lastPosition.current.copy(position)
    lastYaw.current = yaw
    lastBroadcast.current = now

    currentChannel.send({
      type: 'broadcast',
      event: 'pos',
      payload: {
        uid: localUsername,
        x: +position.x.toFixed(2),
        y: +position.y.toFixed(2),
        z: +position.z.toFixed(2),
        yaw: +yaw.toFixed(3),
        speed: +currentSpeed.toFixed(3),
        isThrusting: Boolean(valueOf(isThrusting)),
        isBoosting: Boolean(valueOf(isBoosting)),
        area: activeArea.current,
        timestamp: now
      }
    })
  })

  const getPlayers = useCallback(() => {
    return Array.from(players.current.values())
      .filter((player) => player.area === activeArea.current)
      .slice(0, MAX_PLAYERS)
  }, [])

  const getAllPlayers = useCallback(() => {
    return Array.from(players.current.values()).slice(0, MAX_PLAYERS)
  }, [])

  return { getPlayers, getAllPlayers }
}
