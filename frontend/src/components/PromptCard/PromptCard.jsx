import { motion, AnimatePresence } from 'framer-motion'
import Card from '../Cards/Card'

const PromptCard = ({ prompt, category, className = '' }) => {
  const categoryIcons = {
    drama: '🎭',
    comedy: '😂',
    chaos: '💥',
    object: '📦',
    twist: '🌀',
    character: '👤',
    default: '✨',
  }

  const categoryColors = {
    drama: 'border-electric-purple',
    comedy: 'border-sunbeam-yellow',
    chaos: 'border-laser-coral',
    object: 'border-mint-pop',
    twist: 'border-electric-purple',
    character: 'border-mint-pop',
    default: 'border-cloud-gray',
  }

  const icon = categoryIcons[category] || categoryIcons.default
  const borderColor = categoryColors[category] || categoryColors.default

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={prompt}
        initial={{ rotateY: 90, opacity: 0 }}
        animate={{ rotateY: 0, opacity: 1 }}
        exit={{ rotateY: -90, opacity: 0 }}
        transition={{ duration: 0.6 }}
        className={className}
      >
        <Card className={`p-6 border-2 ${borderColor}`}>
          <div className="flex items-start gap-4">
            <div className="text-4xl">{icon}</div>
            <div className="flex-1">
              <div className="text-sm font-decorative text-slate-600 dark:text-cloud-gray mb-2 uppercase tracking-wider">
                {category || 'Prompt'}
              </div>
              <div className="text-xl font-header font-bold text-slate-900 dark:text-white leading-relaxed">
                {prompt || 'Waiting for prompt...'}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}

export default PromptCard
