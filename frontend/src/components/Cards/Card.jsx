import { motion } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'

const Card = ({ 
  children, 
  className = '',
  hoverable = true,
  onClick,
  glow = 'purple',
  ...props 
}) => {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  const glowClasses = {
    purple: isDark ? 'shadow-glow-purple hover:shadow-glow-purple' : 'shadow-lg hover:shadow-xl',
    mint: isDark ? 'shadow-glow-mint hover:shadow-glow-mint' : 'shadow-lg hover:shadow-xl',
    coral: isDark ? 'shadow-glow-coral hover:shadow-glow-coral' : 'shadow-lg hover:shadow-xl',
  }

  return (
    <motion.div
      className={`
        rounded-card-lg 
        ${isDark ? 'bg-soft-charcoal glass-effect' : 'bg-light-surface border border-gray-200'}
        ${glowClasses[glow]}
        ${hoverable ? 'cursor-pointer' : ''}
        transition-colors
        ${className}
      `}
      onClick={onClick}
      whileHover={hoverable ? { 
        scale: 1.03, 
        rotate: 1,
        transition: { duration: 0.2 }
      } : {}}
      whileTap={hoverable && onClick ? { 
        scale: 0.98,
        transition: { duration: 0.1 }
      } : {}}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export default Card

