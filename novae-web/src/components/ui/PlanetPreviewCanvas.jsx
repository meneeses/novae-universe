import { Canvas, useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import {
  earthFragmentShader,
  planetVertexShader,
  saturnRingFragmentShader,
  solarPlanetFragments
} from '../../shaders/solarPlanets.glsl.js'

const DEV_VERTEX_SHADER = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  void main() {
    vPosition = normalize(position);
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const DEV_FRAGMENT_SHADER = `
  uniform float uTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  varying vec3 vPosition;
  varying vec3 vNormal;
  void main() {
    float bands = sin(vPosition.y * 18.0 + sin(vPosition.x * 9.0 + uTime * 0.2)) * 0.5 + 0.5;
    float terrain = sin(vPosition.x * 15.0) * sin(vPosition.y * 11.0 + uTime * 0.08) * sin(vPosition.z * 17.0);
    vec3 color = mix(uColor1, uColor2, smoothstep(-0.25, 0.4, terrain));
    color = mix(color, uColor3, bands * 0.28);
    float light = 0.18 + max(dot(normalize(vNormal), normalize(vec3(0.9, 0.35, 0.55))), 0.0) * 0.82;
    gl_FragColor = vec4(color * light, 1.0);
  }
`

const RING_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

function normalizeType(type) {
  return String(type ?? 'earth').toLowerCase()
}

function capitalizedPlanetName(type) {
  const normalized = normalizeType(type)
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

function colorFromProps(props, index, fallback) {
  if (Array.isArray(props?.colors)) return props.colors[index] ?? fallback
  if (index === 0) return props?.colors?.emissive ?? fallback
  if (index === 1) return props?.colors?.base ?? fallback
  return props?.colors?.accent ?? fallback
}

function buildPlanetMaterial(type, props) {
  const normalized = normalizeType(type)
  const solarName = capitalizedPlanetName(type)
  const fragmentShader = normalized === 'earth'
    ? earthFragmentShader
    : solarPlanetFragments[solarName]

  if (fragmentShader) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSeed: { value: 42 }
      },
      vertexShader: planetVertexShader,
      fragmentShader
    })
  }

  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color(colorFromProps(props, 0, '#112244')) },
      uColor2: { value: new THREE.Color(colorFromProps(props, 1, '#4488cc')) },
      uColor3: { value: new THREE.Color(colorFromProps(props, 2, '#88ccff')) }
    },
    vertexShader: DEV_VERTEX_SHADER,
    fragmentShader: DEV_FRAGMENT_SHADER
  })
}

function getAtmosphereColor(type, props) {
  const map = {
    earth: '#4488ff',
    mars: '#cc6644',
    venus: '#ffaa44',
    uranus: '#88ccdd',
    neptune: '#4466ff',
    saturn: '#ccaa66',
    jupiter: '#cc8844',
    mercury: '#888888'
  }
  return map[normalizeType(type)] || colorFromProps(props, 1, '#4488ff')
}

function getPlanetGlowColor(type, props) {
  const map = {
    earth: '#4488ff',
    mars: '#cc4422',
    venus: '#ffaa22',
    jupiter: '#cc8833',
    saturn: '#ddbb44',
    uranus: '#44cccc',
    neptune: '#3355ee',
    mercury: '#888877'
  }
  return map[normalizeType(type)] || colorFromProps(props, 1, '#4488ff')
}

function shouldShowRings(type, props) {
  const normalized = normalizeType(type)
  return normalized === 'saturn' || normalized === 'uranus' || (props?.ringCount ?? props?.rings ?? props?._rings ?? 0) > 0
}

function getRingColor(type, props) {
  const normalized = normalizeType(type)
  if (normalized === 'saturn') return '#d8bd67'
  if (normalized === 'uranus') return '#667077'
  return colorFromProps(props, 1, '#66ccff')
}

function createCloudNoiseTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  const image = ctx.createImageData(128, 128)

  for (let y = 0; y < 128; y += 1) {
    for (let x = 0; x < 128; x += 1) {
      const index = (y * 128 + x) * 4
      const wave = Math.sin(x * 0.12) * Math.sin(y * 0.09) + Math.sin((x + y) * 0.06)
      const alpha = wave > 0.48 ? 185 : wave > 0.08 ? 75 : 0
      image.data[index] = 255
      image.data[index + 1] = 255
      image.data[index + 2] = 255
      image.data[index + 3] = alpha
    }
  }

  ctx.putImageData(image, 0, 0)
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}

function PreviewRings({ size, planetType, planetProps }) {
  const normalized = normalizeType(planetType)
  const saturnMaterial = useMemo(() => normalized === 'saturn'
    ? new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: RING_VERTEX_SHADER,
      fragmentShader: saturnRingFragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false
    })
    : null, [normalized])

  useFrame(({ clock }) => {
    if (saturnMaterial?.uniforms?.uTime) saturnMaterial.uniforms.uTime.value = clock.elapsedTime
  })

  useEffect(() => () => saturnMaterial?.dispose(), [saturnMaterial])

  const ringConfigs = normalized === 'saturn'
    ? [{ inner: size * 1.3, outer: size * 3.2, opacity: 1 }]
    : Array.from({ length: Math.max(1, planetProps?.ringCount ?? planetProps?.rings ?? planetProps?._rings ?? 1) }, (_, index) => ({
      inner: size * (1.35 + index * 0.22),
      outer: size * (1.52 + index * 0.22),
      opacity: Math.max(0.18, 0.45 - index * 0.08)
    }))

  return (
    <group rotation={[normalized === 'uranus' ? Math.PI / 2 : Math.PI / 2.3, 0, 0.3]}>
      {ringConfigs.map((ring, index) => (
        <mesh key={index}>
          <ringGeometry args={[ring.inner, ring.outer, 128]} />
          {saturnMaterial ? (
            <primitive object={saturnMaterial} attach="material" />
          ) : (
            <meshBasicMaterial
              color={getRingColor(planetType, planetProps)}
              transparent
              opacity={ring.opacity}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          )}
        </mesh>
      ))}
    </group>
  )
}

function RotatingPlanet({ planetType, planetProps }) {
  const normalized = normalizeType(planetType)
  const meshRef = useRef()
  const cloudRef = useRef()
  const material = useMemo(() => buildPlanetMaterial(normalized, planetProps), [normalized, planetProps])
  const cloudTexture = useMemo(() => normalized === 'earth' ? createCloudNoiseTexture() : null, [normalized])
  const size = normalized === 'jupiter' ? 1.08 : 1

  useFrame(({ clock }) => {
    const time = clock.elapsedTime
    if (meshRef.current) meshRef.current.rotation.y = time * 0.18
    if (cloudRef.current) cloudRef.current.rotation.y = time * 0.12
    if (material.uniforms?.uTime) material.uniforms.uTime.value = time
  })

  useEffect(() => () => {
    material.dispose()
    cloudTexture?.dispose()
  }, [cloudTexture, material])

  return (
    <group rotation={normalized === 'uranus' ? [0, 0, Math.PI * 0.54] : [0, 0, 0]}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[size, 64, 64]} />
        <primitive object={material} attach="material" />
      </mesh>

      {planetProps?.hasAtmosphere !== false && normalized !== 'mercury' && (
        <mesh>
          <sphereGeometry args={[size * 1.07, 32, 32]} />
          <meshBasicMaterial
            color={getAtmosphereColor(normalized, planetProps)}
            transparent
            opacity={normalized === 'venus' ? 0.2 : 0.14}
            depthWrite={false}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {normalized === 'earth' && cloudTexture && (
        <mesh ref={cloudRef}>
          <sphereGeometry args={[size * 1.014, 32, 32]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.28}
            depthWrite={false}
            alphaMap={cloudTexture}
          />
        </mesh>
      )}

      {shouldShowRings(normalized, planetProps) && (
        <PreviewRings size={size} planetType={normalized} planetProps={planetProps} />
      )}
    </group>
  )
}

export function PlanetPreviewCanvas({ planetType, planetProps, accent }) {
  const normalized = normalizeType(planetType)
  const hasRings = shouldShowRings(normalized, planetProps)
  const glowColor = accent ?? getPlanetGlowColor(normalized, planetProps)
  const cameraPosition = hasRings ? [0, 1.4, 4.2] : [0, 0.2, 3.2]

  return (
    <div className="planet-preview-canvas" style={{ '--planet-preview-accent': glowColor }}>
      <Canvas
        gl={{
          alpha: true,
          antialias: true,
          preserveDrawingBuffer: false,
          powerPreference: 'default'
        }}
        camera={{
          position: cameraPosition,
          fov: 38,
          near: 0.1,
          far: 100
        }}
        style={{ background: 'transparent', width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.25} color="#223355" />
        <pointLight position={[4, 2, 4]} intensity={2.8} color="#fff8ee" />
        <pointLight position={[-3, -1, -2]} intensity={0.35} color="#334466" />
        <RotatingPlanet planetType={normalized} planetProps={planetProps} />
      </Canvas>
      <div className="planet-preview-canvas__glow" />
    </div>
  )
}
