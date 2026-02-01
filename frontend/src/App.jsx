import React, { useContext } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import Box from '@mui/material/Box'
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

function ProtectedRoute({ children, adminOnly }) {
  const { isAuthenticated, role, loading } = useContext(AuthContext)
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <Box sx={{ fontSize: 40, mb: 2 }}>🔄</Box>
          <Box>Loading...</Box>
        </Box>
      </Box>
    )
  }
  
  if (!isAuthenticated) return <Navigate to="/login" />
  if (adminOnly && role !== 'admin') return <Navigate to="/" />
  return children
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useContext(AuthContext)
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <Box sx={{ fontSize: 40, mb: 2 }}>🔄</Box>
          <Box>Loading...</Box>
        </Box>
      </Box>
    )
  }
  
  if (isAuthenticated) return <Navigate to="/" />
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
              <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
              <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
              <Route path="/explore" element={<ProtectedRoute><ExplorePage /></ProtectedRoute>} />
              <Route path="/module/:id" element={<ProtectedRoute><ModulePage /></ProtectedRoute>} />
              <Route path="/module/:id/quiz" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/contests" element={<ProtectedRoute><ContestsPage /></ProtectedRoute>} />
              <Route path="/contest/:id/quiz" element={<ProtectedRoute><ContestQuizPage /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
            </Routes>
          </Box>
        </Box>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
