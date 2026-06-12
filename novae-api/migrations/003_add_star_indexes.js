export const up = (pgm) => {
  pgm.createIndex('novae_stars', ['position_x', 'position_z'], {
    name: 'idx_novae_stars_position'
  })

  pgm.createIndex('novae_worlds', ['novae_star_id', 'orbit_radius'], {
    name: 'idx_novae_worlds_orbit'
  })

  pgm.sql(`
    ALTER TABLE novae_stars ENABLE ROW LEVEL SECURITY;
    ALTER TABLE novae_worlds ENABLE ROW LEVEL SECURITY;
    REVOKE ALL ON TABLE novae_stars, novae_worlds FROM anon, authenticated;
  `)
}

export const down = (pgm) => {
  pgm.sql(`
    ALTER TABLE novae_stars DISABLE ROW LEVEL SECURITY;
    ALTER TABLE novae_worlds DISABLE ROW LEVEL SECURITY;
  `)

  pgm.dropIndex('novae_worlds', ['novae_star_id', 'orbit_radius'], {
    name: 'idx_novae_worlds_orbit'
  })
  pgm.dropIndex('novae_stars', ['position_x', 'position_z'], {
    name: 'idx_novae_stars_position'
  })
}