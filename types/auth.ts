export type UserRole = 'admin' | 'prestamista' | 'cliente'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}