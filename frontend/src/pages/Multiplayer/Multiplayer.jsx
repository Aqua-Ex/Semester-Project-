import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import PromptCard from '../../components/PromptCard/PromptCard'
import StoryEditor from '../../components/StoryEditor/StoryEditor'
import Timer from '../../components/Timer/Timer'
import Avatar from '../../components/Avatars/Avatar'
import Button from '../../components/Buttons/Button'
import Card from '../../components/Cards/Card'
import Container from '../../components/Layout/Container'
import { AnimatedBackground } from '../../components/Background'
import { ThemeToggle } from '../../components/ThemeToggle'
import { useThemeClasses } from '../../hooks/useThemeClasses'
import { useUser } from '../../context/UserContext'
import { useSubmitTurn, useGameState, usePreviewTurn } from '../../hooks/useGameAPI'
import { useMatch } from '../../context/MatchContext'

const Multiplayer = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const themeClasses = useThemeClasses()
  const { user } = useUser()
  const { updateMatch } = useMatch()
  const [story, setStory] = useState('')
  const [preview, setPreview] = useState('')
  
  const gameId = searchParams.get('gameId')
  const submitTurnMutation = useSubmitTurn()
  const previewTurnMutation = usePreviewTurn()
  const { data: gameData, isLoading } = useGameState(gameId, {
    enabled: !!gameId,
    refetchInterval: 2000, // Poll every 2 seconds for active games
  })

  const game = gameData?.game
  const gameInfo = gameData?.info
  const currentPrompt = game?.guidePrompt || game?.initialPrompt || 'A mysterious door appears in the middle of the forest, glowing with an otherworldly light.'
  const isMyTurn = game?.currentPlayerId === user.id
  const timeRemaining = gameInfo?.timeRemainingSeconds || 0
  const players = game?.players || []

  // Redirect if no gameId
  useEffect(() => {
    if (!gameId) {
      navigate('/lobby')
    }
  }, [gameId, navigate])

  // Update match context when game state changes
  useEffect(() => {
    if (game) {
      updateMatch({
        id: game.id,
        players: game.players,
        currentPrompt: game.guidePrompt || game.initialPrompt,
        currentTurn: game.currentPlayer,
        status: game.status,
        timeRemaining,
      })
    }
  }, [game, timeRemaining])

  // Navigate to story view when game finishes
  useEffect(() => {
    if (game?.status === 'finished' && gameId) {
      navigate(`/story/${gameId}`)
    }
  }, [game?.status, gameId, navigate])

  const handlePreviewTurn = () => {
    if (!gameId || !story.trim() || !isMyTurn) return

    setPreview('')
    previewTurnMutation.mutate({
      gameId,
      turnData: {
        playerName: user.username || 'Player',
        playerId: user.id,
        text: story,
      },
    }, {
      onSuccess: (data) => setPreview(data?.preview || ''),
      onError: (error) => {
        console.error('Failed to preview turn:', error)
        alert(error.message || 'Failed to preview turn. Please try again.')
      },
    })
  }

  const handleSubmitTurn = () => {
    if (!gameId || !story.trim() || !isMyTurn) return

    submitTurnMutation.mutate({
      gameId,
      turnData: {
        playerName: user.username || 'Player',
        playerId: user.id,
        text: story,
      },
    }, {
      onSuccess: () => {
        setStory('')
      },
      onError: (error) => {
        console.error('Failed to submit turn:', error)
        alert(error.message || 'Failed to submit turn. Please try again.')
      },
    })
  }

  return (
    <div className={`min-h-screen relative transition-colors ${themeClasses.bg}`}>
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      <AnimatedBackground variant="game" />
      
      {/* Story-themed decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {['📖', '✍️', '🎭', '✨', '📝', '🖋️'].map((icon, i) => (
          <motion.div
            key={i}
            className="absolute text-5xl opacity-10"
            style={{
              left: `${15 + i * 12}%`,
              top: `${10 + (i % 2) * 40}%`,
            }}
            animate={{
              y: [0, -20, 0],
              rotate: [0, 15, -15, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 4 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          >
            {icon}
          </motion.div>
        ))}
      </div>
      
      <Container className="relative z-10">
        <div className="py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate('/lobby')}
            >
              ← Leave Game
            </Button>
            <div className="text-2xl font-header font-bold gradient-text">
              Multiplayer Story
            </div>
            <div className="w-24" /> {/* Spacer */}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Prompt Card */}
            <div className="lg:col-span-3">
              {isLoading ? (
                <Card className="p-6">
                  <div className="text-center">Loading...</div>
                </Card>
              ) : (
                <>
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <PromptCard
                      prompt={currentPrompt}
                      category="twist"
                      className="sticky top-8"
                    />
                  </motion.div>
                  {timeRemaining > 0 && (
                    <motion.div
                      className={`mt-4 text-center text-sm ${themeClasses.textSecondary}`}
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <span className="text-lg mr-2">⏱️</span>
                      Time remaining: <span className="text-mint-pop font-bold">{timeRemaining}s</span>
                    </motion.div>
                  )}
                </>
              )}
            </div>

            {/* Center: Story Editor */}
            <div className="lg:col-span-6">
              <Card className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className={`text-xl font-header font-bold ${themeClasses.text}`}>The Story</h3>
                  <div className={`text-sm ${themeClasses.textSecondary}`}>
                    Word count: <span className="text-mint-pop">{story.split(' ').filter(w => w).length}</span>
                    {gameInfo && (
                      <span className="ml-4">
                        Turn {game?.turnsCount || 0} / {game?.maxTurns || 5}
                      </span>
                    )}
                  </div>
                </div>
                
                <StoryEditor
                  content={story}
                  onChange={setStory}
                  isActive={isMyTurn}
                  placeholder={isMyTurn ? "Continue the story..." : `Waiting for ${game?.currentPlayer || 'player'}...`}
                />
                
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    onClick={handlePreviewTurn}
                    disabled={!isMyTurn || !story.trim() || previewTurnMutation.isPending}
                    className="flex-1 min-w-[180px]"
                  >
                    {previewTurnMutation.isPending ? 'Previewing...' : 'Preview AI Response'}
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSubmitTurn}
                    disabled={!isMyTurn || !story.trim() || submitTurnMutation.isPending}
                    className="flex-1 min-w-[180px]"
                  >
                    {submitTurnMutation.isPending ? 'Submitting...' : 'Submit Turn'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setStory('')}
                    disabled={!isMyTurn}
                  >
                    Clear
                  </Button>
                </div>

                {(previewTurnMutation.isPending || preview) && (
                  <Card className="mt-4 bg-soft-charcoal/40">
                    <div className="text-sm font-bold mb-2 text-mint-pop">AI Preview</div>
                    {previewTurnMutation.isPending ? (
                      <div className="text-sm text-cloud-gray">Generating response...</div>
                    ) : (
                      <div className={`text-sm leading-relaxed ${themeClasses.text}`}>
                        {preview || 'No preview yet.'}
                      </div>
                    )}
                  </Card>
                )}

                {/* Thread Meter */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-decorative ${themeClasses.textSecondary}`}>Story Momentum</span>
                    <span className="text-sm font-bold text-mint-pop">🔥 High</span>
                  </div>
                  <div className="w-full bg-soft-charcoal rounded-full h-3 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-purple-mint"
                      initial={{ width: '0%' }}
                      animate={{ width: '75%' }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                </div>

                {/* Reaction Buttons */}
                <div className="mt-6 flex gap-2">
                  {['🔥', '💥', '😂', '🎭', '✨'].map((emoji) => (
                    <motion.button
                      key={emoji}
                      className="text-2xl p-2 hover:bg-soft-charcoal rounded-lg transition-colors"
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {emoji}
                    </motion.button>
                  ))}
                </div>
              </Card>
            </div>

            {/* Right: Timer & Players */}
            <div className="lg:col-span-3 space-y-6">
              {/* Timer */}
              <Card className="p-6 flex flex-col items-center">
                <h3 className={`text-lg font-header font-bold mb-4 ${themeClasses.text}`}>
                  {isMyTurn ? 'Your Turn' : `${game?.currentPlayer || "Player"}'s Turn`}
                </h3>
                {timeRemaining > 0 ? (
                  <Timer
                    initialTime={game?.turnDurationSeconds || 120}
                    timeRemaining={timeRemaining}
                    size={120}
                  />
                ) : (
                  <div className="text-4xl">⏱️</div>
                )}
              </Card>

              {/* Players List */}
              <Card className="p-6">
                <h3 className={`text-lg font-header font-bold mb-4 ${themeClasses.text}`}>Players</h3>
                {isLoading ? (
                  <div className="text-center py-4">Loading...</div>
                ) : (
                  <div className="space-y-4">
                    {players.map((player, index) => {
                      const isActive = player.id === game?.currentPlayerId
                      const isCurrentUser = player.id === user.id
                      return (
                        <motion.div
                          key={player.id}
                          className={`
                            flex items-center gap-3 p-3 rounded-lg
                            ${isActive 
                              ? 'bg-mint-pop bg-opacity-20 border-2 border-mint-pop' 
                              : themeClasses.card
                            }
                            transition-all
                          `}
                          animate={isActive ? { scale: [1, 1.02, 1] } : {}}
                          transition={{ repeat: isActive ? Infinity : 0, duration: 2 }}
                        >
                          <Avatar user={{ id: player.id, username: player.name }} size="sm" />
                          <div className="flex-1">
                            <div className={`font-bold text-sm ${themeClasses.text}`}>
                              {player.name}
                              {isCurrentUser && ' (You)'}
                            </div>
                            {isActive && (
                              <div className="text-xs text-mint-pop">Writing...</div>
                            )}
                          </div>
                          {/* Thread connection indicator */}
                          {index < players.length - 1 && (
                            <div className="w-1 h-8 bg-electric-purple opacity-50" />
                          )}
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </Card>

              {/* AI Drama Meter */}
              <Card className="p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-laser-coral to-sunbeam-yellow opacity-20 rounded-full blur-2xl" />
                <div className="relative z-10">
                  <h3 className={`text-lg font-header font-bold mb-4 flex items-center gap-2 ${themeClasses.text}`}>
                    <span className="text-2xl">🤖</span>
                    AI Drama Meter
                  </h3>
                  <div className="space-y-3">
                    <motion.div
                      className={`flex items-center gap-2 text-sm p-2 rounded-lg ${themeClasses.card}`}
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                    >
                      <motion.span
                        className="text-2xl"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        🔥
                      </motion.span>
                      <span className={themeClasses.textSecondary}>Spicy plot twist detected</span>
                    </motion.div>
                    <motion.div
                      className={`flex items-center gap-2 text-sm p-2 rounded-lg ${themeClasses.card}`}
                      animate={{ x: [0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                    >
                      <motion.span
                        className="text-2xl"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                      >
                        💥
                      </motion.span>
                      <span className={themeClasses.textSecondary}>Creativity surge!</span>
                    </motion.div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}

export default Multiplayer
