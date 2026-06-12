import * as THREE from 'three'

export function NovaeWorldRings({ size, ringSize, color }) {
  return (
    <mesh rotation={[Math.PI / 2, 0, Math.PI / 8]}>
      <ringGeometry args={[size * ringSize * 0.72, size * ringSize * 1.18, 64]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.62}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
