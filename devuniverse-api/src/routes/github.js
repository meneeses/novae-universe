import { getGithubProfile } from '../services/githubService.js'

const usernameParamsSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['username'],
  properties: {
    username: {
      type: 'string',
      minLength: 1,
      maxLength: 39,
      pattern: '^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$'
    }
  }
}

export default async function githubRoutes(fastify) {
  fastify.get(
    '/:username',
    {
      schema: {
        params: usernameParamsSchema
      }
    },
    async (request) => getGithubProfile(request.params.username)
  )
}
