import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { NovaeShipGlow } from './NovaeShipGlow'
import { NovaeShipExhaust } from './NovaeShipExhaust'
import { NovaeShipTrail } from './NovaeShipTrail'
import { SpeedLines } from './SpeedLines'

const shieldVertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewDirection;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vNormal = normalize(mat3(modelMatrix) * normal);
    vViewDirection = normalize(cameraPosition - worldPosition.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`

const shieldFragmentShader = `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vViewDirection;
  void main() {
    float fresnel = pow(1.0 - abs(dot(vViewDirection, vNormal)), 3.0);
    float pulse = sin(uTime * 4.0) * 0.5 + 0.5;
    float alpha = fresnel * 0.25 * (0.7 + pulse * 0.3);
    gl_FragColor = vec4(0.3, 0.7, 1.0, alpha);
  }
`

function EnergyShield() {
  const materialRef = useRef()
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), [])

  useFrame((state) => {
    if (materialRef.current) materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
  })

  return (
    <mesh scale={[1.45, 0.8, 1.7]}>
      <sphereGeometry args={[0.8, 24, 18]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={shieldVertexShader}
        fragmentShader={shieldFragmentShader}
        transparent
        depthWrite={false}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

function NavigationLight({ position, color, phase = 0 }) {
  const materialRef = useRef()
  const lightRef = useRef()

  useFrame(({ clock }) => {
    const pulse = Math.sin(clock.elapsedTime * 4.5 + phase) > 0.2 ? 1 : 0.18
    if (materialRef.current) materialRef.current.emissiveIntensity = 2.5 * pulse
    if (lightRef.current) lightRef.current.intensity = 0.45 * pulse
  })

  return (
    <>
      <mesh position={position}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshStandardMaterial ref={materialRef} color={color} emissive={color} emissiveIntensity={2} />
      </mesh>
      <pointLight ref={lightRef} position={position} color={color} intensity={0.3} distance={1.8} />
    </>
  )
}

export function NovaeShip({ novaeShipRef, speed, isThrusting, isBoosting, isBraking, hasShield = false }) {
  const visualRef = useRef()
  const leftWingRef = useRef()
  const rightWingRef = useRef()
  const leftNacelleRef = useRef()
  const rightNacelleRef = useRef()

  useFrame(({ clock }) => {
    if (!visualRef.current) return
    const thrusting = isThrusting.current ?? isThrusting
    const braking = isBraking.current ?? isBraking
    const currentSpeed = speed?.current ?? speed ?? 0
    const idleFloat = currentSpeed < 0.06 ? Math.sin(clock.elapsedTime * 0.8) * 0.012 : 0
    const vibration = thrusting ? 0.004 : 0

    visualRef.current.position.set(
      (Math.random() - 0.5) * vibration,
      idleFloat + (Math.random() - 0.5) * vibration,
      0
    )

    const bankAmount = novaeShipRef.current?.rotation.z ?? 0
    if (leftWingRef.current) leftWingRef.current.rotation.z = -0.18 + bankAmount * 0.15
    if (rightWingRef.current) rightWingRef.current.rotation.z = 0.18 - bankAmount * 0.15

    const nacelleScale = braking ? 0.85 : 1
    if (leftNacelleRef.current) leftNacelleRef.current.scale.z = THREE.MathUtils.lerp(leftNacelleRef.current.scale.z, nacelleScale, 0.1)
    if (rightNacelleRef.current) rightNacelleRef.current.scale.z = THREE.MathUtils.lerp(rightNacelleRef.current.scale.z, nacelleScale, 0.1)
  })

  return (
    <>
      <group ref={novaeShipRef}>
        <group ref={visualRef}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <capsuleGeometry args={[0.22, 1.1, 8, 16]} />
            <meshStandardMaterial color="#d8dde8" metalness={0.75} roughness={0.18} />
          </mesh>
          <mesh position={[0, 0, -0.85]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
            <coneGeometry args={[0.22, 0.55, 16]} />
            <meshStandardMaterial color="#c8cdd8" metalness={0.8} roughness={0.15} />
          </mesh>

          <mesh position={[0, 0.18, -0.25]} scale={[1, 0.65, 1]}>
            <sphereGeometry args={[0.18, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
            <meshStandardMaterial color="#001a33" emissive="#0055aa" emissiveIntensity={0.8} roughness={0.02} transparent opacity={0.85} />
          </mesh>
          <mesh position={[0, 0.145, -0.25]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.17, 0.012, 8, 24]} />
            <meshStandardMaterial color="#555566" metalness={0.9} roughness={0.1} />
          </mesh>
          <pointLight position={[0, 0.18, -0.25]} intensity={0.8} color="#0088ff" distance={1.2} />

          <group ref={leftWingRef} position={[-0.55, -0.05, 0.15]} rotation={[0, 0, -0.18]}>
            <mesh><boxGeometry args={[0.55, 0.04, 0.5]} /><meshStandardMaterial color="#c0c5d0" metalness={0.7} roughness={0.2} /></mesh>
            <mesh position={[-0.3, 0, 0.1]}><boxGeometry args={[0.25, 0.025, 0.3]} /><meshStandardMaterial color="#b0b5c0" metalness={0.75} roughness={0.18} /></mesh>
            <mesh position={[-0.42, 0.06, 0.18]} rotation={[0, 0, 0.3]}><boxGeometry args={[0.04, 0.14, 0.18]} /><meshStandardMaterial color="#a0a5b0" metalness={0.8} roughness={0.15} /></mesh>
          </group>
          <group ref={rightWingRef} position={[0.55, -0.05, 0.15]} rotation={[0, 0, 0.18]}>
            <mesh><boxGeometry args={[0.55, 0.04, 0.5]} /><meshStandardMaterial color="#c0c5d0" metalness={0.7} roughness={0.2} /></mesh>
            <mesh position={[0.3, 0, 0.1]}><boxGeometry args={[0.25, 0.025, 0.3]} /><meshStandardMaterial color="#b0b5c0" metalness={0.75} roughness={0.18} /></mesh>
            <mesh position={[0.42, 0.06, 0.18]} rotation={[0, 0, -0.3]}><boxGeometry args={[0.04, 0.14, 0.18]} /><meshStandardMaterial color="#a0a5b0" metalness={0.8} roughness={0.15} /></mesh>
          </group>

          {[-0.38, 0.38].map((x, index) => (
            <group key={x} ref={index === 0 ? leftNacelleRef : rightNacelleRef} position={[x, -0.08, 0.45]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.09, 0.11, 0.55, 12]} /><meshStandardMaterial color="#888899" metalness={0.85} roughness={0.12} /></mesh>
              <mesh position={[0, 0, 0.28]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.11, 0.09, 0.08, 12]} /><meshStandardMaterial color="#444455" metalness={0.9} roughness={0.05} /></mesh>
              <NovaeShipGlow position={[0, 0, 0.34]} isThrusting={isThrusting} isBoosting={isBoosting} isBraking={isBraking} index={index} />
            </group>
          ))}

          <group position={[0, 0, 0.6]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.14, 0.18, 0.3, 16]} /><meshStandardMaterial color="#666677" metalness={0.9} roughness={0.08} /></mesh>
            <mesh position={[0, 0, 0.16]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.18, 0.14, 0.06, 16]} /><meshStandardMaterial color="#333344" metalness={0.95} roughness={0.05} /></mesh>
            <NovaeShipGlow position={[0, 0, 0.22]} isThrusting={isThrusting} isBoosting={isBoosting} isBraking={isBraking} index={2} isMain />
          </group>

          {[-0.28, 0.28].map((x) => (
            <mesh key={x} position={[x, 0.22, 0.1]} rotation={[x < 0 ? 0.1 : -0.1, 0, x < 0 ? -0.05 : 0.05]}>
              <boxGeometry args={[0.28, 0.02, 0.22]} />
              <meshStandardMaterial color="#1a1a3a" emissive="#001133" emissiveIntensity={0.3} metalness={0.2} roughness={0.6} />
            </mesh>
          ))}

          <mesh position={[0, 0.34, 0.05]}><cylinderGeometry args={[0.006, 0.006, 0.32, 4]} /><meshStandardMaterial color="#cccccc" metalness={0.9} roughness={0.1} /></mesh>
          <NavigationLight position={[0, 0.5, 0.05]} color="#ff2222" phase={1.2} />
          <NavigationLight position={[-0.72, -0.05, 0.15]} color="#00ff44" />
          <NavigationLight position={[0.72, -0.05, 0.15]} color="#ff4400" phase={Math.PI} />

          <mesh position={[0, 0, -1.08]}><sphereGeometry args={[0.025, 8, 8]} /><meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={3} /></mesh>
          <spotLight position={[0, 0, -1.1]} target-position={[0, 0, -10]} intensity={2} color="#ffffff" angle={0.18} penumbra={0.4} distance={25} />

          {hasShield && <EnergyShield />}
          <NovaeShipExhaust isThrusting={isThrusting} isBraking={isBraking} />
        </group>
      </group>
      <NovaeShipTrail novaeShipRef={novaeShipRef} speed={speed} />
      <SpeedLines speed={speed} />
    </>
  )
}
