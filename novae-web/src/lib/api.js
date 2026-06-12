import { useAuthStore } from '../store/authStore'

export const API_BASE_URL = (import.meta.env.NOVAE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '')
const TIMEOUT_MS = 10_000

function redirectToLanding() {
  useAuthStore.getState().logout()
  window.history.replaceState({}, '', '/')
  window.dispatchEvent(new PopStateEvent('popstate'))
}

async function execute(path, options) {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), TIMEOUT_MS)
  const token = useAuthStore.getState().token

  try {
    return await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })
  } finally {
    window.clearTimeout(timeout)
  }
}

async function request(path, options = {}) {
  let response

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      response = await execute(path, options)
      break
    } catch (error) {
      if (attempt === 1) {
        throw new Error(
          error.name === 'AbortError'
            ? 'The request timed out. Please try again.'
            : 'Could not connect to the universe. Please try again.',
          { cause: error }
        )
      }
    }
  }

  const body = await response.json().catch(() => null)
  if (response.ok) return body

  if (response.status === 401) {
    redirectToLanding()
    throw new Error('Your session expired. Please sign in again.')
  }
  if (response.status === 429 || response.status === 503) {
    throw new Error('GitHub rate limit reached. Please try again in about one hour.')
  }
  throw new Error(body?.message ?? body?.error ?? `Request failed with status ${response.status}.`)
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, {
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body)
  }),
  delete: (path) => request(path, { method: 'DELETE' })
}
