import crypto from 'node:crypto'
import { authenticate } from '../middlewares/auth.js'
import {
  buildGithubAuthorizationUrl,
  exchangeGithubCode,
  fetchAuthenticatedGithubData
} from '../services/authService.js'
import {
  findNovaeStarByUsername,
  listNovaeWorldsByUsername,
  registerNovaeStar
} from '../services/novaeWorldService.js'

const oauthStates = new Map()
const STATE_TTL_MS = 10 * 60 * 1000

function frontendUrl(path = '/') {
  return new URL(path, process.env.FRONTEND_URL || 'http://localhost:5173')
}

function callbackError(reply, code, message) {
  const url = frontendUrl('/')
  url.searchParams.set('oauth_error', code)
  url.searchParams.set('message', message)
  return reply.redirect(url.toString())
}

function consumeState(state) {
  const createdAt = oauthStates.get(state)
  oauthStates.delete(state)
  return Boolean(createdAt && Date.now() - createdAt < STATE_TTL_MS)
}

export default async function authRoutes(fastify) {
  fastify.get('/github', async (_request, reply) => {
    const state = crypto.randomUUID()
    oauthStates.set(state, Date.now())

    for (const [savedState, createdAt] of oauthStates) {
      if (Date.now() - createdAt >= STATE_TTL_MS) oauthStates.delete(savedState)
    }

    return reply.redirect(buildGithubAuthorizationUrl(state))
  })

  fastify.get('/callback', async (request, reply) => {
    const { code, state, error } = request.query

    if (error) {
      if (!state || !consumeState(state)) {
        return callbackError(reply, 'invalid_state', 'Security validation failed. Please try again.')
      }
      return callbackError(reply, 'oauth_cancelled', 'GitHub sign-in was cancelled.')
    }

    if (!code || !state || !consumeState(state)) {
      return callbackError(reply, 'invalid_state', 'Security validation failed. Please try again.')
    }

    try {
      const accessToken = await exchangeGithubCode(code)
      const { user, repos } = await fetchAuthenticatedGithubData(accessToken)
      await registerNovaeStar({ user, repos })

      const token = fastify.jwt.sign(
        {
          github_id: user.id,
          username: user.login,
          avatar: user.avatar_url
        },
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      )

      const url = frontendUrl('/auth/callback')
      url.searchParams.set('token', token)
      url.searchParams.set('username', user.login)
      return reply.redirect(url.toString())
    } catch (requestError) {
      request.log.error(requestError)
      const isRateLimited = requestError.code === 'GITHUB_RATE_LIMIT'
      return callbackError(
        reply,
        isRateLimited ? 'github_rate_limit' : 'github_unavailable',
        isRateLimited
          ? 'GitHub rate limit reached. Please try again in about one hour.'
          : 'GitHub is unavailable right now. Please try again.'
      )
    }
  })

  fastify.get('/me', { preHandler: authenticate }, async (request, reply) => {
    const star = await findNovaeStarByUsername(request.user.username)
    if (!star) return reply.code(404).send({ error: 'Star not found' })

    const planets = await listNovaeWorldsByUsername(request.user.username)
    return {
      user: {
        github_id: request.user.github_id,
        username: request.user.username,
        avatar: request.user.avatar || star.avatar_url
      },
      star,
      planets: planets || []
    }
  })

  fastify.post('/logout', async () => ({ ok: true }))
}
