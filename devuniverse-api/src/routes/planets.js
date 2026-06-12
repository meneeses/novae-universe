import { authenticate } from '../middlewares/auth.js'
import { getGithubProfile } from '../services/githubService.js'
import {
  findPlanetByUsername,
  listPlanets,
  registerPlanet
} from '../services/planetService.js'

const usernameProperty = {
  type: 'string',
  minLength: 1,
  maxLength: 39,
  pattern: '^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$'
}

const usernameParamsSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['username'],
  properties: {
    username: usernameProperty
  }
}

export default async function planetRoutes(fastify) {
  fastify.get(
    '/',
    {
      schema: {
        querystring: {
          type: 'object',
          additionalProperties: false,
          properties: {}
        }
      }
    },
    async () => listPlanets()
  )

  fastify.get(
    '/:username',
    {
      schema: {
        params: usernameParamsSchema
      }
    },
    async (request, reply) => {
      const planet = await findPlanetByUsername(request.params.username)

      if (!planet) {
        return reply.code(404).send({ error: 'Planet not found' })
      }

      return planet
    }
  )

  fastify.post(
    '/register',
    {
      preHandler: authenticate,
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['username'],
          properties: {
            username: usernameProperty
          }
        }
      }
    },
    async (request, reply) => {
      if (request.user.username.toLowerCase() !== request.body.username.toLowerCase()) {
        return reply.code(403).send({ error: 'JWT does not belong to this username' })
      }

      const githubData = await getGithubProfile(request.body.username)
      const planet = await registerPlanet(githubData)
      return reply.code(201).send(planet)
    }
  )
}
