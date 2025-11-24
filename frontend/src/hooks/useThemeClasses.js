import { useTheme } from '../context/ThemeContext'

export const useThemeClasses = () => {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return {
    isDark,
    bg: isDark ? 'bg-deep-graphite' : 'bg-light-bg',
    surface: isDark ? 'bg-soft-charcoal' : 'bg-light-surface',
    card: isDark ? 'bg-soft-charcoal' : 'bg-light-card',
    text: isDark ? 'text-white' : 'text-light-text',
    textSecondary: isDark ? 'text-cloud-gray' : 'text-light-text-secondary',
    border: isDark ? 'border-soft-charcoal' : 'border-gray-200',
  }
}

