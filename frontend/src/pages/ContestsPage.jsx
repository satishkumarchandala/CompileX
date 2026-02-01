import React, { useEffect, useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Container, Grid, Card, CardContent, Typography, Box, Chip, Button,
  Paper, Divider, LinearProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Alert, Snackbar
} from '@mui/material'
import { EmojiEvents, Timer, TrendingUp, CheckCircle, PlayArrow } from '@mui/icons-material'
import { getContests, joinContest, getLeaderboard } from '../api'
import { AuthContext } from '../context/AuthContext'

export default function ContestsPage() {
  const { userId } = useContext(AuthContext)
  const navigate = useNavigate()
  const [contests, setContests] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedContest, setSelectedContest] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [openLeaderboard, setOpenLeaderboard] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  const loadContests = () => {
    getContests().then(r => {
      setContests(r.data.contests)
      setLoading(false)
    })
  }

  useEffect(() => {
    loadContests()

    // Auto-refresh when returning to page
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadContests()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const handleJoinContest = async (contest) => {
    try {
      await joinContest(contest._id, { studentId: userId })
      // Navigate to contest quiz page
      navigate(`/contest/${contest._id}/quiz`)
    } catch (err) {
      setSnackbar({ 
        open: true, 
        message: err.response?.data?.error || 'Failed to join contest', 
        severity: 'error' 
      })
    }
  }

  const handleViewLeaderboard = async (contest) => {
    try {
      setSelectedContest(contest)
      const res = await getLeaderboard(contest._id)
      setLeaderboard(res.data.leaderboard)
      setOpenLeaderboard(true)
    } catch (err) {
      setSnackbar({ 
        open: true, 
        message: 'Failed to load leaderboard', 
        severity: 'error' 
      })
    }
  }

  const handleCloseLeaderboard = () => {
    setOpenLeaderboard(false)
    setSelectedContest(null)
    setLeaderboard([])
  }

  if (loading) return <LinearProgress />

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <EmojiEvents color="primary" sx={{ fontSize: 40 }} />
          Contests
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Compete with others and climb the leaderboard!
        </Typography>
      </Box>

      {contests.length === 0 ? (
        <Paper elevation={2} sx={{ p: 6, textAlign: 'center' }}>
          <EmojiEvents sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h5" color="text.secondary">
            No contests available yet
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            Check back later for upcoming competitions!
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {contests.map(c => (
            <Grid item xs={12} md={6} key={c._id}>
              <Card 
                elevation={3}
                sx={{ 
                  height: '100%',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-4px)' }
                }}
              >
                <CardContent>
                  <Typography variant="h5" gutterBottom fontWeight={600} color="primary">
                    {c.title}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    <Chip 
                      icon={<Timer />} 
                      label={`${c.durationMinutes} minutes`} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                    {c.negativeMarking > 0 && (
                      <Chip 
                        label={`-${c.negativeMarking} per wrong`} 
                        size="small" 
                        color="error" 
                        variant="outlined"
                      />
                    )}
                  </Box>

                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Test your knowledge and compete for the top spot on the leaderboard!
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
                    <Button 
                      variant="contained" 
                      fullWidth
                      startIcon={<EmojiEvents />}
                      onClick={() => handleJoinContest(c)}
                    >
                      Join Contest
                    </Button>
                    <Button 
                      variant="outlined" 
                      startIcon={<TrendingUp />}
                      onClick={() => handleViewLeaderboard(c)}
                    >
                      Leaderboard
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Leaderboard Dialog */}
      <Dialog open={openLeaderboard} onClose={handleCloseLeaderboard} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUp color="primary" />
            {selectedContest?.title} - Leaderboard
          </Box>
        </DialogTitle>
        <DialogContent>
          {leaderboard.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                No participants yet. Be the first to join!
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Rank</strong></TableCell>
                    <TableCell><strong>Student ID</strong></TableCell>
                    <TableCell align="right"><strong>Score</strong></TableCell>
                    <TableCell align="right"><strong>Time (s)</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leaderboard.map((entry, idx) => (
                    <TableRow 
                      key={entry._id}
                      sx={{ 
                        bgcolor: idx === 0 ? 'gold' : idx === 1 ? 'silver' : idx === 2 ? '#cd7f32' : 'inherit',
                        '& td': { 
                          color: idx < 3 ? 'white' : 'inherit',
                          fontWeight: idx < 3 ? 600 : 400
                        }
                      }}
                    >
                      <TableCell>
                        {idx === 0 && '🥇 '}
                        {idx === 1 && '🥈 '}
                        {idx === 2 && '🥉 '}
                        #{idx + 1}
                      </TableCell>
                      <TableCell>{entry.studentId.substring(0, 8)}...</TableCell>
                      <TableCell align="right">{entry.score || 0}</TableCell>
                      <TableCell align="right">{entry.timeTaken || 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseLeaderboard}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  )
}
