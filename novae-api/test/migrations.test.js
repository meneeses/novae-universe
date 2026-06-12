import assert from 'node:assert/strict'
import { readdir } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { MigrationBuilder } from 'node-pg-migrate'

const migrationsDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'migrations')

function builder() {
  return new MigrationBuilder(
    { query: async () => ({ rows: [] }) },
    undefined,
    true,
    console
  )
}

test('all migrations generate reversible SQL', async () => {
  const files = (await readdir(migrationsDirectory))
    .filter((file) => /^\d{3}_.+\.js$/.test(file))
    .sort()

  assert.deepEqual(files, [
    '001_create_stars.js',
    '002_create_planets.js',
    '003_add_star_indexes.js',
    '004_add_supernova_status.js',
    '005_add_binary_systems.js',
    '006_add_register_star_rpc.js',
    '007_add_star_status.js',
    '008_repair_missing_novae_schema.js'
  ])

  for (const file of files) {
    const migration = await import(pathToFileURL(path.join(migrationsDirectory, file)))

    assert.equal(typeof migration.up, 'function', `${file} must export up`)
    assert.equal(typeof migration.down, 'function', `${file} must export down`)

    const upBuilder = builder()
    await migration.up(upBuilder)
    assert.ok(upBuilder.getSqlSteps().length > 0, `${file} up must generate SQL`)

    const downBuilder = builder()
    await migration.down(downBuilder)
    assert.ok(downBuilder.getSqlSteps().length > 0, `${file} down must generate SQL`)
  }
})
