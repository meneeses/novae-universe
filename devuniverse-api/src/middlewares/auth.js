export async function authenticate(request, reply) {
  try {
    await request.jwtVerify()
  } catch {
    return reply.code(401).send({ error: 'Invalid or missing JWT' })
  }
}
