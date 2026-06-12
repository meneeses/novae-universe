const STEPS = {
  oauth: [
    'Authenticating with GitHub...',
    'Mapping your repositories...',
    'Generating your star...',
    'Placing your planets in orbit...',
    'Ready for launch.'
  ],
  guest: [
    'Connecting to the universe...',
    'Loading star systems...',
    'Ready to explore.'
  ]
}

export function LoadingScreen({ mode = 'oauth', step = 0, error, exiting = false, onRetry }) {
  const steps = STEPS[mode]
  const completed = error ? step : Math.min(step, steps.length)
  const progress = Math.round((completed / steps.length) * 100)

  return (
    <main className={`oauth-loading-screen${exiting ? ' oauth-loading-screen--exiting' : ''}`}>
      <section className="oauth-loading-content" aria-live="polite">
        <div className="oauth-loading-star" aria-hidden="true" />
        <div className="oauth-loading-steps">
          {steps.map((label, index) => (
            <p
              key={label}
              className={index <= step ? 'oauth-loading-step oauth-loading-step--visible' : 'oauth-loading-step'}
            >
              <span>{index < completed ? '✓' : '✦'}</span>
              {label}
            </p>
          ))}
        </div>
        <div className="oauth-progress-track">
          <div className="oauth-progress-bar" style={{ width: `${progress}%` }} />
        </div>
        {error && (
          <div className="oauth-loading-error">
            <p>{error}</p>
            <button type="button" onClick={onRetry}>Try again</button>
          </div>
        )}
      </section>
    </main>
  )
}
