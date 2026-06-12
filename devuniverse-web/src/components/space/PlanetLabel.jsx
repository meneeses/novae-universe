import { Html } from '@react-three/drei'

export function PlanetLabel({ username, size, isMyPlanet }) {
  return (
    <Html position={[0, size * 1.8, 0]} center occlude>
      <div
        className={`planet-label${isMyPlanet ? ' planet-label--mine' : ''}`}
        aria-label={isMyPlanet ? `@${username}, your planet` : `@${username}`}
      >
        {isMyPlanet ? `► @${username} (you)` : `@${username}`}
      </div>
    </Html>
  )
}
