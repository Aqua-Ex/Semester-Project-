import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Avatar from '../../components/Avatars/Avatar'
import Button from '../../components/Buttons/Button'
import Card from '../../components/Cards/Card'
import Container from '../../components/Layout/Container'
import { AnimatedBackground } from '../../components/Background'
import { ThemeToggle } from '../../components/ThemeToggle'
import { useThemeClasses } from '../../hooks/useThemeClasses'
import { useLeaderboard } from '../../hooks/useGameAPI'
import { useUser } from '../../context/UserContext'

const Leaderboard = () => {
  const navigate = useNavigate()
  const themeClasses = useThemeClasses()
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState('global')

  const tabs = [
    { id: 'global', label: 'Global', icon: '🌍' },
    { id: 'friends', label: 'Friends', icon: '👥' },
    { id: 'weekly', label: 'Weekly', icon: '📅' },
    { id: 'rapidfire', label: 'RapidFire', icon: '⚡' },
  ]

  const { data: leaderboardData, isLoading } = useLeaderboard(
    activeTab,
    activeTab === 'friends' ? user.id : null
  )

  const currentData = leaderboardData?.entries || []

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  return (
    <div className={`min-h-screen relative transition-colors ${themeClasses.bg}`}>
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      <AnimatedBackground variant="default" />
      
      {/* Trophy and medal decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {['🏆', '🥇', '🥈', '🥉', '⭐', '🌟'].map((icon, i) => (
          <motion.div
            key={i}
            className="absolute text-6xl opacity-10"
            style={{
              left: `${10 + i * 15}%`,
              top: `${15 + (i % 3) * 30}%`,
            }}
            animate={{
              y: [0, -25, 0],
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.4,
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
              🏆 Leaderboard
            </h1>
            <div className="w-24" />
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-8 overflow-x-auto">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'primary' : 'ghost'}
                onClick={() => setActiveTab(tab.id)}
                className="whitespace-nowrap"
              >
                {tab.icon} {tab.label}
              </Button>
            ))}
          </div>

          {/* Leaderboard */}
          <Card className="p-8">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="text-lg">Loading leaderboard...</div>
              </div>
            ) : currentData.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-lg opacity-70">No leaderboard data available yet</div>
              </div>
            ) : (
              <div className="space-y-4">
                {currentData.map((entry, index) => {
                  const isCurrentUser = entry.userId === user.id;
                  return (
                    <motion.div
                      key={entry.rank || index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`
                        flex items-center gap-6 p-6 rounded-lg
                        ${isCurrentUser
                          ? 'bg-gradient-purple-mint bg-opacity-20 border-2 border-mint-pop'
                          : themeClasses.card
                        }
                      `}
                    >
                      <div className="text-3xl font-header font-bold w-16 text-center">
                        {getRankIcon(entry.rank)}
                      </div>
                      <Avatar user={entry} size="md" />
                      <div className="flex-1">
                        <div className={`text-xl font-header font-bold ${themeClasses.text}`}>
                          {entry.username}
                          {isCurrentUser && (
                            <span className="ml-2 text-sm text-mint-pop">(You)</span>
                          )}
                        </div>
                      </div>
                      <div className="text-2xl font-decorative font-bold text-sunbeam-yellow">
                        {entry.score.toLocaleString()}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </Container>
    </div>
  )
}

export default Leaderboard

