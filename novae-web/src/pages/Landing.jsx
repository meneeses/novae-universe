import { useEffect, useState } from 'react'
import { LoadingScreen } from '../components/LoadingScreen'
import { NovaeLanding } from '../components/NovaeLanding'
import { api } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { useNovaeStore } from '../store/novaeStore'

const wait = (duration) => new Promise((resolve) => window.setTimeout(resolve, duration))

function navigate(path) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function Landing() {
  const [guestStep, setGuestStep] = useState(null)
  const [error, setError] = useState(null)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const message = params.get('message')
    if (message) {
      setError(message)
      window.history.replaceState({}, '', '/')
    }
  }, [])

  const explore = async () => {
    setError(null)
    setGuestStep(0)
    useAuthStore.getState().enterAsGuest()
    useNovaeStore.getState().setIsGuest(true)

    try {
      await wait(600)
      setGuestStep(1)
      const [stars] = await Promise.all([api.get('/novae/stars'), wait(600)])
      useNovaeStore.getState().setNovaeStars(stars)
      setGuestStep(2)
      await wait(600)
      setGuestStep(3)
      setExiting(true)
      await wait(400)
      navigate('/universe')
    } catch (requestError) {
      setError(requestError.message)
      setGuestStep(null)
    }
  }

  if (guestStep !== null) {
    return <LoadingScreen mode="guest" step={guestStep} exiting={exiting} />
  }

  return <NovaeLanding error={error} explore={explore} />
}
