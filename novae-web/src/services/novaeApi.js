import { useNovaeStore } from '../store/novaeStore'

const BASE_URL = (import.meta.env.NOVAE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '')

function decodeJwtPayload(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(decodeURIComponent(escape(atob(base64))))
  } catch {
    return null
  }
}

async function request(path, options = {}) {
  const token = useNovaeStore.getState().token
  let response

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })
  } catch {
    throw new Error('Could not connect to server. Try again.')
  }

  const body = await response.json().catch(() => null)
  if (response.ok) return body

  if (response.status === 404) throw new Error('GitHub user not found.')
  if (response.status === 429) throw new Error('Too many requests. Wait a moment.')
  throw new Error(body?.message ?? body?.error ?? `Request failed with status ${response.status}.`)
}

export async function login(username) {
  const data = await request('/novae/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username })
  })
  const payload = decodeJwtPayload(data.token)

  useNovaeStore.getState().setToken(data.token)
  useNovaeStore.getState().setCurrentUser(
    payload ? { username: payload.username, novaeStarId: payload.novaeStarId } : null
  )

  return data
}

export function fetchNovaeStars() {
  return request('/novae/stars')
}

export function fetchNovaeStar(username) {
  return request(`/novae/stars/${encodeURIComponent(username)}`)
}

export function fetchNovaeWorlds(username) {
  return request(`/novae/stars/${encodeURIComponent(username)}/worlds`)
}

export function triggerSupernova(username) {
  return request(`/novae/stars/${encodeURIComponent(username)}`, { method: 'DELETE' })
}

export function fetchGithubData(username) {
  return request(`/novae/github/${encodeURIComponent(username)}`)
}

export const fetchAllNovaeWorlds = () => request('/novae/worlds')
