import { create } from 'zustand'

const API_BASE_URL = (import.meta.env.NOVAE_API_URL ?? 'http://localhost:3333').replace(/\/$/, '')

async function fetchSystemWorlds(username, token) {
  const response = await fetch(`${API_BASE_URL}/novae/stars/${encodeURIComponent(username)}/worlds`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  })
  const body = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(body?.message ?? body?.error ?? `Request failed with status ${response.status}.`)
  }

  return body
}

async function requestSupernova(username, token) {
  const response = await fetch(`${API_BASE_URL}/novae/stars/${encodeURIComponent(username)}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  })
  const body = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(body?.message ?? body?.error ?? `Request failed with status ${response.status}.`)
  }

  return body
}

const initialState = {
  appPhase: 'landing',
  token: null,
  currentUser: null,
  isGuest: false,
  screen: 'landing',
  error: null,
  myNovaeStar: null,
  myNovaeStarProps: null,
  novaeWorlds: [],
  novaeWorldsProps: {},
  novaeStars: [],
  novaeStarsProps: {},
  galaxyMode: 'galaxy',
  activeNovaeStarUsername: null,
  activeSystemWorlds: [],
  systemTransition: false,
  selectedObject: null,
  nearNovaeWorld: null,
  isLoginOpen: false,
  emptyZoneWarning: false,
  emptyZoneCountdown: 5
}

export const useNovaeStore = create((set) => ({
  ...initialState,
  setAppPhase: (appPhase) => set({ appPhase }),
  setToken: (token) => set({ token }),
  setCurrentUser: (currentUser) => set({ currentUser }),
  setIsGuest: (isGuest) => set({ isGuest }),
  setScreen: (screen) => set({ screen }),
  setError: (error) => set({ error }),
  setMyNovaeStar: (myNovaeStar) => set({ myNovaeStar }),
  setMyNovaeStarProps: (myNovaeStarProps) => set({ myNovaeStarProps }),
  setNovaeWorlds: (novaeWorlds) => set({ novaeWorlds }),
  setNovaeStars: (novaeStars) => set({ novaeStars, novaeWorlds: novaeStars }),
  setNovaeStarProps: (username, starProps) =>
    set((state) => ({
      novaeStarsProps: {
        ...state.novaeStarsProps,
        [username.toLowerCase()]: starProps
      }
    })),
  setNovaeWorldProps: (username, novaeWorldProps) =>
    set((state) => ({
      novaeWorldsProps: {
        ...state.novaeWorldsProps,
        [username.toLowerCase()]: novaeWorldProps
      }
    })),
  setNearNovaeWorld: (nearNovaeWorld) => set({ nearNovaeWorld }),
  setSelectedObject: (selectedObject) => set({ selectedObject }),
  clearSelectedObject: () => set({ selectedObject: null }),
  setGalaxyMode: (galaxyMode) => set({ galaxyMode }),
  setActiveNovaeStar: (activeNovaeStarUsername) => set({ activeNovaeStarUsername }),
  setActiveSystemWorlds: (activeSystemWorlds) => set({ activeSystemWorlds }),
  enterSystem: async (username) => {
    const normalizedUsername = username.toLowerCase()
    if (useNovaeStore.getState().systemTransition) return

    set({ systemTransition: true })
    try {
      const activeSystemWorlds = await fetchSystemWorlds(
        normalizedUsername,
        useNovaeStore.getState().token
      )
      set({
        galaxyMode: 'system',
        activeNovaeStarUsername: normalizedUsername,
        activeSystemWorlds,
        nearNovaeWorld: null
      })
    } finally {
      window.setTimeout(() => set({ systemTransition: false }), 350)
    }
  },
  exitSystem: () => {
    if (useNovaeStore.getState().systemTransition) return
    set({
      systemTransition: true,
      galaxyMode: 'galaxy',
      activeNovaeStarUsername: null,
      activeSystemWorlds: [],
      nearNovaeWorld: null
    })
    window.setTimeout(() => set({ systemTransition: false }), 350)
  },
  triggerSupernova: async (username) => {
    const star = await requestSupernova(username, useNovaeStore.getState().token)
    set((state) => ({
      novaeStars: state.novaeStars.map((item) =>
        (item.github_username ?? item.username).toLowerCase() === username.toLowerCase()
          ? { ...item, ...star }
          : item
      )
    }))
    return star
  },
  setLoginOpen: (isLoginOpen) => set({ isLoginOpen }),
  startEmptyZoneWarning: () => set({ emptyZoneWarning: true, emptyZoneCountdown: 5 }),
  setEmptyZoneCountdown: (emptyZoneCountdown) => set({ emptyZoneCountdown }),
  cancelEmptyZoneWarning: () => set({ emptyZoneWarning: false, emptyZoneCountdown: 5 }),
  logout: () => set({ ...initialState })
}))
