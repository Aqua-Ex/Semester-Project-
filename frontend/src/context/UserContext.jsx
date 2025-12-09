import { createContext, useContext, useState } from 'react'

const UserContext = createContext(null)

export const UserProvider = ({ children }) => {
  // Default test user for development (replace with actual auth later)
  // Generate a Firebase-compatible user ID (alphanumeric, hyphens, underscores only)
  const generateTestUserId = () => {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 9)
    return `testuser_${timestamp}_${random}`
  }

  const [user, setUser] = useState({
    id: generateTestUserId(),
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

