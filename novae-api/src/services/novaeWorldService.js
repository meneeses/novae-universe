import { withDatabaseClient } from '../db/postgres.js'
import {
  generateNovaeWorldFromRepo,
  generateNovaePosition,
  generateNovaeStarProps
} from './novaeWorldGenerator.js'

const PUBLIC_STAR_FIELDS = 'id, github_username, display_name, position_x, position_z, star_color, star_size, star_type, status, supernova_at, total_repos, total_commits, followers, primary_language'

function normalizeUsername(username) {
  return username.trim().toLowerCase()
}

function throwDatabaseError(error) {
  const databaseError = new Error('Database operation failed')
  databaseError.statusCode = 500
  databaseError.cause = error
  throw databaseError
}

async function runTransaction(work) {
  return withDatabaseClient(async (client) => {
    await client.query('BEGIN')
    try {
      const result = await work(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }
  })
}

async function findNovaeStarByUsernameOnClient(client, username) {
  const { rows } = await client.query('SELECT * FROM novae_stars WHERE github_username = $1 LIMIT 1', [normalizeUsername(username)])
  return rows[0] ?? null
}

function buildWorldInsertQuery(novaeStarId, worlds) {
  const columns = [
    'novae_star_id',
    'github_username',
    'repo_name',
    'repo_full_name',
    'description',
    'language',
    'html_url',
    'commit_count',
    'stars_count',
    'forks_count',
    'contributor_count',
    'world_type',
    'orbit_radius',
    'orbit_speed',
    'orbit_offset',
    'is_collab',
    'collab_username'
  ]

  const values = []
  const rows = worlds.map((world, index) => {
    const offset = index * columns.length
    values.push(
      novaeStarId,
      world.github_username,
      world.repo_name,
      world.repo_full_name,
      world.description,
      world.language,
      world.html_url,
      world.commit_count,
      world.stars_count,
      world.forks_count,
      world.contributor_count,
      world.world_type,
      world.orbit_radius,
      world.orbit_speed,
      world.orbit_offset,
      world.is_collab,
      world.collab_username
    )
    return `(${columns.map((_, columnIndex) => `$${offset + columnIndex + 1}`).join(', ')})`
  })

  return {
    text: `INSERT INTO novae_worlds (${columns.join(', ')}) VALUES ${rows.join(', ')} RETURNING *`,
    values
  }
}

export async function listNovaeStars() {
  return runTransaction(async (client) => {
    try {
      const nebulaThreshold = new Date(Date.now() - 6000).toISOString()
      const cleanupThreshold = new Date().toISOString()

      await client.query(
        "UPDATE novae_stars SET status = 'nebula' WHERE status = 'supernova' AND supernova_at <= $1",
        [nebulaThreshold]
      )
      await client.query('DELETE FROM novae_stars WHERE supernova_scheduled_delete <= $1', [cleanupThreshold])

      const { rows } = await client.query(`SELECT ${PUBLIC_STAR_FIELDS} FROM novae_stars ORDER BY created_at ASC`)
      return rows.map(({ github_username, ...star }) => ({
        ...star,
        username: github_username
      }))
    } catch (error) {
      throwDatabaseError(error)
    }
  })
}

export async function findNovaeStarByUsername(username) {
  return withDatabaseClient(async (client) => {
    try {
      return await findNovaeStarByUsernameOnClient(client, username)
    } catch (error) {
      throwDatabaseError(error)
    }
  })
}

export async function listNovaeWorldsByUsername(username) {
  return withDatabaseClient(async (client) => {
    try {
      const novaeStar = await findNovaeStarByUsernameOnClient(client, username)
      if (!novaeStar) return null

      const { rows } = await client.query(
        'SELECT * FROM novae_worlds WHERE novae_star_id = $1 ORDER BY orbit_radius ASC',
        [novaeStar.id]
      )

      return rows
    } catch (error) {
      throwDatabaseError(error)
    }
  })
}

export async function listNovaeWorlds() {
  return withDatabaseClient(async (client) => {
    try {
      const { rows } = await client.query('SELECT * FROM novae_worlds ORDER BY created_at ASC')
      return rows
    } catch (error) {
      throwDatabaseError(error)
    }
  })
}

export async function registerNovaeStar(githubData) {
  const { user, repos } = githubData
  const username = normalizeUsername(user.login)
  const totalCommits = repos.reduce((sum, repo) => sum + (repo.commit_count ?? 0), 0)
  const starProps = generateNovaeStarProps({ ...user, repos }, totalCommits)
  const position = generateNovaePosition(username)
  const existingStar = await findNovaeStarByUsername(username)
  const isDeadStar = existingStar?.status === 'supernova' || existingStar?.status === 'nebula'

  const novaeStarPayload = {
    github_username: username,
    display_name: user.name,
    avatar_url: user.avatar_url,
    bio: user.bio,
    position_x: position.x,
    position_z: position.z,
    star_color: starProps.color,
    star_size: starProps.size,
    star_type: isDeadStar ? 'nebula' : starProps.type,
    total_repos: user.public_repos,
    total_commits: totalCommits,
    followers: user.followers,
    primary_language: starProps.primaryLanguage,
    account_age_days: Math.max(0, Math.floor((Date.now() - new Date(user.created_at).getTime()) / 86400000)),
    last_seen: new Date().toISOString()
  }

  const worlds = repos.map((repo, index) => {
    const {
      _size,
      _rings,
      _moons,
      _colors,
      _seed,
      ...world
    } = generateNovaeWorldFromRepo(repo, null, username, index)
    return world
  })

  const candidateUsernames = [...new Set(worlds.filter((world) => world.is_collab && world.collab_username).map((world) => world.collab_username))]

  if (candidateUsernames.length) {
    const collaboratorUsernames = await withDatabaseClient(async (client) => {
      try {
        const { rows } = await client.query(
          'SELECT github_username FROM novae_stars WHERE github_username = ANY($1::text[])',
          [candidateUsernames]
        )
        return rows.map(({ github_username }) => github_username)
      } catch (error) {
        throwDatabaseError(error)
      }
    })

    const registered = new Set(collaboratorUsernames)
    for (const world of worlds) {
      if (world.is_collab && !registered.has(world.collab_username)) {
        world.is_collab = false
        world.collab_username = null
      }
    }
  }

  const data = await runTransaction(async (client) => {
    try {
      const starResult = await client.query(
        `
          INSERT INTO novae_stars (
            github_username, display_name, avatar_url, bio, position_x, position_z,
            star_color, star_size, star_type, total_repos, total_commits, followers,
            primary_language, account_age_days, last_seen
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          ON CONFLICT (github_username) DO UPDATE SET
            display_name = EXCLUDED.display_name,
            avatar_url = EXCLUDED.avatar_url,
            bio = EXCLUDED.bio,
            position_x = EXCLUDED.position_x,
            position_z = EXCLUDED.position_z,
            star_color = EXCLUDED.star_color,
            star_size = EXCLUDED.star_size,
            star_type = EXCLUDED.star_type,
            total_repos = EXCLUDED.total_repos,
            total_commits = EXCLUDED.total_commits,
            followers = EXCLUDED.followers,
            primary_language = EXCLUDED.primary_language,
            account_age_days = EXCLUDED.account_age_days,
            last_seen = EXCLUDED.last_seen
          RETURNING *
        `,
        [
          novaeStarPayload.github_username,
          novaeStarPayload.display_name,
          novaeStarPayload.avatar_url,
          novaeStarPayload.bio,
          novaeStarPayload.position_x,
          novaeStarPayload.position_z,
          novaeStarPayload.star_color,
          novaeStarPayload.star_size,
          novaeStarPayload.star_type,
          novaeStarPayload.total_repos,
          novaeStarPayload.total_commits,
          novaeStarPayload.followers,
          novaeStarPayload.primary_language,
          novaeStarPayload.account_age_days,
          novaeStarPayload.last_seen
        ]
      )

      const novaeStar = starResult.rows[0]
      await client.query('DELETE FROM novae_worlds WHERE novae_star_id = $1', [novaeStar.id])

      const novaeWorldInsert = buildWorldInsertQuery(novaeStar.id, worlds)
      const novaeWorldResult = worlds.length
        ? await client.query(novaeWorldInsert.text, novaeWorldInsert.values)
        : { rows: [] }

      return {
        novae_star: novaeStar,
        novae_worlds: novaeWorldResult.rows
      }
    } catch (error) {
      throwDatabaseError(error)
    }
  })

  await syncNovaeBinaries(data.novae_star, data.novae_worlds)
  return data
}

async function syncNovaeBinaries(novaeStar, worlds) {
  const collabs = worlds.filter((world) => world.is_collab && world.collab_username)
  if (!collabs.length) return

  const collaboratorRows = await withDatabaseClient(async (client) => {
    try {
      const { rows } = await client.query(
        'SELECT id, github_username FROM novae_stars WHERE github_username = ANY($1::text[])',
        [collabs.map((world) => world.collab_username)]
      )
      return rows
    } catch (error) {
      throwDatabaseError(error)
    }
  })

  const byUsername = new Map(collaboratorRows.map((item) => [item.github_username, item]))
  const novaeBinariesByPair = new Map()

  for (const world of collabs) {
    const collaborator = byUsername.get(world.collab_username)
    if (!collaborator) continue
    const [novaeStarAId, novaeStarBId] = [novaeStar.id, collaborator.id].sort()
    novaeBinariesByPair.set(`${novaeStarAId}:${novaeStarBId}`, {
      novae_star_a_id: novaeStarAId,
      novae_star_b_id: novaeStarBId,
      shared_repo_full_name: world.repo_full_name,
      novae_world_id: world.id
    })
  }

  const novaeBinaries = [...novaeBinariesByPair.values()]
  if (!novaeBinaries.length) return

  await withDatabaseClient(async (client) => {
    try {
      const values = []
      const rows = novaeBinaries.map((binary, index) => {
        const offset = index * 4
        values.push(binary.novae_star_a_id, binary.novae_star_b_id, binary.shared_repo_full_name, binary.novae_world_id)
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`
      })

      await client.query(
        `
          INSERT INTO novae_binaries (
            novae_star_a_id, novae_star_b_id, shared_repo_full_name, novae_world_id
          )
          VALUES ${rows.join(', ')}
          ON CONFLICT (novae_star_a_id, novae_star_b_id) DO UPDATE SET
            shared_repo_full_name = EXCLUDED.shared_repo_full_name,
            novae_world_id = EXCLUDED.novae_world_id
        `,
        values
      )
    } catch (error) {
      throwDatabaseError(error)
    }
  })
}

export async function scheduleSupernova(username) {
  return runTransaction(async (client) => {
    try {
      const now = new Date()
      const scheduledDelete = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      const { rows } = await client.query(
        `
          UPDATE novae_stars
          SET status = 'supernova',
              star_type = 'nebula',
              supernova_at = $2,
              supernova_scheduled_delete = $3
          WHERE github_username = $1
          RETURNING *
        `,
        [normalizeUsername(username), now.toISOString(), scheduledDelete.toISOString()]
      )

      return rows[0] ?? null
    } catch (error) {
      throwDatabaseError(error)
    }
  })
}

export const getOrCreateNovaeStar = registerNovaeStar