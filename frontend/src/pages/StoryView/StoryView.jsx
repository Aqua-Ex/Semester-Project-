import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Button from '../../components/Buttons/Button'
import Card from '../../components/Cards/Card'
import Container from '../../components/Layout/Container'
import { AnimatedBackground } from '../../components/Background'
import { ThemeToggle } from '../../components/ThemeToggle'
import { useThemeClasses } from '../../hooks/useThemeClasses'
import { useGameState } from '../../hooks/useGameAPI'

const StoryView = () => {
  const { id: gameId } = useParams()
  const navigate = useNavigate()
  const themeClasses = useThemeClasses()

  const { data, isLoading, isError } = useGameState(gameId, {
    enabled: !!gameId,
    refetchInterval: false,
  })

  const game = data?.game
  const info = data?.info
  const scores = info?.scores || game?.scores

  const playerResults = useMemo(() => {
    if (!scores?.players) return []
    return Object.entries(scores.players)
      .map(([name, metrics]) => {
        const creativity = Number(metrics?.creativity) || 0
        const cohesion = Number(metrics?.cohesion) || 0
        const promptFit = Number(metrics?.prompt_fit ?? metrics?.promptFit ?? metrics?.momentum) || 0
        const average = Math.round((creativity + cohesion + promptFit) / 3)
        return {
          name,
          creativity,
          cohesion,
          promptFit,
          average,
          notes: {
            creativity: metrics?.creativity_note || metrics?.creativityNote,
            cohesion: metrics?.cohesion_note || metrics?.continuity_note,
            prompt: metrics?.prompt_fit_note || metrics?.promptFitNote || metrics?.momentum_note,
          },
        }
      })
      .sort((a, b) => b.average - a.average)
  }, [scores?.players])

  const status = info?.status || game?.status || 'finished'
  const modeLabel = useMemo(() => {
    if (!game?.mode) return 'Story'
    if (game.mode === 'multi') return 'Multiplayer'
    if (game.mode === 'single') return 'Single Player'
    if (game.mode === 'rapid') return 'Rapid Fire'
    return game.mode
  }, [game?.mode])

  const meta = [
    { label: 'Mode', value: modeLabel },
    { label: 'Turns', value: `${game?.turnsCount || 0} / ${game?.maxTurns || '—'}` },
    { label: 'Players', value: game?.players?.length || 0 },
    { label: 'Seconds / turn', value: game?.turnDurationSeconds ? `${game.turnDurationSeconds}s` : '—' },
  ]

  const summaryText = scores?.summary || (status === 'finished' ? 'Game finished' : 'Game in progress')
  const initialPrompt = game?.initialPrompt || 'Story starter unavailable'

  const renderContent = () => {
    if (isLoading) {
      return (
        <Card className="p-10 text-center">
          <div className="text-lg">Loading game results...</div>
        </Card>
      )
    }

    if (isError || !game) {
      return (
        <Card className="p-10 text-center">
          <div className="text-lg mb-2">We could not find that story.</div>
          <Button variant="secondary" onClick={() => navigate('/')}>
            Back to Home
          </Button>
        </Card>
      )
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <Card className="p-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-soft-charcoal text-xs uppercase tracking-wide text-cloud-gray">
                  {modeLabel}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs uppercase tracking-wide ${
                  status === 'finished' ? 'bg-mint-pop/20 text-mint-pop' : 'bg-sunbeam-yellow/30 text-sunbeam-yellow'
                }`}>
                  {status}
                </span>
              </div>
              <h1 className="text-4xl font-header font-bold gradient-text">
                Game {gameId?.slice(0, 6)}
              </h1>
              <p className={`${themeClasses.textSecondary} max-w-3xl leading-relaxed`}>
                {summaryText}
              </p>
            </div>
            <div className={`lg:text-right ${themeClasses.textSecondary}`}>
              <div className="text-sm">Initial prompt</div>
              <div className={`mt-2 text-lg font-semibold ${themeClasses.text}`}>
                {initialPrompt}
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {meta.map((item) => (
              <div
                key={item.label}
                className={`p-3 rounded-lg border ${themeClasses.border} ${themeClasses.surface}`}
              >
                <div className="text-xs uppercase tracking-wide text-cloud-gray">{item.label}</div>
                <div className={`text-xl font-header font-bold ${themeClasses.text}`}>{item.value}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-2xl font-header font-bold ${themeClasses.text}`}>Player Scores</h3>
            {scores?.summary && (
              <span className="text-sm text-cloud-gray">AI Summary: {scores.summary}</span>
            )}
          </div>

          {playerResults.length === 0 ? (
            <div className="text-center py-6 text-cloud-gray">
              {status === 'finished' ? 'Scores not available yet.' : 'Game is still running.'}
            </div>
          ) : (
            <div className="space-y-4">
              {playerResults.map((player, index) => (
                <motion.div
                  key={player.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 rounded-xl border ${themeClasses.border} ${themeClasses.surface}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-header font-bold text-electric-purple">#{index + 1}</span>
                      <div>
                        <div className={`text-lg font-bold ${themeClasses.text}`}>{player.name}</div>
                        <div className="text-xs text-cloud-gray">Average score</div>
                      </div>
                    </div>
                    <div className="text-3xl font-header font-bold text-mint-pop">
                      {player.average}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                    <div className="p-3 rounded-lg bg-soft-charcoal/40">
                      <div className="text-xs uppercase tracking-wide text-cloud-gray">Creativity</div>
                      <div className={`text-xl font-bold ${themeClasses.text}`}>{player.creativity}</div>
                      {player.notes.creativity && (
                        <div className="text-xs text-cloud-gray mt-1">{player.notes.creativity}</div>
                      )}
                    </div>
                    <div className="p-3 rounded-lg bg-soft-charcoal/40">
                      <div className="text-xs uppercase tracking-wide text-cloud-gray">Cohesion</div>
                      <div className={`text-xl font-bold ${themeClasses.text}`}>{player.cohesion}</div>
                      {player.notes.cohesion && (
                        <div className="text-xs text-cloud-gray mt-1">{player.notes.cohesion}</div>
                      )}
                    </div>
                    <div className="p-3 rounded-lg bg-soft-charcoal/40">
                      <div className="text-xs uppercase tracking-wide text-cloud-gray">Prompt Fit</div>
                      <div className={`text-xl font-bold ${themeClasses.text}`}>{player.promptFit}</div>
                      {player.notes.prompt && (
                        <div className="text-xs text-cloud-gray mt-1">{player.notes.prompt}</div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="primary"
            onClick={() => navigate('/')}
          >
            Play Again
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href)
              alert('Story link copied to clipboard!')
            }}
          >
            Share Results
          </Button>
        </div>
      </motion.div>
    )
  }

  return (
    <div className={`min-h-screen relative transition-colors ${themeClasses.bg}`}>
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      <AnimatedBackground variant="default" />
      
      {/* Story reading decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {['📖', '✨', '🌟', '💫', '📚'].map((icon, i) => (
          <motion.div
            key={i}
            className="absolute text-4xl opacity-10"
            style={{
              left: `${10 + i * 20}%`,
              top: `${15 + (i % 2) * 35}%`,
            }}
            animate={{
              y: [0, -15, 0],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              delay: i * 0.5,
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
              onClick={() => navigate('/history')}
            >
              ← Back to History
            </Button>
            <div className="w-24" />
          </div>

          {renderContent()}
        </div>
      </Container>
    </div>
  )
}

export default StoryView
