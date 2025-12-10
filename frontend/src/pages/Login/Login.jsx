import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import Button from '../../components/Buttons/Button'
import Card from '../../components/Cards/Card'
import Container from '../../components/Layout/Container'
import { AnimatedBackground, PatternBackground } from '../../components/Background'
import { ThemeToggle } from '../../components/ThemeToggle'
import { useTheme } from '../../context/ThemeContext'
import { useUser } from '../../context/UserContext'

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { theme } = useTheme()
  const { login } = useUser()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const isDark = theme === 'dark'

  // Get the intended destination from location state, or default to home
  const from = location.state?.from?.pathname || '/'

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError(null)
    try {
      await login()
      // Navigate to the intended destination or home after successful login
      navigate(from, { replace: true })
    } catch (err) {
      console.error('Login failed:', err)
      setError(err.message || 'Failed to sign in. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors ${
      isDark ? 'bg-deep-graphite' : 'bg-light-bg'
    }`}>
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      <AnimatedBackground variant="default" />
      <PatternBackground />
      
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {['🔐', '✨', '🎮', '🌟', '💫', '🚀'].map((icon, i) => (
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
        <div className="flex items-center justify-center min-h-screen py-16">
          <motion.div
            className="w-full max-w-md relative z-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="p-8 relative overflow-hidden">
              {/* Decorative background pattern */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-electric-purple to-mint-pop opacity-10 rounded-full blur-2xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-mint-pop to-electric-purple opacity-10 rounded-full blur-xl" />
              
              <div className="relative z-10">
                <motion.div
                  className="text-center mb-8"
                  animate={{ 
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                  }}
                >
                  <span className="text-8xl">🔐</span>
                </motion.div>
                
                <h1 className={`text-4xl font-header font-bold mb-2 text-center ${
                  isDark ? 'text-white' : 'text-light-text'
                }`}>
                  Welcome to Co-Thread
                </h1>
                <p className={`text-center mb-8 ${
                  isDark ? 'text-cloud-gray' : 'text-light-text-secondary'
                }`}>
                  Sign in to start creating epic stories
                </p>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-laser-coral/20 border border-laser-coral rounded-lg text-laser-coral text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full mb-4"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        ⏳
                      </motion.span>
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Sign in with Google
                    </span>
                  )}
                </Button>

                <p className={`text-sm text-center ${
                  isDark ? 'text-cloud-gray' : 'text-light-text-secondary'
                }`}>
                  By signing in, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </Card>
          </motion.div>
        </div>
      </Container>
    </div>
  )
}

export default Login

