import { getGithubProfile } from '../services/githubService.js'
import { getOrCreatePlanet } from '../services/planetService.js'

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
      const githubData = await getGithubProfile(request.body.username)
      const planet = await getOrCreatePlanet(githubData)
      const token = fastify.jwt.sign(
        {
          username: planet.github_username,
          planetId: planet.id
        },
        { expiresIn: '1h' }
      )

      return { token }
    }
  )
}
