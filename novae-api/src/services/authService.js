import fetch from 'node-fetch'

const GITHUB_API_URL = 'https://api.github.com'
const GITHUB_OAUTH_URL = 'https://github.com/login/oauth'

function required(name) {
  const value = process.env[name]
  if (!value) {
    const error = new Error(`${name} is required for GitHub OAuth`)
    error.statusCode = 500
    throw error
  }
  return value
}

function githubHeaders(accessToken) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${accessToken}`,
    'User-Agent': 'Novae API',
    'X-GitHub-Api-Version': '2022-11-28'
  }
}

async function githubJson(url, options) {
  const response = await fetch(url, options)
  const body = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(body.message || `GitHub request failed with status ${response.status}`)
    error.statusCode = response.status === 403 || response.status === 429 ? 503 : 502
    if (response.status === 403 || response.status === 429) error.code = 'GITHUB_RATE_LIMIT'
    throw error
  }

  return body
}

export function buildGithubAuthorizationUrl(state) {
  const url = new URL(`${GITHUB_OAUTH_URL}/authorize`)
  url.searchParams.set('client_id', required('GITHUB_CLIENT_ID'))
  url.searchParams.set(
    'redirect_uri',
    `${(process.env.BACKEND_URL || 'http://localhost:3000').replace(/\/$/, '')}/auth/callback`
  )
  url.searchParams.set('scope', 'read:user repo')
  url.searchParams.set('state', state)
  return url.toString()
}

export async function exchangeGithubCode(code) {
  const body = await githubJson(`${GITHUB_OAUTH_URL}/access_token`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: required('GITHUB_CLIENT_ID'),
      client_secret: required('GITHUB_CLIENT_SECRET'),
      code
    })
  })

  if (!body.access_token) {
    const error = new Error(body.error_description || 'GitHub did not return an access token')
    error.statusCode = 502
    throw error
  }

  return body.access_token
}

export async function fetchAuthenticatedGithubData(accessToken) {
  const headers = githubHeaders(accessToken)
  const [user, repos] = await Promise.all([
    githubJson(`${GITHUB_API_URL}/user`, { headers }),
    githubJson(`${GITHUB_API_URL}/user/repos?per_page=100&sort=updated`, { headers })
  ])

  return {
    user,
    repos: repos.map((repo) => ({
      ...repo,
      commit_count: Math.floor((repo.size || 0) / 5),
      contributor_count: 1,
      collab_username: null
    }))
  }
}
