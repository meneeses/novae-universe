const NOVAE_STAR_DEFINITIONS = [
  ['aurora-dev', 'Aurora Vale', -42, -28, '#66aaff', 1.2, 'main_sequence', 1840, 38, 920, 'TypeScript'],
  ['rust-orbit', 'Kael Ferris', 18, -44, '#ff5533', 1.6, 'giant', 3680, 24, 610, 'Rust'],
  ['python-nebula', 'Mira Chen', 52, -16, '#ff9944', 1.2, 'main_sequence', 1320, 31, 1540, 'Python'],
  ['go-pioneer', 'Noah Silva', 68, 34, '#44ccdd', 0.9, 'main_sequence', 720, 17, 430, 'Go'],
  ['ruby-pulsar', 'Lena Ortiz', 8, 58, '#ff4466', 1.6, 'giant', 2760, 45, 2100, 'Ruby'],
  ['cpp-architect', 'Iris Stone', -46, 52, '#aa66ff', 2.2, 'supergiant', 6840, 62, 4780, 'C++'],
  ['js-nomad', 'Theo Sparks', -72, 12, '#ffe566', 0.9, 'main_sequence', 460, 12, 180, 'JavaScript'],
  ['swift-signal', 'Ayla North', -12, 18, '#ff6644', 0.6, 'dwarf', 84, 8, 96, 'Swift']
]

export const MOCK_NOVAE_STARS = NOVAE_STAR_DEFINITIONS.map(([
  github_username, display_name, position_x, position_z, star_color, star_size,
  star_type, total_commits, total_repos, followers, primary_language
], index) => ({
  id: `mock-star-${index}`,
  github_username,
  display_name,
  position_x,
  position_z,
  star_color,
  star_size,
  star_type,
  total_commits,
  total_repos,
  followers,
  primary_language,
  bio: `Explorer of the ${primary_language} frontier.`,
  is_mock: true
}))

const REPO_NAMES = {
  TypeScript: ['stellar-console', 'quantum-ui', 'orbit-sdk', 'signal-router', 'nova-dashboard'],
  Rust: ['iron-core', 'warp-engine', 'memory-forge', 'oxide-runtime', 'cargo-station'],
  Python: ['nebula-ml', 'cosmic-lab', 'signal-ai', 'gravity-notebook', 'pulsar-api'],
  Go: ['deep-space-proxy', 'comet-worker', 'orbit-gateway', 'starship-cli', 'void-cache'],
  Ruby: ['crystal-rails', 'gem-observatory', 'redshift-jobs', 'cosmos-rspec', 'lunar-shop'],
  'C++': ['quantum-renderer', 'gravity-sim', 'photon-engine', 'deep-space-db', 'stellar-kernel'],
  JavaScript: ['meteor-app', 'galaxy-canvas', 'cosmic-hooks', 'star-map', 'launchpad'],
  Swift: ['aurora-ios', 'satellite-kit', 'orbit-watch', 'signal-swift', 'lunar-notes']
}

const NOVAE_WORLD_TYPES = ['asteroid', 'dwarf', 'rocky', 'large', 'ringed', 'gaseous', 'giant']
const COMMIT_LEVELS = [6, 58, 340, 1180, 1740, 2480, 3860]

function createSystem(star, starIndex) {
  return REPO_NAMES[star.primary_language].map((repo_name, index) => {
    const level = (index + starIndex) % NOVAE_WORLD_TYPES.length
    return {
      id: `mock-planet-${starIndex}-${index}`,
      novae_star_id: star.id,
      github_username: star.github_username,
      repo_name,
      repo_full_name: `${star.github_username}/${repo_name}`,
      description: `A ${star.primary_language} project transmitting from the ${star.display_name} system.`,
      language: star.primary_language,
      html_url: `https://github.com/${star.github_username}/${repo_name}`,
      commit_count: COMMIT_LEVELS[level] + starIndex * 17,
      stars_count: 8 + ((starIndex + 3) * (index + 5) * 13) % 740,
      forks_count: 2 + ((starIndex + 2) * (index + 4) * 7) % 85,
      contributor_count: 1 + ((starIndex + index) % 14),
      world_type: NOVAE_WORLD_TYPES[level],
      orbit_radius: 3.5 + index * 2.1,
      orbit_speed: 0.055 + index * 0.018,
      orbit_offset: starIndex * 0.7 + index * 1.1,
      is_collab: index === 3 && starIndex % 2 === 0,
      collab_username: index === 3 && starIndex % 2 === 0
        ? MOCK_NOVAE_STARS[(starIndex + 1) % MOCK_NOVAE_STARS.length].github_username
        : null,
      is_mock: true
    }
  })
}

export const MOCK_NOVAE_SYSTEMS = Object.fromEntries(
  MOCK_NOVAE_STARS.map((star, index) => [star.github_username, createSystem(star, index)])
)

export const MOCK_LANDMARKS = [
  {
    id: 'galactic-core', name: 'The Open Source Core', type: 'landmark',
    position: [0, -2, 0], color: '#ffffff', accent: '#7c4dff', size: 8,
    description: 'A dense archive where millions of public ideas converge into a shared gravitational field.'
  },
  {
    id: 'legacy-nebula', name: 'Legacy Code Nebula', type: 'landmark',
    position: [-65, 8, -52], color: '#ff4466', accent: '#6633ff', size: 11,
    description: 'Ancient systems dissolve here, leaving patterns that still influence modern architectures.'
  },
  {
    id: 'package-forge', name: 'Package Forge', type: 'landmark',
    position: [72, 5, -58], color: '#44ccdd', accent: '#ffee88', size: 6,
    description: 'A high-energy station where reusable modules are forged and launched across the galaxy.'
  }
]
