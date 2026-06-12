import { useEffect } from 'react'
import { NovaePulse } from '../NovaePulse'
import { useNovaePulse } from '../../hooks/useNovaePulse'
import { NovaeAsteroidBelt } from './NovaeAsteroidBelt'
import { NovaeBinary } from './NovaeBinary'
import { NovaeWorldObject } from './NovaeWorldObject'
import { NovaeStarObject } from './NovaeStarObject'
import { NovaeSupernova } from './NovaeSupernova'
import { NovaeGate } from './NovaeGate'

export function NovaeSystem({ starData, planets, stars, novaeShipPosition, onRepoClick, onSelectObject, onExitSystem }) {
  const { waves, emitWave } = useNovaePulse()
  const asteroidCount = planets.filter((planet) => planet.world_type === 'asteroid').length
  const formedPlanets = planets.filter((planet) => planet.world_type !== 'asteroid')
  const collabPlanet = formedPlanets.find((planet) => planet.is_collab && planet.collab_username)
  const companion = collabPlanet
    ? stars.find((star) => star.username === collabPlanet.collab_username)?.starData
    : null
  const centeredStar = { ...starData, position_x: 0, position_z: 0 }
  const isDeadSystem = starData.status === 'supernova' || starData.status === 'nebula' || starData.star_type === 'nebula'
  const exitNovaeGate = {
    id: `exit-${starData.github_username ?? starData.username}`,
    position: [22, 0, 42],
    color: '#00ccff',
    accentColor: '#ffffff',
    label: '← EXIT SYSTEM',
    dimension: 'Novae Galaxy',
    description: 'Return to the Novae Galaxy map.',
    scale: [2.1, 2.1, 1],
    rotation: [0, 0, 0],
    ringRadius: 1.5,
    innerRadius: 0.95,
    triggerRadius: 5
  }

  useEffect(() => {
    if (!import.meta.env.DEV) return undefined

    const eventTypes = ['commit', 'star', 'fork', 'new_repo']
    let eventIndex = 0
    const interval = setInterval(() => {
      emitWave({
        type: eventTypes[eventIndex++ % eventTypes.length],
        origin: [0, 0, 0],
        maxRadius: 120
      })
    }, 4000)

    return () => clearInterval(interval)
  }, [emitWave])

  return (
    <group>
      {waves.map((wave) => (
        <NovaePulse key={wave.id} wave={wave} />
      ))}

      {isDeadSystem ? (
        <NovaeSupernova starData={centeredStar} />
      ) : companion ? (
        <NovaeBinary primaryStar={centeredStar} companionStar={companion} />
      ) : (
        <NovaeStarObject
          starData={centeredStar}
          isCenter
          distanceFromNovaeShip={0}
          onClick={() => onSelectObject?.({
            type: 'star',
            name: `@${starData.github_username ?? starData.username}`,
            description: 'The central Novae Star of this Novae System.',
            commits: starData.total_commits,
            repos: starData.total_repos,
            primaryLanguage: starData.primary_language
          })}
        />
      )}

      <NovaeAsteroidBelt
        count={asteroidCount}
        starSize={starData.star_size ?? 1}
        starColor={starData.star_color ?? '#ffffff'}
      />

      {formedPlanets.map((planet) => (
        <NovaeWorldObject
          key={planet.id ?? planet.repo_full_name}
          planet={planet}
          novaeShipPosition={novaeShipPosition}
          waves={waves}
          onClick={onRepoClick}
          dimmed={isDeadSystem}
        />
      ))}

      <NovaeGate
        config={exitNovaeGate}
        novaeShipPosition={novaeShipPosition}
        onTeleport={onExitSystem}
        onSelectObject={onSelectObject}
      />
    </group>
  )
}
