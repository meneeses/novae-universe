export const SOLAR_SYSTEM = {
  sun: {
    name: 'Sun',
    radius: 4,
    position: [0, 0, 0],
    color: '#FDB813',
    emissive: '#FF8C00',
    emissiveIntensity: 2
  },
  planets: [
    { name: 'Mercury', radius: 0.35, orbitRadius: 8, color: '#b8a898', orbitSpeed: 0.47, rotationSpeed: 0.01 },
    { name: 'Venus', radius: 0.55, orbitRadius: 11, color: '#e8c87a', orbitSpeed: 0.35, rotationSpeed: 0.008 },
    {
      name: 'Earth', radius: 0.65, orbitRadius: 15, color: '#4a90d9', emissive: '#112244',
      orbitSpeed: 0.29, rotationSpeed: 0.02, hasMoon: true, hasAtmosphere: true,
      atmosphereColor: '#4fc3f7', isEarth: true
    },
    { name: 'Mars', radius: 0.45, orbitRadius: 19, color: '#cc5533', orbitSpeed: 0.24, rotationSpeed: 0.018 },
    {
      name: 'Jupiter', radius: 1.6, orbitRadius: 28, color: '#c8944a', orbitSpeed: 0.13,
      rotationSpeed: 0.04, hasRings: false, bands: true
    },
    {
      name: 'Saturn', radius: 1.3, orbitRadius: 36, color: '#d4b86a', orbitSpeed: 0.09,
      rotationSpeed: 0.038, hasRings: true, ringColor: '#c8b560'
    },
    { name: 'Uranus', radius: 0.9, orbitRadius: 44, color: '#55cccc', orbitSpeed: 0.06, rotationSpeed: 0.03 },
    { name: 'Neptune', radius: 0.85, orbitRadius: 51, color: '#3355ee', orbitSpeed: 0.05, rotationSpeed: 0.028 }
  ]
}

export const SPAWN_POSITION = [18, 0, 8]

export const PORTALS = [
  {
    id: 'dev-universe',
    position: [30, 0, 0],
    destination: [60, 0, 0],
    color: '#7c4dff',
    label: '→ Dev Universe'
  },
  {
    id: 'solar-system',
    position: [55, 0, 5],
    destination: [20, 0, 8],
    color: '#00ccff',
    label: '→ Solar System'
  }
]
