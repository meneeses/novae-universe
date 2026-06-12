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
      onDelete: 'CASCADE'
    },
    novae_star_b_id: {
      type: 'uuid',
      notNull: true,
      references: '"novae_stars"',
      onDelete: 'CASCADE'
    },
    shared_repo_full_name: { type: 'text', notNull: true },
    novae_world_id: {
      type: 'uuid',
      references: '"novae_worlds"',
      onDelete: 'SET NULL'
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()')
    }
  })

  pgm.addConstraint('novae_binaries', 'unique_binary_pair', {
    unique: ['novae_star_a_id', 'novae_star_b_id']
  })
  pgm.addConstraint('novae_binaries', 'canonical_binary_pair', {
    check: 'novae_star_a_id < novae_star_b_id'
  })
  pgm.createIndex('novae_binaries', ['novae_star_a_id', 'novae_star_b_id'], {
    name: 'idx_novae_binary_stars'
  })

  pgm.sql(`
    ALTER TABLE novae_binaries ENABLE ROW LEVEL SECURITY;
    REVOKE ALL ON TABLE novae_binaries FROM anon, authenticated;
    GRANT SELECT ON TABLE novae_binaries TO anon, authenticated;

    CREATE POLICY "public_read_novae_binaries"
      ON novae_binaries FOR SELECT TO anon, authenticated USING (true);

    CREATE POLICY "service_write_novae_binaries"
      ON novae_binaries FOR ALL TO service_role
      USING (true) WITH CHECK (true);
  `)
}

export const down = (pgm) => {
  pgm.dropTable('novae_binaries')
}
