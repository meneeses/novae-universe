import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { useNovaeStore } from '../store/novaeStore'
import { SPAWN_POSITION } from '../utils/solarSystem'
import { useNovaeControls } from './useNovaeControls'

export const AUTO_CRUISE_SPEED = 0.025
export const MAX_SPEED = 0.7
export const BOOST_MAX_SPEED = 1.8
const THRUST = 0.012
const REVERSE_THRUST = 0.006
const TURN_SPEED = 0.035
const PITCH_SPEED = 0.025
const VERTICAL_SPEED = 0.012
const BOOST_MULTIPLIER = 3.5
const DAMPING = 0.985
const CAMERA_LERP = 0.06
const CAMERA_OFFSET = new THREE.Vector3(0, 4, 12)
const EMPTY_ZONE_RADIUS = 180
const FORWARD = new THREE.Vector3(0, 0, -1)
const UP = new THREE.Vector3(0, 1, 0)
const MAX_PITCH = Math.PI * 0.32

export function useNovaeShip(novaeShipRef, cameraRef, onUpdate, controllerRef) {
  const keys = useNovaeControls()
  const position = useRef(new THREE.Vector3(...SPAWN_POSITION))
  const velocity = useRef(new THREE.Vector3(0, 0, -AUTO_CRUISE_SPEED))
  const yaw = useRef(0)
  const pitch = useRef(0)
  const roll = useRef(0)
  const forward = useRef(FORWARD.clone())
  const movementEuler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'))
  const visualEuler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'))
  const movementQuaternion = useRef(new THREE.Quaternion())
  const visualQuaternion = useRef(new THREE.Quaternion())
  const cruiseVelocity = useRef(new THREE.Vector3())
  const cameraTarget = useRef(new THREE.Vector3())
  const cameraOffset = useRef(CAMERA_OFFSET.clone())
  const cameraShake = useRef(new THREE.Vector3())
  const updateTimer = useRef(0)
  const warningSuppressedUntil = useRef(0)
  const cruiseRecovery = useRef(1)
  const brakeLatched = useRef(false)
  const wasBrakePressed = useRef(false)
  const isThrusting = useRef(false)
  const isBoosting = useRef(false)
  const isBraking = useRef(false)
  const speed = useRef(AUTO_CRUISE_SPEED)

  function resetWarning() {
    useNovaeStore.getState().cancelEmptyZoneWarning()
  }

  if (controllerRef) {
    controllerRef.current = {
      teleport(destination) {
        position.current.fromArray(destination)
        brakeLatched.current = false
        velocity.current.copy(forward.current).multiplyScalar(AUTO_CRUISE_SPEED)
        resetWarning()
        const camera = cameraRef?.current
        if (camera) {
          cameraOffset.current.copy(CAMERA_OFFSET).applyQuaternion(movementQuaternion.current)
          camera.position.copy(position.current).add(cameraOffset.current)
        }
      },
      stop() {
        velocity.current.set(0, 0, 0)
        cruiseRecovery.current = 0
        brakeLatched.current = true
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
    const boostFactor = keys.boost ? BOOST_MULTIPLIER : 1
    const maxSpeed = keys.boost ? BOOST_MAX_SPEED : MAX_SPEED
    const hasThrustInput = keys.forward || keys.backward || keys.up || keys.down
    const brakePressed = keys.brake && !wasBrakePressed.current

    if (brakePressed) {
      brakeLatched.current = !brakeLatched.current
      cruiseRecovery.current = 0
      if (brakeLatched.current) velocity.current.set(0, 0, 0)
    } else if (keys.forward && brakeLatched.current) {
      brakeLatched.current = false
    }
    wasBrakePressed.current = keys.brake

    if (keys.left) yaw.current += TURN_SPEED * frameScale
    if (keys.right) yaw.current -= TURN_SPEED * frameScale
    if (keys.up) pitch.current += PITCH_SPEED * frameScale
    if (keys.down) pitch.current -= PITCH_SPEED * frameScale
    pitch.current = THREE.MathUtils.clamp(pitch.current, -MAX_PITCH, MAX_PITCH)

    const targetRoll = keys.left ? 0.35 : keys.right ? -0.35 : 0
    roll.current = THREE.MathUtils.lerp(roll.current, targetRoll, 0.08 * frameScale)

    movementEuler.current.set(pitch.current, yaw.current, 0)
    movementQuaternion.current.setFromEuler(movementEuler.current)
    forward.current.copy(FORWARD).applyQuaternion(movementQuaternion.current).normalize()

    isBraking.current = brakeLatched.current
    isBoosting.current = keys.boost && !brakeLatched.current
    isThrusting.current = hasThrustInput && !brakeLatched.current

    if (brakeLatched.current) {
      velocity.current.set(0, 0, 0)
      cruiseRecovery.current = 0
    } else {
      if (keys.forward) {
        velocity.current.addScaledVector(forward.current, THRUST * boostFactor * frameScale)
      }
      if (keys.backward) {
        velocity.current.addScaledVector(forward.current, -REVERSE_THRUST * frameScale)
      }
      if (keys.up) velocity.current.addScaledVector(UP, VERTICAL_SPEED * frameScale)
      if (keys.down) velocity.current.addScaledVector(UP, -VERTICAL_SPEED * frameScale)

      velocity.current.multiplyScalar(Math.pow(DAMPING, frameScale))

      if (!hasThrustInput) {
        cruiseRecovery.current = Math.min(1, cruiseRecovery.current + dt * 0.45)
        cruiseVelocity.current.copy(forward.current).multiplyScalar(
          AUTO_CRUISE_SPEED * cruiseRecovery.current
        )
        velocity.current.lerp(cruiseVelocity.current, Math.min(1, 0.025 * frameScale))
      } else {
        cruiseRecovery.current = 1
      }
    }

    if (velocity.current.length() > maxSpeed) velocity.current.setLength(maxSpeed)
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
    cameraOffset.current.copy(CAMERA_OFFSET).applyQuaternion(movementQuaternion.current)
    cameraTarget.current.copy(position.current).add(cameraOffset.current)
    camera.position.lerp(cameraTarget.current, Math.min(1, CAMERA_LERP * frameScale))
    const shakeAmount = isBoosting.current ? 0.025 : isThrusting.current ? 0.015 : 0
    cameraShake.current.set(
      (Math.random() - 0.5) * shakeAmount,
      (Math.random() - 0.5) * shakeAmount,
      0
    )
    camera.position.add(cameraShake.current)
    camera.lookAt(position.current)

    const store = useNovaeStore.getState()
    speed.current = velocity.current.length()
    const targetFov = 55 + THREE.MathUtils.clamp(speed.current / MAX_SPEED, 0, 1) * 8
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
        isBraking: isBraking.current
      })
      updateTimer.current = 0
    }
  })

  return { position, velocity, speed, isThrusting, isBoosting, isBraking }
}
