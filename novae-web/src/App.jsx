import { useEffect, useState } from 'react'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { NovaeGalaxyScene } from './components/space/NovaeGalaxyScene'
import { api } from './lib/api'
import { Landing } from './pages/Landing'
import { OAuthCallback } from './pages/OAuthCallback'
import { useAuthStore } from './store/authStore'
import { useNovaeStore } from './store/novaeStore'

function routeFromPath() {
  if (window.location.pathname === '/auth/callback') return 'callback'
  if (window.location.pathname === '/universe' || window.location.pathname.startsWith('/universe/')) {
    const { isAuthenticated, isGuest } = useAuthStore.getState()
    if (isAuthenticated || isGuest) return 'universe'
    window.history.replaceState({}, '', '/')
  }
  return 'landing'
}

function AppContent() {
  const [route, setRoute] = useState(routeFromPath)

  useEffect(() => {
    const updateRoute = () => setRoute(routeFromPath())
    window.addEventListener('popstate', updateRoute)
    return () => window.removeEventListener('popstate', updateRoute)
  }, [])

  useEffect(() => {
    if (route !== 'universe') return
    const username = window.location.pathname.match(/^\/universe\/([^/]+)$/)?.[1]
    if (!username) return

    const loadSystem = async () => {
      try {
        const normalized = decodeURIComponent(username).toLowerCase()
        const [star, planets] = await Promise.all([
          api.get(`/novae/stars/${encodeURIComponent(normalized)}`),
          api.get(`/novae/stars/${encodeURIComponent(normalized)}/worlds`)
        ])
        useNovaeStore.setState((state) => ({
          novaeStars: [
            ...state.novaeStars.filter((item) =>
              (item.github_username ?? item.username).toLowerCase() !== normalized
            ),
            star
          ],
          galaxyMode: 'system',
          activeNovaeStarUsername: normalized,
          activeSystemWorlds: planets
        }))
      } catch {
        // Keep the current universe visible if a public system cannot be loaded.
      }
    }

    loadSystem()
  }, [route])

  if (route === 'callback') return <OAuthCallback />
  if (route === 'universe') return <NovaeGalaxyScene />
  return <Landing />
}

export default function App() {
  return <ErrorBoundary><AppContent /></ErrorBoundary>
}
