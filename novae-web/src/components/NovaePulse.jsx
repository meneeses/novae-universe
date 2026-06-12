import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'

const WAVE_COLORS = {
  commit: '#00f0ff',
  star: '#ffd700',
  fork: '#00ff88',
  new_repo: '#bb88ff'
}

function WaveRing({ wave, delay = 0, opacityMultiplier = 1 }) {
  const meshRef = useRef()
  const materialRef = useRef()

  useFrame(() => {
    if (!meshRef.current || !materialRef.current) return

    const delayedProgress = THREE.MathUtils.clamp(
      (wave.progress - delay) / (1 - delay),
      0,
      1
    )
    const radius = THREE.MathUtils.lerp(0.4, wave.maxRadius, delayedProgress)
    meshRef.current.scale.setScalar(radius)
    meshRef.current.visible = wave.progress >= delay
    materialRef.current.opacity = (1 - delayedProgress) * 0.8 * opacityMultiplier
  })

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.992, 1, 128]} />
      <meshBasicMaterial
        ref={materialRef}
        color={WAVE_COLORS[wave.type] ?? WAVE_COLORS.commit}
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.NormalBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

export function NovaePulse({ wave }) {
  return (
    <group position={wave.origin}>
      <WaveRing wave={wave} />
      <WaveRing wave={wave} delay={0.12} opacityMultiplier={0.55} />
    </group>
  )
}
