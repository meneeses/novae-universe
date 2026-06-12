import { create } from 'zustand'

const initialState = {
  token: null,
  user: null,
  star: null,
  planets: [],
  isAuthenticated: false,
  isGuest: false,
  loadingStep: 0
}

export const useAuthStore = create((set) => ({
  ...initialState,
  loginWithData: ({ token, user, star, planets }) => set({
    token,
    user,
    star,
    planets,
    isAuthenticated: true,
    isGuest: false
  }),
  enterAsGuest: () => set({ ...initialState, isGuest: true }),
  logout: () => set({ ...initialState }),
  setLoadingStep: (loadingStep) => set({ loadingStep })
}))
