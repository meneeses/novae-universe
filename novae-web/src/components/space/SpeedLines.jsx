import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { MAX_SPEED } from '../../hooks/useNovaeShip'

const LINE_COUNT = 80

export function SpeedLines({ speed }) {
  const camera = useThree((state) => state.camera)
  const data = useMemo(() => Array.from({ length: LINE_COUNT }, () => ({
    x: (Math.random() - 0.5) * 12,
    y: (Math.random() - 0.5) * 8,
    length: 0.5 + Math.random() * 1.2
  })), [])
  const positions = useMemo(() => new Float32Array(LINE_COUNT * 6), [])
  const geometry = useMemo(() => new THREE.BufferGeometry(), [])
  const material = useMemo(() => new THREE.LineBasicMaterial({
    color: '#aaccff',
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false
  }), [])
  const lines = useMemo(() => {
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const object = new THREE.LineSegments(geometry, material)
    object.position.z = -6
    object.frustumCulled = false
    return object
  }, [geometry, material, positions])

  useEffect(() => {
    camera.add(lines)
    return () => {
      camera.remove(lines)
      geometry.dispose()
      material.dispose()
    }
  }, [camera, geometry, lines, material])

  useFrame(() => {
    const currentSpeed = speed?.current ?? speed ?? 0
    const intensity = THREE.MathUtils.clamp((currentSpeed - MAX_SPEED * 0.7) / (MAX_SPEED * 0.8), 0, 1)
    material.opacity = THREE.MathUtils.lerp(material.opacity, intensity * 0.55, 0.05)
    data.forEach((line, index) => {
      const offset = index * 6
      const radial = 1 + intensity * line.length
      positions[offset] = line.x * 0.35
      positions[offset + 1] = line.y * 0.35
      positions[offset + 2] = 0
      positions[offset + 3] = line.x * radial
      positions[offset + 4] = line.y * radial
      positions[offset + 5] = -intensity * 1.5
    })
    geometry.attributes.position.needsUpdate = true
  })

  return null
}
