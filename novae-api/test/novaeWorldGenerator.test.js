import assert from 'node:assert/strict'
import test from 'node:test'
import {
  generateNovaeWorldFromRepo,
  generateNovaePosition,
  generateNovaeStarProps,
  getMoonCount,
  getNovaeWorldSize,
  getNovaeWorldType,
  getRingCount
} from '../src/services/novaeWorldGenerator.js'

test('Novae Star position is deterministic, case insensitive, and galaxy distributed', () => {
  const position = generateNovaePosition('TestDev')

  assert.deepEqual(position, generateNovaePosition('testdev'))
  assert.ok(Math.hypot(position.x, position.z) >= 60)
  assert.ok(Math.hypot(position.x, position.z) < 160)
})

test('Novae Star properties use commits and primary repository language', () => {
  const user = {
    repos: [
      { language: 'Python' },
      { language: 'Python' },
      { language: 'JavaScript' }
    ]
  }

  assert.deepEqual(
    [50, 200, 800, 3000, 6000].map((commits) => generateNovaeStarProps(user, commits).type),
    ['dwarf', 'main_sequence', 'main_sequence', 'giant', 'supergiant']
  )
  assert.deepEqual(
    [50, 200, 800, 3000, 6000].map((commits) => generateNovaeStarProps(user, commits).size),
    [0.6, 0.9, 1.2, 1.6, 2.2]
  )

  const props = generateNovaeStarProps(user, 800)
  assert.equal(props.primaryLanguage, 'Python')
  assert.equal(props.color, '#ff9944')
  assert.ok(props.coronaIntensity >= 0.3 && props.coronaIntensity <= 1)
})

test('commit count maps to all seven Novae World types and visual sizes', () => {
  assert.deepEqual(
    [0, 10, 100, 1000, 1500, 2000, 3000].map(getNovaeWorldType),
    ['asteroid', 'dwarf', 'rocky', 'large', 'ringed', 'gaseous', 'giant']
  )
  assert.deepEqual(
    [0, 10, 100, 500, 1000, 1500, 2000, 3000].map(getNovaeWorldSize),
    [0.08, 0.18, 0.32, 0.48, 0.62, 0.8, 1, 1.3]
  )
})

test('ring and moon counts cover their complete ranges', () => {
  assert.deepEqual([0, 1500, 2000, 2500, 3000].map(getRingCount), [0, 1, 2, 3, 4])
  assert.deepEqual([0, 5, 20, 100, 500].map(getMoonCount), [0, 1, 2, 3, 4])
})

test('Novae World generation is deterministic and maps repository stats', () => {
  const repo = {
    name: 'orbit',
    description: 'A test repository',
    language: 'TypeScript',
    html_url: 'https://github.com/testdev/orbit',
    commit_count: 1700,
    stargazers_count: 120,
    forks_count: 12,
    contributor_count: 6,
    collab_username: 'collabdev'
  }

  const first = generateNovaeWorldFromRepo(repo, 'novae-star-id', 'TestDev', 2)
  const second = generateNovaeWorldFromRepo(repo, 'novae-star-id', 'testdev', 2)

  assert.deepEqual(first, second)
  assert.equal(first.world_type, 'ringed')
  assert.equal(first.repo_full_name, 'testdev/orbit')
  assert.equal(first.is_collab, true)
  assert.equal(first.collab_username, 'collabdev')
  assert.equal(first._rings, 1)
  assert.equal(first._moons, 3)
  assert.deepEqual(first._colors, { base: '#4488cc', emissive: '#112244' })
})
