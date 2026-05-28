import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { lazy, Suspense, Component, type ReactNode, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import RouteGuard from './components/RouteGuard'
import Layout from './components/Layout'

/* ── Error Boundary ── */
interface EBProps { children: ReactNode }
interface EBState { hasError: boolean }
class ErrorBoundary extends Component<EBProps, EBState> {
  constructor(props: EBProps) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('App Error Boundary caught:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-bg-primary px-4 text-text-primary">
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="mt-2 text-text-secondary">Please refresh the page to continue.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-full bg-accent-blue px-6 py-2 text-sm font-semibold text-white hover:bg-accent-blue-hover"
          >
            Refresh Page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

const Home = lazy(() => import('./pages/Home'))
const WeeklyPlans = lazy(() => import('./pages/WeeklyPlans'))
const Topics = lazy(() => import('./pages/Topics'))
const PlanDetail = lazy(() => import('./pages/PlanDetail'))
const Agents = lazy(() => import('./pages/Agents'))
const Settings = lazy(() => import('./pages/Settings'))
const Login = lazy(() => import('./pages/Login'))
const AcceptInvite = lazy(() => import('./pages/AcceptInvite'))
const UserManagement = lazy(() => import('./pages/UserManagement'))

function LoadingFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-cyan border-t-transparent" />
    </div>
  )
}

/* Redirect authenticated users away from login page */
function LoginRedirect() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate])
  if (isAuthenticated) {
    return null
  }
  return <Login />
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginRedirect />} />
      <Route path="/accept-invite" element={<AcceptInvite />} />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <RouteGuard>
            <Home />
          </RouteGuard>
        }
      />
      <Route
        path="/topics"
        element={
          <RouteGuard requireEditor>
            <Topics />
          </RouteGuard>
        }
      />
      <Route
        path="/topics/:id"
        element={
          <RouteGuard requireEditor>
            <PlanDetail />
          </RouteGuard>
        }
      />
      <Route
        path="/plans"
        element={
          <RouteGuard requireEditor>
            <WeeklyPlans />
          </RouteGuard>
        }
      />
      <Route
        path="/plans/:id"
        element={
          <RouteGuard requireEditor>
            <PlanDetail />
          </RouteGuard>
        }
      />
      <Route
        path="/agents"
        element={
          <RouteGuard>
            <Agents />
          </RouteGuard>
        }
      />
      <Route
        path="/settings"
        element={
          <RouteGuard>
            <Settings />
          </RouteGuard>
        }
      />
      {/* Admin-only: User Management */}
      <Route
        path="/team"
        element={
          <RouteGuard requireAdmin>
            <UserManagement />
          </RouteGuard>
        }
      />

      {/* Catch all — redirect to login or home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Layout>
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <AppRoutes />
            </Suspense>
          </ErrorBoundary>
        </Layout>
      </AuthProvider>
    </HashRouter>
  )
}
