import 'dotenv/config'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import Fastify from 'fastify'
import { rateLimitOptions } from './middlewares/rateLimit.js'
import authRoutes from './routes/auth.js'
import githubRoutes from './routes/github.js'
import novaeRoutes from './routes/novae.js'

const jwtSecret = process.env.JWT_SECRET || process.env.NOVAE_JWT_SECRET
if (!jwtSecret) throw new Error('JWT_SECRET is required')

const fastify = Fastify({
  logger: true,
  routerOptions: {
    ignoreTrailingSlash: true
  },
  trustProxy: false
})

await fastify.register(cors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
})
await fastify.register(helmet, { contentSecurityPolicy: false })
await fastify.register(jwt, { secret: jwtSecret })
await fastify.register(rateLimit, rateLimitOptions)

fastify.get(
  '/novae/health',
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
await fastify.register(novaeRoutes)
await fastify.register(githubRoutes, { prefix: '/novae/github' })

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

const port = Number(process.env.PORT ?? 3000)

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
