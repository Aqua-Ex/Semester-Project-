import { motion } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'

const AnimatedBackground = ({ variant = 'default' }) => {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const variants = {
    default: {
      blobs: [
        { color: '#7A33FF', size: 400, x: '10%', y: '20%' },
        { color: '#4AF2C3', size: 350, x: '80%', y: '60%' },
        { color: '#FF6464', size: 300, x: '50%', y: '80%' },
        { color: '#FFD93D', size: 250, x: '20%', y: '50%' },
      ],
    },
    game: {
      blobs: [
        { color: '#7A33FF', size: 500, x: '5%', y: '10%' },
        { color: '#4AF2C3', size: 450, x: '90%', y: '70%' },
        { color: '#FF6464', size: 400, x: '60%', y: '90%' },
      ],
    },
    lobby: {
      blobs: [
        { color: '#7A33FF', size: 300, x: '15%', y: '30%' },
        { color: '#4AF2C3', size: 280, x: '85%', y: '50%' },
      ],
    },
  }

  const config = variants[variant] || variants.default

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {config.blobs.map((blob, index) => (
        <motion.div
          key={index}
          className={`absolute rounded-full blur-3xl ${
            isDark ? 'opacity-20' : 'opacity-10'
          }`}
          style={{
            width: blob.size,
            height: blob.size,
            background: `radial-gradient(circle, ${blob.color}, transparent)`,
            left: blob.x,
            top: blob.y,
          }}
          animate={{
            x: [0, Math.random() * 100 - 50, 0],
            y: [0, Math.random() * 100 - 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20 + index * 5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
      
      {/* Floating particles */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-2 h-2 rounded-full"
          style={{
            background: ['#7A33FF', '#4AF2C3', '#FF6464', '#FFD93D'][i % 4],
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: isDark ? 0.6 : 0.3,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  )
}

export default AnimatedBackground

