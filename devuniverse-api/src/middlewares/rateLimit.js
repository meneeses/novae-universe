export const rateLimitOptions = {
  global: true,
  max: 30,
  timeWindow: '1 minute',
  keyGenerator: (request) => request.ip,
  errorResponseBuilder: () => ({
    statusCode: 429,
    error: 'Too Many Requests',
    message: 'Rate limit exceeded. Try again in one minute.'
  })
}
