import { createContext, useContext, useState } from 'react'

const MatchContext = createContext(null)

export const MatchProvider = ({ children }) => {
  const [currentMatch, setCurrentMatch] = useState({
    id: null,
    mode: null, // 'multiplayer', 'singleplayer', 'rapidfire'
    players: [],
    currentPrompt: null,
    story: '',
    timeLimit: 10, // minutes
    timeRemaining: 0,
    currentTurn: null,
    status: 'waiting', // 'waiting', 'playing', 'finished'
    scores: {},
  })

  const startMatch = (matchData) => {
    setCurrentMatch({ ...matchData, status: 'playing' })
  }

  const updateMatch = (updates) => {
    setCurrentMatch(prev => ({ ...prev, ...updates }))
  }

  const endMatch = () => {
    setCurrentMatch(prev => ({ ...prev, status: 'finished' }))
  }

  const resetMatch = () => {
    setCurrentMatch({
      id: null,
      mode: null,
      players: [],
      currentPrompt: null,
      story: '',
      timeLimit: 10,
      timeRemaining: 0,
      currentTurn: null,
      status: 'waiting',
      scores: {},
    })
  }

  return (
    <MatchContext.Provider value={{ currentMatch, startMatch, updateMatch, endMatch, resetMatch }}>
      {children}
    </MatchContext.Provider>
  )
}

export const useMatch = () => {
  const context = useContext(MatchContext)
  if (!context) {
    throw new Error('useMatch must be used within MatchProvider')
  }
  return context
}

