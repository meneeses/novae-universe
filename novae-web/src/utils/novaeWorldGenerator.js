export const NOVAE_STAR_COLORS_BY_LANGUAGE = {
  JavaScript: '#ffe566',
  TypeScript: '#66aaff',
  Python: '#ff9944',
  Rust: '#ff5533',
  Go: '#44ccdd',
  Java: '#ff8833',
  'C++': '#aa66ff',
  Ruby: '#ff4466',
  Swift: '#ff6644',
  Kotlin: '#aa44ff',
  default: '#ffffff'
}

export const NOVAE_WORLD_COLORS_BY_LANGUAGE = {
  JavaScript: { base: '#d4922a', emissive: '#442200' },
  TypeScript: { base: '#4488cc', emissive: '#112244' },
  Python: { base: '#3a8c4a', emissive: '#0a2a10' },
  Rust: { base: '#cc4422', emissive: '#441100' },
  Go: { base: '#44aacc', emissive: '#112233' },
  Java: { base: '#cc7733', emissive: '#331100' },
  'C++': { base: '#8844cc', emissive: '#220044' },
  Ruby: { base: '#cc3355', emissive: '#440011' },
  HTML: { base: '#cc6644', emissive: '#331100' },
  CSS: { base: '#4466cc', emissive: '#111133' },
  default: { base: '#8888aa', emissive: '#222233' }
}

const BIOME_NAMES = {
  JavaScript: 'desert',
  TypeScript: 'arctic',
  Python: 'forest',
  Rust: 'volcanic',
  Go: 'tundra',
  Java: 'desert',
  'C++': 'crystal',
  Ruby: 'crimson',
  default: 'alien'
}

export function generateNovaeStarProps(githubUser, totalCommits) {
  const primaryLanguage = getPrimaryLanguage(githubUser.repos ?? [])
  let type
  let size

  if (totalCommits < 100) {
    type = 'dwarf'
    size = 0.6
  } else if (totalCommits < 500) {
    type = 'main_sequence'
    size = 0.9
  } else if (totalCommits < 2000) {
    type = 'main_sequence'
    size = 1.2
  } else if (totalCommits < 5000) {
    type = 'giant'
    size = 1.6
  } else {
    type = 'supergiant'
    size = 2.2
  }

  return {
    type,
    size,
    color: NOVAE_STAR_COLORS_BY_LANGUAGE[primaryLanguage] ?? NOVAE_STAR_COLORS_BY_LANGUAGE.default,
    primaryLanguage,
    coronaIntensity: mapRange(totalCommits, 0, 5000, 0.3, 1)
  }
}

export function getPlanetType(commitCount = 0) {
  if (commitCount < 10) return 'asteroid'
  if (commitCount < 100) return 'dwarf'
  if (commitCount < 1000) return 'rocky'
  if (commitCount < 1500) return 'large'
  if (commitCount < 2000) return 'ringed'
  if (commitCount < 3000) return 'gaseous'
  return 'giant'
}

export function getPlanetSize(commitCount = 0) {
  if (commitCount < 10) return 0.08
  if (commitCount < 100) return 0.18
  if (commitCount < 500) return 0.32
  if (commitCount < 1000) return 0.48
  if (commitCount < 1500) return 0.62
  if (commitCount < 2000) return 0.8
  if (commitCount < 3000) return 1
  return 1.3
}

export function getRingCount(commitCount = 0) {
  if (commitCount < 1500) return 0
  if (commitCount < 2000) return 1
  if (commitCount < 2500) return 2
  if (commitCount < 3000) return 3
  return 4
}

export function getMoonCount(starsCount = 0) {
  if (starsCount < 5) return 0
  if (starsCount < 20) return 1
  if (starsCount < 100) return 2
  if (starsCount < 500) return 3
  return 4
}

export function generatePlanetFromRepo(repo, starId, username, index) {
  const normalizedUsername = username.trim().toLowerCase()
  const commitCount = repo.commit_count ?? 0
  const starsCount = repo.stargazers_count ?? repo.stars_count ?? 0
  const forksCount = repo.forks_count ?? 0
  const contributorCount = repo.contributor_count ?? 1
  const seed = hashString(`${repo.name}${normalizedUsername}`)
  const colors = NOVAE_WORLD_COLORS_BY_LANGUAGE[repo.language] ?? NOVAE_WORLD_COLORS_BY_LANGUAGE.default

  return {
    novae_star_id: starId,
    github_username: normalizedUsername,
    repo_name: repo.name,
    repo_full_name: repo.full_name ?? `${normalizedUsername}/${repo.name}`,
    description: repo.description,
    language: repo.language,
    html_url: repo.html_url,
    commit_count: commitCount,
    stars_count: starsCount,
    forks_count: forksCount,
    contributor_count: contributorCount,
    world_type: getPlanetType(commitCount),
    orbit_radius: 3.5 + index * 1.8 + ((seed % 100) / 100) * 0.8,
    orbit_speed: 0.08 + (seed % 50) / 1000,
    orbit_offset: (seed % 628) / 100,
    is_collab: forksCount > 10 && contributorCount > 5 && Boolean(repo.collab_username),
    collab_username: repo.collab_username?.toLowerCase() ?? null,
    _size: getPlanetSize(commitCount),
    _rings: getRingCount(commitCount),
    _moons: getMoonCount(starsCount),
    _colors: colors,
    _seed: seed
  }
}

export function hashString(value) {
  let hash = 5381

  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) + hash) + value.charCodeAt(index)
    hash &= hash
  }

  return Math.abs(hash)
}

export function mapRange(value, inMin, inMax, outMin, outMax) {
  return outMin + (outMax - outMin) *
    Math.max(0, Math.min(1, (value - inMin) / (inMax - inMin)))
}

export function generateNovaePosition(username) {
  const seed = hashString(username.trim().toLowerCase())
  const angle = ((seed % 1000) / 1000) * Math.PI * 2
  const radius = 60 + (seed % 800) / 8

  return {
    x: Math.cos(angle) * radius,
    z: Math.sin(angle) * radius
  }
}

// Temporary adapter for components that still render a flat list of planets.
export function generatePlanetProps(data) {
  const commitCount = data.commit_count ?? data.total_commits ?? 0
  const starsCount = data.stars_count ?? data.total_stars ?? data.followers ?? 0
  const primaryLanguage = data.language ?? data.primary_language ?? 'default'
  const ringCount = getRingCount(commitCount)

  return {
    seed: hashString(data.repo_full_name ?? data.github_username ?? data.username ?? 'unknown'),
    primaryLanguage,
    biome: BIOME_NAMES[primaryLanguage] ?? BIOME_NAMES.default,
    size: data.star_size ?? getPlanetSize(commitCount),
    totalStars: starsCount,
    hasRings: ringCount > 0,
    ringSize: 1.3 + ringCount * 0.18,
    moons: getMoonCount(starsCount),
    atmosphereThickness: 0.3,
    terrainRoughness: 0.6,
    colors: NOVAE_WORLD_COLORS_BY_LANGUAGE[primaryLanguage] ?? NOVAE_WORLD_COLORS_BY_LANGUAGE.default
  }
}

export function getBiome(primaryLanguage) {
  const colors = NOVAE_WORLD_COLORS_BY_LANGUAGE[primaryLanguage] ?? NOVAE_WORLD_COLORS_BY_LANGUAGE.default

  return {
    name: BIOME_NAMES[primaryLanguage] ?? BIOME_NAMES.default,
    colors: [colors.emissive, colors.base, colors.base],
    emissive: colors.emissive
  }
}

function getPrimaryLanguage(repos) {
  const counts = {}

  for (const repo of repos) {
    if (repo.language) counts[repo.language] = (counts[repo.language] ?? 0) + 1
  }

  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'default'
}
