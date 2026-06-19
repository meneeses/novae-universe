import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { useNovaeStore } from '../store/novaeStore'
import { SPAWN_POSITION } from '../utils/solarSystem'
import { useNovaeControls } from './useNovaeControls'

export const CRUISE_SPEED = 0.18
export const NORMAL_SPEED = CRUISE_SPEED
export const BOOST_SPEED = 0.55
export const MAX_SPEED = BOOST_SPEED
export const BOOST_MAX_SPEED = BOOST_SPEED
const TURN_SPEED = 0.032
const VERTICAL_SPEED = 0.25
const MAX_PITCH = 0.38
const PITCH_LERP = 6
const CAMERA_LERP = 0.06
const CAMERA_OFFSET = new THREE.Vector3(0, 4, 12)
const EMPTY_ZONE_RADIUS = 180
const FORWARD = new THREE.Vector3(0, 0, -1)

export function useNovaeShip(novaeShipRef, cameraRef, onUpdate, controllerRef) {
  const keys = useNovaeControls()
  const position = useRef(new THREE.Vector3(...SPAWN_POSITION))
  const velocity = useRef(new THREE.Vector3(0, 0, -CRUISE_SPEED))
  const yaw = useRef(0)
  const pitch = useRef(0)
  const roll = useRef(0)
  const verticalInput = useRef(0)
  const forward = useRef(FORWARD.clone())
  const movementEuler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'))
  const visualEuler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'))
  const movementQuaternion = useRef(new THREE.Quaternion())
  const visualQuaternion = useRef(new THREE.Quaternion())
  const cameraTarget = useRef(new THREE.Vector3())
  const cameraOffset = useRef(CAMERA_OFFSET.clone())
  const cameraPitchOffset = useRef(0)
  const cameraShake = useRef(new THREE.Vector3())
  const updateTimer = useRef(0)
  const warningSuppressedUntil = useRef(0)
  const isThrusting = useRef(false)
  const isBoosting = useRef(false)
  const isEngineOff = useRef(false)
  const isEngineEnabled = useRef(true)
  const speed = useRef(CRUISE_SPEED)

  function resetWarning() {
    useNovaeStore.getState().cancelEmptyZoneWarning()
  }

  if (controllerRef) {
    controllerRef.current = {
      teleport(destination) {
        position.current.fromArray(destination)
        isEngineEnabled.current = true
        velocity.current.copy(forward.current).multiplyScalar(CRUISE_SPEED)
        speed.current = CRUISE_SPEED
        resetWarning()
        const camera = cameraRef?.current
        if (camera) {
          cameraOffset.current.copy(CAMERA_OFFSET).applyQuaternion(movementQuaternion.current)
          camera.position.copy(position.current).add(cameraOffset.current)
        }
      },
      stop() {
        velocity.current.set(0, 0, 0)
        speed.current = 0
        isEngineEnabled.current = false
      },
      suppressEmptyZoneWarning(duration = 10000) {
        warningSuppressedUntil.current = performance.now() + duration
        resetWarning()
      }
    }
  }

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const frameScale = dt * 60

    if (keys.left) yaw.current += TURN_SPEED * frameScale
    if (keys.right) yaw.current -= TURN_SPEED * frameScale

    const targetRoll = keys.left ? 0.35 : keys.right ? -0.35 : 0
    roll.current = THREE.MathUtils.lerp(roll.current, targetRoll, 0.08 * frameScale)
    verticalInput.current = keys.engineEnabled ? (keys.up ? 1 : keys.down ? -1 : 0) : 0
    const targetPitch = verticalInput.current > 0 ? MAX_PITCH : verticalInput.current < 0 ? -MAX_PITCH : 0
    pitch.current += (targetPitch - pitch.current) * PITCH_LERP * dt

    movementEuler.current.set(0, yaw.current, 0)
    movementQuaternion.current.setFromEuler(movementEuler.current)
    forward.current.copy(FORWARD).applyQuaternion(movementQuaternion.current).normalize()

    isEngineEnabled.current = keys.engineEnabled
    isEngineOff.current = !keys.engineEnabled
    isBoosting.current = keys.boost && keys.engineEnabled
    isThrusting.current = keys.engineEnabled

    if (!keys.engineEnabled) {
      velocity.current.set(0, 0, 0)
      speed.current = 0
    } else {
      speed.current = keys.boost ? BOOST_SPEED : NORMAL_SPEED
      velocity.current.copy(forward.current).multiplyScalar(speed.current)
      if (keys.up) position.current.y += VERTICAL_SPEED * frameScale
      if (keys.down) position.current.y -= VERTICAL_SPEED * frameScale
    }

    position.current.addScaledVector(velocity.current, frameScale)

    if (novaeShipRef.current) {
      novaeShipRef.current.position.copy(position.current)
      visualEuler.current.set(pitch.current, yaw.current, roll.current)
      visualQuaternion.current.setFromEuler(visualEuler.current)
      novaeShipRef.current.quaternion.slerp(
        visualQuaternion.current,
        Math.min(1, 0.12 * frameScale)
      )
    }

    const camera = cameraRef?.current ?? state.camera
    cameraOffset.current.set(
      Math.sin(yaw.current) * 10,
      3.5 + pitch.current * 2,
      Math.cos(yaw.current) * 10
    )
    cameraPitchOffset.current = THREE.MathUtils.lerp(cameraPitchOffset.current, pitch.current, Math.min(1, PITCH_LERP * dt))
    cameraTarget.current.copy(position.current).add(cameraOffset.current)
    camera.position.lerp(cameraTarget.current, Math.min(1, CAMERA_LERP * frameScale))
    const shakeAmount = isBoosting.current ? 0.015 : isThrusting.current ? 0.006 : 0
    cameraShake.current.set(
      (Math.random() - 0.5) * shakeAmount,
      (Math.random() - 0.5) * shakeAmount,
      0
    )
    camera.position.add(cameraShake.current)
    const lookAhead = position.current.clone().addScaledVector(forward.current, 5)
    lookAhead.y += cameraPitchOffset.current * -3
    camera.lookAt(lookAhead)

    const store = useNovaeStore.getState()
    const targetFov = isBoosting.current ? 65 : 55
    camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, Math.min(1, 0.05 * frameScale))
    camera.updateProjectionMatrix()
    const outsideEmptyZone =
      store.galaxyMode === 'galaxy' && position.current.length() > EMPTY_ZONE_RADIUS
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
        velocity: velocity.current,
        speed: speed.current,
        yaw: yaw.current,
        isThrusting: isThrusting.current,
        isBoosting: isBoosting.current,
        isEngineOff: isEngineOff.current,
        engineEnabled: isEngineEnabled.current,
        verticalInput: verticalInput.current,
        fireSequence: keys.fireSequence
      })
      updateTimer.current = 0
    }
  })

  return { position, velocity, forward, yaw, pitch, speed, isThrusting, isBoosting, isEngineOff, isEngineEnabled, verticalInput, fireSequence: keys.fireSequence }
}
