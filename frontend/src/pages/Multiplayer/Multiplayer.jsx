import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

const Multiplayer = () => {
  const navigate = useNavigate()
  const themeClasses = useThemeClasses()
  const [story, setStory] = useState('')
  const [currentPrompt, setCurrentPrompt] = useState({
    text: 'A mysterious door appears in the middle of the forest, glowing with an otherworldly light.',
    category: 'twist',
  })
  const [isMyTurn, setIsMyTurn] = useState(true)
  const [timeRemaining, setTimeRemaining] = useState(120) // 2 minutes in seconds

  const players = [
    { id: '1', username: 'Player1', isActive: false },
    { id: '2', username: 'Player2', isActive: false },
    { id: '3', username: 'Player3', isActive: false },
    { id: '4', username: 'You', isActive: isMyTurn },
  ]

  const handleTimeComplete = () => {
    // Handle turn end
    setIsMyTurn(false)
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
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <PromptCard
                  prompt={currentPrompt.text}
                  category={currentPrompt.category}
                  className="sticky top-8"
                />
              </motion.div>
              <motion.div
                className={`mt-4 text-center text-sm ${themeClasses.textSecondary}`}
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="text-lg mr-2">⏱️</span>
                Next prompt in: <span className="text-mint-pop font-bold">45s</span>
              </motion.div>
            </div>

            {/* Center: Story Editor */}
            <div className="lg:col-span-6">
              <Card className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className={`text-xl font-header font-bold ${themeClasses.text}`}>The Story</h3>
                  <div className={`text-sm ${themeClasses.textSecondary}`}>
                    Word count: <span className="text-mint-pop">{story.split(' ').filter(w => w).length}</span>
                  </div>
                </div>
                
                <StoryEditor
                  content={story}
                  onChange={setStory}
                  isActive={isMyTurn}
                  placeholder={isMyTurn ? "Continue the story..." : "Waiting for your turn..."}
                />

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
                  {isMyTurn ? 'Your Turn' : "Player's Turn"}
                </h3>
                <Timer
                  initialTime={120}
                  timeRemaining={timeRemaining}
                  onComplete={handleTimeComplete}
                  size={120}
                />
              </Card>

              {/* Players List */}
              <Card className="p-6">
                <h3 className={`text-lg font-header font-bold mb-4 ${themeClasses.text}`}>Players</h3>
                <div className="space-y-4">
                  {players.map((player, index) => (
                    <motion.div
                      key={player.id}
                      className={`
                        flex items-center gap-3 p-3 rounded-lg
                        ${player.isActive 
                          ? 'bg-mint-pop bg-opacity-20 border-2 border-mint-pop' 
                          : themeClasses.card
                        }
                        transition-all
                      `}
                      animate={player.isActive ? { scale: [1, 1.02, 1] } : {}}
                      transition={{ repeat: player.isActive ? Infinity : 0, duration: 2 }}
                    >
                      <Avatar user={player} size="sm" />
                      <div className="flex-1">
                        <div className={`font-bold text-sm ${themeClasses.text}`}>{player.username}</div>
                        {player.isActive && (
                          <div className="text-xs text-mint-pop">Writing...</div>
                        )}
                      </div>
                      {/* Thread connection indicator */}
                      {index < players.length - 1 && (
                        <div className="w-1 h-8 bg-electric-purple opacity-50" />
                      )}
                    </motion.div>
                  ))}
                </div>
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

