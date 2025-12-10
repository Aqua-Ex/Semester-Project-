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
import { useCreateGame, useSubmitTurn, useGameState } from '../../hooks/useGameAPI'
import { useMatch } from '../../context/MatchContext'

const RapidFire = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const themeClasses = useThemeClasses()
  const { user } = useUser()
  const { startMatch, updateMatch } = useMatch()
  const [story, setStory] = useState('')
  const gameId = searchParams.get('gameId')
  const createGameMutation = useCreateGame()
  const submitTurnMutation = useSubmitTurn()
  const { data: gameData, isLoading } = useGameState(gameId, {
    enabled: !!gameId,
    refetchInterval: 1000,
    refetchWhileWaiting: true,
  })

  const game = gameData?.game
  const gameInfo = gameData?.info
  const timeRemaining = gameInfo?.timeRemainingSeconds || 0
  const isMyTurn = game?.currentPlayerId === user?.id
  const currentPrompt = game?.guidePrompt || game?.initialPrompt || 'A robot learns to feel emotions for the first time.'
  const currentTurnSeconds = game?.turnDurationSeconds || 60
  const previousTurn = game?.lastTurn || gameInfo?.lastTurn
  const showPreviousTurn = isMyTurn && previousTurn?.text

  // Create rapid game on mount
  useEffect(() => {
    if (!gameId && user.id && !createGameMutation.isPending) {
      createGameMutation.mutate({
        hostName: user.username || 'Player',
        hostId: user.id,
        initialPrompt: 'A robot learns to feel emotions for the first time.',
        turnDurationSeconds: 60,
        maxTurns: 50,
        maxPlayers: 2,
        mode: 'rapid',
      }, {
        onSuccess: (data) => {
          if (data?.game?.id) {
            navigate(`/rapidfire?gameId=${data.game.id}`, { replace: true })
            startMatch({
              id: data.game.id,
              mode: 'rapid',
              players: data.game.players,
              currentPrompt: data.game.initialPrompt,
              story: '',
              timeLimit: 1,
              status: 'playing',
            })
          }
        },
        onError: (error) => {
          console.error('Failed to start rapid mode:', error)
          alert('Failed to start rapid mode. Please try again.')
        },
      })
    }
  }, [gameId, user?.id, createGameMutation.isPending, navigate, startMatch, user?.username])

  // Keep match context in sync
  useEffect(() => {
    if (game) {
      updateMatch({
        id: game.id,
        mode: 'rapid',
        players: game.players,
        currentPrompt: game.guidePrompt || game.initialPrompt,
        currentTurn: game.currentPlayer,
        status: game.status,
        timeRemaining,
      })
    }
  }, [game, timeRemaining, updateMatch])

  // Navigate to story view when finished
  useEffect(() => {
    if (game?.status === 'finished' && gameId) {
      navigate(`/story/${gameId}`)
    }
  }, [game?.status, gameId, navigate])

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
    <div className="min-h-screen bg-deep-graphite relative">
      <AnimatedBackground variant="game" />
      
      {/* Rapid fire themed decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {['⚡', '🔥', '💥', '⚡', '🌟', '💫'].map((icon, i) => (
          <motion.div
            key={i}
            className="absolute text-6xl opacity-15"
            style={{
              left: `${10 + i * 14}%`,
              top: `${8 + (i % 3) * 30}%`,
            }}
            animate={{
              y: [0, -30, 0],
              rotate: [0, 360],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 2 + i * 0.3,
              repeat: Infinity,
              delay: i * 0.2,
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
              ⚡ Rapid Fire Mode
            </h1>
            <div className="w-24" />
          </div>

          {/* Round Indicator */}
          <div className="text-center mb-8">
            <motion.div
              className="inline-flex items-center gap-4 bg-soft-charcoal px-6 py-3 rounded-full border-2 border-mint-pop shadow-glow-mint"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <span className="text-3xl">⚡</span>
              <span className="text-cloud-gray">Turn</span>
              <span className="text-3xl font-header font-bold text-mint-pop">
                {game?.turnsCount || 0}
              </span>
              <span className="text-3xl">🔥</span>
            </motion.div>
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
              <motion.div
                className="mt-4 text-center"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <div className={`text-sm ${themeClasses.textSecondary}`}>
                  Turn length (speeds up to 20s):
                </div>
                <div className="text-2xl font-decorative font-bold text-laser-coral">
                  {currentTurnSeconds}s
                </div>
              </motion.div>
            </div>

            {/* Center: Story Editor */}
            <div className="lg:col-span-2">
              {isLoading && !game ? (
                <Card className="p-6">
                  <div className="text-center py-8">Loading rapid game...</div>
                </Card>
              ) : (
                <Card className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className={`text-xl font-header font-bold ${themeClasses.text}`}>Your Story</h3>
                    <Timer
                      initialTime={currentTurnSeconds}
                      timeRemaining={timeRemaining}
                      size={80}
                    />
                  </div>
                  
                  <StoryEditor
                    content={story}
                    onChange={setStory}
                    isActive={isMyTurn}
                    placeholder={isMyTurn ? "Write fast! Time is running out..." : "Waiting for your turn..."}
                  />

                  <div className="mt-6 flex gap-4">
                    <Button
                      variant="primary"
                      className="flex-1"
                      onClick={handleSubmitTurn}
                      disabled={!isMyTurn || !story.trim() || submitTurnMutation.isPending}
                    >
                      {submitTurnMutation.isPending ? 'Submitting...' : 'Send Turn →'}
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}

export default RapidFire
