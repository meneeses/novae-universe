export const up = (pgm) => {
  pgm.addColumns('novae_stars', {
    supernova_at: {
      type: 'timestamptz'
    },
    supernova_scheduled_delete: {
      type: 'timestamptz'
    }
  })

  pgm.sql(`
    COMMENT ON COLUMN novae_stars.supernova_at IS
      'Timestamp da supernova. NULL = estrela ativa.';
    COMMENT ON COLUMN novae_stars.supernova_scheduled_delete IS
      'Quando deletar permanentemente após supernova (24h depois).';
  `)

  pgm.createIndex('novae_stars', 'supernova_scheduled_delete', {
    name: 'idx_novae_stars_scheduled_delete',
    where: 'supernova_scheduled_delete IS NOT NULL'
  })
}

export const down = (pgm) => {
  pgm.dropIndex('novae_stars', 'supernova_scheduled_delete', {
    name: 'idx_novae_stars_scheduled_delete'
  })
  pgm.dropColumns('novae_stars', ['supernova_at', 'supernova_scheduled_delete'])
}
