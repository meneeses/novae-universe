export const up = (pgm) => {
  pgm.addColumn('novae_stars', {
    status: {
      type: 'text',
      notNull: true,
      default: "'active'",
      check: "status IN ('active', 'supernova', 'nebula')"
    }
  })
  pgm.createIndex('novae_stars', 'status', { name: 'idx_novae_stars_status' })
}

export const down = (pgm) => {
  pgm.dropIndex('novae_stars', 'status', { name: 'idx_novae_stars_status' })
  pgm.dropColumn('novae_stars', 'status')
}
