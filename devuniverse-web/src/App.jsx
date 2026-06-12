import { SpaceScene } from './components/space/SpaceScene'
import { Landing } from './components/ui/Landing'
import { LoadingScreen } from './components/ui/LoadingScreen'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { useGitHub } from './hooks/useGitHub'
import { useUniverseStore } from './store/universeStore'

function AppContent() {
  const screen = useUniverseStore((state) => state.screen)
  const github = useGitHub()

  let content = <Landing {...github} />
  if (screen === 'loading') content = <LoadingScreen stage={github.stage} username={github.username} />
  if (screen === 'space') content = <SpaceScene login={github.login} />

  return content
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  )
}
