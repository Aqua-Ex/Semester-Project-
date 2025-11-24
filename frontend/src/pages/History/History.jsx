import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Button from '../../components/Buttons/Button'
import Card from '../../components/Cards/Card'
import Container from '../../components/Layout/Container'
import { AnimatedBackground } from '../../components/Background'
import { ThemeToggle } from '../../components/ThemeToggle'
import { useThemeClasses } from '../../hooks/useThemeClasses'

const History = () => {
  const navigate = useNavigate()
  const themeClasses = useThemeClasses()

  const historyItems = [
    {
      id: '1',
      mode: 'Multiplayer',
      title: 'The Enchanted Forest',
      players: 4,
      date: '2024-01-15',
      score: 850,
      result: 'win',
      preview: 'Once upon a time, in a forest where the trees whispered secrets...',
    },
    {
      id: '2',
      mode: 'RapidFire',
      title: 'Space Adventure',
      players: 1,
      date: '2024-01-14',
      score: 1200,
      result: 'win',
      preview: 'The spaceship hurtled through the asteroid field...',
    },
    {
      id: '3',
      mode: 'Single Player',
      title: 'Mystery Mansion',
      players: 1,
      date: '2024-01-13',
      score: 650,
      result: 'loss',
      preview: 'The old mansion creaked in the wind...',
    },
  ]

  const getModeIcon = (mode) => {
    if (mode === 'Multiplayer') return '👥'
    if (mode === 'RapidFire') return '⚡'
    return '⚔️'
  }

  const getResultIcon = (result) => {
    return result === 'win' ? '✅' : '❌'
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

          <div className="space-y-4">
            {historyItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 hover:scale-[1.02] transition-transform">
                  <div className="flex items-start gap-6">
                    <div className="text-4xl">
                      {getModeIcon(item.mode)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="text-2xl font-header font-bold">
                          {item.title}
                        </h3>
                        <span className="text-sm text-cloud-gray">
                          {getResultIcon(item.result)}
                        </span>
                        <span className="text-sm bg-soft-charcoal px-3 py-1 rounded-full">
                          {item.mode}
                        </span>
                      </div>
                      <p className={`mb-4 line-clamp-2 ${themeClasses.textSecondary}`}>
                        {item.preview}
                      </p>
                      <div className={`flex items-center gap-6 text-sm ${themeClasses.textSecondary}`}>
                        <span>📅 {item.date}</span>
                        <span>👥 {item.players} players</span>
                        <span className="text-sunbeam-yellow font-bold">
                          ⭐ {item.score} points
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => navigate(`/story/${item.id}`)}
                    >
                      View Story
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </Container>
    </div>
  )
}

export default History

