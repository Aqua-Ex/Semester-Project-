import { Navigate, useLocation } from 'react-router-dom'
import { useUser } from '../../context/UserContext'

const ProtectedRoute = ({ children }) => {
  const { user } = useUser()
  const location = useLocation()

  // Show loading state while checking authentication
  if (user.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin text-4xl mb-4">⏳</div>
          <p className="text-cloud-gray">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated, preserving the intended destination
  if (!user.isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Render protected content if authenticated
  return children
}

export default ProtectedRoute

