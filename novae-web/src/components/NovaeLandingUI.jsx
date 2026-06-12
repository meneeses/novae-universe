import { useState } from 'react'

const USERNAME_PATTERN = /^[a-zA-Z0-9-]+$/

export function NovaeLandingUI({ login, explore, error, isLoading, onLaunch }) {
  const [username, setUsername] = useState('')
  const [localError, setLocalError] = useState(null)

  const launch = () => {
    const normalized = username.trim()
    if (normalized && (!USERNAME_PATTERN.test(normalized) || normalized.length > 39)) {
      setLocalError('Use a valid GitHub username.')
      return
    }
    setLocalError(null)
    onLaunch(() => normalized ? login(normalized) : explore())
  }

  return (
    <section className="landing3d-ui">
      <p className="landing3d-kicker">[ LIVING CODE GALAXY ]</p>
      <h1>Novae Universe</h1>
      <p className="landing3d-subtitle">A living universe built from GitHub.</p>
      <div className="landing3d-controls">
        <input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter') launch() }}
          placeholder="your GitHub username"
          disabled={isLoading}
          maxLength={39}
          spellCheck="false"
          autoComplete="off"
        />
        <button type="button" onClick={launch} disabled={isLoading}>EXPLORE NOVAE UNIVERSE →</button>
      </div>
      <p className="landing3d-error">{localError ?? error ?? '\u00a0'}</p>
      <p className="landing3d-stats">∞ Novae Worlds&nbsp;&nbsp;·&nbsp;&nbsp;open universe&nbsp;&nbsp;·&nbsp;&nbsp;no signup required</p>
    </section>
  )
}
