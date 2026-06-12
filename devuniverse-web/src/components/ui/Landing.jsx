import { useEffect, useRef, useState } from 'react'

const STAR_COUNT = 150

function LandingStars() {
  const canvasRef = useRef()

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    const pointer = { x: 0, y: 0 }
    let animationFrame
    let stars = []

    function resize() {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = window.innerWidth * pixelRatio
      canvas.height = window.innerHeight * pixelRatio
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      stars = Array.from({ length: STAR_COUNT }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        radius: Math.random() * 1.25 + 0.25,
        depth: Math.random() * 0.8 + 0.2,
        alpha: Math.random() * 0.45 + 0.15
      }))
    }

    function handlePointerMove(event) {
      pointer.x = event.clientX / window.innerWidth - 0.5
      pointer.y = event.clientY / window.innerHeight - 0.5
    }

    function draw() {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight)
      for (const star of stars) {
        const x = star.x + pointer.x * star.depth * 20
        const y = star.y + pointer.y * star.depth * 20
        context.beginPath()
        context.arc(x, y, star.radius, 0, Math.PI * 2)
        context.fillStyle = `rgba(255, 255, 255, ${star.alpha})`
        context.fill()
      }
      animationFrame = requestAnimationFrame(draw)
    }

    resize()
    draw()
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', handlePointerMove)

    return () => {
      cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', handlePointerMove)
    }
  }, [])

  return <canvas ref={canvasRef} className="landing-stars" aria-hidden="true" />
}

export function Landing({ login, explore, isLoading, error }) {
  const [username, setUsername] = useState('')
  const [showInput, setShowInput] = useState(false)

  function handleLaunch() {
    if (!isLoading) login(username)
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter') handleLaunch()
  }

  return (
    <main className="landing-screen">
      <LandingStars />
      <section className="landing-content">
        <p className="landing-logo">✦ DEVUNIVERSE</p>
        <h1>
          Your planet
          <span>is out there.</span>
        </h1>
        <div className="landing-actions">
          <button className="landing-action landing-action--primary" type="button" onClick={explore}>
            🚀&nbsp; Explore Universe
          </button>
          <button className="landing-action landing-action--secondary" type="button" onClick={() => setShowInput(true)}>
            🌍&nbsp; Find My Planet
          </button>
        </div>

        <div className={`landing-login${showInput ? ' landing-login--visible' : ''}`}>
          <div className="launch-controls">
            <label className="sr-only" htmlFor="github-username">GitHub username</label>
            <input
              id="github-username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="github username"
              autoComplete="off"
              spellCheck="false"
              maxLength={39}
              disabled={isLoading}
            />
            <button type="button" onClick={handleLaunch} disabled={isLoading}>Launch →</button>
          </div>
          <p className="landing-error" role="alert">{error ?? '\u00a0'}</p>
        </div>

        <button className="landing-login-link" type="button" onClick={() => setShowInput(true)}>
          Already exploring? <span>Login</span>
        </button>
      </section>

      <footer className="landing-footer">
        Built with Three.js + GitHub API ·{' '}
        <a href="https://github.com/" target="_blank" rel="noreferrer">GitHub</a>
      </footer>
    </main>
  )
}
