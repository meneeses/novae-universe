export const up = (pgm) => {
  pgm.createTable('novae_binaries', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()')
    },
    novae_star_a_id: {
      type: 'uuid',
      notNull: true,
      references: '"novae_stars"',
      onDelete: 'cascade'
    },
    novae_star_b_id: {
      type: 'uuid',
      notNull: true,
      references: '"novae_stars"',
      onDelete: 'cascade'
    },
    shared_repo_full_name: { type: 'text', notNull: true },
    novae_world_id: {
      type: 'uuid',
      notNull: true,
      references: '"novae_worlds"',
      onDelete: 'cascade'
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()')
    }
  })

  pgm.addConstraint('novae_binaries', 'uq_novae_binaries_pair', {
    unique: ['novae_star_a_id', 'novae_star_b_id']
  })
}

export const down = (pgm) => {
  pgm.dropTable('novae_binaries', { cascade: true })
}