import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import Card from '../../components/Cards/Card'
import Button from '../../components/Buttons/Button'
import Avatar from '../../components/Avatars/Avatar'
import Container from '../../components/Layout/Container'
import { AnimatedBackground } from '../../components/Background'
import { ThemeToggle } from '../../components/ThemeToggle'
import { useTheme } from '../../context/ThemeContext'
import { useUser } from '../../context/UserContext'
import { useCreateGame, useJoinGame, useGameState } from '../../hooks/useGameAPI'
import { useMatch } from '../../context/MatchContext'
import { useThemeClasses } from '../../hooks/useThemeClasses'

const Lobby = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { theme } = useTheme()
  const { user } = useUser()
  const { startMatch } = useMatch()
  const themeClasses = useThemeClasses()
  const isDark = theme === 'dark'
  
  const gameId = searchParams.get('gameId')
  const isHost = !gameId
  
  const [timeLimit, setTimeLimit] = useState(10) // minutes
  const [maxPlayers, setMaxPlayers] = useState(4)
  
  const createGameMutation = useCreateGame()
  const joinGameMutation = useJoinGame()
  const { data: gameData, isLoading: isLoadingGame } = useGameState(gameId, {
    enabled: !!gameId,
    refetchInterval: 2000, // Poll every 2 seconds
  })

  const game = gameData?.game
  const gameInfo = gameData?.info
  const players = game?.players || []
  const isFull = gameInfo?.isFull || false
  const canStart = players.length >= 2 && isHost

  // Create game on mount if host
  useEffect(() => {
    if (isHost && !createGameMutation.isPending && !gameId && user.id) {
      const initialPrompt = 'A traveler enters a mysterious forest...'
      createGameMutation.mutate({
        hostName: user.username || 'Player',
        hostId: user.id,
        initialPrompt,
        turnDurationSeconds: timeLimit * 60,
        maxTurns: 5,
        maxPlayers,
        mode: 'multi',
      }, {
        onSuccess: (data) => {
          if (data?.game?.id) {
            navigate(`/lobby?gameId=${data.game.id}`, { replace: true })
          }
        },
        onError: (error) => {
          console.error('Failed to create game:', error)
          alert('Failed to create game. Please try again.')
        },
      })
    }
  }, [isHost, user.id])

  // Join game if not host and not already joined
  useEffect(() => {
    if (!isHost && gameId && user.id && game && !joinGameMutation.isPending) {
      const isJoined = players.some(p => p.id === user.id)
      if (!isJoined && !isFull) {
        joinGameMutation.mutate({
          gameId,
          playerData: {
            playerName: user.username || 'Player',
            playerId: user.id,
          },
        }, {
          onError: (error) => {
            console.error('Failed to join game:', error)
            alert(error.message || 'Failed to join game. Please try again.')
          },
        })
      }
    }
  }, [gameId, game, user.id, isHost, isFull])

  const handleStartGame = () => {
    if (game && canStart) {
      startMatch({
        id: game.id,
        mode: 'multiplayer',
        players,
        currentPrompt: game.initialPrompt,
        story: '',
        timeLimit,
        status: 'playing',
      })
      navigate(`/multiplayer?gameId=${game.id}`)
    }
  }

  const isLoading = isLoadingGame || createGameMutation.isPending || joinGameMutation.isPending

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
                    {isHost ? 'Create Game' : 'Waiting Room'}
                  </h2>
                
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="text-lg">Loading...</div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-6 mb-8">
                      {Array.from({ length: maxPlayers }).map((_, index) => {
                        const player = players[index]
                        const isEmpty = !player
                        const isCurrentUser = player?.id === user.id
                        
                        return (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex flex-col items-center"
                          >
                            {isEmpty ? (
                              <div className={`w-24 h-24 rounded-full border-2 border-dashed flex items-center justify-center ${
                                isDark ? 'border-cloud-gray' : 'border-gray-300'
                              }`}>
                                <span className="text-4xl opacity-50">👤</span>
                              </div>
                            ) : (
                              <>
                                <Avatar
                                  user={{ id: player.id, username: player.name }}
                                  size="lg"
                                  showStatus
                                />
                                <div className={`mt-2 text-sm font-bold ${
                                  isCurrentUser ? 'text-mint-pop' : themeClasses.text
                                }`}>
                                  {player.name}
                                  {isCurrentUser && ' (You)'}
                                </div>
                              </>
                            )}
                          </motion.div>
                        )
                      })}
                    </div>
                  </>
                )}

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
                  {players.length} / {maxPlayers} players joined
                  {gameId && (
                    <div className="text-xs mt-2 opacity-70">
                      Game ID: {gameId.slice(0, 8)}...
                    </div>
                  )}
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

              {/* Max Players Setting */}
              {isHost && (
                <Card className="p-6">
                  <h3 className="text-xl font-header font-bold mb-4">
                    Max Players
                  </h3>
                  <div className="flex gap-2">
                    {[2, 3, 4, 5].map((count) => (
                      <Button
                        key={count}
                        variant={maxPlayers === count ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => setMaxPlayers(count)}
                        className="flex-1"
                      >
                        {count}
                      </Button>
                    ))}
                  </div>
                </Card>
              )}

              {/* Start Game Button */}
              <motion.div
                animate={canStart ? { scale: [1, 1.05, 1] } : {}}
                transition={{ repeat: canStart ? Infinity : 0, duration: 2 }}
              >
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={!canStart || isLoading}
                  onClick={handleStartGame}
                >
                  {isLoading ? 'Loading...' : canStart ? '🚀 Start Game' : `Waiting for players... (${players.length}/${maxPlayers})`}
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

