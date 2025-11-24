import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Card from '../../components/Cards/Card'
import Button from '../../components/Buttons/Button'
import Avatar from '../../components/Avatars/Avatar'
import Container from '../../components/Layout/Container'
import { AnimatedBackground } from '../../components/Background'
import { ThemeToggle } from '../../components/ThemeToggle'
import { useTheme } from '../../context/ThemeContext'

const Lobby = () => {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [players, setPlayers] = useState([
    { id: '1', username: 'Player1', isReady: true },
    { id: '2', username: 'Player2', isReady: false },
    { id: '3', username: 'Player3', isReady: true },
    { id: '4', username: 'You', isReady: false },
  ])
  const [timeLimit, setTimeLimit] = useState(10)

  const toggleReady = (playerId) => {
    setPlayers(prev =>
      prev.map(p => (p.id === playerId ? { ...p, isReady: !p.isReady } : p))
    )
  }

  const allReady = players.every(p => p.isReady)
  const readyCount = players.filter(p => p.isReady).length

  return (
    <div className={`min-h-screen relative transition-colors ${
      isDark ? 'bg-deep-graphite' : 'bg-light-bg'
    }`}>
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      <AnimatedBackground variant="lobby" />
      
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-4xl opacity-10"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              rotate: [0, 360],
            }}
            transition={{
              duration: 5 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          >
            {['👥', '🎮', '✨', '🎯', '⚡', '🌟', '💫', '🎨'][i]}
          </motion.div>
        ))}
      </div>
      
      <Container className="relative z-10">
        <div className="py-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-8"
          >
            ← Back to Home
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Player Slots */}
            <div className="lg:col-span-2">
              <Card className="p-8 relative overflow-hidden">
                {/* Decorative background */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-electric-purple to-mint-pop opacity-10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-laser-coral to-sunbeam-yellow opacity-10 rounded-full blur-2xl" />
                
                <div className="relative z-10">
                  <div className="text-center mb-4">
                    <motion.span
                      className="text-5xl inline-block"
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      👥
                    </motion.span>
                  </div>
                  <h2 className="text-3xl font-header font-bold mb-6 text-center">
                    Waiting Room
                  </h2>
                
                <div className="grid grid-cols-2 gap-6 mb-8">
                  {players.map((player, index) => (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex flex-col items-center"
                    >
                      <Avatar
                        user={player}
                        size="lg"
                        isReady={player.isReady}
                        showStatus
                      />
                      <Button
                        variant={player.isReady ? 'primary' : 'secondary'}
                        size="sm"
                        className="mt-4 w-full"
                        onClick={() => toggleReady(player.id)}
                      >
                        {player.isReady ? '✓ Ready' : 'Not Ready'}
                      </Button>
                    </motion.div>
                  ))}
                </div>

                {/* Thread Connection Animation */}
                <div className="relative h-20 mb-6">
                  <svg className="absolute inset-0 w-full h-full">
                    {players.map((player, i) => {
                      if (i === players.length - 1) return null
                      const x1 = (i % 2) * 50 + 25
                      const y1 = i < 2 ? 0 : 100
                      const x2 = ((i + 1) % 2) * 50 + 25
                      const y2 = (i + 1) < 2 ? 0 : 100
                      return (
                        <motion.line
                          key={i}
                          x1={`${x1}%`}
                          y1={`${y1}%`}
                          x2={`${x2}%`}
                          y2={`${y2}%`}
                          stroke="#7A33FF"
                          strokeWidth="2"
                          strokeDasharray="5,5"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 1, delay: i * 0.2 }}
                        />
                      )
                    })}
                  </svg>
                </div>

                <div className={`text-center ${
                  isDark ? 'text-cloud-gray' : 'text-light-text-secondary'
                }`}>
                  {readyCount} / {players.length} players ready
                </div>
                </div>
              </Card>
            </div>

            {/* Settings & Chat */}
            <div className="space-y-6">
              {/* Time Limit */}
              <Card className="p-6">
                <h3 className="text-xl font-header font-bold mb-4">
                  Time Limit
                </h3>
                <div className="flex gap-2">
                  {[5, 10, 15].map((time) => (
                    <Button
                      key={time}
                      variant={timeLimit === time ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setTimeLimit(time)}
                      className="flex-1"
                    >
                      {time}m
                    </Button>
                  ))}
                </div>
              </Card>

              {/* Chat Area */}
              <Card className="p-6 h-64 flex flex-col">
                <h3 className="text-xl font-header font-bold mb-4">
                  Chat
                </h3>
                <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                  <div className={`p-3 rounded-lg ${
                    isDark ? 'bg-soft-charcoal' : 'bg-light-card'
                  }`}>
                    <span className="text-mint-pop font-bold">Player1:</span>
                    <span className={`ml-2 ${
                      isDark ? 'text-cloud-gray' : 'text-light-text-secondary'
                    }`}>
                      Let's make this epic!
                    </span>
                  </div>
                  <div className={`p-3 rounded-lg ${
                    isDark ? 'bg-soft-charcoal' : 'bg-light-card'
                  }`}>
                    <span className="text-sunbeam-yellow font-bold">Player2:</span>
                    <span className={`ml-2 ${
                      isDark ? 'text-cloud-gray' : 'text-light-text-secondary'
                    }`}>
                      Ready when you are!
                    </span>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Type a message..."
                  className={`w-full rounded-lg px-4 py-2 focus:outline-none focus:border-mint-pop ${
                    isDark 
                      ? 'bg-deep-graphite border border-soft-charcoal text-white' 
                      : 'bg-light-card border border-gray-200 text-light-text'
                  }`}
                />
              </Card>

              {/* Start Game Button */}
              <motion.div
                animate={allReady ? { scale: [1, 1.05, 1] } : {}}
                transition={{ repeat: allReady ? Infinity : 0, duration: 2 }}
              >
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={!allReady}
                  onClick={() => navigate('/multiplayer')}
                >
                  {allReady ? '🚀 Start Game' : 'Waiting for players...'}
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}

export default Lobby

