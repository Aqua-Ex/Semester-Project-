import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Card from '../../components/Cards/Card'
import Button from '../../components/Buttons/Button'
import Container from '../../components/Layout/Container'
import { AnimatedBackground, PatternBackground } from '../../components/Background'
import { ThemeToggle } from '../../components/ThemeToggle'
import { useTheme } from '../../context/ThemeContext'
import { useUser } from '../../context/UserContext'

const Home = () => {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const { user, logout } = useUser()
  const isDark = theme === 'dark'

  const gameModes = [
    {
      id: 'multiplayer',
      title: 'Multiplayer Mode',
      description: 'Team up with friends and create epic stories together',
      icon: '👥',
      gradient: 'from-electric-purple to-mint-pop',
      route: '/lobby',
    },
    {
      id: 'singleplayer',
      title: 'Single Player Mode',
      description: 'Challenge yourself in a 1v1 storytelling duel',
      icon: '⚔️',
      gradient: 'from-laser-coral to-sunbeam-yellow',
      route: '/singleplayer',
    },
    {
      id: 'rapidfire',
      title: 'Rapid Fire Mode',
      description: 'Fast-paced storytelling with lightning rounds',
      icon: '⚡',
      gradient: 'from-mint-pop to-electric-purple',
      route: '/rapidfire',
    },
  ]

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors ${
      isDark ? 'bg-deep-graphite' : 'bg-light-bg'
    }`}>
      <div className="absolute top-4 right-4 z-20 flex items-center gap-4">
        {user.isAuthenticated && (
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {user.avatar && (
              <img
                src={user.avatar}
                alt={user.username}
                className="w-10 h-10 rounded-full border-2 border-electric-purple"
              />
            )}
            <span className={`hidden md:block font-header ${
              isDark ? 'text-white' : 'text-light-text'
            }`}>
              {user.username}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await logout()
                navigate('/login')
              }}
            >
              Logout
            </Button>
          </motion.div>
        )}
        {!user.isAuthenticated && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/login')}
          >
            Sign In
          </Button>
        )}
        <ThemeToggle />
      </div>
      <AnimatedBackground variant="default" />
      <PatternBackground />
      
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating story icons */}
        {['📖', '✍️', '🎭', '✨', '🌟', '💫'].map((icon, i) => (
          <motion.div
            key={i}
            className="absolute text-6xl opacity-20"
            style={{
              left: `${10 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [0, -20, 0],
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              delay: i * 0.5,
            }}
          >
            {icon}
          </motion.div>
        ))}
      </div>

      <Container>
        {/* Header */}
        <motion.div
          className="text-center py-16 relative z-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="inline-block mb-6"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <span className="text-8xl">📚</span>
          </motion.div>
          <motion.h1
            className="text-7xl font-header font-extrabold mb-4 gradient-text"
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{
              backgroundSize: '200% 200%',
              backgroundImage: 'linear-gradient(135deg, #7A33FF, #4AF2C3)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Co-Thread
          </motion.h1>
          <p className={`text-xl font-body mb-4 ${
            isDark ? 'text-cloud-gray' : 'text-light-text-secondary'
          }`}>
            Collaborative storytelling reimagined
          </p>
          <div className="flex justify-center gap-4 text-4xl">
            {['🎮', '✍️', '🎭', '🌟'].map((emoji, i) => (
              <motion.span
                key={i}
                animate={{ y: [0, -10, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              >
                {emoji}
              </motion.span>
            ))}
          </div>
        </motion.div>

        {/* Game Mode Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-16 relative z-10">
          {gameModes.map((mode, index) => (
            <motion.div
              key={mode.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card
                className="p-8 h-full flex flex-col cursor-pointer relative overflow-hidden"
                onClick={() => navigate(mode.route)}
                glow="purple"
              >
                {/* Decorative background pattern */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${mode.gradient} opacity-10 rounded-full blur-2xl`} />
                <div className={`absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr ${mode.gradient} opacity-10 rounded-full blur-xl`} />
                
                <div className="relative z-10">
                  <motion.div
                    className={`text-8xl mb-4`}
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      delay: index * 0.3
                    }}
                  >
                    {mode.icon}
                  </motion.div>
                <h2 className={`text-2xl font-header font-bold mb-3 ${
                  isDark ? 'text-white' : 'text-light-text'
                }`}>
                  {mode.title}
                </h2>
                <p className={`mb-6 flex-1 ${
                  isDark ? 'text-cloud-gray' : 'text-light-text-secondary'
                }`}>
                  {mode.description}
                </p>
                  
                  {/* Visual indicators */}
                  <div className="flex gap-2 mb-4">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full bg-gradient-to-r ${mode.gradient}`}
                      />
                    ))}
                  </div>
                  
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(mode.route)
                    }}
                  >
                    Play Now →
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Navigation Links */}
        <motion.div
          className="flex justify-center gap-6 pb-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/leaderboard')}
          >
            🏆 Leaderboard
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate('/history')}
          >
            📜 History
          </Button>
        </motion.div>
      </Container>
    </div>
  )
}

export default Home

