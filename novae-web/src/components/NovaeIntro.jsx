import { Canvas } from '@react-three/fiber'
import { useCallback, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { NOVAE_INTRO_DURATION } from './NovaeIntroCamera'
import { NovaeIntroScene } from './NovaeIntroScene'
import { NovaeIntroTexts } from './NovaeIntroTexts'

const SKIP_FADE_DURATION = 0.6
const FINAL_FADE_START = 16

export function NovaeIntro({ onComplete }) {
  const surfaceRef = useRef()
  const blackoutRef = useRef()
  const vignetteRef = useRef()
  const skipButtonRef = useRef()
  const timelineRef = useRef(0)
  const exitProgressRef = useRef(0)
  const skipStartedAtRef = useRef(null)
  const completedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  const requestSkip = useCallback(() => {
    if (skipStartedAtRef.current == null && !completedRef.current) {
      skipStartedAtRef.current = performance.now()
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') requestSkip()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [requestSkip])

  useEffect(() => {
    let frameId

    const complete = () => {
      if (completedRef.current) return
      completedRef.current = true
      localStorage.setItem('novae_intro_seen', 'true')
      onCompleteRef.current()
    }

    const update = (now) => {
      const elapsed = timelineRef.current
      const naturalExit = THREE.MathUtils.clamp(
        (elapsed - FINAL_FADE_START) / (NOVAE_INTRO_DURATION - FINAL_FADE_START),
        0,
        1
      )
      const skipExit = skipStartedAtRef.current == null
        ? 0
        : THREE.MathUtils.clamp((now - skipStartedAtRef.current) / (SKIP_FADE_DURATION * 1000), 0, 1)
      const exitProgress = Math.max(naturalExit, skipExit)
      const initialBlackout = 1 - THREE.MathUtils.clamp(elapsed / 2, 0, 1)

      exitProgressRef.current = exitProgress
      if (surfaceRef.current) surfaceRef.current.style.opacity = String(1 - exitProgress)
      if (blackoutRef.current) blackoutRef.current.style.opacity = String(Math.max(initialBlackout, exitProgress))
      if (vignetteRef.current) vignetteRef.current.style.opacity = String(0.48 + exitProgress * 0.52)
      if (skipButtonRef.current) skipButtonRef.current.style.opacity = String(1 - exitProgress)

      if (elapsed >= NOVAE_INTRO_DURATION || skipExit >= 1) {
        complete()
        return
      }

      frameId = window.requestAnimationFrame(update)
    }

    frameId = window.requestAnimationFrame(update)
    return () => window.cancelAnimationFrame(frameId)
  }, [])

  return (
    <main className="novae-intro">
      <div ref={surfaceRef} className="novae-intro__surface">
        <Canvas
          camera={{ position: [0, 0, 0], fov: 58, near: 0.1, far: 1600 }}
          scene={{ background: new THREE.Color('#02050e') }}
          gl={{
            antialias: true,
            toneMapping: THREE.NoToneMapping,
            outputColorSpace: THREE.SRGBColorSpace
          }}
        >
          <NovaeIntroScene timelineRef={timelineRef} />
        </Canvas>
      </div>

      <NovaeIntroTexts timelineRef={timelineRef} exitProgressRef={exitProgressRef} />
      <div ref={vignetteRef} className="novae-intro__vignette" />
      <div ref={blackoutRef} className="novae-intro__blackout" />
      <button ref={skipButtonRef} className="novae-intro__skip" type="button" onClick={requestSkip}>
        ESC · SKIP
      </button>
    </main>
  )
}
