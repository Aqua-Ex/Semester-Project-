import { motion } from 'framer-motion'

const Avatar = ({ 
  user,
  size = 'md',
  showStatus = false,
  isReady = false,
  className = '',
  ...props 
}) => {
  const sizes = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-16 h-16 text-base',
    lg: 'w-24 h-24 text-lg',
    xl: 'w-32 h-32 text-xl',
  }

  const getInitials = (name) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const avatarColors = [
    'bg-electric-purple',
    'bg-mint-pop',
    'bg-laser-coral',
    'bg-sunbeam-yellow',
  ]

  const colorIndex = user?.id ? parseInt(user.id) % avatarColors.length : 0
  const bgColor = avatarColors[colorIndex]

  return (
    <motion.div
      className={`relative ${className}`}
      whileHover={{ scale: 1.1 }}
      {...props}
    >
      <div className={`
        ${sizes[size]}
        ${bgColor}
        rounded-full
        flex items-center justify-center
        font-header font-bold
        text-white
        shadow-lg
        relative
        overflow-hidden
      `}>
        {user?.avatar ? (
          <img 
            src={user.avatar} 
            alt={user.username || 'User'} 
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{getInitials(user?.username || 'User')}</span>
        )}
        
        {isReady && (
          <motion.div
            className="absolute inset-0 bg-mint-pop opacity-50 rounded-full"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </div>
      
      {showStatus && user?.username && (
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-soft-charcoal px-2 py-1 rounded-full text-xs whitespace-nowrap">
          {user.username}
        </div>
      )}
      
      {isReady && (
        <motion.div
          className="absolute -top-1 -right-1 w-4 h-4 bg-mint-pop rounded-full border-2 border-deep-graphite"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />
      )}
    </motion.div>
  )
}

export default Avatar

