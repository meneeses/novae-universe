import { Canvas, useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { NovaeShip } from './space/NovaeShip'
import { Starfield } from './space/Starfield'

function LaunchSequence({ onComplete, flashRef, rootRef }) {
  const novaeShipRef = useRef()
  const completed = useRef(false)
  const thrust = useRef(true)
  const boost = useRef(true)
  const braking = useRef(false)
  const speed = useRef(1.8)

  useFrame(({ clock }) => {
    const elapsed = clock.elapsedTime
    const flightProgress = THREE.MathUtils.clamp((elapsed - 0.2) / 1.8, 0, 1)
    const eased = flightProgress ** 4

    if (novaeShipRef.current) {
      novaeShipRef.current.position.z = THREE.MathUtils.lerp(-800, 20, eased)
      novaeShipRef.current.scale.setScalar(THREE.MathUtils.lerp(0.05, 8, eased))
    }

    const flash = elapsed < 1.8 ? 0 : elapsed < 1.95
      ? (elapsed - 1.8) / 0.15
      : elapsed < 2.15 ? 1 - (elapsed - 1.95) / 0.2 : 0
    if (flashRef.current) flashRef.current.style.opacity = String(THREE.MathUtils.clamp(flash, 0, 1))
    if (rootRef.current) rootRef.current.style.opacity = String(elapsed < 2.2 ? 1 : Math.max(0, 1 - (elapsed - 2.2) / 0.8))

    if (elapsed >= 3.2 && !completed.current) {
      completed.current = true
      onComplete()
    }
  })

  return (
    <>
      <ambientLight intensity={1.8} color="#88aaff" />
      <Starfield />
      <NovaeShip
        novaeShipRef={novaeShipRef}
        speed={speed}
        isThrusting={thrust}
        isBoosting={boost}
        isBraking={braking}
      />
    </>
  )
}

export function NovaeLaunch({ onComplete }) {
  const flashRef = useRef()
  const rootRef = useRef()

  return (
    <div ref={rootRef} className="novae-launch-transition">
      <Canvas camera={{ position: [0, 0, 30], fov: 58, near: 0.1, far: 1500 }} scene={{ background: new THREE.Color('#050a1a') }}>
        <LaunchSequence onComplete={onComplete} flashRef={flashRef} rootRef={rootRef} />
      </Canvas>
      <div ref={flashRef} className="launch-flash" />
    </div>
  )
}
