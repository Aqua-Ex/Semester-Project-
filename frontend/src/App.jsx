import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { UserProvider } from './context/UserContext'
import { MatchProvider } from './context/MatchContext'
import { ThemeProvider } from './context/ThemeContext'
import Home from './pages/Home/Home'
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
                <Route path="/lobby" element={<Lobby />} />
                <Route path="/multiplayer" element={<Multiplayer />} />
                <Route path="/singleplayer" element={<SinglePlayer />} />
                <Route path="/rapidfire" element={<RapidFire />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/history" element={<History />} />
                <Route path="/story/:id" element={<StoryView />} />
              </Routes>
            </Router>
          </MatchProvider>
        </UserProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App

