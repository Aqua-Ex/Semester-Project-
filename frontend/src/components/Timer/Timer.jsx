import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const Timer = ({ 
  initialTime, 
  timeRemaining: externalTimeRemaining,
  onComplete,
  size = 100,
  strokeWidth = 8,
  className = ''
}) => {
  const [internalTime, setInternalTime] = useState(initialTime)
  const isControlled = externalTimeRemaining !== undefined
  const timeRemaining = isControlled ? externalTimeRemaining : internalTime
  
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (timeRemaining / initialTime) * circumference
  const offset = circumference - progress

  useEffect(() => {
    if (!isControlled) {
      // Internal timer mode - manage own state
      if (internalTime <= 0) {
        onComplete?.()
        return
      }

      const interval = setInterval(() => {
        setInternalTime(prev => {
          if (prev <= 1) {
            onComplete?.()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(interval)
    } else {
      // Controlled mode - external component manages time
      if (externalTimeRemaining <= 0) {
        onComplete?.()
      }
    }
  }, [internalTime, externalTimeRemaining, isControlled, onComplete])

  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60
  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`

  const getColor = () => {
    const percentage = timeRemaining / initialTime
    if (percentage > 0.5) return '#4AF2C3' // mint
    if (percentage > 0.25) return '#FFD93D' // yellow
    return '#FF6464' // coral
  }

  return (
    <div className={`relative ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#2A2A30"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'linear' }}
          style={{
            filter: timeRemaining < 30 ? 'drop-shadow(0 0 8px currentColor)' : 'none',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="text-center"
          animate={timeRemaining < 30 ? { scale: [1, 1.1, 1] } : {}}
          transition={{ repeat: timeRemaining < 30 ? Infinity : 0, duration: 1 }}
        >
          <div className="text-2xl font-decorative font-bold" style={{ color: getColor() }}>
            {timeString}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Timer
