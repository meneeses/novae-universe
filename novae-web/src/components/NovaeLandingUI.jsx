import { API_BASE_URL } from '../lib/api'

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M12 .7a11.5 11.5 0 0 0-3.6 22.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.4-4-1.4-.5-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.8 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.6.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0C15.2 4.7 16.2 5 16.2 5c.6 1.5.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.5-2.8 5.5-5.5 5.8.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A11.5 11.5 0 0 0 12 .7Z" />
    </svg>
  )
}

export function NovaeLandingUI({ explore, error }) {
  return (
    <section className="landing3d-ui">
      <p className="landing3d-kicker">[ LIVING CODE GALAXY ]</p>
      <h1>Novae Universe</h1>
      <p className="landing3d-subtitle">A living universe built from GitHub.</p>
      <div className="landing3d-controls">
        <a className="github-sign-in" href={`${API_BASE_URL}/auth/github`}>
          <GithubIcon />
          Sign in with GitHub
        </a>
        <button className="guest-explore" type="button" onClick={explore}>Explore the Universe →</button>
      </div>
      <p className="landing3d-error">{error ?? '\u00a0'}</p>
      <p className="landing3d-stats">∞ Novae Worlds&nbsp;&nbsp;·&nbsp;&nbsp;open universe&nbsp;&nbsp;·&nbsp;&nbsp;no signup required</p>
    </section>
  )
}
