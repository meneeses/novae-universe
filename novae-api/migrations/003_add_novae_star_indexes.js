export const up = (pgm) => {
  pgm.createIndex('novae_stars', ['position_x', 'position_z'], {
    name: 'idx_novae_stars_position'
  })
  pgm.createIndex('novae_worlds', 'novae_star_id', { name: 'idx_novae_worlds_star_id' })
  pgm.createIndex('novae_worlds', 'github_username', { name: 'idx_novae_worlds_username' })
  pgm.createIndex('novae_worlds', 'world_type', { name: 'idx_novae_worlds_type' })

  pgm.sql(`
    ALTER TABLE novae_stars ENABLE ROW LEVEL SECURITY;
    ALTER TABLE novae_worlds ENABLE ROW LEVEL SECURITY;

    REVOKE ALL ON TABLE novae_stars, novae_worlds FROM anon, authenticated;
    GRANT SELECT ON TABLE novae_stars, novae_worlds TO anon, authenticated;

    CREATE POLICY "public_read_novae_stars"
      ON novae_stars FOR SELECT TO anon, authenticated USING (true);

    CREATE POLICY "public_read_novae_worlds"
      ON novae_worlds FOR SELECT TO anon, authenticated USING (true);

    CREATE POLICY "service_write_novae_stars"
      ON novae_stars FOR ALL TO service_role
      USING (true) WITH CHECK (true);

    CREATE POLICY "service_write_novae_worlds"
      ON novae_worlds FOR ALL TO service_role
      USING (true) WITH CHECK (true);
  `)
}

export const down = (pgm) => {
  pgm.sql(`
    DROP POLICY IF EXISTS "public_read_novae_stars" ON novae_stars;
    DROP POLICY IF EXISTS "public_read_novae_worlds" ON novae_worlds;
    DROP POLICY IF EXISTS "service_write_novae_stars" ON novae_stars;
    DROP POLICY IF EXISTS "service_write_novae_worlds" ON novae_worlds;

    ALTER TABLE novae_stars DISABLE ROW LEVEL SECURITY;
    ALTER TABLE novae_worlds DISABLE ROW LEVEL SECURITY;
  `)

  pgm.dropIndex('novae_stars', ['position_x', 'position_z'], { name: 'idx_novae_stars_position' })
  pgm.dropIndex('novae_worlds', 'novae_star_id', { name: 'idx_novae_worlds_star_id' })
  pgm.dropIndex('novae_worlds', 'github_username', { name: 'idx_novae_worlds_username' })
  pgm.dropIndex('novae_worlds', 'world_type', { name: 'idx_novae_worlds_type' })
}
