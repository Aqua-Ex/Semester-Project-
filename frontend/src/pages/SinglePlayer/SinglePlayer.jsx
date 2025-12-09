import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import PromptCard from '../../components/PromptCard/PromptCard'
import StoryEditor from '../../components/StoryEditor/StoryEditor'
import Timer from '../../components/Timer/Timer'
import Button from '../../components/Buttons/Button'
import Card from '../../components/Cards/Card'
import Container from '../../components/Layout/Container'
import { AnimatedBackground } from '../../components/Background'
import { ThemeToggle } from '../../components/ThemeToggle'
import { useThemeClasses } from '../../hooks/useThemeClasses'
import { useUser } from '../../context/UserContext'
import { useCreateGame, useSubmitTurn, useGameState, useGameTurns } from '../../hooks/useGameAPI'
import { useMatch } from '../../context/MatchContext'

const SinglePlayer = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const themeClasses = useThemeClasses()
  const { user } = useUser()
  const { startMatch, updateMatch } = useMatch()
  const [story, setStory] = useState('')
  
  const gameId = searchParams.get('gameId')
  const createGameMutation = useCreateGame()
  const submitTurnMutation = useSubmitTurn()
  const { data: gameData, isLoading, error: gameError } = useGameState(gameId, {
    enabled: !!gameId,
    refetchInterval: 2000, // Poll every 2 seconds for active games
    pollWaiting: false, // Don't poll waiting games in single player
  })
  const { data: turnsData } = useGameTurns(gameId)

  const game = gameData?.game
  const gameInfo = gameData?.info
  const turns = turnsData?.turns || []
  const currentPrompt = game?.initialPrompt || game?.guidePrompt || 'You wake up in a world where gravity works sideways.'
  const isMyTurn = game?.currentPlayerId === user?.id
  const timeRemaining = gameInfo?.timeRemainingSeconds || 0
  
  // Build accumulated story from turns
  const accumulatedStory = turns.length > 0 
    ? turns.map(turn => turn.text).join('\n\n')
    : game?.initialPrompt || ''
  
  // Show loading state while creating game
  const isCreatingGame = !gameId && !game && createGameMutation.isPending

  // Create game on mount if no gameId
  useEffect(() => {
    if (!gameId && user?.id && !createGameMutation.isPending && !createGameMutation.isSuccess) {
      createGameMutation.mutate({
        hostName: user.username || 'Player',
        hostId: user.id,
        initialPrompt: 'You wake up in a world where gravity works sideways.',
        turnDurationSeconds: 300, // 5 minutes
        maxTurns: 5,
        maxPlayers: 2,
        mode: 'single',
      }, {
        onSuccess: (data) => {
          if (data?.game?.id) {
            navigate(`/singleplayer?gameId=${data.game.id}`, { replace: true })
            startMatch({
              id: data.game.id,
              mode: 'singleplayer',
              players: data.game.players,
              currentPrompt: data.game.initialPrompt,
              story: '',
              timeLimit: 5,
              status: 'playing',
            })
          }
        },
        onError: (error) => {
          console.error('Failed to create game:', error)
          alert(`Failed to create game: ${error.message || 'Please try again.'}`)
        },
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, user?.id])

  // Update match context when game state changes
  useEffect(() => {
    if (game) {
      updateMatch({
        id: game.id,
        currentPrompt: game.guidePrompt || game.initialPrompt,
        currentTurn: game.currentPlayer,
        status: game.status,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game])

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
      onSuccess: (data) => {
        setStory('')
        if (data?.game?.status === 'finished') {
          navigate(`/story/${gameId}`)
        }
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
      
      {/* Duel-themed decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {['⚔️', '🛡️', '⚡', '🎯', '🔥'].map((icon, i) => (
          <motion.div
            key={i}
            className="absolute text-5xl opacity-10"
            style={{
              left: `${15 + i * 15}%`,
              top: `${10 + (i % 2) * 40}%`,
            }}
            animate={{
              y: [0, -20, 0],
              rotate: [0, 20, -20, 0],
            }}
            transition={{
              duration: 3 + i,
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
          <div className="flex justify-between items-center mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
            >
              ← Back to Home
            </Button>
            <h1 className={`text-2xl font-header font-bold ${
              themeClasses.isDark ? 'gradient-text' : 'text-electric-purple'
            }`}>
              1v1 Duel Mode
            </h1>
            <div className="w-24" />
          </div>

          {createGameMutation.isError ? (
            <Card className="p-12 max-w-2xl mx-auto">
              <div className="text-center py-8">
                <div className="text-lg text-red-500 mb-4">Error creating game</div>
                <div className="text-sm opacity-70 mb-4">
                  {createGameMutation.error?.message || 'Failed to create game'}
                </div>
                <Button
                  variant="primary"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </div>
            </Card>
          ) : isCreatingGame ? (
            <Card className="p-12 max-w-2xl mx-auto">
              <div className="text-center py-8">
                <div className="text-lg mb-4">Creating your game...</div>
                <div className="text-sm opacity-70">Please wait</div>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {/* Left: Prompt */}
              <div className="lg:col-span-1">
                <PromptCard
                  prompt={currentPrompt}
                  category="chaos"
                />
              </div>

              {/* Center: Story Editor */}
              <div className="lg:col-span-2">
                <Card className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className={`text-xl font-header font-bold ${themeClasses.text}`}>
                      {isMyTurn ? 'Your Turn' : "StoryBot's Turn"}
                    </h3>
                    {timeRemaining > 0 && (
                      <Timer
                        initialTime={300}
                        timeRemaining={timeRemaining}
                        size={80}
                      />
                    )}
                  </div>
                  
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="text-lg">Loading game...</div>
                    </div>
                  ) : (
                  <>
                    {/* Accumulated Story Display */}
                    {accumulatedStory && (
                      <div className={`mb-4 p-4 rounded-lg max-h-48 overflow-y-auto ${themeClasses.card}`}>
                        <div className={`text-sm ${themeClasses.textSecondary} mb-2`}>Story so far:</div>
                        <div className={`text-sm whitespace-pre-wrap ${themeClasses.text}`}>
                          {accumulatedStory}
                        </div>
                      </div>
                    )}
                    
                    <StoryEditor
                      content={story}
                      onChange={setStory}
                      isActive={isMyTurn}
                      placeholder={isMyTurn ? "Continue the story..." : "Waiting for StoryBot..."}
                    />

                    <div className="mt-6 flex gap-4">
                      <Button
                        variant="primary"
                        className="flex-1"
                        onClick={handleSubmitTurn}
                        disabled={!isMyTurn || !story.trim() || submitTurnMutation.isPending}
                      >
                        {submitTurnMutation.isPending ? 'Submitting...' : 'Submit Story'}
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setStory('')}
                        disabled={!isMyTurn}
                      >
                        Clear
                      </Button>
                    </div>
                    
                    {gameInfo && (
                      <div className="mt-4 text-sm text-center opacity-70">
                        Turn {game?.turnsCount || 0} / {game?.maxTurns || 5}
                      </div>
                    )}
                    
                    {/* Turn History */}
                    {turns.length > 0 && (
                      <div className="mt-6">
                        <details className={`${themeClasses.card} p-4 rounded-lg`}>
                          <summary className={`cursor-pointer font-bold ${themeClasses.text}`}>
                            📜 Turn History ({turns.length} turns)
                          </summary>
                          <div className="mt-4 space-y-3 max-h-64 overflow-y-auto">
                            {turns.map((turn) => {
                              const isAI = turn.playerId === 'ai-bot'
                              const isCurrentUser = turn.playerId === user?.id
                              return (
                                <div
                                  key={turn.id}
                                  className={`p-3 rounded-lg text-sm ${
                                    isCurrentUser ? 'bg-mint-pop bg-opacity-20' : themeClasses.card
                                  }`}
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold">
                                      {isAI ? '🤖 StoryBot' : turn.playerName}
                                      {isCurrentUser && ' (You)'}
                                    </span>
                                    <span className={`text-xs ${themeClasses.textSecondary}`}>
                                      Turn {turn.order}
                                    </span>
                                  </div>
                                  <div className={`whitespace-pre-wrap ${themeClasses.text}`}>
                                    {turn.text}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </details>
                      </div>
                    )}
                  </>
                  )}
                </Card>
              </div>
            </div>
          )}
        </div>
      </Container>
    </div>
  )
}

export default SinglePlayer

