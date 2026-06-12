import { supabase } from '../db/supabase.js'
import { generatePlanetProps, generatePosition } from './planetGenerator.js'

const PUBLIC_PLANET_FIELDS =
  'id, github_username, display_name, position_x, position_z, primary_language, total_stars, repo_count, followers, account_age_days, languages_json'

function normalizeUsername(username) {
  return username.trim().toLowerCase()
}

function throwDatabaseError(error) {
  const databaseError = new Error('Database operation failed')
  databaseError.statusCode = 500
  databaseError.cause = error
  throw databaseError
}

export async function listPlanets() {
  const { data, error } = await supabase
    .from('planets')
    .select(PUBLIC_PLANET_FIELDS)
    .order('created_at', { ascending: true })

  if (error) throwDatabaseError(error)

  return data.map(({ github_username, ...planet }) => ({
    ...planet,
    username: github_username
  }))
}

export async function findPlanetByUsername(username) {
  const { data, error } = await supabase
    .from('planets')
    .select('*')
    .eq('github_username', normalizeUsername(username))
    .maybeSingle()

  if (error) throwDatabaseError(error)
  return data
}

export async function registerPlanet(githubData) {
  const username = normalizeUsername(githubData.login)
  const props = generatePlanetProps(githubData)
  const position = generatePosition(username)
  const planet = {
    github_username: username,
    display_name: githubData.name,
    avatar_url: githubData.avatar_url,
    position_x: position.x,
    position_z: position.z,
    primary_language: props.primaryLanguage,
    total_stars: props.totalStars,
    repo_count: githubData.public_repos,
    followers: githubData.followers,
    account_age_days: props.accountAgeDays,
    languages_json: props.languages,
    last_seen: new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('planets')
    .upsert(planet, { onConflict: 'github_username' })
    .select()
    .single()

  if (error) throwDatabaseError(error)
  return data
}

export async function getOrCreatePlanet(githubData) {
  return registerPlanet(githubData)
}
