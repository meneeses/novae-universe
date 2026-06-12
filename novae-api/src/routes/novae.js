import { authenticate } from '../middlewares/auth.js'
import { fetchGithubData } from '../services/novaeGitHubService.js'
import {
  findNovaeStarByUsername,
  listNovaeWorlds,
  listNovaeWorldsByUsername,
  listNovaeStars,
  registerNovaeStar,
  scheduleSupernova
} from '../services/novaeWorldService.js'

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

const emptyQuerySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {}
}

export default async function novaeRoutes(fastify) {
  fastify.get(
    '/novae/worlds',
    {
      schema: {
        querystring: emptyQuerySchema
      }
    },
    async () => listNovaeWorlds()
  )

  fastify.get(
    '/novae/stars',
    {
      schema: {
        querystring: emptyQuerySchema
      }
    },
    async () => listNovaeStars()
  )

  fastify.get(
    '/novae/stars/:username',
    {
      schema: {
        params: usernameParamsSchema
      }
    },
    async (request, reply) => {
      const novaeStar = await findNovaeStarByUsername(request.params.username)

      if (!novaeStar) {
        return reply.code(404).send({ error: 'Novae Star not found' })
      }

      return novaeStar
    }
  )

  fastify.get(
    '/novae/stars/:username/worlds',
    {
      schema: {
        params: usernameParamsSchema
      }
    },
    async (request, reply) => {
      const worlds = await listNovaeWorldsByUsername(request.params.username)

      if (!worlds) {
        return reply.code(404).send({ error: 'Novae Star not found' })
      }

      return worlds
    }
  )

  fastify.post(
    '/novae/stars/register',
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

      const githubData = await fetchGithubData(request.body.username)
      const system = await registerNovaeStar(githubData)
      return reply.code(201).send(system)
    }
  )

  fastify.delete(
    '/novae/stars/:username',
    {
      preHandler: authenticate,
      schema: {
        params: usernameParamsSchema
      }
    },
    async (request, reply) => {
      if (request.user.username.toLowerCase() !== request.params.username.toLowerCase()) {
        return reply.code(403).send({ error: 'JWT does not belong to this username' })
      }

      const novaeStar = await scheduleSupernova(request.params.username)
      if (!novaeStar) return reply.code(404).send({ error: 'Novae Star not found' })
      return novaeStar
    }
  )
}
