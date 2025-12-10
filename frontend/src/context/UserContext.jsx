import { createContext, useContext, useState, useEffect } from 'react'
import { 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged 
} from 'firebase/auth'
import { auth, googleProvider } from '../firebase/config'

const UserContext = createContext(null)

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState({
    id: null,
    username: null,
    email: null,
    avatar: null,
    score: 0,
    coins: 0,
    level: 1,
    isAuthenticated: false,
    loading: true,
  })

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          email: firebaseUser.email,
          avatar: firebaseUser.photoURL,
          score: 0, // These would come from your database
          coins: 0,
          level: 1,
          isAuthenticated: true,
          loading: false,
        })
      } else {
        setUser({
          id: null,
          username: null,
          email: null,
          avatar: null,
          score: 0,
          coins: 0,
          level: 1,
          isAuthenticated: false,
          loading: false,
        })
      }
    })

    return () => unsubscribe()
  }, [])

  const updateUser = (userData) => {
    setUser(prev => ({ ...prev, ...userData }))
  }

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider)
      // Auth state listener will update the user automatically
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await firebaseSignOut(auth)
      // Auth state listener will update the user automatically
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
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

