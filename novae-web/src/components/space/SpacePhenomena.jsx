import { Line } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

function seededRandom(seed) {
  return Math.abs(Math.sin(seed * 12.9898) * 43758.5453) % 1
}

function hexToRgb(hex) {
  const value = hex.replace('#', '')
  const number = parseInt(value, 16)
  return `${(number >> 16) & 255}, ${(number >> 8) & 255}, ${number & 255}`
}

function createGlowTexture(color = '#ffffff', alpha = 1) {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const context = canvas.getContext('2d')
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64)
  gradient.addColorStop(0, `${color}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`)
  gradient.addColorStop(0.35, `${color}66`)
  gradient.addColorStop(1, `${color}00`)
  context.fillStyle = gradient
  context.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(canvas)
}

function generateGalaxyTexture(type, color, seed) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')

  if (type === 'spiral') {
    const core = ctx.createRadialGradient(128, 128, 0, 128, 128, 34)
    core.addColorStop(0, `${color}ff`)
    core.addColorStop(1, `${color}00`)
    ctx.fillStyle = core
    ctx.fillRect(0, 0, 256, 256)
    for (let arm = 0; arm < 2; arm += 1) {
      for (let t = 0; t < 430; t += 1) {
        const angle = t * 0.08 + arm * Math.PI
        const r = t * 0.25
        const x = 128 + Math.cos(angle) * r + (seededRandom(seed + t + arm) - 0.5) * 8
        const y = 128 + Math.sin(angle) * r * 0.6 + (seededRandom(seed + t + arm + 1) - 0.5) * 8
        const alpha = Math.max(0, 1 - r / 110) * 0.62
        ctx.fillStyle = `rgba(${hexToRgb(color)}, ${alpha})`
        ctx.fillRect(x, y, t < 50 ? 2 : 1, t < 50 ? 2 : 1)
      }
    }
  } else if (type === 'elliptical') {
    const grad = ctx.createRadialGradient(128, 96, 0, 128, 96, 112)
    grad.addColorStop(0, `${color}cc`)
    grad.addColorStop(0.4, `${color}66`)
    grad.addColorStop(1, `${color}00`)
    ctx.save()
    ctx.translate(128, 128)
    ctx.scale(1, 0.55)
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(0, 0, 110, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  } else {
    for (let i = 0; i < 240; i += 1) {
      const x = 128 + (seededRandom(seed + i) - 0.5) * 130
      const y = 128 + (seededRandom(seed + i * 2) - 0.5) * 75
      const size = 1 + seededRandom(seed + i * 3) * 3
      const alpha = 0.08 + seededRandom(seed + i * 4) * 0.45
      ctx.fillStyle = `rgba(${hexToRgb(color)}, ${alpha})`
      ctx.fillRect(x, y, size, size)
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function GalaxySprite({ position, type, size, rotation, color, seed }) {
  const texture = useMemo(() => generateGalaxyTexture(type, color, seed), [color, seed, type])

  return (
    <sprite position={position} scale={[size, size, 1]} rotation={[0, 0, rotation]}>
      <spriteMaterial map={texture} transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} />
    </sprite>
  )
}

const blackHoleVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const blackHoleNoise = `
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fbm(vec2 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.55;
    for (int i = 0; i < 5; i++) {
      if (i >= octaves) break;
      value += noise(p) * amplitude;
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }
`

const accretionFragmentShader = `
  uniform float uTime;
  varying vec2 vUv;
  ${blackHoleNoise}
  void main() {
    float r = vUv.x;
    vec3 diskColor = mix(vec3(1.0, 0.95, 0.8), vec3(1.0, 0.5, 0.1), smoothstep(0.0, 0.3, r));
    diskColor = mix(diskColor, vec3(0.6, 0.1, 0.02), smoothstep(0.3, 0.7, r));
    diskColor = mix(diskColor, vec3(0.2, 0.0, 0.0), smoothstep(0.7, 1.0, r));
    float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
    float spots = fbm(vec2(angle * 3.0 + uTime * 0.35, r * 5.0 + uTime * 0.2), 3) * 0.3;
    diskColor *= 0.8 + spots;
    float alpha = smoothstep(0.0, 0.08, r) * smoothstep(1.0, 0.85, r) * 0.85;
    gl_FragColor = vec4(diskColor, alpha);
  }
`

const lensingFragmentShader = `
  varying vec2 vUv;
  void main() {
    float dist = length(vUv - 0.5) * 2.0;
    float photonRing = smoothstep(0.85, 0.88, dist) * smoothstep(0.96, 0.93, dist);
    vec3 ringColor = vec3(0.9, 0.85, 0.7) * photonRing * 2.0;
    float shadow = 1.0 - smoothstep(0.0, 0.85, dist);
    gl_FragColor = vec4(ringColor, photonRing * 0.9 + shadow * 0.1);
  }
`

function BlackHole({ position, scale = 1, novaeShipPosition, onAlert }) {
  const groupRef = useRef()
  const diskRef = useRef()
  const haloRef = useRef()
  const texture = useMemo(() => createGlowTexture('#ff5522', 0.6), [])
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), [])

  useFrame(({ clock }, delta) => {
    uniforms.uTime.value = clock.elapsedTime
    diskRef.current.rotation.z += delta * 0.18
    haloRef.current.scale.setScalar(scale * (12 + Math.sin(clock.elapsedTime * 1.5) * 0.3))
    if (novaeShipPosition?.current) {
      const distance = groupRef.current.position.distanceTo(novaeShipPosition.current)
      if (distance < 30) onAlert?.('GRAVITATIONAL ANOMALY DETECTED')
    }
  })

  return (
    <group ref={groupRef} position={position} scale={scale}>
      <sprite ref={haloRef}>
        <spriteMaterial map={texture} color="#ff5522" transparent opacity={0.06} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <mesh ref={diskRef} rotation={[THREE.MathUtils.degToRad(20), 0, 0]}>
        <ringGeometry args={[2, 5.5, 128]} />
        <shaderMaterial uniforms={uniforms} vertexShader={blackHoleVertexShader} fragmentShader={accretionFragmentShader} transparent side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh scale={2.2}>
        <sphereGeometry args={[1, 48, 48]} />
        <shaderMaterial vertexShader={blackHoleVertexShader} fragmentShader={lensingFragmentShader} transparent depthWrite={false} side={THREE.BackSide} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.5, 48, 48]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
    </group>
  )
}

function AsteroidStream() {
  const groupRef = useRef()
  const asteroids = useMemo(() => Array.from({ length: 5 }, (_, index) => ({
    position: new THREE.Vector3(-80 + index * 42, -8 + seededRandom(index) * 26, 70 - index * 36),
    velocity: new THREE.Vector3(0.1 + seededRandom(index + 10) * 0.06, 0.02, -0.08).normalize().multiplyScalar(0.08 + seededRandom(index + 4) * 0.07),
    size: 0.3 + seededRandom(index + 7) * 0.5
  })), [])
  const meteors = useMemo(() => Array.from({ length: 15 }, (_, index) => ({
    active: index < 5,
    position: new THREE.Vector3(-70 + index * 11, 24 - index * 2, -60 + index * 8),
    velocity: new THREE.Vector3(0.65, -0.25, 0.45).multiplyScalar(0.7 + seededRandom(index) * 0.5),
    size: 0.05 + seededRandom(index + 3) * 0.07
  })), [])

  useFrame((_, delta) => {
    groupRef.current.children.slice(0, 5).forEach((child, index) => {
      const asteroid = asteroids[index]
      child.position.addScaledVector(asteroid.velocity, delta * 60)
      child.rotation.x += 0.02 * delta * 60
      child.rotation.z += 0.01 * delta * 60
      if (child.position.length() > 150) child.position.copy(asteroid.position).multiplyScalar(-1)
    })
    groupRef.current.children.slice(5).forEach((child, index) => {
      const meteor = meteors[index]
      child.position.addScaledVector(meteor.velocity, delta * 60)
      if (child.position.length() > 160) child.position.set(-85 + seededRandom(index + performance.now()) * 30, 45, -85 + seededRandom(index + 2) * 80)
    })
  })

  return (
    <group ref={groupRef}>
      {asteroids.map((asteroid, index) => (
        <mesh key={`asteroid-${index}`} position={asteroid.position} scale={[asteroid.size * 1.3, asteroid.size * 0.85, asteroid.size]}>
          <icosahedronGeometry args={[1, 2]} />
          <meshLambertMaterial color="#887766" emissive="#221100" emissiveIntensity={0.1} flatShading />
        </mesh>
      ))}
      {meteors.map((meteor, index) => (
        <group key={`meteor-${index}`} position={meteor.position}>
          <mesh>
            <sphereGeometry args={[meteor.size, 8, 8]} />
            <meshBasicMaterial color="#fff4dd" />
          </mesh>
          <Line
            points={[[0, 0, 0], [-meteor.velocity.x * 4, -meteor.velocity.y * 4, -meteor.velocity.z * 4]]}
            color={index % 2 ? '#ff9944' : '#ffffff'}
            transparent
            opacity={0.55}
            lineWidth={1.2}
          />
        </group>
      ))}
    </group>
  )
}

function CometObject() {
  const groupRef = useRef()
  const comaTexture = useMemo(() => createGlowTexture('#ccddff', 0.85), [])

  useFrame(({ clock }) => {
    const t = (clock.elapsedTime % 90) / 90 * Math.PI * 2
    const x = Math.cos(t) * 90 - 25
    const z = Math.sin(t) * 34
    const y = Math.sin(t * 0.7) * 9
    groupRef.current.position.set(x, y, z)
    const awayFromSun = groupRef.current.position.clone().normalize()
    groupRef.current.lookAt(groupRef.current.position.clone().add(awayFromSun))
  })

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshBasicMaterial color="#aabbcc" />
      </mesh>
      <sprite scale={[1.4, 1.4, 1]}>
        <spriteMaterial map={comaTexture} color="#eaf4ff" transparent opacity={0.32} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      {Array.from({ length: 7 }, (_, index) => (
        <Line
          key={index}
          points={[[0, 0, 0], [-(4 + index * 0.55), (index - 3) * 0.07, 0]]}
          color={index < 3 ? '#ffffff' : '#88bbff'}
          transparent
          opacity={0.22 - index * 0.018}
          lineWidth={1.6}
        />
      ))}
    </group>
  )
}

function createNebulaTexture(colorA, colorB, seed) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
  gradient.addColorStop(0, `${colorA}88`)
  gradient.addColorStop(0.5, `${colorB}33`)
  gradient.addColorStop(1, `${colorB}00`)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 500; i += 1) {
    const x = seededRandom(seed + i) * 256
    const y = seededRandom(seed + i * 2) * 256
    const alpha = seededRandom(seed + i * 3) * 0.08
    ctx.fillStyle = `rgba(255,255,255,${alpha})`
    ctx.fillRect(x, y, 1, 1)
  }
  return new THREE.CanvasTexture(canvas)
}

function Nebula({ position, colorA, colorB, size, opacity, seed }) {
  const ref = useRef()
  const texture = useMemo(() => createNebulaTexture(colorA, colorB, seed), [colorA, colorB, seed])

  useFrame((_, delta) => {
    ref.current.rotation.z += delta * 0.003
  })

  return (
    <sprite ref={ref} position={position} scale={[size, size, 1]}>
      <spriteMaterial map={texture} transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} />
    </sprite>
  )
}

function CosmicDust() {
  const count = 10000
  const positions = useMemo(() => {
    const result = new Float32Array(count * 3)
    for (let i = 0; i < count; i += 1) {
      result[i * 3] = (seededRandom(i) - 0.5) * 900
      result[i * 3 + 1] = (seededRandom(i + 10000) - 0.5) * 260
      result[i * 3 + 2] = (seededRandom(i + 20000) - 0.5) * 900
    }
    return result
  }, [])
  const ref = useRef()

  useFrame((_, delta) => {
    ref.current.rotation.y += delta * 0.0008
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={count} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#aa8866" size={0.02} transparent opacity={0.2} depthWrite={false} />
    </points>
  )
}

function Pulsar({ position, novaeShipPosition, onAlert }) {
  const groupRef = useRef()

  useFrame(({ clock }, delta) => {
    groupRef.current.rotation.y += delta * 7
    groupRef.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 125) * 0.16)
    if (novaeShipPosition?.current) {
      const distance = groupRef.current.position.distanceTo(novaeShipPosition.current)
      if (distance < 20) onAlert?.('PULSAR DETECTED')
    }
  })

  return (
    <group ref={groupRef} position={position}>
      <mesh>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color="#aaddff" />
      </mesh>
      <Line points={[[-7, 0, 0], [7, 0, 0]]} color="#aaddff" transparent opacity={0.55} lineWidth={2} />
      <Line points={[[0, -7, 0], [0, 7, 0]]} color="#ffffff" transparent opacity={0.35} lineWidth={1.4} />
      <pointLight color="#aaddff" intensity={1.8} distance={28} />
    </group>
  )
}

const GALAXIES = [
  { position: [-380, 60, -520], type: 'spiral', size: 25, rotation: 0.4, color: '#aabbff' },
  { position: [450, -40, -480], type: 'spiral', size: 18, rotation: -0.7, color: '#ffeecc' },
  { position: [-180, 120, -600], type: 'elliptical', size: 12, rotation: 0.1, color: '#ddddff' },
  { position: [320, 80, -550], type: 'spiral', size: 22, rotation: 1.1, color: '#ffccee' },
  { position: [-500, -30, -400], type: 'irregular', size: 8, rotation: -0.2, color: '#ccddff' },
  { position: [180, -90, -580], type: 'elliptical', size: 15, rotation: 0.8, color: '#ffeedd' }
]

export function SpacePhenomena({ dimension, novaeShipPosition, onAlert }) {
  return (
    <group>
      {GALAXIES.map((galaxy, index) => <GalaxySprite key={index} {...galaxy} seed={index + 1} />)}
      <CosmicDust />
      {dimension === 'solar' && (
        <>
          <AsteroidStream />
          <CometObject />
        </>
      )}
      {dimension === 'developers' && (
        <>
          <Nebula position={[-90, 12, -80]} colorA="#ff4466" colorB="#cc2244" size={72} opacity={0.055} seed={1} />
          <Nebula position={[115, -18, 58]} colorA="#4488ff" colorB="#2244cc" size={64} opacity={0.045} seed={2} />
          <Nebula position={[30, 38, -120]} colorA="#44ff88" colorB="#116644" size={52} opacity={0.04} seed={3} />
          <BlackHole position={[96, -8, -72]} scale={1.2} novaeShipPosition={novaeShipPosition} onAlert={onAlert} />
          <BlackHole position={[-135, 10, 105]} scale={0.85} novaeShipPosition={novaeShipPosition} onAlert={onAlert} />
          <Pulsar position={[72, 18, 128]} novaeShipPosition={novaeShipPosition} onAlert={onAlert} />
          <Pulsar position={[-170, -12, -95]} novaeShipPosition={novaeShipPosition} onAlert={onAlert} />
        </>
      )}
    </group>
  )
}
