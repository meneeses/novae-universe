import { create } from 'zustand'
import { api } from '../lib/api'

async function fetchSystemWorlds(username) {
  return api.get(`/novae/stars/${encodeURIComponent(username)}/worlds`)
}

async function requestSupernova(username) {
  return api.delete(`/novae/stars/${encodeURIComponent(username)}`)
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
      const activeSystemWorlds = await fetchSystemWorlds(normalizedUsername)
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
    const star = await requestSupernova(username)
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
