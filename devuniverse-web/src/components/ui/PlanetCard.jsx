import { getBiome } from '../../utils/planetGenerator'

function compactNumber(value) {
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value ?? 0)
}

export function PlanetCard({ planet, onClose }) {
  const data = planet.planetData
  const props = planet.planetProps
  const biome = getBiome(props.primaryLanguage)
  const repoCount = data.repo_count ?? data.public_repos ?? 0
  const followers = data.followers ?? 0
  const stars = data.total_stars ?? props.totalStars ?? 0

  function visitProfile() {
    window.open(`https://github.com/${encodeURIComponent(planet.username)}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <aside className="planet-card" style={{ '--biome-color': biome.colors[1] }}>
      <button className="planet-card__close" type="button" onClick={onClose} aria-label="Close planet card">
        ×
      </button>
      <h2><span style={{ color: biome.colors[2] }}>●</span> @{planet.username}</h2>
      <span className="planet-card__divider" />
      <dl>
        <div><dt>TYPE</dt><dd>{props.primaryLanguage ?? 'Unknown'} · {biome.name}</dd></div>
        <div><dt>STARS</dt><dd>{compactNumber(stars)}</dd></div>
        <div><dt>FOLLOWERS</dt><dd>{compactNumber(followers)}</dd></div>
        <div><dt>REPOS</dt><dd>{compactNumber(repoCount)}</dd></div>
        <div><dt>DISTANCE</dt><dd>{planet.distance.toFixed(1)}</dd></div>
      </dl>
      <span className="planet-card__divider" />
      <button className="planet-card__visit" type="button" onClick={visitProfile}>
        Visit Profile
      </button>
    </aside>
  )
}
