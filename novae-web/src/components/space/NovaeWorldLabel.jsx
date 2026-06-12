import { Html } from '@react-three/drei'

export function NovaeWorldLabel({ username, size, isMyPlanet }) {
  return (
    <Html position={[0, size * 1.8, 0]} center occlude>
      <div
        className={`novae-world-label${isMyPlanet ? ' novae-world-label--mine' : ''}`}
        aria-label={isMyPlanet ? `@${username}, your Novae World` : `@${username}`}
      >
        {isMyPlanet ? `► @${username} (you)` : `@${username}`}
      </div>
    </Html>
  )
}
