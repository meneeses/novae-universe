import { RocketExhaust } from './RocketExhaust'

export function Rocket({ rocketRef, isThrusting, isBraking }) {
  return (
    <group ref={rocketRef}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[0.3, 1.2, 8]} />
        <meshStandardMaterial color="#f0f0f0" metalness={0.7} roughness={0.2} envMapIntensity={1} />
      </mesh>

      <mesh position={[-0.4, 0, 0.2]} rotation={[0, 0, Math.PI / 12]} castShadow>
        <boxGeometry args={[0.6, 0.05, 0.4]} />
        <meshStandardMaterial color="#d0d0d8" metalness={0.8} roughness={0.15} />
      </mesh>
      <mesh position={[0.4, 0, 0.2]} rotation={[0, 0, -Math.PI / 12]} castShadow>
        <boxGeometry args={[0.6, 0.05, 0.4]} />
        <meshStandardMaterial color="#d0d0d8" metalness={0.8} roughness={0.15} />
      </mesh>

      <mesh position={[0, 0.1, -0.3]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial
          color="#001133"
          emissive="#0066cc"
          emissiveIntensity={0.8}
          metalness={0}
          roughness={0}
          transparent
          opacity={0.9}
        />
      </mesh>

      <mesh position={[0, 0, 0.6]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.2, 0.3, 8]} />
        <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.3} />
      </mesh>

      <pointLight position={[0, 0.5, -1]} intensity={0.5} color="#4488ff" distance={8} />
      <RocketExhaust isThrusting={isThrusting} isBraking={isBraking} rocketRef={rocketRef} />
    </group>
  )
}
