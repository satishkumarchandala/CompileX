import React, { useEffect, useState, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Container, Paper, Typography, Box, Button, RadioGroup, FormControlLabel,
  Radio, Card, CardContent, Divider, LinearProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, Chip
} from '@mui/material'
import { Timer, CheckCircle, Cancel } from '@mui/icons-material'
import { getQuestions, submitQuiz } from '../api'
import { AuthContext } from '../context/AuthContext'

export default function QuizPage() {
  const { id } = useParams()
  const { userId } = useContext(AuthContext)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [start, setStart] = useState(Date.now())
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    getQuestions(id).then(r => {
      setQuestions(r.data.questions)
      setLoading(false)
    })
  }, [id])

  function handleChange(qid, val) {
    setAnswers({ ...answers, [qid]: parseInt(val) })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const timeTaken = Math.floor((Date.now() - start) / 1000)
    const ans = Object.entries(answers).map(([questionId, selected]) => ({ questionId, selected }))
    const res = await submitQuiz(id, { studentId: userId, answers: ans, timeTaken })
    setResult(res.data)
  }

  if (loading) return <LinearProgress />

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" fontWeight={600}>
            Quiz - Module {id}
          </Typography>
          <Chip icon={<Timer />} label={`${questions.length} Questions`} color="primary" />
        </Box>
        <Divider sx={{ mb: 4 }} />

        <form onSubmit={handleSubmit}>
          {questions.map((q, i) => (
            <Card key={q._id} elevation={1} sx={{ mb: 3, bgcolor: 'action.hover' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  {i + 1}. {q.question}
                </Typography>
                <RadioGroup
                  value={answers[q._id] ?? ''}
                  onChange={e => handleChange(q._id, e.target.value)}
                >
                  {q.options.map((opt, idx) => (
                    <FormControlLabel
                      key={idx}
                      value={idx}
                      control={<Radio />}
                      label={opt}
                      sx={{ 
                        bgcolor: 'background.paper',
                        m: 0.5,
                        px: 2,
                        py: 1,
                        borderRadius: 1,
                        '&:hover': { bgcolor: 'action.selected' }
                      }}
                    />
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          ))}

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={Object.keys(answers).length < questions.length}
              sx={{ px: 6, py: 1.5 }}
            >
              Submit Quiz
            </Button>
          </Box>
        </form>
      </Paper>

      <Dialog open={!!result} onClose={() => navigate('/profile')}>
        <DialogTitle sx={{ textAlign: 'center' }}>
          {result && result.score / result.total >= 0.7 ? (
            <CheckCircle color="success" sx={{ fontSize: 60, mb: 1 }} />
          ) : (
            <Cancel color="error" sx={{ fontSize: 60, mb: 1 }} />
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom fontWeight={600}>
              {result && result.score / result.total >= 0.7 ? 'Great Job!' : 'Keep Practicing!'}
            </Typography>
            <Typography variant="h2" color="primary" fontWeight={700} gutterBottom>
              {result?.score} / {result?.total}
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={2}>
              Score: {result && Math.round(result.score / result.total * 100)}%
            </Typography>
            <Chip label={`+${result?.xpEarned} XP`} color="secondary" size="large" />
            {result?.newLevel && (
              <Typography variant="h6" color="primary" fontWeight={600} mt={2}>
                🎉 Level Up! You are now Level {result.newLevel}!
              </Typography>
            )}
            {result?.badgesEarned?.length > 0 && (
              <Box mt={2}>
                <Typography variant="body2" color="text.secondary">New Badges:</Typography>
                {result.badgesEarned.map((badge, i) => (
                  <Chip key={i} label={badge} color="secondary" sx={{ m: 0.5 }} />
                ))}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button onClick={() => navigate('/profile')} variant="contained">
            View Profile
          </Button>
          <Button onClick={() => navigate('/explore')} variant="outlined">
            Continue Learning
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
