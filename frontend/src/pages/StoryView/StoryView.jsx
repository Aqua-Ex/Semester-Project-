import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Button from '../../components/Buttons/Button'
import Card from '../../components/Cards/Card'
import Container from '../../components/Layout/Container'
import { AnimatedBackground } from '../../components/Background'
import { ThemeToggle } from '../../components/ThemeToggle'
import { useThemeClasses } from '../../hooks/useThemeClasses'

const StoryView = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const themeClasses = useThemeClasses()

  // Mock story data - in real app, fetch by id
  const story = {
    title: 'The Enchanted Forest',
    content: `
      <p>Once upon a time, in a forest where the trees whispered secrets to those who would listen, there lived a young explorer named Luna. She had always been drawn to the mysterious, and this forest was the most mysterious place she had ever encountered.</p>
      
      <p>The trees here were ancient, their bark covered in glowing runes that pulsed with a soft purple light. As Luna ventured deeper, she noticed that the whispers were growing louder, more urgent. They were trying to tell her something important.</p>
      
      <p>Suddenly, a door appeared before her—a door that shouldn't exist, floating in the middle of a clearing. It was made of what looked like starlight and shadow, and it glowed with an otherworldly light that made her heart race with both fear and excitement.</p>
      
      <p>Without hesitation, Luna reached for the handle. The moment her fingers touched the cool, ethereal surface, the entire forest fell silent. The door swung open, revealing not another part of the forest, but a world of pure imagination—a place where stories came to life.</p>
    `,
    mode: 'Multiplayer',
    players: ['Luna', 'Alex', 'Sam', 'Jordan'],
    date: '2024-01-15',
    score: 850,
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="p-12 max-w-4xl mx-auto">
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-5xl font-header font-bold mb-4 gradient-text">
                  {story.title}
                </h1>
                <div className={`flex items-center justify-center gap-6 ${themeClasses.textSecondary}`}>
                  <span>📅 {story.date}</span>
                  <span>👥 {story.players.length} players</span>
                  <span className="text-sunbeam-yellow font-bold">
                    ⭐ {story.score} points
                  </span>
                </div>
              </div>

              {/* Story Content */}
              <div
                className={`prose max-w-none text-lg leading-relaxed ${
                  themeClasses.isDark ? 'prose-invert' : ''
                }`}
                dangerouslySetInnerHTML={{ __html: story.content }}
                style={{
                  color: themeClasses.isDark ? '#D9D9E0' : '#1A1A1E',
                }}
              />

              {/* Contributors */}
              <div className={`mt-12 pt-8 border-t ${themeClasses.border}`}>
                <h3 className="text-xl font-header font-bold mb-4">
                  Story Contributors
                </h3>
                <div className="flex flex-wrap gap-3">
                  {story.players.map((player, index) => (
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
        </div>
      </Container>
    </div>
  )
}

export default StoryView

