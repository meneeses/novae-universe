import { useFrame, useThree } from '@react-three/fiber'
import { useMemo } from 'react'
import * as THREE from 'three'

export const NOVAE_INTRO_DURATION = 18

const easings = {
  linear: (t) => t,
  easeIn: (t) => t * t,
  easeOut: (t) => t * (2 - t),
  easeInOut: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeOutCubic: (t) => {
    const shifted = t - 1
    return shifted * shifted * shifted + 1
  }
}

const cameraKeyframes = [
  { time: 0, position: [0, 0, 0], lookAt: [0, 0, -40], easing: 'linear' },
  { time: 3, position: [0, 0, 0], lookAt: [0, 0, -40], easing: 'easeInOut' },
  { time: 6, position: [3, 2, -12], lookAt: [0, 0, -42], easing: 'easeInOut' },
  { time: 10, position: [18, 5, -35], lookAt: [0, 0, -58], easing: 'easeOutCubic' },
  { time: 13, position: [0, 80, -20], lookAt: [0, 0, -45], easing: 'easeOut' },
  { time: 16, position: [0, 80, -20], lookAt: [0, 0, -45], easing: 'linear' },
  { time: 18, position: [0, 80, -20], lookAt: [0, 0, -45], easing: 'linear' }
]

export function NovaeIntroCamera({ timelineRef }) {
  const camera = useThree((state) => state.camera)
  const keyframes = useMemo(() => cameraKeyframes.map((keyframe) => ({
    ...keyframe,
    positionVector: new THREE.Vector3(...keyframe.position),
    lookAtVector: new THREE.Vector3(...keyframe.lookAt)
  })), [])
  const targetPosition = useMemo(() => new THREE.Vector3(), [])
  const targetLookAt = useMemo(() => new THREE.Vector3(), [])

  useFrame((_, delta) => {
    timelineRef.current = Math.min(NOVAE_INTRO_DURATION, timelineRef.current + delta)
    const elapsed = timelineRef.current
    let index = keyframes.length - 2

    for (let cursor = 0; cursor < keyframes.length - 1; cursor += 1) {
      if (elapsed <= keyframes[cursor + 1].time) {
        index = cursor
        break
      }
    }

    const from = keyframes[index]
    const to = keyframes[index + 1]
    const duration = Math.max(0.001, to.time - from.time)
    const progress = THREE.MathUtils.clamp((elapsed - from.time) / duration, 0, 1)
    const eased = easings[to.easing]?.(progress) ?? progress

    targetPosition.lerpVectors(from.positionVector, to.positionVector, eased)
    targetLookAt.lerpVectors(from.lookAtVector, to.lookAtVector, eased)
    camera.position.copy(targetPosition)
    camera.lookAt(targetLookAt)
  }, -10)

  return null
}
