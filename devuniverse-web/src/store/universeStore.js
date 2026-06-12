import { create } from 'zustand'

const initialState = {
  token: null,
  currentUser: null,
  isGuest: false,
  screen: 'landing',
  error: null,
  myPlanet: null,
  myPlanetProps: null,
  planets: [],
  planetsProps: {},
  nearPlanet: null,
  isLoginOpen: false,
  emptyZoneWarning: false,
  emptyZoneCountdown: 5
}

export const useUniverseStore = create((set) => ({
  ...initialState,
  setToken: (token) => set({ token }),
  setCurrentUser: (currentUser) => set({ currentUser }),
  setIsGuest: (isGuest) => set({ isGuest }),
  setScreen: (screen) => set({ screen }),
  setError: (error) => set({ error }),
  setMyPlanet: (myPlanet) => set({ myPlanet }),
  setMyPlanetProps: (myPlanetProps) => set({ myPlanetProps }),
  setPlanets: (planets) => set({ planets }),
  setPlanetProps: (username, planetProps) =>
    set((state) => ({
      planetsProps: {
        ...state.planetsProps,
        [username.toLowerCase()]: planetProps
      }
    })),
  setNearPlanet: (nearPlanet) => set({ nearPlanet }),
  setLoginOpen: (isLoginOpen) => set({ isLoginOpen }),
  startEmptyZoneWarning: () => set({ emptyZoneWarning: true, emptyZoneCountdown: 5 }),
  setEmptyZoneCountdown: (emptyZoneCountdown) => set({ emptyZoneCountdown }),
  cancelEmptyZoneWarning: () => set({ emptyZoneWarning: false, emptyZoneCountdown: 5 }),
  logout: () => set({ ...initialState })
}))
