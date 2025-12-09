import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Button from '../../components/Buttons/Button'
import Card from '../../components/Cards/Card'
import Container from '../../components/Layout/Container'
import { AnimatedBackground } from '../../components/Background'
import { ThemeToggle } from '../../components/ThemeToggle'
import { useThemeClasses } from '../../hooks/useThemeClasses'
import { useGameState, useGameTurns } from '../../hooks/useGameAPI'

const StoryView = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const themeClasses = useThemeClasses()
  
  const { data: gameData, isLoading, error } = useGameState(id, {
    enabled: !!id,
  })
  const { data: turnsData } = useGameTurns(id)

  const game = gameData?.game
  const gameInfo = gameData?.info
  const turns = turnsData?.turns || []
  
  // Build story content from game data
  const storyTitle = game?.initialPrompt || 'Untitled Story'
  const players = game?.players?.map(p => p.name) || []
  const createdAt = game?.createdAt ? new Date(game.createdAt).toLocaleDateString() : 'Unknown'
  const scores = game?.scores
  const playerScores = scores?.players || {}
  
  // Calculate total score (average of all player scores)
  const totalScore = Object.values(playerScores).reduce((sum, score) => {
    const creativity = Number(score?.creativity) || 0
    const cohesion = Number(score?.cohesion) || 0
    const momentum = Number(score?.momentum) || 0
    return sum + (creativity + cohesion + momentum) / 3
  }, 0) / Math.max(Object.keys(playerScores).length, 1)
  
  // Build story from turns, or use summary if available
  const storyContent = turns.length > 0
    ? turns.map((turn, index) => {
        const isAI = turn.playerId === 'ai-bot'
        return `${isAI ? '🤖 StoryBot' : turn.playerName} (Turn ${turn.order}):\n${turn.text}`
      }).join('\n\n')
    : game?.summary || game?.scores?.summary || 'Story content will be displayed here once turns are available.'

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

          {isLoading ? (
            <Card className="p-12 max-w-4xl mx-auto">
              <div className="text-center py-8">
                <div className="text-lg">Loading story...</div>
              </div>
            </Card>
          ) : error ? (
            <Card className="p-12 max-w-4xl mx-auto">
              <div className="text-center py-8">
                <div className="text-lg text-red-500">Error loading story: {error.message}</div>
                <Button
                  variant="primary"
                  className="mt-4"
                  onClick={() => navigate('/history')}
                >
                  Back to History
                </Button>
              </div>
            </Card>
          ) : !game ? (
            <Card className="p-12 max-w-4xl mx-auto">
              <div className="text-center py-8">
                <div className="text-lg">Story not found</div>
                <Button
                  variant="primary"
                  className="mt-4"
                  onClick={() => navigate('/history')}
                >
                  Back to History
                </Button>
              </div>
            </Card>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="p-12 max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                  <h1 className="text-5xl font-header font-bold mb-4 gradient-text">
                    {storyTitle}
                  </h1>
                  <div className={`flex items-center justify-center gap-6 ${themeClasses.textSecondary}`}>
                    <span>📅 {createdAt}</span>
                    <span>👥 {players.length} players</span>
                    {totalScore > 0 && (
                      <span className="text-sunbeam-yellow font-bold">
                        ⭐ {Math.round(totalScore)} points
                      </span>
                    )}
                    {game?.status && (
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        game.status === 'finished' ? 'bg-green-500 bg-opacity-20 text-green-400' : 'bg-yellow-500 bg-opacity-20 text-yellow-400'
                      }`}>
                        {game.status}
                      </span>
                    )}
                  </div>
                </div>

                {/* Story Content */}
                <div
                  className={`prose max-w-none text-lg leading-relaxed ${
                    themeClasses.isDark ? 'prose-invert' : ''
                  }`}
                  style={{
                    color: themeClasses.isDark ? '#D9D9E0' : '#1A1A1E',
                  }}
                >
                  <p className="whitespace-pre-wrap">{storyContent}</p>
                </div>

                {/* Scores Section */}
                {scores && Object.keys(playerScores).length > 0 && (
                  <div className={`mt-12 pt-8 border-t ${themeClasses.border}`}>
                    <h3 className="text-xl font-header font-bold mb-4">
                      Scores
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(playerScores).map(([playerName, score]) => {
                        const creativity = Number(score?.creativity) || 0
                        const cohesion = Number(score?.cohesion) || 0
                        const momentum = Number(score?.momentum) || 0
                        const avg = (creativity + cohesion + momentum) / 3
                        return (
                          <div key={playerName} className={`p-4 rounded-lg ${themeClasses.card}`}>
                            <div className="font-bold mb-2">{playerName}</div>
                            <div className="text-sm space-y-1">
                              <div>Creativity: {creativity.toFixed(1)}</div>
                              <div>Cohesion: {cohesion.toFixed(1)}</div>
                              <div>Momentum: {momentum.toFixed(1)}</div>
                              <div className="font-bold text-mint-pop mt-2">Average: {avg.toFixed(1)}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Contributors */}
                {players.length > 0 && (
                  <div className={`mt-12 pt-8 border-t ${themeClasses.border}`}>
                    <h3 className="text-xl font-header font-bold mb-4">
                      Story Contributors
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {players.map((player, index) => (
                        <motion.span
                          key={player}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-gradient-purple-mint px-4 py-2 rounded-full font-header font-bold text-sm"
                        >
                          {player}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                )}

              {/* Actions */}
              <div className="mt-8 flex gap-4 justify-center">
                <Button
                  variant="primary"
                  onClick={() => navigate('/')}
                >
                  Play Again
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    // Share functionality
                    navigator.clipboard.writeText(window.location.href)
                    alert('Story link copied to clipboard!')
                  }}
                >
                  Share Story
                </Button>
              </div>
            </Card>
          </motion.div>
          )}
        </div>
      </Container>
    </div>
  )
}

export default StoryView

