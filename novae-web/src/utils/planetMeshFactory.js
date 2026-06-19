import * as THREE from 'three'
import {
  earthFragmentShader,
  planetVertexShader,
  ringVertexShader,
  saturnRingFragmentShader,
  solarPlanetFragments
} from '../shaders/solarPlanets.glsl.js'
import { NOVAE_WORLD_COLORS_BY_LANGUAGE } from './novaeWorldGenerator'

const SOLAR_NAMES = {
  mercury: 'Mercury',
  venus: 'Venus',
  earth: 'Earth',
  mars: 'Mars',
  jupiter: 'Jupiter',
  saturn: 'Saturn',
  uranus: 'Uranus',
  neptune: 'Neptune'
}

const DEV_VERTEX = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  void main() {
    vPosition = position;
    vNormal = normal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const DEV_ROCKY = `
  uniform vec3 uBase;
  uniform vec3 uDark;
  uniform float uTime;
  varying vec3 vPosition;
  varying vec3 vNormal;
  void main() {
    float terrain = sin(vPosition.x * 17.0 + uTime * 0.08) * sin(vPosition.y * 13.0) * sin(vPosition.z * 19.0);
    float light = 0.55 + max(dot(normalize(vNormal), normalize(vec3(0.7, 1.0, 0.4))), 0.0) * 0.45;
    gl_FragColor = vec4(mix(uDark, uBase, smoothstep(-0.25, 0.35, terrain)) * light, 1.0);
  }
`

const DEV_GASEOUS = `
  uniform vec3 uBase;
  uniform vec3 uDark;
  uniform float uTime;
  varying vec3 vPosition;
  varying vec3 vNormal;
  void main() {
    float bands = 0.5 + sin(vPosition.y * 42.0 + sin(vPosition.x * 8.0 + uTime * 0.15) * 0.8) * 0.5;
    float light = 0.5 + max(dot(normalize(vNormal), normalize(vec3(0.8, 1.0, 0.5))), 0.0) * 0.5;
    gl_FragColor = vec4(mix(uDark, uBase, bands) * light, 1.0);
  }
`

function shaderMaterial(fragmentShader, uniforms = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      ...uniforms
    },
    vertexShader: planetVertexShader,
    fragmentShader
  })
}

function createSurface(name, radius = 1, segments = 64) {
  const fragmentShader = name === 'Earth' ? earthFragmentShader : solarPlanetFragments[name]
  return new THREE.Mesh(
    new THREE.SphereGeometry(radius, segments, segments),
    fragmentShader
      ? shaderMaterial(fragmentShader, name === 'Earth' ? { uSeed: { value: 42 } } : {})
      : new THREE.MeshLambertMaterial({ color: '#6688aa' })
  )
}

function addAtmosphere(group, radius, color, opacity, scale = 1.08) {
  group.add(new THREE.Mesh(
    new THREE.SphereGeometry(radius * scale, 48, 48),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    })
  ))
}

function createSaturnRings(radius = 1) {
  return new THREE.Mesh(
    new THREE.RingGeometry(radius * 1.12, radius * 2.55, 256),
    new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: ringVertexShader,
      fragmentShader: saturnRingFragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  )
}

function createUranusRings(radius = 1) {
  return new THREE.Mesh(
    new THREE.RingGeometry(radius * 1.35, radius * 1.75, 128),
    new THREE.MeshBasicMaterial({
      color: '#667077',
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  )
}

export function createSolarPlanetMesh(type, options = {}) {
  const name = SOLAR_NAMES[String(type).toLowerCase()] ?? type ?? 'Earth'
  const radius = options.radius ?? 1
  const group = new THREE.Group()
  const surface = createSurface(name, radius, options.segments ?? 64)

  if (name === 'Uranus') surface.rotation.z = Math.PI * 0.54
  group.add(surface)

  if (name === 'Earth') {
    addAtmosphere(group, radius, '#66aaff', 0.2, 1.08)
  }
  if (name === 'Venus') addAtmosphere(group, radius, '#ff9944', 0.32, 1.12)
  if (name === 'Mars') addAtmosphere(group, radius, '#ff8866', 0.06, 1.06)

  if (name === 'Saturn') {
    const rings = createSaturnRings(radius)
    rings.rotation.set(Math.PI / 2, 0, 0.48)
    group.add(rings)
  }

  if (name === 'Uranus') {
    const rings = createUranusRings(radius)
    rings.rotation.set(0, Math.PI / 2, Math.PI * 0.54)
    group.add(rings)
  }

  return group
}

export function createDevPlanetMesh(props = {}) {
  const group = new THREE.Group()
  const colors = props.colors ?? props._colors ?? NOVAE_WORLD_COLORS_BY_LANGUAGE[props.primaryLanguage] ?? NOVAE_WORLD_COLORS_BY_LANGUAGE.default
  const type = props.worldType ?? props.type ?? 'rocky'
  const base = new THREE.Color(colors.base ?? colors[1] ?? '#66ccff')
  const dark = new THREE.Color(colors.emissive ?? colors[0] ?? '#101a44')
  const material = type === 'gaseous' || type === 'giant'
    ? new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uBase: { value: base }, uDark: { value: dark } },
      vertexShader: DEV_VERTEX,
      fragmentShader: DEV_GASEOUS
    })
    : new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uBase: { value: base }, uDark: { value: dark } },
      vertexShader: DEV_VERTEX,
      fragmentShader: DEV_ROCKY
    })

  group.add(new THREE.Mesh(new THREE.SphereGeometry(1, 64, 64), material))
  addAtmosphere(group, 1, base, props.atmosphereThickness ? props.atmosphereThickness * 0.25 : 0.12, 1.08)

  const ringCount = props.ringCount ?? props.rings ?? props._rings ?? 0
  for (let index = 0; index < ringCount; index += 1) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.4 + index * 0.28, 1.56 + index * 0.28, 96),
      new THREE.MeshBasicMaterial({
        color: base,
        transparent: true,
        opacity: Math.max(0.16, 0.5 - index * 0.1),
        depthWrite: false,
        side: THREE.DoubleSide
      })
    )
    ring.rotation.set(Math.PI / 2.55, 0, Math.PI / 6)
    group.add(ring)
  }

  return group
}

export function updatePlanetMeshTime(object, elapsedTime) {
  object.traverse((child) => {
    if (child.material?.uniforms?.uTime) child.material.uniforms.uTime.value = elapsedTime
  })
}
