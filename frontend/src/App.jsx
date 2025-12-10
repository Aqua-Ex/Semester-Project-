import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { UserProvider } from './context/UserContext'
import { MatchProvider } from './context/MatchContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home/Home'
import Login from './pages/Login'
import Lobby from './pages/Lobby/Lobby'
import Multiplayer from './pages/Multiplayer/Multiplayer'
import SinglePlayer from './pages/SinglePlayer/SinglePlayer'
import RapidFire from './pages/RapidFire/RapidFire'
import Leaderboard from './pages/Leaderboard/Leaderboard'
import History from './pages/History/History'
import StoryView from './pages/StoryView/StoryView'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <UserProvider>
          <MatchProvider>
            <Router>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route 
                  path="/lobby" 
                  element={
                    <ProtectedRoute>
                      <Lobby />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/multiplayer" 
                  element={
                    <ProtectedRoute>
                      <Multiplayer />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/singleplayer" 
                  element={
                    <ProtectedRoute>
                      <SinglePlayer />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/rapidfire" 
                  element={
                    <ProtectedRoute>
                      <RapidFire />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/history" 
                  element={
                    <ProtectedRoute>
                      <History />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/story/:id" 
                  element={
                    <ProtectedRoute>
                      <StoryView />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </Router>
          </MatchProvider>
        </UserProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App

