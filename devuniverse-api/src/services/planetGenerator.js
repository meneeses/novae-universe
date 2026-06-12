const BIOMES = {
  JavaScript: 'ocean',
  Python: 'forest',
  Rust: 'volcanic',
  Go: 'arctic',
  Java: 'desert',
  TypeScript: 'arctic',
  Ruby: 'crimson',
  'C++': 'crystal'
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
  const languageCounts = repos.reduce((counts, repo) => {
    if (repo.language) counts[repo.language] = (counts[repo.language] ?? 0) + 1
    return counts
  }, {})
  const primaryLanguage =
    Object.entries(languageCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ??
    null
  const totalStars = repos.reduce((total, repo) => total + (repo.stargazers_count ?? 0), 0)
  const accountAgeDays = Math.max(
    0,
    Math.floor((Date.now() - new Date(githubData.created_at).getTime()) / 86400000)
  )
  const languagesCount = Object.keys(languageCounts).length

  return {
    seed: hashString(githubData.login.toLowerCase()),
    primaryLanguage,
    biome: BIOMES[primaryLanguage] ?? 'alien',
    size: Number(mapRange(githubData.public_repos ?? 0, 0, 100, 0.6, 2.2).toFixed(3)),
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
