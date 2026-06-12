import * as THREE from 'three'

export function NovaeWorldAtmosphere({ size, color, thickness }) {
  const opacity = Math.min(0.18, Math.max(0.08, thickness * 0.2 + 0.05))

  return (
    <mesh scale={size * (1 + thickness * 0.3)}>
      <sphereGeometry args={[1, 48, 48]} />
      <meshLambertMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.25}
        transparent
        opacity={opacity}
        side={THREE.BackSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}
