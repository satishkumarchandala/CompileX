import React, { useState, useContext } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import { 
  Container, Paper, TextField, Button, Typography, Box, Alert, Link 
} from '@mui/material'
import { Login as LoginIcon } from '@mui/icons-material'
import { login as apiLogin } from '../api'
import { AuthContext } from '../context/AuthContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { loginUser } = useContext(AuthContext)
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    try {
      const res = await apiLogin({ email, password })
      loginUser(res.data.token, res.data.role)
      if (res.data.role === 'admin') navigate('/admin')
      else navigate('/')
    } catch {
      setError('Invalid email or password')
    }
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <LoginIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
            Welcome Back
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Sign in to continue your learning journey
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleLogin}>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            margin="normal"
            autoComplete="email"
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            margin="normal"
            autoComplete="current-password"
          />
          <Button
            fullWidth
            type="submit"
            variant="contained"
            size="large"
            sx={{ mt: 3, mb: 2 }}
          >
            Sign In
          </Button>
        </form>

        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Don't have an account?{' '}
            <Link component={RouterLink} to="/register" underline="hover">
              Register here
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  )
}
