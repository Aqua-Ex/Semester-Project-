import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

const RapidFire = () => {
  const navigate = useNavigate()
  const [story, setStory] = useState('')
  const [round, setRound] = useState(1)
  const [currentPrompt, setCurrentPrompt] = useState({
    text: 'A robot learns to feel emotions for the first time.',
    category: 'character',
  })

  const totalRounds = 5

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
              <span className="text-cloud-gray">Round</span>
              <span className="text-3xl font-header font-bold text-mint-pop">
                {round} / {totalRounds}
              </span>
              <span className="text-3xl">🔥</span>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Left: Prompt */}
            <div className="lg:col-span-1">
              <PromptCard
                prompt={currentPrompt.text}
                category={currentPrompt.category}
              />
              <motion.div
                className="mt-4 text-center"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <div className={`text-sm ${themeClasses.textSecondary}`}>
                  Next prompt in:
                </div>
                <div className="text-2xl font-decorative font-bold text-laser-coral">
                  45s
                </div>
              </motion.div>
            </div>

            {/* Center: Story Editor */}
            <div className="lg:col-span-2">
              <Card className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className={`text-xl font-header font-bold ${themeClasses.text}`}>Your Story</h3>
                  <Timer
                    initialTime={60}
                    size={80}
                  />
                </div>
                
                <StoryEditor
                  content={story}
                  onChange={setStory}
                  isActive={true}
                  placeholder="Write fast! Time is running out..."
                />

                <div className="mt-6 flex gap-4">
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={() => {
                      if (round < totalRounds) {
                        setRound(round + 1)
                        setStory('')
                      } else {
                        navigate('/story/123')
                      }
                    }}
                  >
                    {round < totalRounds ? 'Next Round →' : 'Finish Story'}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}

export default RapidFire

