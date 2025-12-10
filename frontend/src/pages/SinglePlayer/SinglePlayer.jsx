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
import { useCreateGame, useSubmitTurn, useGameState, usePreviewTurn } from '../../hooks/useGameAPI'
import { useMatch } from '../../context/MatchContext'

const SinglePlayer = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const themeClasses = useThemeClasses()
  const { user } = useUser()
  const { startMatch, updateMatch } = useMatch()
  const [story, setStory] = useState('')
  const [preview, setPreview] = useState('')
  const [turnDurationSeconds, setTurnDurationSeconds] = useState(180) // default 3 minutes
  const [hasStarted, setHasStarted] = useState(!!searchParams.get('gameId'))
  const [localCountdown, setLocalCountdown] = useState(null)
  
  const gameId = searchParams.get('gameId')
  const createGameMutation = useCreateGame()
  const submitTurnMutation = useSubmitTurn()
  const previewTurnMutation = usePreviewTurn()
  const { data: gameData, isLoading } = useGameState(gameId, {
    enabled: !!gameId,
    // Use the query's latest data instead of the not-yet-defined gameData variable
    refetchInterval: (query) => {
      const status = query?.state?.data?.game?.status
      return status === 'active' ? 2000 : false
    },
  })

  const game = gameData?.game
  const gameInfo = gameData?.info
  const currentPrompt = game?.guidePrompt || game?.initialPrompt || 'You wake up in a world where gravity works sideways.'
  const isMyTurn = game?.currentPlayerId === user.id
  const timeRemaining = typeof gameInfo?.timeRemainingSeconds === 'number'
    ? gameInfo.timeRemainingSeconds
    : null
  const displayTime = (localCountdown ?? timeRemaining ?? game?.turnDurationSeconds ?? turnDurationSeconds ?? 0)
  const previousTurn = game?.lastTurn || gameInfo?.lastTurn
  const showPreviousTurn = isMyTurn && previousTurn?.text

  useEffect(() => {
    if (game?.turnDurationSeconds) {
      setTurnDurationSeconds(game.turnDurationSeconds)
    }
  }, [game?.turnDurationSeconds])

  // Smooth countdown between backend polls using the latest server time remaining
  useEffect(() => {
    if (typeof timeRemaining !== 'number') {
      setLocalCountdown(null)
      return
    }
    setLocalCountdown(timeRemaining)
    const startedAt = Date.now()
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000)
      setLocalCountdown(Math.max(0, timeRemaining - elapsed))
    }, 1000)
    return () => clearInterval(interval)
  }, [timeRemaining])

  const beginGame = () => {
    if (!user.id || createGameMutation.isPending) return
    setHasStarted(true)
    createGameMutation.mutate({
      hostName: user.username || 'Player',
      hostId: user.id,
      initialPrompt: 'You wake up in a world where gravity works sideways.',
      turnDurationSeconds,
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
            timeLimit: Math.round(turnDurationSeconds / 60),
            status: 'playing',
          })
        }
      },
      onError: (error) => {
        console.error('Failed to create game:', error)
        alert('Failed to create game. Please try again.')
      },
    })
  }

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
  }, [game])

  // Clear stale preview when the turn or player changes
  useEffect(() => {
    setPreview('')
    previewTurnMutation.reset()
  }, [game?.turnsCount, game?.currentPlayerId])

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
      onSuccess: (data) => {
        setPreview(data?.preview || '')
      },
      onError: (error) => {
        console.error('Failed to preview turn:', error)
        alert(error.message || 'Failed to preview turn. Please try again.')
      },
      onSettled: () => {
        previewTurnMutation.reset()
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
      onSuccess: (data) => {
        setStory('')
        setPreview('')
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

  if (!gameId) {
    return (
      <div className={`min-h-screen relative transition-colors ${themeClasses.bg}`}>
        <div className="absolute top-4 right-4 z-20">
          <ThemeToggle />
        </div>
        <AnimatedBackground variant="game" />
        <Container className="relative z-10">
          <div className="py-12 max-w-3xl mx-auto">
            <Card className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className={`text-2xl font-header font-bold ${themeClasses.text}`}>1v1 vs AI</h2>
                  <p className={`${themeClasses.textSecondary} text-sm`}>Choose your turn timer, then start the duel.</p>
                </div>
                <div className="text-3xl">⚔️</div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {[60, 120, 180, 300].map((sec) => (
                  <Button
                    key={sec}
                    variant={turnDurationSeconds === sec ? 'primary' : 'secondary'}
                    onClick={() => setTurnDurationSeconds(sec)}
                    className="w-full"
                  >
                    {Math.round(sec / 60)} minute{sec === 60 ? '' : 's'}
                  </Button>
                ))}
              </div>
              <Button
                variant="primary"
                className="mt-6 w-full"
                disabled={createGameMutation.isPending || !user.id}
                onClick={beginGame}
              >
                {createGameMutation.isPending ? 'Starting...' : 'Start Match'}
              </Button>
            </Card>
          </div>
        </Container>
      </div>
    )
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Left: Prompt */}
            <div className="lg:col-span-1">
              <PromptCard
                prompt={currentPrompt}
                category="chaos"
              />
              {showPreviousTurn && (
                <Card className="mt-4 p-4">
                  <div className="text-xs uppercase tracking-wide text-mint-pop font-semibold mb-2">
                    Previous turn by {previousTurn.playerName}
                  </div>
                  <div className={`text-sm leading-relaxed ${themeClasses.text}`}>
                    {previousTurn.text}
                  </div>
                </Card>
              )}
            </div>

            {/* Center: Story Editor */}
            <div className="lg:col-span-2">
              <Card className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className={`text-xl font-header font-bold ${themeClasses.text}`}>
                    {isMyTurn ? 'Your Turn' : `${game?.currentPlayer || 'Player'}'s Turn`}
                  </h3>
                  {displayTime > 0 && (
                    <Timer
                      initialTime={game?.turnDurationSeconds || turnDurationSeconds || 300}
                      timeRemaining={displayTime}
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
                    <StoryEditor
                      content={story}
                      onChange={setStory}
                      isActive={isMyTurn}
                      placeholder={isMyTurn ? "Start writing your story..." : "Waiting for your turn..."}
                    />

                    <div className="mt-6 flex flex-wrap gap-4">
                      <Button
                        variant="secondary"
                        className="flex-1 min-w-[180px]"
                        onClick={handlePreviewTurn}
                        disabled={!isMyTurn || !story.trim() || previewTurnMutation.isPending}
                      >
                        {previewTurnMutation.isPending ? 'Previewing...' : 'Preview Next Prompt'}
                      </Button>
                      <Button
                        variant="primary"
                        className="flex-1 min-w-[180px]"
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

                    {(previewTurnMutation.isPending || preview) && (
                      <Card className="mt-4 bg-soft-charcoal/40">
                        <div className="text-sm font-bold mb-2 text-mint-pop">Next Prompt Preview</div>
                        {previewTurnMutation.isPending ? (
                          <div className="text-sm text-cloud-gray">Generating response...</div>
                        ) : (
                          <div className={`text-sm leading-relaxed ${themeClasses.text}`}>
                            {preview || 'No preview yet.'}
                          </div>
                        )}
                      </Card>
                    )}
                    
                    {gameInfo && (
                      <div className="mt-4 text-sm text-center opacity-70">
                        Turn {game?.turnsCount || 0} / {game?.maxTurns || 5}
                      </div>
                    )}
                  </>
                )}
              </Card>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}

export default SinglePlayer
