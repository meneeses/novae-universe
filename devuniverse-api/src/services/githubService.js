import fetch from 'node-fetch'

const GITHUB_API_URL = 'https://api.github.com'

function requestHeaders() {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'DevUniverse-API',
    'X-GitHub-Api-Version': '2022-11-28'
  }

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  }

  return headers
}

async function githubRequest(url) {
  const response = await fetch(url, { headers: requestHeaders() })

  if (response.status === 404) {
    const error = new Error('GitHub user not found')
    error.statusCode = 404
    throw error
  }

  if (!response.ok) {
    const error = new Error(`GitHub API request failed with status ${response.status}`)
    error.statusCode = response.status === 403 || response.status === 429 ? 503 : 502
    throw error
  }

  return response
}

function nextPageUrl(linkHeader) {
  if (!linkHeader) return null

  const nextLink = linkHeader
    .split(',')
    .map((part) => part.trim())
    .find((part) => part.endsWith('rel="next"'))

  return nextLink?.match(/<([^>]+)>/)?.[1] ?? null
}

async function fetchRepositories(username) {
  const repositories = []
  let url = `${GITHUB_API_URL}/users/${encodeURIComponent(username)}/repos?per_page=100&type=owner&sort=updated`

  while (url) {
    const response = await githubRequest(url)
    const page = await response.json()
    repositories.push(...page)
    url = nextPageUrl(response.headers.get('link'))
  }

  return repositories
}

export async function getGithubProfile(username) {
  const normalizedUsername = username.trim()
  const userResponse = await githubRequest(
    `${GITHUB_API_URL}/users/${encodeURIComponent(normalizedUsername)}`
  )
  const [user, repositories] = await Promise.all([
    userResponse.json(),
    fetchRepositories(normalizedUsername)
  ])

  return {
    login: user.login,
    name: user.name,
    avatar_url: user.avatar_url,
    bio: user.bio,
    public_repos: user.public_repos,
    followers: user.followers,
    created_at: user.created_at,
    repos: repositories.map(({ name, language, stargazers_count }) => ({
      name,
      language,
      stargazers_count
    }))
  }
}
