import React, { useContext } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { 
  AppBar, Toolbar, Typography, Button, Box, IconButton, Menu, MenuItem, useMediaQuery, useTheme 
} from '@mui/material'
import { Menu as MenuIcon, School, Home, Explore, Person, EmojiEvents, Dashboard } from '@mui/icons-material'
import { AuthContext } from '../context/AuthContext'

export default function Navbar() {
  const { isAuthenticated, role, logoutUser } = useContext(AuthContext)
  const [anchorEl, setAnchorEl] = React.useState(null)
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const handleMenu = (event) => setAnchorEl(event.currentTarget)
  const handleClose = () => setAnchorEl(null)
  const handleLogout = () => {
    logoutUser()
    navigate('/login')
    handleClose()
  }

  return (
    <AppBar position="sticky" elevation={2}>
      <Toolbar>
        <School sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
          Compiler Design Learning
        </Typography>
        
        {isAuthenticated ? (
          <>
            {isMobile ? (
              <>
                <IconButton color="inherit" onClick={handleMenu}>
                  <MenuIcon />
                </IconButton>
                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
                  {role === 'student' && [
                    <MenuItem key="home" onClick={() => { navigate('/'); handleClose() }}>
                      <Home sx={{ mr: 1 }} /> Home
                    </MenuItem>,
                    <MenuItem key="explore" onClick={() => { navigate('/explore'); handleClose() }}>
                      <Explore sx={{ mr: 1 }} /> Explore
                    </MenuItem>,
                    <MenuItem key="profile" onClick={() => { navigate('/profile'); handleClose() }}>
                      <Person sx={{ mr: 1 }} /> Profile
                    </MenuItem>,
                    <MenuItem key="contests" onClick={() => { navigate('/contests'); handleClose() }}>
                      <EmojiEvents sx={{ mr: 1 }} /> Contests
                    </MenuItem>
                  ]}
                  {role === 'admin' && (
                    <MenuItem onClick={() => { navigate('/admin'); handleClose() }}>
                      <Dashboard sx={{ mr: 1 }} /> Dashboard
                    </MenuItem>
                  )}
                  <MenuItem onClick={handleLogout}>Logout</MenuItem>
                </Menu>
              </>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                {role === 'student' && (
                  <>
                    <Button color="inherit" component={RouterLink} to="/" startIcon={<Home />}>Home</Button>
                    <Button color="inherit" component={RouterLink} to="/explore" startIcon={<Explore />}>Explore</Button>
                    <Button color="inherit" component={RouterLink} to="/profile" startIcon={<Person />}>Profile</Button>
                    <Button color="inherit" component={RouterLink} to="/contests" startIcon={<EmojiEvents />}>Contests</Button>
                  </>
                )}
                {role === 'admin' && (
                  <Button color="inherit" component={RouterLink} to="/admin" startIcon={<Dashboard />}>Dashboard</Button>
                )}
                <Button color="inherit" onClick={handleLogout}>Logout</Button>
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
