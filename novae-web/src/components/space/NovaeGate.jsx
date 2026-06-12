import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { NovaeGateParticles } from './NovaeGateParticles'

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
  uniform float uTransit;
  uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    vec2 center=vUv-0.5;float dist=length(center);float angle=atan(center.y,center.x);
    float spiral=fract(angle/(PI*2.0)+dist*3.0-uTime*0.8);
    float ring=smoothstep(0.0,0.3,spiral)*smoothstep(0.6,0.3,spiral);
    float falloff=1.0-smoothstep(0.3,0.5,dist);float core=smoothstep(0.15,0.0,dist);
    float alpha=(ring*0.6+core*(0.8+uTransit*1.5))*falloff*(0.7+uTransit*0.3);vec3 color=mix(uColor,vec3(1.0),core*(0.5+uTransit*0.5));
    gl_FragColor=vec4(color,alpha);
  }
`

const ringFragmentShader = `
  uniform float uTime; uniform vec3 uColor;
  void main(){float pulse=sin(uTime*3.0)*0.2+0.2;gl_FragColor=vec4(mix(uColor,vec3(1.0),pulse),1.0);}
`

export function NovaeGate({ config, novaeShipPosition, onTeleport, onSelectObject }) {
  const groupRef = useRef()
  const apertureRef = useRef()
  const lightRef = useRef()
  const ringRef = useRef()
  const innerRingRef = useRef()
  const materialRef = useRef()
  const ringMaterialRef = useRef()
  const innerRingMaterialRef = useRef()
  const frame = useRef(0)
  const cooldown = useRef(false)
  const transit = useRef(0)
  const transitStartedAt = useRef(0)
  const transitTriggered = useRef(false)
  const completionScheduled = useRef(false)
  const targetScale = useMemo(() => new THREE.Vector3(...config.scale), [config.scale])
  const novaeGatePosition = useMemo(() => new THREE.Vector3(), [])
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uTransit: { value: 0 },
    uColor: { value: new THREE.Color(config.color) }
  }), [config.color])

  const triggerTransit = () => {
    if (cooldown.current) return
    cooldown.current = true
    transitTriggered.current = false
    completionScheduled.current = false
    transitStartedAt.current = performance.now()
  }

  useFrame(({ clock }, delta) => {
    const active = cooldown.current
    transit.current = active
      ? Math.min(1, (performance.now() - transitStartedAt.current) / 700)
      : THREE.MathUtils.lerp(transit.current, 0, 0.08)
    const surge = transit.current

    ringRef.current.rotation.y += (0.005 + surge * 0.08) * delta * 60
    ringRef.current.rotation.z += (0.005 + surge * 0.05) * delta * 60
    innerRingRef.current.rotation.y -= (0.007 + surge * 0.11) * delta * 60
    innerRingRef.current.rotation.z -= (0.007 + surge * 0.08) * delta * 60
    materialRef.current.uniforms.uTime.value += delta
    materialRef.current.uniforms.uTransit.value = surge
    ringMaterialRef.current.uniforms.uTime.value += delta
    innerRingMaterialRef.current.uniforms.uTime.value += delta
    apertureRef.current.scale.setScalar(1 + surge * 0.45 + Math.sin(clock.elapsedTime * 12) * 0.025)
    targetScale.set(
      config.scale[0] * (1 + surge * 0.12),
      config.scale[1] * (1 + surge * 0.12),
      config.scale[2]
    )
    groupRef.current.scale.lerp(targetScale, 0.12)
    lightRef.current.intensity = 1.5 + surge * 14

    if (active && surge >= 0.62 && !transitTriggered.current) {
      transitTriggered.current = true
      onTeleport(config)
    }
    if (active && surge >= 1 && !completionScheduled.current) {
      completionScheduled.current = true
      window.setTimeout(() => {
        cooldown.current = false
        transitTriggered.current = false
        completionScheduled.current = false
      }, 1400)
    }

    frame.current += 1
    if (frame.current % 5 !== 0 || cooldown.current) return
    groupRef.current.getWorldPosition(novaeGatePosition)
    const distance = novaeShipPosition.current.distanceTo(novaeGatePosition)
    if (distance < (config.triggerRadius ?? 2.8)) triggerTransit()
  })

  return (
    <group
      ref={groupRef}
      position={config.position}
      rotation={config.rotation}
      scale={config.scale}
      onClick={(event) => {
        event.stopPropagation()
        onSelectObject?.({
          type: 'novae-gate',
          name: config.label.replace('→ ', ''),
          description: config.description,
          destination: config.dimension,
          actionLabel: 'Enter NovaeGate',
          action: triggerTransit
        })
      }}
      onPointerOver={() => { document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { document.body.style.cursor = 'default' }}
    >
      <mesh ref={ringRef}>
        <torusGeometry args={[config.ringRadius, 0.07, 16, 64]} />
        <shaderMaterial
          ref={ringMaterialRef}
          uniforms={{ uTime: { value: 0 }, uColor: { value: new THREE.Color(config.color) } }}
          vertexShader={vertexShader}
          fragmentShader={ringFragmentShader}
        />
      </mesh>
      <mesh ref={innerRingRef}>
        <torusGeometry args={[config.innerRadius, 0.035, 16, 64]} />
        <shaderMaterial
          ref={innerRingMaterialRef}
          uniforms={{ uTime: { value: 0 }, uColor: { value: new THREE.Color(config.color) } }}
          vertexShader={vertexShader}
          fragmentShader={ringFragmentShader}
          transparent
          opacity={0.8}
        />
      </mesh>
      <mesh ref={apertureRef}>
        <circleGeometry args={[config.ringRadius * 0.96, 64]} />
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
      <NovaeGateParticles color={config.accentColor} radius={config.ringRadius} intensity={1.2} />
      <pointLight ref={lightRef} color={config.color} intensity={1.5} distance={30} decay={2} />
      <Html position={[0, config.ringRadius + 0.8, 0]} center>
        <span className="novae-gate-label" style={{ color: config.color }}>
          {config.label}<small>{config.dimension}</small>
        </span>
      </Html>
    </group>
  )
}
