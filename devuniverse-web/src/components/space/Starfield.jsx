import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

const STAR_COLORS = ['#ffffff', '#ffffff', '#ffffff', '#dce8ff', '#fff0c2']

function createStars(count, radiusMin, radiusMax, sizeMin, sizeMax) {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const phases = new Float32Array(count)

  for (let index = 0; index < count; index += 1) {
    const direction = new THREE.Vector3(
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1
    ).normalize().multiplyScalar(radiusMin + Math.random() * (radiusMax - radiusMin))
    const color = new THREE.Color(STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)])
    positions.set(direction.toArray(), index * 3)
    colors.set(color.toArray(), index * 3)
    sizes[index] = sizeMin + Math.random() * (sizeMax - sizeMin)
    phases[index] = Math.random() * Math.PI * 2
  }

  return { positions, colors, sizes, phases }
}

function createMilkyWay(count) {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const color = new THREE.Color('#aabbdd')

  for (let index = 0; index < count; index += 1) {
    const centerBias = Math.pow(Math.random(), 2)
    const x = (Math.random() * 2 - 1) * 330
    const y = (Math.random() * 2 - 1) * (10 + centerBias * 34)
    const z = (Math.random() * 2 - 1) * 110
    const point = new THREE.Vector3(x, y, z)
    point.applyAxisAngle(new THREE.Vector3(0, 0, 1), -0.32)
    positions.set(point.toArray(), index * 3)
    colors.set(color.toArray(), index * 3)
  }

  return { positions, colors }
}

const starVertexShader = `
  uniform float uTime;
  uniform float uTwinkle;
  attribute float aSize;
  attribute float aPhase;
  varying vec3 vColor;
  void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float pulse = 1.0 + sin(uTime * 1.8 + aPhase) * 0.3 * uTwinkle;
    gl_PointSize = aSize * pulse * (190.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const starFragmentShader = `
  varying vec3 vColor;
  void main() {
    float alpha = 1.0 - smoothstep(0.1, 0.5, length(gl_PointCoord - 0.5));
    gl_FragColor = vec4(vColor, alpha);
  }
`

function StarLayer({ count, radiusMin, radiusMax, sizeMin, sizeMax, opacity, twinkle = false }) {
  const materialRef = useRef()
  const layer = useMemo(
    () => createStars(count, radiusMin, radiusMax, sizeMin, sizeMax),
    [count, radiusMax, radiusMin, sizeMax, sizeMin]
  )

  useFrame(({ clock }) => {
    materialRef.current.uniforms.uTime.value = clock.elapsedTime
  })

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={layer.positions} count={count} itemSize={3} />
        <bufferAttribute attach="attributes-color" array={layer.colors} count={count} itemSize={3} />
        <bufferAttribute attach="attributes-aSize" array={layer.sizes} count={count} itemSize={1} />
        <bufferAttribute attach="attributes-aPhase" array={layer.phases} count={count} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        uniforms={{ uTime: { value: 0 }, uTwinkle: { value: twinkle ? 1 : 0 } }}
        vertexShader={starVertexShader}
        fragmentShader={starFragmentShader}
        vertexColors
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

function MilkyWay() {
  const count = 800
  const layer = useMemo(() => createMilkyWay(count), [])

  return (
    <points rotation={[0.12, 0.2, 0]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={layer.positions} count={count} itemSize={3} />
        <bufferAttribute attach="attributes-color" array={layer.colors} count={count} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.32}
        vertexColors
        transparent
        opacity={0.4}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  )
}

export function Starfield() {
  const groupRef = useRef()

  useFrame(() => {
    groupRef.current.rotation.y += 0.00003
  })

  return (
    <group ref={groupRef}>
      <StarLayer count={3000} sizeMin={0.1} sizeMax={0.14} radiusMin={130} radiusMax={430} opacity={0.8} />
      <StarLayer count={200} sizeMin={0.22} sizeMax={0.3} radiusMin={90} radiusMax={300} opacity={1} twinkle />
      <MilkyWay />
    </group>
  )
}
