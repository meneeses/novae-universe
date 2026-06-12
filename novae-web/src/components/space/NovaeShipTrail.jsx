import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { AUTO_CRUISE_SPEED, MAX_SPEED } from '../../hooks/useNovaeShip'

const TRAIL_LENGTH = 80
const TRAIL_INTERVAL = 2

export function NovaeShipTrail({ novaeShipRef, speed }) {
  const geometryRef = useRef()
  const materialRef = useRef()
  const frame = useRef(0)
  const initialized = useRef(false)
  const worldPosition = useMemo(() => new THREE.Vector3(), [])
  const history = useMemo(() => Array.from({ length: TRAIL_LENGTH }, () => new THREE.Vector3()), [])
  const positions = useMemo(() => new Float32Array(TRAIL_LENGTH * 3), [])
  const colors = useMemo(() => {
    const array = new Float32Array(TRAIL_LENGTH * 3)
    for (let index = 0; index < TRAIL_LENGTH; index += 1) {
      const strength = 1 - index / (TRAIL_LENGTH - 1)
      array[index * 3] = 0.39 * strength
      array[index * 3 + 1] = 0.7 * strength
      array[index * 3 + 2] = strength
    }
    return array
  }, [])

  useFrame(() => {
    if (!novaeShipRef.current || !geometryRef.current || !materialRef.current) return
    frame.current += 1
    if (frame.current % TRAIL_INTERVAL === 0) {
      novaeShipRef.current.getWorldPosition(worldPosition)
      if (!initialized.current) {
        history.forEach((point) => point.copy(worldPosition))
        initialized.current = true
      } else {
        for (let index = TRAIL_LENGTH - 1; index > 0; index -= 1) history[index].copy(history[index - 1])
        history[0].copy(worldPosition)
      }
      history.forEach((point, index) => point.toArray(positions, index * 3))
      geometryRef.current.attributes.position.needsUpdate = true
    }

    const currentSpeed = speed?.current ?? speed ?? 0
    const speedFactor = THREE.MathUtils.clamp((currentSpeed - AUTO_CRUISE_SPEED) / (MAX_SPEED - AUTO_CRUISE_SPEED), 0, 1)
    materialRef.current.opacity = THREE.MathUtils.lerp(materialRef.current.opacity, speedFactor * 0.8, 0.08)
  })

  return (
    <line frustumCulled={false}>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute attach="attributes-position" array={positions} count={TRAIL_LENGTH} itemSize={3} />
        <bufferAttribute attach="attributes-color" array={colors} count={TRAIL_LENGTH} itemSize={3} />
      </bufferGeometry>
      <lineBasicMaterial ref={materialRef} vertexColors transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
    </line>
  )
}
