import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { useUniverseStore } from '../store/universeStore'
import { SPAWN_POSITION } from '../utils/solarSystem'
import { useKeyboard } from './useKeyboard'

export const MIN_SPEED = 0.04
export const MAX_SPEED = 0.28
const THRUST_ACCEL = 0.003
const BRAKE_DECEL = 0.004
const SPEED_DAMPING = 0.995
const TURN_SPEED = 0.032
const CAMERA_LERP = 0.06
const CAMERA_DIST = 10
const CAMERA_HEIGHT = 3.5
const EMPTY_ZONE_RADIUS = 180

export function useRocket(rocketRef, cameraRef, onUpdate, controllerRef) {
  const keys = useKeyboard()
  const speed = useRef(MIN_SPEED)
  const yaw = useRef(0)
  const position = useRef(new THREE.Vector3(...SPAWN_POSITION))
  const isThrusting = useRef(false)
  const isBraking = useRef(false)
  const direction = useRef(new THREE.Vector3(0, 0, -1))
  const cameraTarget = useRef(new THREE.Vector3())
  const lookTarget = useRef(new THREE.Vector3())
  const updateTimer = useRef(0)
  const warningSuppressedUntil = useRef(0)

  function resetWarning() {
    useUniverseStore.getState().cancelEmptyZoneWarning()
  }

  if (controllerRef) {
    controllerRef.current = {
      teleport(destination) {
        position.current.fromArray(destination)
        speed.current = MIN_SPEED
        resetWarning()
        const camera = cameraRef?.current
        if (camera) {
          camera.position.set(
            position.current.x + Math.sin(yaw.current) * CAMERA_DIST,
            position.current.y + CAMERA_HEIGHT,
            position.current.z + Math.cos(yaw.current) * CAMERA_DIST
          )
        }
      },
      suppressEmptyZoneWarning(duration = 10000) {
        warningSuppressedUntil.current = performance.now() + duration
        resetWarning()
      }
    }
  }

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)

    if (keys.left) yaw.current += TURN_SPEED
    if (keys.right) yaw.current -= TURN_SPEED

    if (keys.up) {
      speed.current = Math.min(speed.current + THRUST_ACCEL, MAX_SPEED)
      isThrusting.current = true
    } else if (keys.down) {
      speed.current = Math.max(speed.current - BRAKE_DECEL, MIN_SPEED)
      isThrusting.current = false
    } else {
      speed.current = Math.max(speed.current * SPEED_DAMPING, MIN_SPEED)
      isThrusting.current = false
    }

    isBraking.current = keys.down && speed.current > MIN_SPEED
    direction.current.set(-Math.sin(yaw.current), 0, -Math.cos(yaw.current))
    position.current.addScaledVector(direction.current, speed.current * dt * 60)

    if (rocketRef.current) {
      rocketRef.current.position.copy(position.current)
      rocketRef.current.rotation.y = yaw.current
      const targetBank = keys.left ? 0.35 : keys.right ? -0.35 : 0
      rocketRef.current.rotation.z = THREE.MathUtils.lerp(
        rocketRef.current.rotation.z,
        targetBank,
        0.08
      )
      const targetPitch = keys.up ? -0.12 : keys.down ? 0.12 : 0
      rocketRef.current.rotation.x = THREE.MathUtils.lerp(
        rocketRef.current.rotation.x,
        targetPitch,
        0.06
      )
    }

    const camera = cameraRef?.current ?? state.camera
    cameraTarget.current.set(
      position.current.x + Math.sin(yaw.current) * CAMERA_DIST,
      position.current.y + CAMERA_HEIGHT,
      position.current.z + Math.cos(yaw.current) * CAMERA_DIST
    )
    camera.position.lerp(cameraTarget.current, CAMERA_LERP)
    lookTarget.current.copy(position.current).addScaledVector(direction.current, 4)
    camera.lookAt(lookTarget.current)

    const store = useUniverseStore.getState()
    const outsideEmptyZone = position.current.length() > EMPTY_ZONE_RADIUS
    if (
      outsideEmptyZone &&
      !store.emptyZoneWarning &&
      performance.now() >= warningSuppressedUntil.current
    ) {
      store.startEmptyZoneWarning()
    } else if (!outsideEmptyZone && store.emptyZoneWarning) {
      store.cancelEmptyZoneWarning()
    }

    updateTimer.current += dt
    if (updateTimer.current >= 0.08) {
      onUpdate?.({
        position: position.current,
        speed: speed.current,
        yaw: yaw.current,
        isThrusting: isThrusting.current,
        isBraking: isBraking.current,
        isTurning: keys.left || keys.right
      })
      updateTimer.current = 0
    }
  })

  return { position, speed, yaw, isThrusting, isBraking }
}
