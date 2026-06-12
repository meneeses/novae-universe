export const SOLAR_SYSTEM = {
  sun: {
    name: 'Sun',
    radius: 7,
    position: [0, 0, 0],
    color: '#FDB813',
    emissive: '#FF8C00',
    emissiveIntensity: 2
  },
  planets: [
    { name: 'Mercury', radius: 1.6, orbitRadius: 14, color: '#b8a898', orbitSpeed: 0.47, rotationSpeed: 0.01 },
    { name: 'Venus', radius: 2, orbitRadius: 23, color: '#e8c87a', orbitSpeed: 0.35, rotationSpeed: 0.008 },
    {
      name: 'Earth', radius: 2.2, orbitRadius: 33, color: '#4a90d9', emissive: '#112244',
      orbitSpeed: 0.29, rotationSpeed: 0.02, hasMoon: true, hasAtmosphere: true,
      atmosphereColor: '#4fc3f7', isEarth: true
    },
    { name: 'Mars', radius: 1.8, orbitRadius: 43, color: '#cc5533', orbitSpeed: 0.24, rotationSpeed: 0.018 },
    {
      name: 'Jupiter', radius: 5, orbitRadius: 58, color: '#c8944a', orbitSpeed: 0.13,
      rotationSpeed: 0.04, hasRings: false, bands: true
    },
    {
      name: 'Saturn', radius: 4.4, orbitRadius: 76, color: '#d4b86a', orbitSpeed: 0.09,
      rotationSpeed: 0.038, hasRings: true, ringColor: '#c8b560'
    },
    { name: 'Uranus', radius: 3.2, orbitRadius: 93, color: '#55cccc', orbitSpeed: 0.06, rotationSpeed: 0.03 },
    { name: 'Neptune', radius: 3.1, orbitRadius: 108, color: '#3355ee', orbitSpeed: 0.05, rotationSpeed: 0.028 }
  ]
}

export const SPAWN_POSITION = [38, 0, 12]

export const NOVAE_GATES = [
  {
    id: 'novae-galaxy',
    sourceDimension: 'solar',
    targetDimension: 'developers',
    position: [126, 0, 0],
    destination: [18, 0, 8],
    color: '#7c4dff',
    accentColor: '#ff44cc',
    label: '→ Novae Galaxy',
    dimension: 'Novae Galaxy',
    description: 'A violet hyperspace gate connected to the Novae Galaxy.',
    scale: [2.4, 2.8, 1],
    rotation: [0.18, -0.35, 0.12],
    ringRadius: 1.6,
    innerRadius: 1.02,
    triggerRadius: 5
  },
  {
    id: 'solar-system',
    sourceDimension: 'developers',
    targetDimension: 'solar',
    position: [55, 0, 5],
    destination: [38, 0, 12],
    color: '#00ccff',
    accentColor: '#ffee88',
    label: '→ Solar System',
    dimension: 'Origin Dimension',
    description: 'A stable cyan gate anchored to the Solar System.',
    scale: [2.6, 2.2, 1],
    rotation: [-0.12, 0.5, -0.18],
    ringRadius: 1.65,
    innerRadius: 1.08,
    triggerRadius: 5
  }
]
