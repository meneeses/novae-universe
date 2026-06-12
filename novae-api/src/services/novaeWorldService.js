import { supabase } from '../db/supabase.js'
import {
  generateNovaeWorldFromRepo,
  generateNovaePosition,
  generateNovaeStarProps
} from './novaeWorldGenerator.js'

const PUBLIC_STAR_FIELDS =
  'id, github_username, display_name, position_x, position_z, star_color, star_size, star_type, status, supernova_at, total_repos, total_commits, followers, primary_language'

function normalizeUsername(username) {
  return username.trim().toLowerCase()
}

function throwDatabaseError(error) {
  const databaseError = new Error('Database operation failed')
  databaseError.statusCode = 500
  databaseError.cause = error
  throw databaseError
}

export async function listNovaeStars() {
  const nebulaThreshold = new Date(Date.now() - 6000).toISOString()
  const { error: nebulaError } = await supabase
    .from('novae_stars')
    .update({ status: 'nebula' })
    .eq('status', 'supernova')
    .lte('supernova_at', nebulaThreshold)

  if (nebulaError) throwDatabaseError(nebulaError)

  const { error: cleanupError } = await supabase
    .from('novae_stars')
    .delete()
    .lte('supernova_scheduled_delete', new Date().toISOString())

  if (cleanupError) throwDatabaseError(cleanupError)

  const { data, error } = await supabase
    .from('novae_stars')
    .select(PUBLIC_STAR_FIELDS)
    .order('created_at', { ascending: true })

  if (error) throwDatabaseError(error)

  return data.map(({ github_username, ...star }) => ({
    ...star,
    username: github_username
  }))
}

export async function findNovaeStarByUsername(username) {
  const { data, error } = await supabase
    .from('novae_stars')
    .select('*')
    .eq('github_username', normalizeUsername(username))
    .maybeSingle()

  if (error) throwDatabaseError(error)
  return data
}

export async function listNovaeWorldsByUsername(username) {
  const novaeStar = await findNovaeStarByUsername(username)
  if (!novaeStar) return null

  const { data, error } = await supabase
    .from('novae_worlds')
    .select('*')
    .eq('novae_star_id', novaeStar.id)
    .order('orbit_radius', { ascending: true })

  if (error) throwDatabaseError(error)
  return data
}

export async function listNovaeWorlds() {
  const { data, error } = await supabase
    .from('novae_worlds')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throwDatabaseError(error)
  return data
}

export async function registerNovaeStar(githubData) {
  const { user, repos } = githubData
  const username = normalizeUsername(user.login)
  const existingStar = await findNovaeStarByUsername(username)
  const isDeadStar = existingStar?.status === 'supernova' || existingStar?.status === 'nebula'
  const totalCommits = repos.reduce((sum, repo) => sum + (repo.commit_count ?? 0), 0)
  const starProps = generateNovaeStarProps({ ...user, repos }, totalCommits)
  const position = generateNovaePosition(username)
  const novaeStar = {
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
    account_age_days: Math.max(
      0,
      Math.floor((Date.now() - new Date(user.created_at).getTime()) / 86400000)
    ),
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
  const candidateUsernames = [...new Set(
    worlds.filter((world) => world.is_collab).map((world) => world.collab_username)
  )]

  if (candidateUsernames.length) {
    const { data: registeredCollaborators, error: collaboratorError } = await supabase
      .from('novae_stars')
      .select('github_username')
      .in('github_username', candidateUsernames)

    if (collaboratorError) throwDatabaseError(collaboratorError)
    const registered = new Set(registeredCollaborators.map(({ github_username }) => github_username))
    for (const world of worlds) {
      if (world.is_collab && !registered.has(world.collab_username)) {
        world.is_collab = false
        world.collab_username = null
      }
    }
  }

  const { data, error } = await supabase.rpc('register_novae_star_with_worlds', {
    novae_star_payload: novaeStar,
    worlds_payload: worlds
  })

  if (error) throwDatabaseError(error)
  await syncNovaeBinaries(data.novae_star, data.novae_worlds)
  return data
}

async function syncNovaeBinaries(novaeStar, worlds) {
  const collabs = worlds.filter((world) => world.is_collab && world.collab_username)
  if (!collabs.length) return

  const { data: collaborators, error } = await supabase
    .from('novae_stars')
    .select('id, github_username')
    .in('github_username', collabs.map((world) => world.collab_username))

  if (error) throwDatabaseError(error)
  const byUsername = new Map(collaborators.map((item) => [item.github_username, item]))
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
  const { error: upsertError } = await supabase
    .from('novae_binaries')
    .upsert(novaeBinaries, { onConflict: 'novae_star_a_id,novae_star_b_id' })

  if (upsertError) throwDatabaseError(upsertError)
}

export async function scheduleSupernova(username) {
  const now = new Date()
  const scheduledDelete = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const { data, error } = await supabase
    .from('novae_stars')
    .update({
      status: 'supernova',
      star_type: 'nebula',
      supernova_at: now.toISOString(),
      supernova_scheduled_delete: scheduledDelete.toISOString()
    })
    .eq('github_username', normalizeUsername(username))
    .select()
    .maybeSingle()

  if (error) throwDatabaseError(error)
  return data
}

export const getOrCreateNovaeStar = registerNovaeStar
