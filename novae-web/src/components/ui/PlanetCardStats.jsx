function compactNumber(value) {
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value ?? 0)
}

export function PlanetCardStats({ object, dossier }) {
  return (
    <section className="dossier-stats">
      {object.commits != null && <div><span>COMMITS</span><b>{compactNumber(object.commits)}</b><small>world mass</small></div>}
      {object.stars != null && <div><span>STARS</span><b>{compactNumber(object.stars)}</b><small>signals</small></div>}
      {object.forks != null && <div><span>FORKS</span><b>{compactNumber(object.forks)}</b><small>branches</small></div>}
      {object.contributors != null && <div><span>CREW</span><b>{compactNumber(object.contributors)}</b><small>authors</small></div>}
      {object.orbitRadius != null && <div><span>ORBIT</span><b>{object.orbitRadius}</b><small>units</small></div>}
      {object.radius != null && <div><span>RADIUS</span><b>{object.radius}</b><small>visual</small></div>}
      {dossier.stats?.radius && <div><span>REAL RADIUS</span><b>{dossier.stats.radius}</b><small>km x1000</small></div>}
      {dossier.stats?.moons != null && <div><span>MOONS</span><b>{dossier.stats.moons}</b><small>confirmed</small></div>}
      {dossier.stats?.dayLength && <div><span>DAY</span><b>{dossier.stats.dayLength}</b><small>rotation</small></div>}
    </section>
  )
}
