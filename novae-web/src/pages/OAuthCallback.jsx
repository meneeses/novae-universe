import { useEffect, useState } from 'react'
import { LoadingScreen } from '../components/LoadingScreen'
import { api } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { useNovaeStore } from '../store/novaeStore'

const wait = (duration) => new Promise((resolve) => window.setTimeout(resolve, duration))

function goToLanding() {
  useAuthStore.getState().logout()
  useNovaeStore.getState().logout()
  window.history.replaceState({}, '', '/')
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function OAuthCallback() {
  const [step, setStep] = useState(0)
  const [error, setError] = useState(null)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    let active = true

    const completeLogin = async () => {
      const params = new URLSearchParams(window.location.search)
      const token = params.get('token')
      if (!token) throw new Error('GitHub did not return a valid session. Please try again.')

      useAuthStore.setState({ token })
      await wait(600)
      if (!active) return
      setStep(1)

      const [system] = await Promise.all([api.get('/auth/me'), wait(600)])
      if (!active) return
      setStep(2)
      await wait(600)
      if (!active) return
      setStep(3)

      const [stars] = await Promise.all([
        api.get('/novae/stars').catch(() => [system.star]),
        wait(600)
      ])
      if (!active) return

      useAuthStore.getState().loginWithData({ token, ...system })
      useNovaeStore.setState({
        token,
        currentUser: system.user,
        isGuest: false,
        myNovaeStar: system.star,
        novaeStars: stars,
        novaeWorlds: stars,
        galaxyMode: 'system',
        activeNovaeStarUsername: system.user.username.toLowerCase(),
        activeSystemWorlds: system.planets
      })

      setStep(4)
      await wait(600)
      if (!active) return
      setStep(5)
      setExiting(true)
      await wait(400)
      if (!active) return
      window.history.replaceState({}, '', '/universe')
      window.dispatchEvent(new PopStateEvent('popstate'))
    }

    completeLogin().catch((requestError) => {
      if (active) setError(requestError.message)
    })
    return () => { active = false }
  }, [])

  return <LoadingScreen mode="oauth" step={step} error={error} exiting={exiting} onRetry={goToLanding} />
}
