import React, { useEffect, useState, useContext } from 'react'
import { 
  Container, Typography, Box, Paper, LinearProgress, Grid, Card, CardContent
} from '@mui/material'
import { School, EmojiEvents, TrendingUp } from '@mui/icons-material'
import { AuthContext } from '../context/AuthContext'
import { getProfile } from '../api'

export default function HomePage() {
  const { userId, user } = useContext(AuthContext)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId && user?.role === 'student') {
      loadProfile()
    } else {
      setLoading(false)
    }
  }, [userId, user])

  // Reload profile when navigating back to this page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && userId && user?.role === 'student') {
        loadProfile()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [userId, user])

  const loadProfile = () => {
    setLoading(true)
    getProfile(userId).then(r => {
      setProfile(r.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  if (loading && user?.role === 'student') return <LinearProgress />

  return (
    <Container maxWidth="lg">
      <Paper 
        elevation={3} 
        sx={{ 
          p: 6, 
          mt: 4,
          mb: 4,
          textAlign: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}
      >
        <School sx={{ fontSize: 80, mb: 2 }} />
        <Typography variant="h2" gutterBottom fontWeight={700}>
          Welcome back{user?.name ? `, ${user.name}` : ''}! 🎓
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.95, lineHeight: 1.8 }}>
          Continue your learning journey in Compiler Design
        </Typography>
      </Paper>

      {user?.role === 'student' && profile && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card elevation={3} sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 30%, #764ba2 90%)' }}>
              <CardContent sx={{ textAlign: 'center', color: 'white', py: 4 }}>
                <TrendingUp sx={{ fontSize: 50, mb: 1 }} />
                <Typography variant="h3" fontWeight={700}>
                  Level {profile.level}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>
                  {profile.xp} XP Earned
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card elevation={3} sx={{ height: '100%', background: 'linear-gradient(135deg, #f093fb 30%, #f5576c 90%)' }}>
              <CardContent sx={{ textAlign: 'center', color: 'white', py: 4 }}>
                <EmojiEvents sx={{ fontSize: 50, mb: 1 }} />
                <Typography variant="h3" fontWeight={700}>
                  {profile.badges?.length || 0}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>
                  Badges Earned
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card elevation={3} sx={{ height: '100%', background: 'linear-gradient(135deg, #4facfe 30%, #00f2fe 90%)' }}>
              <CardContent sx={{ textAlign: 'center', color: 'white', py: 4 }}>
                <School sx={{ fontSize: 50, mb: 1 }} />
                <Typography variant="h3" fontWeight={700}>
                  {profile.completedModules?.length || 0}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>
                  Modules Completed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}      <Paper elevation={2} sx={{ p: 5, mt: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight={600} color="primary" textAlign="center">
          About This Platform
        </Typography>
        <Box sx={{ mt: 3 }}>
          <Typography variant="body1" paragraph color="text.secondary" sx={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
            Welcome to the <strong>Gamified Learning Platform for Compiler Design</strong>! This innovative educational platform 
            transforms the complex subject of compiler design into an engaging and rewarding learning experience.
          </Typography>
          
          <Typography variant="body1" paragraph color="text.secondary" sx={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
            Our platform features <strong>5 comprehensive modules</strong> covering essential topics from Lexical Analysis to 
            Code Optimization. Each module includes detailed notes, video lessons, and interactive quizzes designed to 
            reinforce your understanding.
          </Typography>

          <Typography variant="body1" paragraph color="text.secondary" sx={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
            What makes learning here special? We've integrated <strong>gamification elements</strong> including:
          </Typography>

          <Box sx={{ pl: 4, mb: 3 }}>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem', lineHeight: 1.8, mb: 1 }}>
              🏆 <strong>XP Points & Levels</strong> - Earn experience points with every quiz and level up as you progress
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem', lineHeight: 1.8, mb: 1 }}>
              🎖️ <strong>Achievement Badges</strong> - Unlock special badges for milestones like perfect scores and consistent performance
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem', lineHeight: 1.8, mb: 1 }}>
              🎯 <strong>Competitive Contests</strong> - Test your knowledge against peers in timed challenges
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
              📊 <strong>Leaderboards</strong> - See how you rank among fellow learners
            </Typography>
          </Box>

          <Typography variant="body1" paragraph color="text.secondary" sx={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
            Start your journey by exploring the modules, take quizzes to test your knowledge, and watch your progress 
            grow as you master compiler design concepts. Happy learning! 📚
          </Typography>
        </Box>
      </Paper>
    </Container>
  )
}
