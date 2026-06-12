import { useFrame } from '@react-three/fiber'
import { useCallback, useRef, useState } from 'react'

const WAVE_DURATION = 2.5

export function useNovaePulse() {
  const nextId = useRef(0)
  const [waves, setWaves] = useState([])

  const emitWave = useCallback(({ type = 'commit', origin = [0, 0, 0], maxRadius = 120 }) => {
    const id = `${Date.now()}-${nextId.current++}`
    setWaves((current) => [
      ...current,
      {
        id,
        type,
        origin: [...origin],
        maxRadius,
        progress: 0
      }
    ])
    return id
  }, [])

  useFrame((_, delta) => {
    setWaves((current) => {
      if (current.length === 0) return current

      const next = current
        .map((wave) => ({
          ...wave,
          progress: wave.progress + delta / WAVE_DURATION
        }))
        .filter((wave) => wave.progress < 1)

      return next
    })
  })

  return { waves, emitWave }
}
