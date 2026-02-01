import React, { useEffect, useState, useContext } from 'react'
import { 
  Container, Grid, Card, CardContent, Typography, Box, Chip, Avatar,
  List, ListItem, ListItemText, Paper, Divider, LinearProgress, IconButton
} from '@mui/material'
import { Person, EmojiEvents, School, TrendingUp, Refresh } from '@mui/icons-material'
import { AuthContext } from '../context/AuthContext'
import { getProfile, getProgress } from '../api'

export default function ProfilePage() {
  const { userId } = useContext(AuthContext)
  const [profile, setProfile] = useState(null)
  const [progress, setProgress] = useState([])
  const [refreshing, setRefreshing] = useState(false)

  const loadProfileData = async () => {
    if (!userId) return
    setRefreshing(true)
    try {
      const profileRes = await getProfile(userId)
      const progressRes = await getProgress(userId)
      setProfile(profileRes.data)
      setProgress(progressRes.data.attempts)
    } catch (err) {
      console.error('Failed to load profile', err)
    }
    setRefreshing(false)
  }

  useEffect(() => {
    loadProfileData()

    // Auto-refresh when returning to page
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadProfileData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [userId])

  if (!profile) return <LinearProgress />

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 4, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', position: 'relative' }}>
        <IconButton 
          onClick={loadProfileData} 
          disabled={refreshing}
          sx={{ position: 'absolute', top: 16, right: 16, color: 'white' }}
        >
          <Refresh sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
        </IconButton>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Avatar sx={{ width: 80, height: 80, bgcolor: 'rgba(255,255,255,0.2)' }}>
            <Person sx={{ fontSize: 40 }} />
          </Avatar>
          <Box>
            <Typography variant="h3" fontWeight={600} gutterBottom>
              {profile?.name}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              {profile?.email}
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight={600}>Level & XP</Typography>
              </Box>
              <Typography variant="h2" color="primary" fontWeight={700}>Level {profile?.level}</Typography>
              <Typography variant="body1" color="text.secondary">{profile?.xp} XP earned</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <EmojiEvents color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight={600}>Badges Collection</Typography>
              </Box>
              {profile?.badges?.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {profile.badges.map((badge, i) => (
                    <Chip key={i} label={badge} color="secondary" icon={<EmojiEvents />} />
                  ))}
                </Box>
              ) : (
                <Typography color="text.secondary">No badges earned yet</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <School color="primary" /> Quiz History
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {progress.length > 0 ? (
              <List>
                {progress.reverse().map((a, i) => (
                  <ListItem 
                    key={i}
                    sx={{ 
                      bgcolor: 'action.hover', 
                      mb: 1, 
                      borderRadius: 1,
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}
                  >
                    <ListItemText
                      primary={`Module ${a.moduleId}`}
                      secondary={`Time: ${a.timeTaken}s • ${new Date(a.attemptedAt).toLocaleDateString()}`}
                    />
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Chip label={`${a.score}/${a.total}`} color={a.score/a.total >= 0.8 ? 'success' : 'default'} />
                      <Chip label={`+${a.xpEarned} XP`} color="primary" variant="outlined" />
                    </Box>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography color="text.secondary">No quiz attempts yet</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}
