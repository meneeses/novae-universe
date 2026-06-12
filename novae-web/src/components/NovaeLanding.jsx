import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { NovaeLandingUI } from './NovaeLandingUI'
import { NovaeLandingUniverse } from './NovaeLandingUniverse'

export function NovaeLanding({ login, explore, error, isLoading, onLaunch }) {
  return (
    <main className="landing3d">
      <Canvas
        className="landing3d-canvas"
        camera={{ position: [0, 3, 34], fov: 55, near: 0.1, far: 1000 }}
        scene={{ background: new THREE.Color('#050a1a') }}
        gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}
      >
        <NovaeLandingUniverse />
      </Canvas>
      <div className="landing3d-vignette" />
      <NovaeLandingUI login={login} explore={explore} error={error} isLoading={isLoading} onLaunch={onLaunch} />
    </main>
  )
}
