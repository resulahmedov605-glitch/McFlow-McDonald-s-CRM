import {create } from 'zustand'
import type { MeResponse } from '../lib/services/authService'

type User = MeResponse | null

type AuthStore = {
    user: User
    setUser: (user: User) => void
}

const useAuthStore = create<AuthStore>((set) => ({
    user: null,
    setUser: (user) => set({ user }),
}))

export default useAuthStore