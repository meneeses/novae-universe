import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

const vertexShader = `
  varying vec3 vPosition;
  void main() {
    vPosition = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform float uSeed;
  varying vec3 vPosition;

  float hash(vec3 p) {
    return fract(sin(dot(p, vec3(17.1, 31.7, 47.3)) + uSeed) * 43758.5453);
  }
  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
      f.z
    );
  }
  float fbm(vec3 p) {
    return noise(p) * 0.65 + noise(p * 2.0) * 0.25 + noise(p * 4.0) * 0.1;
  }
  void main() {
    float land = step(0.52, fbm(vPosition * 2.5));
    vec3 ocean = vec3(0.15, 0.40, 0.80);
    vec3 green = vec3(0.20, 0.55, 0.20);
    gl_FragColor = vec4(mix(ocean, green, land), 1.0);
  }
`

export function Earth({ data }) {
  const earthRef = useRef()
  const moonRef = useRef()
  const uniforms = useMemo(() => ({ uSeed: { value: 42 } }), [])
  const moonOrbitRadius = data.radius * 1.7
  const moonRadius = data.radius * 0.28

  useFrame(({ clock }, delta) => {
    earthRef.current.rotation.y += data.rotationSpeed * delta * 60
    const angle = clock.elapsedTime * 1.2
    moonRef.current.position.set(
      Math.cos(angle) * moonOrbitRadius,
      data.radius * 0.2,
      Math.sin(angle) * moonOrbitRadius
    )
  })

  return (
    <group>
      <mesh ref={earthRef}>
        <sphereGeometry args={[data.radius, 32, 32]} />
        <shaderMaterial uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} />
      </mesh>
      <mesh scale={1.08}>
        <sphereGeometry args={[data.radius, 32, 32]} />
        <meshLambertMaterial
          color="#66aaff"
          emissive="#224466"
          emissiveIntensity={0.25}
          transparent
          opacity={0.18}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>
      <mesh ref={moonRef}>
        <sphereGeometry args={[moonRadius, 20, 20]} />
        <meshLambertMaterial color="#b8b8b8" emissive="#333344" emissiveIntensity={0.2} />
      </mesh>
    </group>
  )
}
