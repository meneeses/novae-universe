export const up = (pgm) => {
  pgm.createTable('novae_worlds', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()')
    },
    novae_star_id: {
      type: 'uuid',
      notNull: true,
      references: '"novae_stars"',
      onDelete: 'CASCADE'
    },
    github_username: { type: 'text', notNull: true },
    repo_name: { type: 'text', notNull: true },
    repo_full_name: { type: 'text', notNull: true, unique: true },
    description: { type: 'text' },
    language: { type: 'text' },
    html_url: { type: 'text' },
    commit_count: { type: 'integer', default: 0 },
    stars_count: { type: 'integer', default: 0 },
    forks_count: { type: 'integer', default: 0 },
    contributor_count: { type: 'integer', default: 1 },
    world_type: {
      type: 'text',
      notNull: true,
      check: "world_type IN ('asteroid','dwarf','rocky','large','ringed','gaseous','giant')"
    },
    orbit_radius: { type: 'float', notNull: true },
    orbit_speed: { type: 'float', notNull: true },
    orbit_offset: { type: 'float', notNull: true },
    is_collab: { type: 'boolean', default: false },
    collab_username: { type: 'text' },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()')
    }
  })
}

export const down = (pgm) => {
  pgm.dropTable('novae_worlds')
}
