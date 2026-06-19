import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

function createGlowTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const context = canvas.getContext('2d')
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.28, 'rgba(255,255,255,0.9)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(canvas)
}

export function NovaeShipGlow({ position, isThrusting, isBoosting, isEngineOff, index, isMain = false }) {
  const coreRef = useRef()
  const haloRef = useRef()
  const texture = useMemo(createGlowTexture, [])
  const coreScaleTarget = useMemo(() => new THREE.Vector3(), [])
  const haloScaleTarget = useMemo(() => new THREE.Vector3(), [])
  const coreColorTarget = useMemo(() => new THREE.Color(), [])
  const haloColorTarget = useMemo(() => new THREE.Color(), [])

  useFrame(({ clock }) => {
    if (!coreRef.current || !haloRef.current) return
    const thrusting = isThrusting.current ?? isThrusting
    const boosting = isBoosting.current ?? isBoosting
    const engineOff = isEngineOff.current ?? isEngineOff
    const flicker = 1 + Math.sin(clock.elapsedTime * 18 + index * 1.3) * 0.12 +
      Math.sin(clock.elapsedTime * 31 + index * 2.1) * 0.06
    const power = engineOff ? 0 : boosting ? 1.4 : thrusting ? 1 : 0.6
    const coreScale = (isMain ? 0.35 : 0.22) * power * flicker
    const haloScale = (isMain ? 0.7 : 0.45) * power * flicker

    coreRef.current.scale.lerp(coreScaleTarget.setScalar(coreScale), 0.18)
    haloRef.current.scale.lerp(haloScaleTarget.setScalar(haloScale), 0.15)
    coreRef.current.material.opacity = THREE.MathUtils.lerp(coreRef.current.material.opacity, engineOff ? 0 : thrusting ? 0.95 : 0.4, 0.15)
    haloRef.current.material.opacity = THREE.MathUtils.lerp(haloRef.current.material.opacity, engineOff ? 0 : boosting ? 0.45 : thrusting ? 0.6 : 0.24, 0.15)
    coreRef.current.material.color.lerp(coreColorTarget.set(boosting ? '#cc88ff' : thrusting ? '#ffffff' : '#3355aa'), 0.12)
    haloRef.current.material.color.lerp(haloColorTarget.set(boosting ? '#8844cc' : thrusting ? '#ff6600' : '#2244aa'), 0.12)
  })

  return (
    <>
      <sprite ref={haloRef} position={position}>
        <spriteMaterial map={texture} color="#2244aa" transparent opacity={0.25} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <sprite ref={coreRef} position={position}>
        <spriteMaterial map={texture} color="#3355aa" transparent opacity={0.4} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </>
  )
}
