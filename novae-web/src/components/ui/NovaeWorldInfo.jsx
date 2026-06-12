import { NOVAE_WORLD_COLORS_BY_LANGUAGE } from '../../utils/novaeWorldGenerator'

function number(value) {
  return new Intl.NumberFormat('pt-BR').format(value ?? 0)
}

export function NovaeWorldInfo({ repo, onClose }) {
  const colors = NOVAE_WORLD_COLORS_BY_LANGUAGE[repo.language] ?? NOVAE_WORLD_COLORS_BY_LANGUAGE.default

  return (
    <aside className="novae-world-card novae-world-info" style={{ '--biome-color': colors.base }}>
      <button className="novae-world-card__close" type="button" onClick={onClose} aria-label="Close repo card">×</button>
      <h2>📦 {repo.repo_name}</h2>
      <span className="novae-world-card__divider" />
      <dl>
        <div><dt>TYPE</dt><dd>{repo.language ?? 'Unknown'} · {repo.world_type} planet</dd></div>
        <div><dt>COMMITS</dt><dd>⚡ {number(repo.commit_count)}</dd></div>
        <div><dt>STARS / FORKS</dt><dd>⭐ {number(repo.stars_count)} · 🍴 {number(repo.forks_count)}</dd></div>
        <div><dt>CONTRIBUTORS</dt><dd>👥 {number(repo.contributor_count)}</dd></div>
      </dl>
      <span className="novae-world-card__divider" />
      <p>{repo.description || 'No description provided.'}</p>
      <span className="novae-world-card__divider" />
      <button
        className="novae-world-card__visit"
        type="button"
        onClick={() => window.open(repo.html_url, '_blank', 'noopener,noreferrer')}
      >
        View on GitHub ↗
      </button>
    </aside>
  )
}
