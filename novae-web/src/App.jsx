import { useCallback, useEffect, useRef } from 'react'
import { NovaeIntro } from './components/NovaeIntro'
import { NovaeLanding } from './components/NovaeLanding'
import { NovaeLaunch } from './components/NovaeLaunch'
import { NovaeGalaxyScene } from './components/space/NovaeGalaxyScene'
import { LoadingScreen } from './components/ui/LoadingScreen'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { useNovaeGitHub } from './hooks/useNovaeGitHub'
import { useNovaeStore } from './store/novaeStore'

function AppContent() {
  const screen = useNovaeStore((state) => state.screen)
  const appPhase = useNovaeStore((state) => state.appPhase)
  const setAppPhase = useNovaeStore((state) => state.setAppPhase)
  const launchAction = useRef(null)
  const github = useNovaeGitHub()

  useEffect(() => {
    setAppPhase(localStorage.getItem('novae_intro_seen') ? 'landing' : 'intro')
  }, [setAppPhase])

  const beginLaunch = useCallback((action) => {
    launchAction.current = action
    action()
    setAppPhase('launching')
  }, [setAppPhase])

  const finishLaunch = useCallback(() => {
    launchAction.current = null
    setAppPhase('space')
  }, [setAppPhase])

  let operationalContent = <NovaeLanding {...github} onLaunch={beginLaunch} />
  if (screen === 'loading') operationalContent = <LoadingScreen stage={github.stage} username={github.username} />
  if (screen === 'space') operationalContent = <NovaeGalaxyScene login={github.login} />

  if (appPhase === 'intro') return <NovaeIntro onComplete={() => setAppPhase('landing')} />
  if (appPhase === 'landing') return <NovaeLanding {...github} onLaunch={beginLaunch} />
  if (appPhase === 'launching') {
    return (
      <>
        <NovaeLanding {...github} onLaunch={beginLaunch} />
        <NovaeLaunch onComplete={finishLaunch} />
      </>
    )
  }
  return operationalContent
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  )
}
