import React, { useEffect, useState, useContext } from 'react'
import {
  Container, Typography, Box, Paper, LinearProgress, Grid, Card, CardContent,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Chip, Divider,
  List, ListItem, ListItemIcon, ListItemText, Avatar, IconButton, Tooltip
} from '@mui/material'
import {
  School, EmojiEvents, TrendingUp, Close, CheckCircle, Star, Lock,
  FlashOn, Speed, WorkspacePremium, MilitaryTech, Bolt
} from '@mui/icons-material'
import { AuthContext } from '../context/AuthContext'
import { getProfile, getProgress, getAllModules } from '../api'

// Level thresholds must match backend models.py
const LEVEL_THRESHOLDS = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200]
const MAX_LEVEL = LEVEL_THRESHOLDS.length

const BADGE_META = {
  'Perfect Score': { icon: <Star sx={{ color: '#f59e0b' }} />, color: '#fff8e1', border: '#f59e0b', desc: 'Score 100% on any quiz' },
  'Quick Learner': { icon: <Speed sx={{ color: '#3b82f6' }} />, color: '#eff6ff', border: '#3b82f6', desc: 'Answer every question in ≤ 10 s on average' },
  'Module Master': { icon: <WorkspacePremium sx={{ color: '#8b5cf6' }} />, color: '#f5f3ff', border: '#8b5cf6', desc: 'Score ≥ 80% on every attempted module' },
  'Contest Winner': { icon: <MilitaryTech sx={{ color: '#10b981' }} />, color: '#ecfdf5', border: '#10b981', desc: 'Win a timed contest' },
  'First Step': { icon: <FlashOn sx={{ color: '#f59e0b' }} />, color: '#fff8e1', border: '#f59e0b', desc: 'Complete your first module' },
  'Speed Demon': { icon: <Bolt sx={{ color: '#6366f1' }} />, color: '#eef2ff', border: '#6366f1', desc: 'Complete a quiz in under 60 seconds' },
}

const ALL_BADGES = ['Perfect Score', 'Quick Learner', 'Module Master', 'Contest Winner', 'First Step', 'Speed Demon']

function LevelDialog({ open, onClose, profile }) {
  if (!profile) return null
  const xp = profile.xp || 0
  const level = profile.level || 1
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? null
  const progressToNext = nextThreshold != null
    ? Math.min(100, ((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100)
    : 100

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrendingUp /> Level & XP Details
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'white' }}><Close /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {/* Current level hero */}
        <Box sx={{ textAlign: 'center', mb: 3, p: 3, background: 'linear-gradient(135deg,#667eea20,#764ba220)', borderRadius: 3 }}>
          <Avatar sx={{ width: 80, height: 80, bgcolor: '#667eea', fontSize: 32, fontWeight: 700, mx: 'auto', mb: 1 }}>
            {level}
          </Avatar>
          <Typography variant="h4" fontWeight={700} color="primary">Level {level}</Typography>
          <Typography variant="body1" color="text.secondary">{xp} XP earned total</Typography>
        </Box>

        {/* Progress to next level */}
        {nextThreshold != null ? (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Progress to Level {level + 1}</Typography>
              <Typography variant="body2" fontWeight={600} color="primary">
                {xp - currentThreshold} / {nextThreshold - currentThreshold} XP
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={progressToNext} sx={{ height: 10, borderRadius: 5, bgcolor: '#e5e7eb', '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg,#667eea,#764ba2)', borderRadius: 5 } }} />
            <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
              {nextThreshold - xp} more XP needed for Level {level + 1}
            </Typography>
          </Box>
        ) : (
          <Chip label="🏆 Max Level Reached!" color="secondary" sx={{ mb: 3, fontWeight: 700, fontSize: 14 }} />
        )}

        <Divider sx={{ mb: 2 }} />

        {/* All level thresholds */}
        <Typography variant="subtitle1" fontWeight={700} mb={2}>📈 Level Roadmap</Typography>
        <List dense disablePadding>
          {LEVEL_THRESHOLDS.map((thresh, idx) => {
            const lvl = idx + 1
            const reached = xp >= thresh
            const isCurrent = lvl === level
            return (
              <ListItem key={lvl} sx={{ mb: 1, borderRadius: 2, bgcolor: isCurrent ? '#667eea15' : 'transparent', border: isCurrent ? '1.5px solid #667eea' : '1.5px solid transparent' }}>
                <ListItemIcon>
                  <Avatar sx={{ width: 36, height: 36, bgcolor: reached ? '#667eea' : '#e5e7eb', fontSize: 14, fontWeight: 700 }}>
                    {lvl}
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={<Typography fontWeight={isCurrent ? 700 : 400} color={reached ? 'text.primary' : 'text.secondary'}>Level {lvl} {isCurrent ? ' ← You are here' : ''}</Typography>}
                  secondary={thresh === 0 ? 'Starting level' : `Requires ${thresh} XP`}
                />
                {reached ? <CheckCircle color="success" /> : <Lock sx={{ color: '#d1d5db' }} />}
              </ListItem>
            )
          })}
        </List>

        <Box sx={{ mt: 2, p: 2, bgcolor: '#f0fdf4', borderRadius: 2, border: '1px solid #bbf7d0' }}>
          <Typography variant="body2" color="success.dark">
            💡 <strong>How to earn XP:</strong> Complete a module quiz for the first time and score ≥ 70%. Each correct answer gives 5 XP.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="contained" sx={{ borderRadius: 2 }}>Got it</Button>
      </DialogActions>
    </Dialog>
  )
}

function BadgesDialog({ open, onClose, profile }) {
  if (!profile) return null
  const earned = profile.badges || []
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ background: 'linear-gradient(135deg,#f093fb,#f5576c)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmojiEvents /> Badges Collection
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'white' }}><Close /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Typography variant="body2" color="text.secondary" mb={3}>
          You have earned <strong>{earned.length}</strong> of <strong>{ALL_BADGES.length}</strong> badges.
        </Typography>

        <Grid container spacing={2}>
          {ALL_BADGES.map(badge => {
            const meta = BADGE_META[badge] || {}
            const isEarned = earned.includes(badge)
            return (
              <Grid item xs={12} sm={6} key={badge}>
                <Paper elevation={0} sx={{
                  p: 2.5, borderRadius: 3,
                  border: `2px solid ${isEarned ? meta.border : '#e5e7eb'}`,
                  bgcolor: isEarned ? meta.color : '#f9fafb',
                  opacity: isEarned ? 1 : 0.6,
                  transition: 'all 0.2s',
                  position: 'relative'
                }}>
                  {isEarned && (
                    <CheckCircle sx={{ position: 'absolute', top: 10, right: 10, fontSize: 18, color: meta.border }} />
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <Avatar sx={{ bgcolor: isEarned ? `${meta.border}20` : '#f3f4f6', width: 40, height: 40 }}>
                      {isEarned ? meta.icon : <Lock sx={{ color: '#9ca3af', fontSize: 20 }} />}
                    </Avatar>
                    <Typography fontWeight={700} color={isEarned ? 'text.primary' : 'text.disabled'}>
                      {badge}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">{meta.desc}</Typography>
                  <Box mt={1}>
                    <Chip label={isEarned ? '✅ Earned' : '🔒 Locked'} size="small"
                      color={isEarned ? 'success' : 'default'} variant={isEarned ? 'filled' : 'outlined'}
                    />
                  </Box>
                </Paper>
              </Grid>
            )
          })}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="contained" color="secondary" sx={{ borderRadius: 2 }}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}

function ModulesDialog({ open, onClose, profile, allModules }) {
  if (!profile) return null
  const completed = (profile.completedModules || []).map(String)

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ background: 'linear-gradient(135deg,#4facfe,#00f2fe)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <School /> Completed Modules
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'white' }}><Close /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {completed.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <School sx={{ fontSize: 60, color: '#d1d5db', mb: 2 }} />
            <Typography color="text.secondary">No modules completed yet.</Typography>
            <Typography variant="caption" color="text.secondary">Complete a quiz with ≥ 70% to mark a module as done.</Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ mb: 2, p: 2, bgcolor: '#f0fdf4', borderRadius: 2, border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle color="success" fontSize="small" />
              <Typography variant="body2" color="success.dark" fontWeight={600}>
                {completed.length} module{completed.length !== 1 ? 's' : ''} completed!
              </Typography>
            </Box>
            <List disablePadding>
              {allModules.map((mod, idx) => {
                const isDone = completed.includes(String(mod._id))
                return (
                  <ListItem key={mod._id} sx={{
                    mb: 1.5, borderRadius: 2,
                    border: `1.5px solid ${isDone ? '#10b981' : '#e5e7eb'}`,
                    bgcolor: isDone ? '#f0fdf4' : '#f9fafb',
                    px: 2
                  }}>
                    <ListItemIcon>
                      <Avatar sx={{ width: 36, height: 36, bgcolor: isDone ? '#10b981' : '#e5e7eb', fontSize: 13, fontWeight: 700 }}>
                        {mod.moduleNo || idx + 1}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={<Typography fontWeight={isDone ? 700 : 400} color={isDone ? 'text.primary' : 'text.disabled'}>{mod.title}</Typography>}
                      secondary={isDone ? '✅ Completed' : '🔒 Not completed yet'}
                    />
                    {isDone
                      ? <Chip label="Done" color="success" size="small" icon={<CheckCircle />} />
                      : <Chip label="Pending" color="default" size="small" variant="outlined" />
                    }
                  </ListItem>
                )
              })}
            </List>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="contained" sx={{ background: 'linear-gradient(135deg,#4facfe,#00f2fe)', borderRadius: 2 }}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}

export default function HomePage() {
  const { userId, user } = useContext(AuthContext)
  const [profile, setProfile] = useState(null)
  const [allModules, setAllModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(null) // 'level' | 'badges' | 'modules'

  useEffect(() => {
    if (userId && user?.role === 'student') {
      loadProfile()
    } else {
      setLoading(false)
    }
  }, [userId, user])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && userId && user?.role === 'student') loadProfile()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [userId, user])

  const loadProfile = () => {
    setLoading(true)
    Promise.all([
      getProfile(userId),
      getAllModules()
    ]).then(([profileRes, modulesRes]) => {
      setProfile(profileRes.data)
      setAllModules(modulesRes.data.modules || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  if (loading && user?.role === 'student') return <LinearProgress />

  return (
    <Container maxWidth="lg">
      {/* Hero Banner */}
      <Paper
        elevation={3}
        sx={{
          p: 6, mt: 4, mb: 4, textAlign: 'center',
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

      {/* Stats Cards — clickable */}
      {user?.role === 'student' && profile && (
        <>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, textAlign: 'center' }}>
            Tap any card to see details
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Level Card */}
            <Grid item xs={12} md={4}>
              <Tooltip title="Click to see your level progress" placement="top">
                <Card
                  elevation={3}
                  onClick={() => setOpenDialog('level')}
                  sx={{
                    height: '100%', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #667eea 30%, #764ba2 90%)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 12px 40px #667eea55' }
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', color: 'white', py: 4 }}>
                    <TrendingUp sx={{ fontSize: 50, mb: 1 }} />
                    <Typography variant="h3" fontWeight={700}>Level {profile.level}</Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>{profile.xp} XP Earned</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.75, mt: 1, display: 'block' }}>
                      Tap to see breakdown →
                    </Typography>
                  </CardContent>
                </Card>
              </Tooltip>
            </Grid>

            {/* Badges Card */}
            <Grid item xs={12} md={4}>
              <Tooltip title="Click to see your badges" placement="top">
                <Card
                  elevation={3}
                  onClick={() => setOpenDialog('badges')}
                  sx={{
                    height: '100%', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #f093fb 30%, #f5576c 90%)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 12px 40px #f093fb55' }
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', color: 'white', py: 4 }}>
                    <EmojiEvents sx={{ fontSize: 50, mb: 1 }} />
                    <Typography variant="h3" fontWeight={700}>{profile.badges?.length || 0}</Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>Badges Earned</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.75, mt: 1, display: 'block' }}>
                      Tap to see badges →
                    </Typography>
                  </CardContent>
                </Card>
              </Tooltip>
            </Grid>

            {/* Modules Done Card */}
            <Grid item xs={12} md={4}>
              <Tooltip title="Click to see completed modules" placement="top">
                <Card
                  elevation={3}
                  onClick={() => setOpenDialog('modules')}
                  sx={{
                    height: '100%', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #4facfe 30%, #00f2fe 90%)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 12px 40px #4facfe55' }
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', color: 'white', py: 4 }}>
                    <School sx={{ fontSize: 50, mb: 1 }} />
                    <Typography variant="h3" fontWeight={700}>{profile.completedModules?.length || 0}</Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>Modules Completed</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.75, mt: 1, display: 'block' }}>
                      Tap to see modules →
                    </Typography>
                  </CardContent>
                </Card>
              </Tooltip>
            </Grid>
          </Grid>
        </>
      )}

      {/* Dialogs */}
      <LevelDialog open={openDialog === 'level'} onClose={() => setOpenDialog(null)} profile={profile} />
      <BadgesDialog open={openDialog === 'badges'} onClose={() => setOpenDialog(null)} profile={profile} />
      <ModulesDialog open={openDialog === 'modules'} onClose={() => setOpenDialog(null)} profile={profile} allModules={allModules} />

      {/* About Section */}
      <Paper elevation={2} sx={{ p: 5, mt: 2 }}>
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
              🏆 <strong>XP Points & Levels</strong> - Earn experience points with every first module completion and level up as you progress
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
