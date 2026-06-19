import {
  getMoonCount,
  getRingCount,
  hashString,
  NOVAE_STAR_COLORS_BY_LANGUAGE,
  NOVAE_WORLD_COLORS_BY_LANGUAGE
} from '../../utils/novaeWorldGenerator'
import { PlanetCardStats } from './PlanetCardStats'
import { PlanetPreviewCanvas } from './PlanetPreviewCanvas'

const SOLAR_DOSSIERS = {
  Earth: {
    title: 'Earth',
    subtitle: 'CRADLE OF THE KNOWN NETWORK',
    quote: "The origin point of every developer's journey.",
    accent: '#4a90d9',
    stats: { orbit: 149.6, radius: 6.371, moons: 1, dayLength: '24h' },
    facts: [
      'Home planet. Starting point of all expeditions.',
      'Unique liquid water oceans cover 71% of surface.',
      'Only known planet harboring biological life.',
      'Single natural satellite: Luna.'
    ]
  },
  Mars: {
    title: 'Mars',
    subtitle: 'THE RUST WORLD',
    quote: 'Where dreams of expansion meet iron reality.',
    accent: '#cc5533',
    facts: [
      'Iron oxide surface gives the characteristic red hue.',
      'Home to Olympus Mons, the tallest volcano in the solar system.',
      'Two moons: Phobos and Deimos.',
      'Candidate for future developer colonies.'
    ]
  },
  Jupiter: {
    title: 'Jupiter',
    subtitle: 'THE GREAT SOVEREIGN',
    quote: 'Mass and power beyond comprehension.',
    accent: '#c8944a',
    facts: [
      'The Great Red Spot: a storm active for 350+ years.',
      'More massive than all other planets combined.',
      '95 known moons, including the volcanic Io.',
      'Acts as a gravitational shield for inner planets.'
    ]
  },
  Saturn: {
    title: 'Saturn',
    subtitle: 'THE RINGED JEWEL',
    quote: 'Beauty defined by what surrounds it.',
    accent: '#d4b86a',
    facts: [
      'Ring system extends 282,000 km but is only 20m thick.',
      'Cassini Division: the iconic gap between Ring A and B.',
      'Less dense than water — it would float in a cosmic ocean.',
      '146 moons confirmed. Titan has a thick atmosphere.'
    ]
  },
  Venus: {
    title: 'Venus',
    subtitle: 'THE VEILED TWIN',
    quote: 'Beautiful from afar. Unforgiving up close.',
    accent: '#e8c87a',
    facts: [
      'Surface temperature: 465°C. Hotter than Mercury.',
      'Rotates backwards — Sun rises in the west.',
      'Atmospheric pressure 90x greater than Earth.',
      'Covered by perpetual toxic cloud layers.'
    ]
  },
  Mercury: {
    title: 'Mercury',
    subtitle: 'THE SWIFT WANDERER',
    quote: 'Closest to the fire. Most scarred by it.',
    accent: '#b8a898',
    facts: [
      'Fastest orbital period: 88 Earth days.',
      'Temperature swings from -180°C to 430°C.',
      'Surface covered in ancient impact craters.',
      'No atmosphere to retain heat or protect surface.'
    ]
  },
  Uranus: {
    title: 'Uranus',
    subtitle: 'THE TILTED ICE GIANT',
    quote: 'It chose its own axis. And never looked back.',
    accent: '#55cccc',
    facts: [
      'Rotational axis tilted 97.77° — orbits on its side.',
      'Faint vertical ring system, unlike any other planet.',
      'Coldest planetary atmosphere in the solar system.',
      '27 moons, all named after Shakespeare characters.'
    ]
  },
  Neptune: {
    title: 'Neptune',
    subtitle: 'THE DARK SOVEREIGN',
    quote: 'The last frontier before the void.',
    accent: '#3355ee',
    facts: [
      'Winds up to 2,100 km/h — fastest in the solar system.',
      'Great Dark Spot: storm the size of Earth.',
      'Takes 165 Earth years to complete one orbit.',
      'Moon Triton orbits backwards and will be torn apart.'
    ]
  }
}

function score(value, ceiling) {
  return Math.round(Math.min(100, Math.log10((value ?? 0) + 1) / Math.log10(ceiling + 1) * 100))
}

function buildDossier(object) {
  const isSolar = object.type === 'solar-planet' || object.type === 'earth'
  const seed = hashString(`${object.username ?? ''}${object.name ?? object.type}`)

  if (isSolar) {
    const solar = SOLAR_DOSSIERS[object.name] ?? SOLAR_DOSSIERS.Earth
    return {
      id: `SOL-${String(seed % 100000).padStart(5, '0')}`,
      isSolar,
      accent: solar.accent,
      dark: '#101a44',
      title: solar.title,
      eyebrow: 'solar system planet',
      classification: solar.subtitle,
      lore: solar.quote,
      planetType: object.name,
      planetProps: null,
      stats: { ...solar.stats, moons: object.moons ?? solar.stats?.moons ?? 0 },
      metrics: [
        ['ORBITAL RANGE', Math.min(100, Math.round((object.orbitRadius ?? 4) / 55 * 100))],
        ['MASS', Math.min(100, Math.round((object.radius ?? 1) / 4 * 100))],
        ['SCAN CLARITY', 94],
        ['SIGNAL', 100]
      ],
      facts: solar.facts
    }
  }

  const colors = NOVAE_WORLD_COLORS_BY_LANGUAGE[object.primaryLanguage] ?? NOVAE_WORLD_COLORS_BY_LANGUAGE.default
  const worldType = object.worldType ?? object.biome?.replace(' planet', '') ?? object.type
  const moons = getMoonCount(object.stars)
  const rings = getRingCount(object.commits)

  return {
    id: `DU-${String(seed % 100000).padStart(5, '0')}`,
    isSolar: false,
    accent: colors.base,
    dark: colors.emissive,
    title: object.name,
    eyebrow: `@${object.username} / repository world`,
    classification: `${(object.primaryLanguage ?? 'unknown').toUpperCase()} · ${worldType.toUpperCase()}`,
    lore: object.description || 'A world forged in code.',
    planetType: worldType,
    planetProps: {
      primaryLanguage: object.primaryLanguage,
      worldType,
      colors,
      ringCount: rings
    },
    moons,
    rings,
    metrics: [
      ['COMMITS', score(object.commits, 5000)],
      ['STARS', score(object.stars, 1000)],
      ['FORKS', score(object.forks, 500)],
      ['TYPE', Math.min(100, 42 + rings * 12 + moons * 4)]
    ],
    facts: [
      `${(object.commits ?? 0).toLocaleString()} commits shaped this world.`,
      object.stars > 0 ? `${object.stars} developers have starred this world.` : 'An unexplored world, awaiting discovery.',
      object.forks > 0 ? `Forked ${object.forks} times across the universe.` : 'Original — never forked.',
      `Written in ${object.primaryLanguage || 'unknown matter'}.`
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

export function PlanetCard({ object, onClose }) {
  const dossier = buildDossier(object)
  const fallbackAccent = object.color ?? object.accent ?? NOVAE_STAR_COLORS_BY_LANGUAGE[object.primaryLanguage] ?? '#66ccff'
  const accent = dossier.accent ?? fallbackAccent

  return (
    <aside className="celestial-details-panel" style={{ '--scan-accent': accent, '--scan-dark': dossier.dark }}>
      <div className="dossier-grid" />
      <button className="celestial-details-panel__close" type="button" onClick={onClose} aria-label="Close details">×</button>

      <header className="dossier-header">
        <span>PLANETARY INTELLIGENCE DOSSIER</span>
        <b>{dossier.id}</b>
      </header>

      <section className="dossier-hero dossier-hero--preview">
        <PlanetPreviewCanvas
          planetType={dossier.planetType}
          planetProps={dossier.planetProps}
          isSolarPlanet={dossier.isSolar}
          accent={accent}
        />
        <div>
          <small>{dossier.eyebrow}</small>
          <h2>{dossier.title}</h2>
          <strong>{dossier.classification}</strong>
          {object.primaryLanguage && <em>{object.primaryLanguage} biosphere</em>}
          <p className="dossier-lore">“{dossier.lore}”</p>
        </div>
      </section>

      <section className="dossier-signals">
        {dossier.metrics.map(([label, value]) => <Metric key={label} label={label} value={value} />)}
      </section>

      <PlanetCardStats object={object} dossier={dossier} />

      <section className="dossier-findings">
        <h3>SCAN FINDINGS</h3>
        {dossier.facts.map((fact, index) => <p key={fact}><span>0{index + 1}</span>{fact}</p>)}
      </section>

      <footer className="dossier-actions">
        {object.githubUrl && (
          <button type="button" onClick={() => window.open(object.githubUrl, '_blank', 'noopener,noreferrer')}>
            VIEW REPOSITORY ON GITHUB ↗
          </button>
        )}
        {object.action && <button type="button" onClick={object.action}>{object.actionLabel ?? 'INTERACT'}</button>}
      </footer>
    </aside>
  )
}
