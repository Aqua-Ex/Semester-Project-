import { createContext, useContext, useState } from 'react'

const UserContext = createContext(null)

export const UserProvider = ({ children }) => {
  // Default test user for development (replace with actual auth later)
  const [user, setUser] = useState({
    id: `test-user-${Date.now()}`,
    username: 'TestPlayer',
    avatar: null,
    score: 0,
    coins: 0,
    level: 1,
    isAuthenticated: true,
  })

  const updateUser = (userData) => {
    setUser(prev => ({ ...prev, ...userData }))
  }

  const login = (userData) => {
    setUser({ ...userData, isAuthenticated: true })
  }

  const logout = () => {
    setUser({
      id: null,
      username: null,
      avatar: null,
      score: 0,
      coins: 0,
      level: 1,
      isAuthenticated: false,
    })
  }

  return (
    <UserContext.Provider value={{ user, updateUser, login, logout }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within UserProvider')
  }
  return context
}

