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
import { useCreateGame, useGameState, useStartGame, useRequestJoin, useReviewJoinRequest, useAvailableLobbies, useAbandonGame, useUpdateGameSettings } from '../../hooks/useGameAPI'
import { useMatch } from '../../context/MatchContext'
import { useThemeClasses } from '../../hooks/useThemeClasses'

const Lobby = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { theme } = useTheme()
  const { user } = useUser()
  const { startMatch } = useMatch()
  const themeClasses = useThemeClasses()
  const isDark = theme === 'dark'
  
  const gameId = searchParams.get('gameId')
  
  const [timeLimit, setTimeLimit] = useState(10) // minutes
  const [maxPlayers, setMaxPlayers] = useState(4)
  
  const createGameMutation = useCreateGame()
  const startGameMutation = useStartGame()
  const updateGameSettingsMutation = useUpdateGameSettings()
  const requestJoinMutation = useRequestJoin()
  const reviewJoinMutation = useReviewJoinRequest()
  const abandonGameMutation = useAbandonGame()
  const { data: lobbiesData, isLoading: isLoadingLobbies } = useAvailableLobbies({
    enabled: true,
    refetchInterval: 4000,
  })
  const { data: gameData, isLoading: isLoadingGame } = useGameState(gameId, {
    enabled: !!gameId,
    refetchInterval: 2000, // Poll every 2 seconds
    refetchWhileWaiting: true,
  })

  const lobbies = lobbiesData?.lobbies || []
  const game = gameData?.game
  const gameInfo = gameData?.info
  const players = game?.players || []
  const pendingRequests = game?.pendingRequests || []
  // Use gameData directly to avoid any TDZ issues with the local `game` binding
  const isHost = gameData?.game?.hostId === user.id
  const isPlayer = players.some(p => p.id === user.id)
  const isFull = gameInfo?.isFull || false
  const canStart = players.length >= 2 && isHost && game?.status === 'waiting'
  const myPendingRequest = pendingRequests.find(req => req.playerId === user.id)
  const canEditLobbySettings = isHost && game?.status === 'waiting'
  const displayMaxPlayers = canEditLobbySettings ? maxPlayers : game?.maxPlayers || maxPlayers
  const waitingForApproval = !isHost && !isPlayer && !!myPendingRequest
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'

  // Keep maxPlayers in sync with server once the game loads
  useEffect(() => {
    if (game?.maxPlayers) {
      setMaxPlayers(game.maxPlayers)
    }
  }, [game?.maxPlayers])

  useEffect(() => {
    if (game?.turnDurationSeconds) {
      setTimeLimit(Math.round(game.turnDurationSeconds / 60))
    }
  }, [game?.turnDurationSeconds])

  const handleCreateLobby = () => {
    if (createGameMutation.isPending || !user.id) return

    createGameMutation.mutate({
      hostName: user.username || 'Player',
      hostId: user.id,
      initialPrompt: '',
      turnDurationSeconds: timeLimit * 60,
      maxTurns: 5,
      maxPlayers,
      mode: 'multi',
    }, {
      onSuccess: (data) => {
        if (data?.game?.id) {
          setSearchParams({ gameId: data.game.id })
        }
      },
      onError: (error) => {
        console.error('Failed to create game:', error)
        alert('Failed to create game. Please try again.')
      },
    })
  }

  const handleMaxPlayersChange = (count) => {
    setMaxPlayers(count)

    if (game && canEditLobbySettings) {
      updateGameSettingsMutation.mutate({
        gameId: game.id,
        settings: {
          hostId: user.id,
          maxPlayers: count,
        },
      })
    }
  }

  const handleTimeLimitChange = (minutes) => {
    setTimeLimit(minutes)

    if (game && canEditLobbySettings) {
      updateGameSettingsMutation.mutate({
        gameId: game.id,
        settings: {
          hostId: user.id,
          turnDurationSeconds: minutes * 60,
        },
      })
    }
  }

  const handleRequestJoin = () => {
    if (!gameId || requestJoinMutation.isPending || myPendingRequest || isPlayer) return
    if (game && game.status !== 'waiting') return

    requestJoinMutation.mutate({
      gameId,
      playerData: {
        playerName: user.username || 'Player',
        playerId: user.id,
      },
    }, {
      onError: (error) => {
        console.error('Failed to request to join:', error)
        alert(error.message || 'Failed to request to join. Please try again.')
      },
    })
  }

  // Ensure host closes lobby when leaving the page/tab
  useEffect(() => {
    const shouldCloseLobby = () => isHost && gameId && game?.status === 'waiting'

    const sendBeaconClose = () => {
      if (!shouldCloseLobby()) return
      const url = `${apiBaseUrl}/api/game/${gameId}/abandon`
      const payload = JSON.stringify({ playerId: user.id, reason: 'host_left' })
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' })
        navigator.sendBeacon(url, blob)
      } else {
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {})
      }
    }

    const handleBeforeUnload = () => {
      sendBeaconClose()
    }

    const handlePageHide = (event) => {
      // Only fire on full page unloads (tab close, navigation), not simple visibility changes
      if (event.persisted) return
      sendBeaconClose()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('pagehide', handlePageHide)
    window.addEventListener('unload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('pagehide', handlePageHide)
      window.removeEventListener('unload', handleBeforeUnload)
    }
  }, [isHost, gameId, game?.status, user.id, abandonGameMutation, apiBaseUrl])

  const handleReviewRequest = (playerId, approve) => {
    if (!game?.id || reviewJoinMutation.isPending) return

    reviewJoinMutation.mutate({
      gameId: game.id,
      decision: {
        hostId: user.id,
        playerId,
        approve,
      },
    }, {
      onError: (error) => {
        console.error('Failed to review request:', error)
        alert(error.message || 'Failed to update join request. Please try again.')
      },
    })
  }

  const handleStartGame = () => {
    if (game && canStart) {
      startGameMutation.mutate({
        gameId: game.id,
        playerId: user.id,
      }, {
        onError: (error) => {
          console.error('Failed to start game:', error)
          alert(error.message || 'Failed to start game. Please try again.')
        },
      })
    }
  }

  // Navigate everyone to the game once the backend flips to active
  useEffect(() => {
    if (game?.status === 'active' && game.id) {
      const timeLimitMinutes = game.turnDurationSeconds ? Math.round(game.turnDurationSeconds / 60) : timeLimit
      startMatch({
        id: game.id,
        mode: 'multiplayer',
        players: game.players,
        currentPrompt: game.guidePrompt || game.initialPrompt,
        story: '',
        timeLimit: timeLimitMinutes,
        status: 'playing',
      })
      navigate(`/multiplayer?gameId=${game.id}`)
    }
  }, [
    game?.status,
    game?.id,
    game?.turnDurationSeconds,
    game?.guidePrompt,
    game?.initialPrompt,
    game?.players,
    navigate,
    startMatch,
    timeLimit,
  ])

  const isLoading = isLoadingGame || createGameMutation.isPending || startGameMutation.isPending || requestJoinMutation.isPending || reviewJoinMutation.isPending || abandonGameMutation.isPending || updateGameSettingsMutation.isPending
  const startButtonLabel = !gameId
    ? 'Select a lobby to begin'
    : isLoading
      ? 'Loading...'
      : canStart
        ? '🚀 Start Game'
        : isHost
          ? `Waiting for players... (${players.length}/${displayMaxPlayers})`
          : waitingForApproval
            ? 'Waiting for approval...'
            : 'Waiting for host...'

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

          <Card className="p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <div>
                <h2 className="text-2xl font-header font-bold">Open Lobbies</h2>
                <p className={`text-sm ${isDark ? 'text-cloud-gray' : 'text-light-text-secondary'}`}>
                  Join a waiting game or host your own. Hosts must approve join requests.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setSearchParams({})}>
                  Clear Selection
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCreateLobby}
                  disabled={createGameMutation.isPending}
                >
                  {createGameMutation.isPending ? 'Hosting...' : 'Host New Lobby'}
                </Button>
              </div>
            </div>
            {isLoadingLobbies ? (
              <div className="text-center py-6">Loading lobbies...</div>
            ) : lobbies.length === 0 ? (
              <div className={`text-center py-6 ${isDark ? 'text-cloud-gray' : 'text-light-text-secondary'}`}>
                No open lobbies yet. Be the first to host!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lobbies.map((lobby) => {
                  const isSelected = gameId === lobby.id
                  return (
                    <Card key={lobby.id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="text-sm uppercase tracking-wide text-electric-purple font-semibold">Host</div>
                          <div className="text-lg font-bold">{lobby.hostName}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm">Players</div>
                          <div className="text-xl font-bold">{lobby.playerCount} / {lobby.maxPlayers}</div>
                        </div>
                      </div>
                      <div className="text-xs mb-3 flex items-center justify-between">
                        <span className={isDark ? 'text-cloud-gray' : 'text-light-text-secondary'}>
                          Requests waiting: {lobby.pendingRequests}
                        </span>
                        <span className="opacity-60">
                          {lobby.createdAt ? new Date(lobby.createdAt).toLocaleTimeString() : 'Just now'}
                        </span>
                      </div>
                      <Button
                        variant={isSelected ? 'primary' : 'ghost'}
                        size="sm"
                        className="w-full"
                        onClick={() => setSearchParams({ gameId: lobby.id })}
                      >
                        {isSelected ? 'Viewing lobby' : 'View lobby'}
                      </Button>
                    </Card>
                  )
                })}
              </div>
            )}
          </Card>

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
                    {game ? (isHost ? 'Your Lobby' : 'Waiting Room') : 'Pick a Lobby'}
                  </h2>
                
                {!gameId ? (
                  <div className="text-center py-8">
                    <div className="text-lg">Select a lobby above or host a new game to begin.</div>
                    <div className={`text-sm ${isDark ? 'text-cloud-gray' : 'text-light-text-secondary'}`}>
                      Hosts approve or deny join requests by player name.
                    </div>
                  </div>
                ) : isLoading ? (
                  <div className="text-center py-8">
                    <div className="text-lg">Loading...</div>
                  </div>
                ) : !game ? (
                  <div className="text-center py-8">
                    <div className="text-lg">Lobby not found.</div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-6 mb-8">
                      {Array.from({ length: displayMaxPlayers }).map((_, index) => {
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

                    {/* Thread Connection Animation */}
                    <div className="relative h-20 mb-6">
                      <svg className="absolute inset-0 w-full h-full">
                        {players.map((_, i) => {
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
                      {players.length} / {displayMaxPlayers} players joined
                      {gameId && (
                        <div className="text-xs mt-2 opacity-70">
                          Game ID: {gameId.slice(0, 8)}...
                        </div>
                      )}
                      {!isHost && !isPlayer && myPendingRequest && (
                        <div className="text-xs mt-1 text-mint-pop">Waiting for host approval...</div>
                      )}
                    </div>
                    {!isHost && !isPlayer && game?.status === 'waiting' && (
                      <div className="mt-4 flex justify-center">
                        <Button
                          variant="primary"
                          size="md"
                          disabled={isFull || !!myPendingRequest || requestJoinMutation.isPending}
                          onClick={handleRequestJoin}
                          className="min-w-[220px]"
                        >
                          {isFull ? 'Lobby Full' : myPendingRequest ? 'Request Sent' : 'Request to Join'}
                        </Button>
                      </div>
                    )}
                  </>
                )}
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
                      onClick={() => handleTimeLimitChange(time)}
                      disabled={game ? (!canEditLobbySettings || updateGameSettingsMutation.isPending) : false}
                      className="flex-1"
                    >
                      {time}m
                    </Button>
                  ))}
                </div>
              </Card>

              {isHost && game && (
                <Card className="p-6">
                  <h3 className="text-xl font-header font-bold mb-4">
                    Join Requests
                  </h3>
                  {pendingRequests.length === 0 ? (
                    <div className={`${isDark ? 'text-cloud-gray' : 'text-light-text-secondary'} text-sm`}>
                      No pending requests right now.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingRequests.map((req) => (
                        <div key={req.playerId} className={`flex items-center justify-between gap-3 p-3 rounded-lg ${
                          isDark ? 'bg-soft-charcoal' : 'bg-light-card'
                        }`}>
                          <div>
                            <div className="font-bold">{req.playerName}</div>
                            <div className={`text-xs ${isDark ? 'text-cloud-gray' : 'text-light-text-secondary'}`}>
                              Requested {req.requestedAt ? new Date(req.requestedAt).toLocaleTimeString() : 'just now'}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={reviewJoinMutation.isPending}
                              onClick={() => handleReviewRequest(req.playerId, false)}
                            >
                              Deny
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              disabled={reviewJoinMutation.isPending || players.length >= displayMaxPlayers}
                              onClick={() => handleReviewRequest(req.playerId, true)}
                            >
                              Approve
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )}

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
                        onClick={() => handleMaxPlayersChange(count)}
                        disabled={game ? (!canEditLobbySettings || updateGameSettingsMutation.isPending) : false}
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
                  disabled={!canStart || isLoading || !isHost || !gameId}
                  onClick={handleStartGame}
                >
                  {startButtonLabel}
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
