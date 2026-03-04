import React, { useContext } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import {
  AppBar, Toolbar, Typography, Button, Box, IconButton,
  Menu, MenuItem, useMediaQuery, useTheme, Chip
} from '@mui/material'
import {
  Menu as MenuIcon, School, Home, Explore, Person, EmojiEvents,
  Dashboard, SupervisorAccount, Leaderboard, AdminPanelSettings
} from '@mui/icons-material'
import { AuthContext } from '../context/AuthContext'

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Instructor',
  student: 'Student'
}

const ROLE_COLORS = {
  super_admin: '#fa8231',
  admin: '#667eea',
  student: '#43e97b'
}

export default function Navbar() {
  const { isAuthenticated, role, logoutUser, user } = useContext(AuthContext)
  const [anchorEl, setAnchorEl] = React.useState(null)
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const handleMenu = (e) => setAnchorEl(e.currentTarget)
  const handleClose = () => setAnchorEl(null)
  const handleLogout = () => {
    logoutUser()
    navigate('/login')
    handleClose()
  }

  // Navigate to correct dashboard based on role
  const toDashboard = () => {
    if (role === 'super_admin') navigate('/superadmin')
    else if (role === 'admin') navigate('/admin')
    else navigate('/')
    handleClose()
  }

  const studentLinks = [
    { label: 'Home', icon: <Home />, to: '/' },
    { label: 'Explore', icon: <Explore />, to: '/explore' },
    { label: 'Contests', icon: <EmojiEvents />, to: '/contests' },
    { label: 'Leaderboard', icon: <Leaderboard />, to: '/leaderboard' },
    { label: 'Profile', icon: <Person />, to: '/profile' },
  ]

  const adminLinks = [
    { label: 'Dashboard', icon: <Dashboard />, to: '/admin' },
    { label: 'My Students', icon: <SupervisorAccount />, to: '/admin/students' },
    { label: 'Leaderboard', icon: <Leaderboard />, to: '/leaderboard' },
  ]

  const superAdminLinks = [
    { label: 'Dashboard', icon: <AdminPanelSettings />, to: '/superadmin' },
    { label: 'Leaderboard', icon: <Leaderboard />, to: '/leaderboard' },
  ]

  const links =
    role === 'super_admin' ? superAdminLinks :
      role === 'admin' ? adminLinks :
        studentLinks

  return (
    <AppBar position="sticky" elevation={2}>
      <Toolbar>
        <School sx={{ mr: 1.5 }} />
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, fontWeight: 700, cursor: 'pointer' }}
          onClick={toDashboard}
        >
          CompileX
        </Typography>

        {isAuthenticated ? (
          <>
            {/* Role badge */}
            {role && (
              <Chip
                label={ROLE_LABELS[role] || role}
                size="small"
                sx={{
                  mr: 2,
                  bgcolor: ROLE_COLORS[role] + '33',
                  color: 'white',
                  fontWeight: 600,
                  border: `1px solid ${ROLE_COLORS[role]}55`,
                  display: { xs: 'none', sm: 'flex' }
                }}
              />
            )}

            {isMobile ? (
              <>
                <IconButton color="inherit" onClick={handleMenu}>
                  <MenuIcon />
                </IconButton>
                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
                  {links.map(l => (
                    <MenuItem key={l.to} onClick={() => { navigate(l.to); handleClose() }}>
                      <Box sx={{ mr: 1, display: 'flex' }}>{l.icon}</Box> {l.label}
                    </MenuItem>
                  ))}
                  <MenuItem onClick={handleLogout}>Logout</MenuItem>
                </Menu>
              </>
            ) : (
              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                {links.map(l => (
                  <Button
                    key={l.to}
                    color="inherit"
                    component={RouterLink}
                    to={l.to}
                    startIcon={l.icon}
                    size="small"
                    sx={{ fontWeight: 500 }}
                  >
                    {l.label}
                  </Button>
                ))}
                <Button color="inherit" onClick={handleLogout} size="small" sx={{ ml: 1, fontWeight: 600 }}>
                  Logout
                </Button>
              </Box>
            )}
          </>
        ) : (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button color="inherit" component={RouterLink} to="/login">Login</Button>
            <Button color="inherit" component={RouterLink} to="/register">Register</Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  )
}
