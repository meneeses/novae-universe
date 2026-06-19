import { useEffect, useState } from 'react'
import { useNovaeStore } from '../../store/novaeStore'
import { BOOST_MAX_SPEED } from '../../hooks/useNovaeShip'

export function NovaeHUD({
  speed,
  yaw,
  position,
  isThrusting: _isThrusting,
  isBoosting,
  isEngineOff,
  nearNovaeWorld,
  isGuest,
  galaxyMode = 'galaxy',
  activeNovaeStarUsername = null,
  dimension = 'solar',
  spaceAlert = null,
  engineEnabled = true,
  weaponStatus = { cooldownProgress: 1, ready: true },
  presence = { playerCount: 0, nearbyPlayers: [], remotePlayers: [] },
  isInvisible = false,
  onToggleInvisible
}) {
  const [showControls, setShowControls] = useState(true)
  const isLoginOpen = useNovaeStore((state) => state.isLoginOpen)
  const error = useNovaeStore((state) => state.error)
  const setLoginOpen = useNovaeStore((state) => state.setLoginOpen)
  const speedPercent = Math.min(100, Math.round((speed / BOOST_MAX_SPEED) * 100))
  const speedBlocks = Math.min(10, Math.round((speed / BOOST_MAX_SPEED) * 10))
  const speedBar = `${'█'.repeat(speedBlocks)}${'░'.repeat(10 - speedBlocks)}`
  const weaponBlocks = Math.min(10, Math.max(0, Math.round((weaponStatus.cooldownProgress ?? 1) * 10)))
  const weaponBar = `${'█'.repeat(weaponBlocks)}${'░'.repeat(10 - weaponBlocks)}`
  const nearbyPlayers = (presence.nearbyPlayers ?? []).filter((player) => player.distance <= 100)
  const distantPlayers = (presence.remotePlayers ?? []).filter((player) => player.distance > 100).slice(0, 3)
  const engineLabel = !engineEnabled || isEngineOff ? '■ ENGINE OFF' : '● ENGINE ON'

  useEffect(() => {
    const timeout = window.setTimeout(() => setShowControls(false), 10000)
    return () => window.clearTimeout(timeout)
  }, [])

  return (
    <>
      <aside className="flight-hud" aria-live="polite">
        <strong>Novae Universe v0.1</strong>
        <span>{galaxyMode === 'system'
          ? `[ @${activeNovaeStarUsername}'s system ]`
          : dimension === 'solar' ? '[ ORIGIN DIMENSION ]' : '[ DEVELOPER GALAXY ]'}
        </span>
        <span className="hud-divider" />
        <span>SPEED&nbsp; {speedBar}</span>
        <span className="hud-speed-scale">[◄ slow&nbsp;&nbsp;&nbsp; {speedPercent}%&nbsp;&nbsp;&nbsp; fast ►]</span>
        <span>X&nbsp; {position.x.toFixed(1)}&nbsp; Y&nbsp; {position.y.toFixed(1)}&nbsp; Z&nbsp; {position.z.toFixed(1)}</span>
        <span className="hud-divider" />
        <span className={`hud-thrust${isEngineOff ? ' hud-engine-off' : ' hud-engine-on'}`}>
          {engineLabel}
        </span>
        {isBoosting && <span className="hud-boost-active">▲ BOOST</span>}
        <span>WEAPON&nbsp; [{weaponBar}] {weaponStatus.ready ? 'READY' : 'LOADING'}</span>
        {nearNovaeWorld && <span>NEAR&nbsp; @{nearNovaeWorld.username}</span>}
        {spaceAlert && <span className="hud-space-alert">⚠ {spaceAlert}</span>}
        <div className="space-compass" aria-label="Ship heading">
          <span className="space-compass__north">N</span>
          <span className="space-compass__south">S</span>
          <span className="space-compass__east">E</span>
          <span className="space-compass__west">W</span>
          <i style={{ transform: `translate(-50%, -100%) rotate(${-yaw}rad)` }} />
        </div>
      </aside>

      <aside className={`controls-hud${showControls ? '' : ' controls-hud--hidden'}`}>
        <span>W / ↑&nbsp; ASCEND</span>
        <span>S / ↓&nbsp; DESCEND</span>
        <span>A / ←&nbsp; TURN LEFT</span>
        <span>D / →&nbsp; TURN RIGHT</span>
        <span>SHIFT&nbsp; BOOST</span>
        <span>SPACE&nbsp; ENGINE ON/OFF</span>
        <span>F&nbsp; FIRE</span>
        {galaxyMode === 'system' && <span className="controls-hud__hint">CYAN GATE&nbsp; EXIT SYSTEM</span>}
      </aside>

      <aside className="presence-hud">
        <button
          type="button"
          className={`presence-hud__visibility${isInvisible ? ' presence-hud__visibility--hidden' : ''}`}
          onClick={onToggleInvisible}
        >
          {isInvisible ? '🙈 Hidden' : '👁 Visible'}
        </button>
        {nearbyPlayers.length > 0 ? (
          <>
            <strong>👥 {nearbyPlayers.length} explorers nearby</strong>
            {nearbyPlayers.slice(0, 5).map((player) => (
              <span key={player.uid}>
                <i style={{ backgroundColor: player.color }} />
                @{player.uid}
                <em>{Math.round(player.distance)}u</em>
              </span>
            ))}
          </>
        ) : (
          <>
            <strong>🌌 Exploring alone...</strong>
            {distantPlayers.map((player) => (
              <span key={player.uid}>
                <i style={{ backgroundColor: player.color }} />
                @{player.uid}
                <em>{player.area?.endsWith('_system') ? `(in @${player.area.replace(/_system$/, '')}'s system)` : 'far away'}</em>
              </span>
            ))}
          </>
        )}
      </aside>

      {isGuest && (
        <a className="guest-login-button" href={`${(import.meta.env.NOVAE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '')}/auth/github`}>
          Sign in with GitHub
        </a>
      )}

      {isGuest && isLoginOpen && (
        <aside className="guest-login-panel">
          <strong>&gt; Create your star system</strong>
          <p>Sign in securely with GitHub to map your repositories.</p>
          {error && <span className="guest-login-error">{error}</span>}
          <div>
            <a href={`${(import.meta.env.NOVAE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '')}/auth/github`}>Sign in with GitHub</a>
            <button type="button" onClick={() => setLoginOpen(false)}>Cancel</button>
          </div>
        </aside>
      )}
    </>
  )
}
