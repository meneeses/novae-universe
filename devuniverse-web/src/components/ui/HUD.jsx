import { useEffect, useState } from 'react'
import { useUniverseStore } from '../../store/universeStore'
import { MAX_SPEED, MIN_SPEED } from '../../hooks/useRocket'

export function HUD({
  speed,
  yaw,
  position,
  isThrusting,
  isBraking,
  isTurning,
  nearPlanet,
  isGuest,
  login
}) {
  const [showControls, setShowControls] = useState(true)
  const [username, setUsername] = useState('')
  const isLoginOpen = useUniverseStore((state) => state.isLoginOpen)
  const error = useUniverseStore((state) => state.error)
  const setLoginOpen = useUniverseStore((state) => state.setLoginOpen)
  const speedPercent = Math.round((speed / MAX_SPEED) * 100)
  const speedBlocks = Math.round((speed / MAX_SPEED) * 10)
  const speedBar = `${'█'.repeat(speedBlocks)}${'░'.repeat(10 - speedBlocks)}`
  const flightState = isThrusting
    ? 'THRUSTING ▲'
    : isBraking
      ? 'BRAKING ▼'
      : isTurning
        ? 'TURNING'
        : speed <= MIN_SPEED + 0.01
          ? 'CRUISING'
          : 'COASTING'

  useEffect(() => {
    const timeout = window.setTimeout(() => setShowControls(false), 10000)
    return () => window.clearTimeout(timeout)
  }, [])

  return (
    <>
      <aside className="flight-hud" aria-live="polite">
        <strong>DEVUNIVERSE v0.1</strong>
        <span className="hud-divider" />
        <span>SPEED&nbsp; {speedBar}</span>
        <span className="hud-speed-scale">[◄ slow&nbsp;&nbsp;&nbsp; {speedPercent}%&nbsp;&nbsp;&nbsp; fast ►]</span>
        <span>X&nbsp; {position.x.toFixed(1)}&nbsp;&nbsp; Z&nbsp; {position.z.toFixed(1)}</span>
        <span className="hud-divider" />
        <span className={isThrusting || isBraking ? 'hud-thrust hud-thrust--active' : 'hud-thrust'}>
          {flightState}
        </span>
        {nearPlanet && <span>NEAR&nbsp; @{nearPlanet.username}</span>}
        <div className="space-compass" aria-label="Ship heading">
          <span className="space-compass__north">N</span>
          <span className="space-compass__south">S</span>
          <span className="space-compass__east">E</span>
          <span className="space-compass__west">W</span>
          <i style={{ transform: `translate(-50%, -100%) rotate(${-yaw}rad)` }} />
        </div>
      </aside>

      <aside className={`controls-hud${showControls ? '' : ' controls-hud--hidden'}`}>
        <span>↑ / W&nbsp; THRUST</span>
        <span>↓ / S&nbsp; BRAKE</span>
        <span>← → / A D&nbsp; TURN</span>
      </aside>

      {isGuest && (
        <button className="guest-login-button" type="button" onClick={() => setLoginOpen(true)}>
          🌍 Find My Planet
        </button>
      )}

      {isGuest && isLoginOpen && (
        <aside className="guest-login-panel">
          <strong>&gt; Enter GitHub username</strong>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && login(username)}
            placeholder="github username"
            maxLength={39}
            autoFocus
          />
          {error && <span className="guest-login-error">{error}</span>}
          <div>
            <button type="button" onClick={() => login(username)}>Launch</button>
            <button type="button" onClick={() => setLoginOpen(false)}>Cancel</button>
          </div>
        </aside>
      )}
    </>
  )
}
