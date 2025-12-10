import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Button from '../../components/Buttons/Button'
import Card from '../../components/Cards/Card'
import Container from '../../components/Layout/Container'
import { AnimatedBackground } from '../../components/Background'
import { ThemeToggle } from '../../components/ThemeToggle'
import { useThemeClasses } from '../../hooks/useThemeClasses'
import { useUser } from '../../context/UserContext'
import { useUserHistory } from '../../hooks/useGameAPI'

const History = () => {
  const navigate = useNavigate()
  const themeClasses = useThemeClasses()
  const { user } = useUser()
  const { data, isLoading, isError } = useUserHistory(user?.id, 5)

  const historyItems = data?.games || []

  const stripHtml = (value) => {
    if (typeof value !== 'string') return value
    return value.replace(/<[^>]*>/g, '').trim()
  }

  const getModeIcon = (mode) => {
    if (mode === 'multi' || mode === 'Multiplayer') return '👥'
    if (mode === 'rapid' || mode === 'RapidFire') return '⚡'
    return '⚔️'
  }

  return (
    <div className={`min-h-screen relative transition-colors ${themeClasses.bg}`}>
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      <AnimatedBackground variant="default" />
      
      {/* Story history decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {['📜', '📚', '📖', '✍️', '🖋️', '📝'].map((icon, i) => (
          <motion.div
            key={i}
            className="absolute text-5xl opacity-10"
            style={{
              left: `${12 + i * 14}%`,
              top: `${8 + (i % 2) * 45}%`,
            }}
            animate={{
              y: [0, -20, 0],
              rotate: [0, 12, -12, 0],
            }}
            transition={{
              duration: 4 + i * 0.3,
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
            <h1 className={`text-4xl font-header font-bold ${
              themeClasses.isDark ? 'gradient-text' : 'text-electric-purple'
            }`}>
              📜 Story History
            </h1>
            <div className="w-24" />
          </div>

          {!user?.id && (
            <Card className="p-6">
              <div className="text-center">
                <div className="text-lg font-semibold">Sign in to view your recent games</div>
                <p className={themeClasses.textSecondary}>We show the last 5 games linked to your Google account.</p>
              </div>
            </Card>
          )}

          {user?.id && (
            <div className="space-y-4">
              {isLoading && (
                <Card className="p-6 text-center">Loading your history...</Card>
              )}
              {isError && (
                <Card className="p-6 text-center text-red-400">Could not load history. Please try again.</Card>
              )}
              {!isLoading && !isError && historyItems.length === 0 && (
                <Card className="p-6 text-center">
                  <div className="text-lg font-semibold">No games yet</div>
                  <p className={themeClasses.textSecondary}>Finish a game to see it here.</p>
                </Card>
              )}
              {historyItems.map((item, index) => {
                const modeLabel = item.mode === 'multi' ? 'Multiplayer' : item.mode === 'rapid' ? 'RapidFire' : 'Single Player'
                const created = item.finishedAt || item.createdAt
                const preview = stripHtml(item.turns?.[0]?.text || item.summary) || 'Story preview unavailable.'
                const players = item.playerCount || Object.keys(item.scores || {}).length || '—'
                const playerScores = item.scores || {}
                const userKey = item.playerName || user?.username
                const myScoreEntry = userKey && playerScores[userKey] ? playerScores[userKey] : null
                const myScore = myScoreEntry
                  ? Math.round(
                      myScoreEntry.total ??
                      (
                        (Number(myScoreEntry.creativity) || 0) +
                        (Number(myScoreEntry.cohesion ?? myScoreEntry.continuity) || 0) +
                        (Number(myScoreEntry.prompt_fit ?? myScoreEntry.promptFit ?? myScoreEntry.momentum) || 0)
                      ) / 3
                    )
                  : null
                const scoreDisplay = myScore ?? (playerScores
                  ? Math.round(Object.values(playerScores).reduce((acc, s) => acc + (Number(s?.total) || 0), 0))
                  : null)
                const durationMinutes = item.turnDurationSeconds ? Math.round(item.turnDurationSeconds / 60) : null

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="p-6 hover:scale-[1.02] transition-transform">
                      <div className="flex items-start gap-6">
                        <div className="text-4xl">
                          {getModeIcon(modeLabel)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className="text-2xl font-header font-bold">
                              {item.hostName ? `${item.hostName}'s game` : 'Finished game'}
                            </h3>
                            <span className="text-sm bg-soft-charcoal px-3 py-1 rounded-full">
                              {modeLabel}
                            </span>
                            {durationMinutes ? (
                              <span className="text-xs bg-electric-purple/20 text-electric-purple px-2 py-1 rounded-full">
                                {durationMinutes}m turns
                              </span>
                            ) : null}
                          </div>
                          <p className={`mb-4 line-clamp-2 ${themeClasses.textSecondary}`}>
                            {preview}
                          </p>
                          <div className={`flex items-center gap-4 text-sm ${themeClasses.textSecondary} flex-wrap`}>
                            <span>📅 {created ? new Date(created).toLocaleDateString() : 'Unknown date'}</span>
                            <span>👥 {players} players</span>
                            {scoreDisplay !== null && scoreDisplay !== undefined && (
                              <span className="text-sunbeam-yellow font-bold">
                                ⭐ {myScore !== null && myScore !== undefined ? `Your score: ${myScore}` : `${scoreDisplay} total pts`}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="secondary"
                          onClick={() => navigate(`/story/${item.gameId || item.id}`)}
                        >
                          View Story
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </Container>
    </div>
  )
}

export default History
