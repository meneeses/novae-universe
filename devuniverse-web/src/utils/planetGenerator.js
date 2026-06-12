export const BIOMES = {
  JavaScript: {
    name: 'ocean',
    colors: ['#0d3b52', '#1a6b8a', '#2eb8d4'],
    emissive: '#051a24'
  },
  TypeScript: {
    name: 'arctic',
    colors: ['#2a4a6b', '#4a90d9', '#c9e8f5'],
    emissive: '#0a1f30'
  },
  Python: {
    name: 'forest',
    colors: ['#1a3d1a', '#2d5a27', '#4a8c3f'],
    emissive: '#0a1a0a'
  },
  Rust: {
    name: 'volcanic',
    colors: ['#3d0a0a', '#8b1a1a', '#d4472a'],
    emissive: '#1a0505'
  },
  Go: {
    name: 'tundra',
    colors: ['#1a3a4a', '#4a9eff', '#a0d4ff'],
    emissive: '#0a1a22'
  },
  Java: {
    name: 'desert',
    colors: ['#4a2e0a', '#c4892a', '#f5d78e'],
    emissive: '#1a1005'
  },
  'C++': {
    name: 'crystal',
    colors: ['#2d0a4a', '#6a0dad', '#d7bde2'],
    emissive: '#120520'
  },
  Ruby: {
    name: 'crimson',
    colors: ['#3d0a14', '#9b2335', '#ff6666'],
    emissive: '#1a0508'
  },
  default: {
    name: 'alien',
    colors: ['#1a0a3d', '#7c4dff', '#18ffff'],
    emissive: '#0a0520'
  }
}

export function hashString(value) {
  let hash = 2166136261

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

export function mapRange(value, inMin, inMax, outMin, outMax) {
  const clampedValue = Math.min(Math.max(value, inMin), inMax)
  return outMin + ((clampedValue - inMin) * (outMax - outMin)) / (inMax - inMin)
}

export function generatePosition(username) {
  const normalizedUsername = username.trim().toLowerCase()
  const angle = mapRange(hashString(`${normalizedUsername}:x`), 0, 0xffffffff, 0, Math.PI * 2)
  const radius = mapRange(hashString(`${normalizedUsername}:z`), 0, 0xffffffff, 40, 150)

  return {
    x: Number((Math.cos(angle) * radius).toFixed(4)),
    z: Number((Math.sin(angle) * radius).toFixed(4))
  }
}

export function generatePlanetProps(githubData) {
  const repos = githubData.repos ?? []
  const storedLanguages = githubData.languages_json ?? githubData.languages
  const languageCounts = storedLanguages ?? repos.reduce((counts, repo) => {
      if (repo.language) counts[repo.language] = (counts[repo.language] ?? 0) + 1
      return counts
    }, {})
  const primaryLanguage =
    githubData.primary_language ??
    Object.entries(languageCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ??
    null
  const totalStars =
    githubData.total_stars ??
    repos.reduce((total, repo) => total + (repo.stargazers_count ?? 0), 0)
  const accountAgeDays =
    githubData.account_age_days ??
    Math.max(0, Math.floor((Date.now() - new Date(githubData.created_at).getTime()) / 86400000))
  const languagesCount = Object.keys(languageCounts).length
  const username = githubData.login ?? githubData.github_username ?? githubData.username
  const repoCount = githubData.public_repos ?? githubData.repo_count ?? 0

  return {
    seed: hashString(username.toLowerCase()),
    primaryLanguage,
    biome: (BIOMES[primaryLanguage] ?? BIOMES.default).name,
    size: Number(mapRange(repoCount, 0, 100, 0.6, 2.2).toFixed(3)),
    totalStars,
    hasRings: totalStars > 50,
    ringSize: Number(mapRange(totalStars, 50, 500, 1.3, 2).toFixed(3)),
    moons: Math.min(4, Math.floor((githubData.followers ?? 0) / 20)),
    accountAgeDays,
    atmosphereThickness: Number(mapRange(accountAgeDays, 0, 1825, 0.1, 0.6).toFixed(3)),
    languagesCount,
    terrainRoughness: Number(mapRange(Math.max(languagesCount, 1), 1, 10, 0.3, 1).toFixed(3)),
    languages: languageCounts
  }
}

export function getBiome(primaryLanguage) {
  return BIOMES[primaryLanguage] ?? BIOMES.default
}
