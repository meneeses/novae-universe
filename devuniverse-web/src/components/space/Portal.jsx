import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { PortalParticles } from './PortalParticles'

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  #define PI 3.14159265359
  uniform float uTime;
  uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    vec2 center=vUv-0.5;float dist=length(center);float angle=atan(center.y,center.x);
    float spiral=fract(angle/(PI*2.0)+dist*3.0-uTime*0.8);
    float ring=smoothstep(0.0,0.3,spiral)*smoothstep(0.6,0.3,spiral);
    float falloff=1.0-smoothstep(0.3,0.5,dist);float core=smoothstep(0.15,0.0,dist);
    float alpha=(ring*0.6+core*0.8)*falloff*0.7;vec3 color=mix(uColor,vec3(1.0),core*0.5);
    gl_FragColor=vec4(color,alpha);
  }
`

const ringFragmentShader = `
  uniform float uTime; uniform vec3 uColor;
  void main(){float pulse=sin(uTime*3.0)*0.2+0.2;gl_FragColor=vec4(mix(uColor,vec3(1.0),pulse),1.0);}
`

export function Portal({ config, rocketPosition, onTeleport }) {
  const ringRef = useRef()
  const innerRingRef = useRef()
  const materialRef = useRef()
  const ringMaterialRef = useRef()
  const innerRingMaterialRef = useRef()
  const frame = useRef(0)
  const cooldown = useRef(false)
  const portalPosition = useMemo(() => new THREE.Vector3(...config.position), [config.position])
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(config.color) }
  }), [config.color])

  useFrame((_, delta) => {
    ringRef.current.rotation.y += 0.005 * delta * 60
    ringRef.current.rotation.z += 0.005 * delta * 60
    innerRingRef.current.rotation.y -= 0.007 * delta * 60
    innerRingRef.current.rotation.z -= 0.007 * delta * 60
    materialRef.current.uniforms.uTime.value += delta
    ringMaterialRef.current.uniforms.uTime.value += delta
    innerRingMaterialRef.current.uniforms.uTime.value += delta

    frame.current += 1
    if (frame.current % 5 !== 0 || cooldown.current) return
    const distance = rocketPosition.current.distanceTo(portalPosition)
    if (distance < 2.5) {
      cooldown.current = true
      onTeleport(config)
      window.setTimeout(() => {
        cooldown.current = false
      }, 2500)
    }
  })

  return (
    <group position={config.position}>
      <mesh ref={ringRef}>
        <torusGeometry args={[1.2, 0.06, 16, 64]} />
        <shaderMaterial
          ref={ringMaterialRef}
          uniforms={{ uTime: { value: 0 }, uColor: { value: new THREE.Color(config.color) } }}
          vertexShader={vertexShader}
          fragmentShader={ringFragmentShader}
        />
      </mesh>
      <mesh ref={innerRingRef}>
        <torusGeometry args={[0.85, 0.03, 16, 64]} />
        <shaderMaterial
          ref={innerRingMaterialRef}
          uniforms={{ uTime: { value: 0 }, uColor: { value: new THREE.Color(config.color) } }}
          vertexShader={vertexShader}
          fragmentShader={ringFragmentShader}
          transparent
          opacity={0.8}
        />
      </mesh>
      <mesh>
        <circleGeometry args={[1.18, 64]} />
        <shaderMaterial
          ref={materialRef}
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <PortalParticles color={config.color} />
      <pointLight color={config.color} intensity={1.5} distance={20} decay={2} />
      <Html position={[0, 2, 0]} center>
        <span className="portal-label" style={{ color: config.color }}>{config.label}</span>
      </Html>
    </group>
  )
}
