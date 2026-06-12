import { fetchGithubData } from '../services/novaeGitHubService.js'
import { getOrCreateNovaeStar } from '../services/novaeWorldService.js'

const usernameSchema = {
  type: 'string',
  minLength: 1,
  maxLength: 39,
  pattern: '^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$'
}

export default async function authRoutes(fastify) {
  fastify.post(
    '/login',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['username'],
          properties: {
            username: usernameSchema
          }
        }
      }
    },
    async (request) => {
      const githubData = await fetchGithubData(request.body.username)
      const { novae_star: novaeStar } = await getOrCreateNovaeStar(githubData)
      const token = fastify.jwt.sign(
        {
          username: novaeStar.github_username,
          novaeStarId: novaeStar.id
        },
        { expiresIn: '1h' }
      )

      return { token }
    }
  )
}
