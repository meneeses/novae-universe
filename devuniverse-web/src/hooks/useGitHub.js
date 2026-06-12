import { useCallback, useState } from 'react'
import * as api from '../services/api'
import { useUniverseStore } from '../store/universeStore'
import { generatePlanetProps } from '../utils/planetGenerator'

const USERNAME_PATTERN = /^[a-zA-Z0-9-]+$/
const MINIMUM_LOADING_TIME = 2500
const STAGE_DELAY = 600

function wait(duration) {
  return new Promise((resolve) => window.setTimeout(resolve, duration))
}

export function useGitHub() {
  const [isLoading, setIsLoading] = useState(false)
  const [stage, setStage] = useState('github')
  const [username, setUsername] = useState('')
  const error = useUniverseStore((state) => state.error)
  const setScreen = useUniverseStore((state) => state.setScreen)
  const setError = useUniverseStore((state) => state.setError)
  const setIsGuest = useUniverseStore((state) => state.setIsGuest)
  const setLoginOpen = useUniverseStore((state) => state.setLoginOpen)
  const setPlanets = useUniverseStore((state) => state.setPlanets)
  const setMyPlanet = useUniverseStore((state) => state.setMyPlanet)
  const setMyPlanetProps = useUniverseStore((state) => state.setMyPlanetProps)
  const setPlanetProps = useUniverseStore((state) => state.setPlanetProps)
  const logout = useUniverseStore((state) => state.logout)

  const cachePlanets = useCallback(
    (planets) => {
      setPlanets(planets)
      planets.forEach((planet) => {
        const planetUsername = planet.github_username ?? planet.username
        setPlanetProps(planetUsername, generatePlanetProps(planet))
      })
    },
    [setPlanetProps, setPlanets]
  )

  const explore = useCallback(async () => {
    setError(null)
    setIsGuest(true)
    setScreen('space')

    try {
      cachePlanets(await api.fetchPlanets())
    } catch {
      // Guests can still explore the solar system while the API is unavailable.
    }
  }, [cachePlanets, setError, setIsGuest, setScreen])

  const login = useCallback(
    async (username) => {
      const normalizedUsername = username.trim()
      const launchedFromGuestMode = useUniverseStore.getState().isGuest

      if (!normalizedUsername) {
        setError('Enter a GitHub username.')
        return
      }
      if (normalizedUsername.length > 39) {
        setError('GitHub usernames cannot exceed 39 characters.')
        return
      }
      if (!USERNAME_PATTERN.test(normalizedUsername)) {
        setError('Use only letters, numbers, and hyphens.')
        return
      }

      setError(null)
      setIsGuest(false)
      setLoginOpen(false)
      setUsername(normalizedUsername)
      setIsLoading(true)
      setStage('github')
      setScreen('loading')
      const startedAt = performance.now()

      try {
        await api.login(normalizedUsername)
        await wait(STAGE_DELAY)
        setStage('generating')

        const [planets, myPlanet] = await Promise.all([
          api.fetchPlanets(),
          api.fetchPlanet(normalizedUsername)
        ])
        cachePlanets(planets)
        setMyPlanet(myPlanet)

        const myPlanetProps = generatePlanetProps(myPlanet)
        setMyPlanetProps(myPlanetProps)
        await wait(STAGE_DELAY)
        setStage('placing')
        await wait(STAGE_DELAY)
        setStage('ready')
        await wait(STAGE_DELAY)

        const remainingTime = MINIMUM_LOADING_TIME - (performance.now() - startedAt)
        if (remainingTime > 0) await wait(remainingTime)
        setScreen('space')
      } catch (requestError) {
        if (launchedFromGuestMode) {
          useUniverseStore.setState({
            token: null,
            currentUser: null,
            myPlanet: null,
            myPlanetProps: null,
            isGuest: true,
            screen: 'space',
            isLoginOpen: true,
            error: requestError.message
          })
        } else {
          logout()
          setError(requestError.message)
        }
      } finally {
        setIsLoading(false)
      }
    },
    [
      logout,
      setError,
      setIsGuest,
      setLoginOpen,
      setMyPlanet,
      setMyPlanetProps,
      cachePlanets,
      setScreen
    ]
  )

  return { login, explore, isLoading, error, stage, username }
}
