import React, { useState, useContext } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import { 
  Container, Paper, TextField, Button, Typography, Box, Alert, Link, 
  FormControl, InputLabel, Select, MenuItem 
} from '@mui/material'
import { PersonAdd } from '@mui/icons-material'
import { register as apiRegister } from '../api'
import { AuthContext } from '../context/AuthContext'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('student')
  const [error, setError] = useState('')
  const { loginUser } = useContext(AuthContext)
  const navigate = useNavigate()

  async function handleRegister(e) {
    e.preventDefault()
    setError('')
    try {
      const res = await apiRegister({ name, email, password, role })
      loginUser(res.data.token, res.data.role)
      if (res.data.role === 'admin') navigate('/admin')
      else navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed')
    }
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <PersonAdd sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
            Create Account
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Join us and start your learning adventure
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleRegister}>
          <TextField
            fullWidth
            label="Full Name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            margin="normal"
          />
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
            autoComplete="new-password"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select value={role} onChange={e => setRole(e.target.value)} label="Role">
              <MenuItem value="student">Student</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
          <Button
            fullWidth
            type="submit"
            variant="contained"
            size="large"
            sx={{ mt: 3, mb: 2 }}
          >
            Register
          </Button>
        </form>

        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Already have an account?{' '}
            <Link component={RouterLink} to="/login" underline="hover">
              Sign in
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  )
}
