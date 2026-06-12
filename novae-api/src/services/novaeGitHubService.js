import fetch from 'node-fetch'

const GITHUB_API_URL = 'https://api.github.com'

function requestHeaders() {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'Novae API',
    'X-GitHub-Api-Version': '2022-11-28'
  }

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  }

  return headers
}

function githubUrl(path) {
  return path.startsWith('http') ? path : `${GITHUB_API_URL}${path}`
}

export async function githubFetch(path) {
  const response = await fetch(githubUrl(path), { headers: requestHeaders() })

  if (response.status === 404) {
    const error = new Error('GitHub user or repository not found')
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

async function githubGet(path) {
  const response = await githubFetch(path)
  return response.json()
}

function commitCountFromResponse(response, repoSize) {
  const linkHeader = response.headers.get('link') || ''
  const match = linkHeader.match(/[?&]page=(\d+)>;\s*rel="last"/)
  return match ? Number.parseInt(match[1], 10) : Math.floor(repoSize / 10)
}

export async function fetchGithubData(username) {
  const normalizedUsername = username.trim()
  const encodedUsername = encodeURIComponent(normalizedUsername)
  const [user, repos] = await Promise.all([
    githubGet(`/users/${encodedUsername}`),
    githubGet(`/users/${encodedUsername}/repos?per_page=100&sort=updated&type=owner`)
  ])

  const topRepos = repos
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 20)

  const reposWithCommits = await Promise.all(
    topRepos.map(async (repo) => {
      let contributor_count = 1
      let collab_username = null

      if (repo.forks_count > 10) {
        try {
          const contributors = await githubGet(
            `/repos/${encodedUsername}/${encodeURIComponent(repo.name)}/contributors?per_page=10`
          )
          contributor_count = contributors.length
          collab_username = contributors.find(
            (contributor) => contributor.login?.toLowerCase() !== normalizedUsername.toLowerCase()
          )?.login ?? null
        } catch {
          contributor_count = 1
        }
      }

      if (repo.stargazers_count >= 10 || repo.size > 500) {
        try {
          const response = await githubFetch(
            `/repos/${encodedUsername}/${encodeURIComponent(repo.name)}/commits?per_page=1`
          )
          return {
            ...repo,
            commit_count: commitCountFromResponse(response, repo.size),
            contributor_count,
            collab_username
          }
        } catch {
          return {
            ...repo,
            commit_count: Math.floor(repo.size / 10),
            contributor_count,
            collab_username
          }
        }
      }

      return {
        ...repo,
        commit_count: Math.floor(repo.size / 5),
        contributor_count,
        collab_username
      }
    })
  )

  return { user, repos: reposWithCommits }
}

export const getGithubProfile = fetchGithubData
