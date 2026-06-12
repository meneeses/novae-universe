import { useCallback, useState } from 'react'
import * as api from '../services/novaeApi'
import { useNovaeStore } from '../store/novaeStore'
import { generateNovaeStarProps } from '../utils/novaeWorldGenerator'

const USERNAME_PATTERN = /^[a-zA-Z0-9-]+$/
const MINIMUM_LOADING_TIME = 2500
const STAGE_DELAY = 600

function wait(duration) {
  return new Promise((resolve) => window.setTimeout(resolve, duration))
}

export function useNovaeGitHub() {
  const [isLoading, setIsLoading] = useState(false)
  const [stage, setStage] = useState('github')
  const [username, setUsername] = useState('')
  const error = useNovaeStore((state) => state.error)
  const setScreen = useNovaeStore((state) => state.setScreen)
  const setError = useNovaeStore((state) => state.setError)
  const setIsGuest = useNovaeStore((state) => state.setIsGuest)
  const setLoginOpen = useNovaeStore((state) => state.setLoginOpen)
  const setNovaeWorlds = useNovaeStore((state) => state.setNovaeWorlds)
  const setNovaeStars = useNovaeStore((state) => state.setNovaeStars)
  const setNovaeStarProps = useNovaeStore((state) => state.setNovaeStarProps)
  const setMyNovaeStar = useNovaeStore((state) => state.setMyNovaeStar)
  const setMyNovaeStarProps = useNovaeStore((state) => state.setMyNovaeStarProps)
  const setNovaeWorldProps = useNovaeStore((state) => state.setNovaeWorldProps)
  const logout = useNovaeStore((state) => state.logout)

  const cacheStars = useCallback(
    (stars) => {
      setNovaeStars(stars)
      setNovaeWorlds(stars)
      stars.forEach((star) => {
        const username = star.github_username ?? star.username
        const props = {
          type: star.star_type,
          size: star.star_size,
          color: star.star_color,
          primaryLanguage: star.primary_language,
          coronaIntensity: Math.min(1, 0.3 + (star.total_commits ?? 0) / 5000)
        }
        setNovaeStarProps(username, props)
        setNovaeWorldProps(username, props)
      })
    },
    [setNovaeWorldProps, setNovaeWorlds, setNovaeStarProps, setNovaeStars]
  )

  const explore = useCallback(async () => {
    setError(null)
    setIsGuest(true)
    setScreen('space')

    try {
      cacheStars(await api.fetchNovaeStars())
    } catch {
      // Guests can still explore the solar system while the API is unavailable.
    }
  }, [cacheStars, setError, setIsGuest, setScreen])

  const login = useCallback(
    async (username) => {
      const normalizedUsername = username.trim()
      const launchedFromGuestMode = useNovaeStore.getState().isGuest

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

        const [stars, myStar] = await Promise.all([
          api.fetchNovaeStars(),
          api.fetchNovaeStar(normalizedUsername)
        ])
        cacheStars(stars)
        setMyNovaeStar(myStar)

        const myNovaeStarProps = generateNovaeStarProps(
          { repos: [{ language: myStar.primary_language }] },
          myStar.total_commits ?? 0
        )
        setMyNovaeStarProps(myNovaeStarProps)
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
          useNovaeStore.setState({
            token: null,
            currentUser: null,
            myNovaeStar: null,
            myNovaeStarProps: null,
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
      setMyNovaeStar,
      setMyNovaeStarProps,
      cacheStars,
      setScreen
    ]
  )

  return { login, explore, isLoading, error, stage, username }
}
