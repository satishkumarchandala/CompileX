import React, { useContext } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import Box from '@mui/material/Box'
import { LinearProgress } from '@mui/material'
import { AuthProvider, AuthContext } from './context/AuthContext'
import Navbar from './components/Navbar'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HomePage from './pages/HomePage'
import ExplorePage from './pages/ExplorePage'
import ModulePage from './pages/ModulePage'
import QuizPage from './pages/QuizPage'
import ProfilePage from './pages/ProfilePage'
import ContestsPage from './pages/ContestsPage'
import ContestQuizPage from './pages/ContestQuizPage'
import AdminDashboard from './pages/AdminDashboard'
import SuperAdminDashboard from './pages/SuperAdminDashboard'
import InstructorStudentsPage from './pages/InstructorStudentsPage'
import LeaderboardPage from './pages/LeaderboardPage'

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
    background: { default: '#f5f5f5' }
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  }
})

function LoadingScreen() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <Box sx={{ textAlign: 'center' }}>
        <Box sx={{ fontSize: 40, mb: 2 }}>🔄</Box>
        <LinearProgress sx={{ width: 200, mx: 'auto' }} />
      </Box>
    </Box>
  )
}

// Redirect authenticated users away from public pages
function PublicRoute({ children }) {
  const { isAuthenticated, role, loading } = useContext(AuthContext)
  if (loading) return <LoadingScreen />
  if (isAuthenticated) {
    if (role === 'super_admin') return <Navigate to="/superadmin" />
    if (role === 'admin') return <Navigate to="/admin" />
    return <Navigate to="/" />
  }
  return children
}

// Any authenticated user
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useContext(AuthContext)
  if (loading) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/login" />
  return children
}

// Only admin or super_admin
function AdminRoute({ children }) {
  const { isAuthenticated, role, loading } = useContext(AuthContext)
  if (loading) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/login" />
  if (role !== 'admin' && role !== 'super_admin') return <Navigate to="/" />
  return children
}

// Only super_admin
function SuperAdminRoute({ children }) {
  const { isAuthenticated, role, loading } = useContext(AuthContext)
  if (loading) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/login" />
  if (role !== 'super_admin') return <Navigate to="/" />
  return children
}

// Student-only route (redirects admins to their dashboard)
function StudentRoute({ children }) {
  const { isAuthenticated, role, loading } = useContext(AuthContext)
  if (loading) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/login" />
  if (role === 'super_admin') return <Navigate to="/superadmin" />
  if (role === 'admin') return <Navigate to="/admin" />
  return children
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />
          <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
            <Routes>
              {/* ── Public ─────────────────────────────────────────────── */}
              <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

              {/* ── Super Admin ─────────────────────────────────────────── */}
              <Route path="/superadmin" element={<SuperAdminRoute><SuperAdminDashboard /></SuperAdminRoute>} />

              {/* ── Admin (Instructor) ──────────────────────────────────── */}
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin/students" element={<AdminRoute><InstructorStudentsPage /></AdminRoute>} />

              {/* ── Shared (all authenticated) ──────────────────────────── */}
              <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />

              {/* ── Student ─────────────────────────────────────────────── */}
              <Route path="/" element={<StudentRoute><HomePage /></StudentRoute>} />
              <Route path="/explore" element={<StudentRoute><ExplorePage /></StudentRoute>} />
              <Route path="/module/:id" element={<StudentRoute><ModulePage /></StudentRoute>} />
              <Route path="/module/:id/quiz" element={<StudentRoute><QuizPage /></StudentRoute>} />
              <Route path="/profile" element={<StudentRoute><ProfilePage /></StudentRoute>} />
              <Route path="/contests" element={<StudentRoute><ContestsPage /></StudentRoute>} />
              <Route path="/contest/:id/quiz" element={<StudentRoute><ContestQuizPage /></StudentRoute>} />

              {/* ── Fallback ─────────────────────────────────────────────── */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Box>
        </Box>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
