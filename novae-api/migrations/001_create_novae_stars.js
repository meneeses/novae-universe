export const up = (pgm) => {
  pgm.createTable('novae_stars', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()')
    },
    github_username: { type: 'text', notNull: true, unique: true },
    display_name: { type: 'text' },
    avatar_url: { type: 'text' },
    bio: { type: 'text' },
    position_x: { type: 'float', notNull: true },
    position_z: { type: 'float', notNull: true },
    star_color: { type: 'text', default: "'#ffdd44'" },
    star_size: { type: 'float', default: 1.0 },
    star_type: {
      type: 'text',
      default: "'main_sequence'",
      check: "star_type IN ('dwarf','main_sequence','giant','supergiant','nebula')"
    },
    total_repos: { type: 'integer', default: 0 },
    total_commits: { type: 'integer', default: 0 },
    followers: { type: 'integer', default: 0 },
    primary_language: { type: 'text' },
    account_age_days: { type: 'integer', default: 0 },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()')
    },
    last_seen: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()')
    }
  })
}

export const down = (pgm) => {
  pgm.dropTable('novae_stars', { cascade: true })
}
