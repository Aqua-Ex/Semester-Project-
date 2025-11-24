import { motion } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  onClick,
  disabled = false,
  className = '',
  ...props 
}) => {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  const baseStyles = `font-header font-bold rounded-button transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
    isDark ? 'focus:ring-offset-deep-graphite' : 'focus:ring-offset-light-bg'
  } disabled:opacity-50 disabled:cursor-not-allowed`
  
  const variants = {
    primary: isDark 
      ? 'bg-gradient-purple-mint text-white shadow-glow-purple hover:shadow-glow-mint hover:scale-105 active:scale-95'
      : 'bg-gradient-purple-mint text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95',
    secondary: isDark
      ? 'bg-transparent border-2 border-electric-purple text-electric-purple hover:bg-electric-purple hover:text-white'
      : 'bg-transparent border-2 border-electric-purple text-electric-purple hover:bg-electric-purple hover:text-white',
    danger: isDark
      ? 'bg-laser-coral text-white shadow-glow-coral hover:scale-105 active:scale-95'
      : 'bg-laser-coral text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95',
    ghost: isDark
      ? 'bg-transparent text-cloud-gray hover:text-white hover:bg-soft-charcoal'
      : 'bg-transparent text-light-text-secondary hover:text-light-text hover:bg-light-card',
  }
  
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    xl: 'px-10 py-5 text-xl',
  }

  return (
    <motion.button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      {...props}
    >
      {children}
    </motion.button>
  )
}

export default Button

