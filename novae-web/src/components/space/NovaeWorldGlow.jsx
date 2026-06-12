import * as THREE from 'three'

export function NovaeWorldGlow({ size, color, isMyPlanet }) {
  return (
    <group position={[0, -size * 1.15, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[size * 1.35, 48]} />
        <meshBasicMaterial
          color={isMyPlanet ? '#00ffcc' : color}
          transparent
          opacity={isMyPlanet ? 0.22 : 0.1}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <pointLight
        color={isMyPlanet ? '#00ffcc' : color}
        intensity={isMyPlanet ? 1.8 : 0.7}
        distance={size * 7}
        decay={2}
      />
    </group>
  )
}
