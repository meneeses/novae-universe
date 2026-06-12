export const up = (pgm) => {
  pgm.addColumn('novae_stars', {
    status: {
      type: 'text',
      notNull: true,
      default: "'main_sequence'",
      check: "status IN ('main_sequence','supernova','nebula')"
    },
    supernova_at: { type: 'timestamptz' },
    supernova_scheduled_delete: { type: 'timestamptz' }
  })

  pgm.createIndex('novae_stars', 'status', { name: 'idx_novae_stars_status' })
}

export const down = (pgm) => {
  pgm.dropIndex('novae_stars', 'status', { name: 'idx_novae_stars_status' })
  pgm.dropColumn('novae_stars', 'supernova_scheduled_delete')
  pgm.dropColumn('novae_stars', 'supernova_at')
  pgm.dropColumn('novae_stars', 'status')
}