const STAGES = {
  github: { progress: 25, label: 'Connecting to GitHub...' },
  generating: { progress: 55, label: 'Generating your Novae World...' },
  placing: { progress: 80, label: 'Placing you in Novae Galaxy...' },
  ready: { progress: 100, label: 'Ready for launch.' }
}

export function LoadingScreen({ stage = 'github', username }) {
  const current = STAGES[stage] ?? STAGES.github

  return (
    <main className="loading-screen">
      <section className="loading-content" aria-live="polite">
        <p className="loading-username">@{username}</p>
        <div className="progress-track">
          <div className="progress-bar" style={{ width: `${current.progress}%` }} />
        </div>
        <div className="loading-details">
          <span>{current.progress}%</span>
          <span>{current.label}</span>
        </div>
      </section>
    </main>
  )
}
