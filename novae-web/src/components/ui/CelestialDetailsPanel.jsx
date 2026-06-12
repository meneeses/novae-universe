import {
  getMoonCount,
  getRingCount,
  hashString,
  NOVAE_WORLD_COLORS_BY_LANGUAGE,
  NOVAE_STAR_COLORS_BY_LANGUAGE
} from '../../utils/novaeWorldGenerator'

const SOLAR_LORE = {
  Mercury: ['Scorched iron frontier', 'A year here ends before most missions do.'],
  Venus: ['Runaway greenhouse world', 'Its cloud deck hides a surface hot enough to melt lead.'],
  Earth: ['Cradle of the known network', 'The origin point of every developer expedition.'],
  Mars: ['Ancient river world', 'Its silent valleys preserve evidence of a wetter past.'],
  Jupiter: ['Guardian gas giant', 'Its gravity redirects countless threats from the inner system.'],
  Saturn: ['Ringed archive world', 'Billions of ice fragments compose its luminous orbital record.'],
  Uranus: ['Sideways ice giant', 'The entire world rolls around the Sun on its side.'],
  Neptune: ['Storm frontier', 'Supersonic winds cross the final major world of the system.']
}

const TYPE_LORE = {
  asteroid: ['Proto-world', 'A young repository still gathering enough activity to become a planet.'],
  dwarf: ['Compact archive world', 'Small, focused, and dense with a single technical purpose.'],
  rocky: ['Stable engineering world', 'A mature codebase with a durable surface and active tectonics.'],
  large: ['Continental repository', 'Its growing code continents support several distinct ecosystems.'],
  ringed: ['Orbital archive world', 'Historic releases and forks form visible rings around the project.'],
  gaseous: ['Cloud-scale platform', 'Layered systems and abstractions move like bands through its atmosphere.'],
  giant: ['Colossal ecosystem world', 'A massive repository whose gravity attracts contributors and satellites.']
}

function number(value) {
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value ?? 0)
}

function score(value, ceiling) {
  return Math.round(Math.min(100, Math.log10((value ?? 0) + 1) / Math.log10(ceiling + 1) * 100))
}

function buildDossier(object) {
  const isRepo = object.type === 'novae-world'
  const isSolar = object.type === 'solar-planet' || object.type === 'earth'
  const seed = hashString(`${object.username ?? ''}${object.name ?? object.type}`)
  const colors = isRepo
    ? NOVAE_WORLD_COLORS_BY_LANGUAGE[object.primaryLanguage] ?? NOVAE_WORLD_COLORS_BY_LANGUAGE.default
    : { base: object.color ?? object.accent ?? NOVAE_STAR_COLORS_BY_LANGUAGE[object.primaryLanguage] ?? '#66ccff', emissive: '#101a44' }
  const worldType = object.worldType ?? object.biome?.replace(' planet', '') ?? object.type
  const moons = isRepo ? getMoonCount(object.stars) : object.moons ?? 0
  const rings = isRepo ? getRingCount(object.commits) : object.hasRings ? 3 : 0
  const lore = isRepo
    ? TYPE_LORE[worldType] ?? TYPE_LORE.rocky
    : SOLAR_LORE[object.name] ?? [object.type?.replace('-', ' '), object.description ?? 'An unexplored celestial object.']
  const repoLore = `${lore[1]} Its ${object.primaryLanguage ?? 'unknown'} biosphere converts every commit into visible planetary energy.`

  return {
    id: `DU-${String(seed % 100000).padStart(5, '0')}`,
    accent: colors.base,
    dark: colors.emissive,
    title: isRepo ? object.name : object.displayName ?? object.name ?? object.username ?? 'Unknown object',
    eyebrow: isRepo ? `@${object.username} / repository world` : object.type?.replace('-', ' ') ?? 'celestial object',
    classification: isRepo ? `${lore[0]} · ${worldType}` : lore[0],
    lore: isRepo ? repoLore : object.description || lore[1],
    moons,
    rings,
    metrics: isRepo ? [
      ['ACTIVITY', score(object.commits, 5000)],
      ['INFLUENCE', score(object.stars, 1000)],
      ['COLLABORATION', score((object.forks ?? 0) * (object.contributors ?? 1), 2000)],
      ['STABILITY', Math.min(100, 38 + Math.round(Math.log2((object.commits ?? 0) + 2) * 7))]
    ] : [
      ['ORBITAL RANGE', Math.min(100, Math.round((object.orbitRadius ?? 4) / 55 * 100))],
      ['VISUAL MASS', Math.min(100, Math.round((object.radius ?? 1) / 4 * 100))],
      ['SCAN CLARITY', 94],
      ['SIGNAL', 100]
    ],
    facts: isRepo ? [
      object.description ? `Mission brief: ${object.description}` : 'Mission brief: no public transmission was provided.',
      `${moons || 'No'} satellite${moons === 1 ? '' : 's'} detected from community stars.`,
      rings ? `${rings} archive ring${rings === 1 ? '' : 's'} formed by sustained commit activity.` : 'No archive rings detected yet.',
      object.isCollab ? `Binary collaboration signal linked to @${object.collabUsername}.` : `${object.contributors ?? 1} contributor signatures detected.`
    ] : [
      lore[1],
      object.orbitRadius ? `Orbital distance registered at ${object.orbitRadius} simulation units.` : 'Fixed landmark coordinates confirmed.',
      object.hasRings ? 'A complex ring system is visible from orbit.' : 'No major ring system detected.',
      'Navigation archive verified by Novae Universe telemetry.'
    ]
  }
}

function Metric({ label, value }) {
  return (
    <div className="dossier-metric">
      <span><b>{label}</b><em>{value}%</em></span>
      <i><u style={{ width: `${value}%` }} /></i>
    </div>
  )
}

export function CelestialDetailsPanel({ object, onClose }) {
  const dossier = buildDossier(object)

  return (
    <aside
      className="celestial-details-panel"
      style={{ '--scan-accent': dossier.accent, '--scan-dark': dossier.dark }}
    >
      <div className="dossier-grid" />
      <button className="celestial-details-panel__close" type="button" onClick={onClose} aria-label="Close details">×</button>

      <header className="dossier-header">
        <span>PLANETARY INTELLIGENCE DOSSIER</span>
        <b>{dossier.id}</b>
      </header>

      <section className="dossier-hero">
        <div className={`dossier-orb${dossier.rings ? ' dossier-orb--ringed' : ''}`}>
          <i />
          <span />
          {Array.from({ length: dossier.moons }, (_, index) => <b key={index} style={{ '--moon-index': index }} />)}
        </div>
        <div>
          <small>{dossier.eyebrow}</small>
          <h2>{dossier.title}</h2>
          <strong>{dossier.classification}</strong>
          {object.primaryLanguage && <em>{object.primaryLanguage} biosphere</em>}
        </div>
      </section>

      <p className="dossier-lore">“{dossier.lore}”</p>

      <section className="dossier-signals">
        {dossier.metrics.map(([label, value]) => <Metric key={label} label={label} value={value} />)}
      </section>

      <section className="dossier-stats">
        {object.commits != null && <div><span>ENERGY</span><b>{number(object.commits)}</b><small>commits</small></div>}
        {object.stars != null && <div><span>SATELLITES</span><b>{number(object.stars)}</b><small>stars</small></div>}
        {object.forks != null && <div><span>OUTPOSTS</span><b>{number(object.forks)}</b><small>forks</small></div>}
        {object.contributors != null && <div><span>SIGNATURES</span><b>{number(object.contributors)}</b><small>contributors</small></div>}
        {object.orbitRadius != null && <div><span>ORBIT</span><b>{object.orbitRadius}</b><small>units</small></div>}
        {object.radius != null && <div><span>RADIUS</span><b>{object.radius}</b><small>visual</small></div>}
      </section>

      <section className="dossier-findings">
        <h3>SCAN FINDINGS</h3>
        {dossier.facts.map((fact, index) => <p key={fact}><span>0{index + 1}</span>{fact}</p>)}
      </section>

      <footer className="dossier-actions">
        {object.githubUrl && (
          <button type="button" onClick={() => window.open(object.githubUrl, '_blank', 'noopener,noreferrer')}>
            OPEN SOURCE ARCHIVE ↗
          </button>
        )}
        {object.action && <button type="button" onClick={object.action}>{object.actionLabel ?? 'INTERACT'}</button>}
      </footer>
    </aside>
  )
}
