import { motion } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'

const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <motion.button
      onClick={toggleTheme}
      className={`
        relative w-16 h-8 rounded-full p-1
        ${isDark ? 'bg-deep-graphite' : 'bg-cloud-gray'}
        border-2
        ${isDark ? 'border-electric-purple' : 'border-mint-pop'}
        focus:outline-none focus:ring-2 focus:ring-offset-2
        ${isDark ? 'focus:ring-electric-purple' : 'focus:ring-mint-pop'}
        transition-colors
        ${className}
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Toggle theme"
    >
      <motion.div
        className={`
          w-6 h-6 rounded-full
          ${isDark ? 'bg-electric-purple' : 'bg-sunbeam-yellow'}
          shadow-lg
        `}
        animate={{
          x: isDark ? 0 : 32,
        }}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 30,
        }}
      >
        <div className="flex items-center justify-center h-full text-lg">
          {isDark ? '🌙' : '☀️'}
        </div>
      </motion.div>
    </motion.button>
  )
}

export default ThemeToggle

