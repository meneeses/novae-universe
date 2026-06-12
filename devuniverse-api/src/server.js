import 'dotenv/config'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import Fastify from 'fastify'
import { rateLimitOptions } from './middlewares/rateLimit.js'
import authRoutes from './routes/auth.js'
import githubRoutes from './routes/github.js'
import planetRoutes from './routes/planets.js'

const requiredEnvironmentVariables = [
  'JWT_SECRET',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
]

for (const variable of requiredEnvironmentVariables) {
  if (!process.env[variable]) {
    throw new Error(`${variable} is required`)
  }
}

const fastify = Fastify({
  logger: true,
  routerOptions: {
    ignoreTrailingSlash: true
  },
  trustProxy: false
})

await fastify.register(cors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
})
await fastify.register(helmet, { contentSecurityPolicy: false })
await fastify.register(jwt, { secret: process.env.JWT_SECRET })
await fastify.register(rateLimit, rateLimitOptions)

fastify.get(
  '/health',
  {
    schema: {
      querystring: {
        type: 'object',
        additionalProperties: false,
        properties: {}
      }
    }
  },
  async () => ({ status: 'ok', timestamp: new Date() })
)

await fastify.register(authRoutes, { prefix: '/auth' })
await fastify.register(planetRoutes, { prefix: '/planets' })
await fastify.register(githubRoutes, { prefix: '/github' })

fastify.setErrorHandler((error, request, reply) => {
  request.log.error(error)

  if (error.validation) {
    return reply.code(400).send({
      error: 'Invalid request',
      details: error.validation.map(({ instancePath, message }) => ({
        field: instancePath || 'request',
        message
      }))
    })
  }

  const statusCode = error.statusCode && error.statusCode >= 400 ? error.statusCode : 500
  return reply.code(statusCode).send({
    error: statusCode === 500 ? 'Internal server error' : error.message
  })
})

const port = Number(process.env.PORT ?? 3333)

process.on('SIGTERM', async () => {
  await fastify.close()
  process.exit(0)
})

try {
  await fastify.listen({ port, host: '0.0.0.0' })
} catch (error) {
  fastify.log.error(error)
  process.exit(1)
}
