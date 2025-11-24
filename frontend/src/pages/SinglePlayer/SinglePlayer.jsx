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

const SinglePlayer = () => {
  const navigate = useNavigate()
  const themeClasses = useThemeClasses()
  const [story, setStory] = useState('')
  const [currentPrompt, setCurrentPrompt] = useState({
    text: 'You wake up in a world where gravity works sideways.',
    category: 'chaos',
  })

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
                prompt={currentPrompt.text}
                category={currentPrompt.category}
              />
            </div>

            {/* Center: Story Editor */}
            <div className="lg:col-span-2">
              <Card className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className={`text-xl font-header font-bold ${themeClasses.text}`}>Your Story</h3>
                  <Timer
                    initialTime={300}
                    size={80}
                  />
                </div>
                
                <StoryEditor
                  content={story}
                  onChange={setStory}
                  isActive={true}
                  placeholder="Start writing your story..."
                />

                <div className="mt-6 flex gap-4">
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={() => navigate('/story/123')}
                  >
                    Submit Story
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setStory('')}
                  >
                    Clear
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

export default SinglePlayer

