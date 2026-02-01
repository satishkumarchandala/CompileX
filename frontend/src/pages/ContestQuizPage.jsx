import React, { useEffect, useState, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Container, Paper, Typography, Box, Button, RadioGroup, FormControlLabel,
  Radio, Card, CardContent, Divider, LinearProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, Chip, Alert
} from '@mui/material'
import { Timer, CheckCircle, Cancel, EmojiEvents } from '@mui/icons-material'
import { getContestQuestions, submitContest } from '../api'
import { AuthContext } from '../context/AuthContext'

export default function ContestQuizPage() {
  const { id } = useParams()
  const { userId } = useContext(AuthContext)
  const [contest, setContest] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [start, setStart] = useState(Date.now())
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState(null)
  const [timeLeft, setTimeLeft] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    getContestQuestions(id).then(r => {
      setContest(r.data.contest)
      setQuestions(r.data.questions)
      setTimeLeft(r.data.contest.durationMinutes * 60) // Convert to seconds
      setLoading(false)
    })
  }, [id])

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          handleSubmit() // Auto-submit when time runs out
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  function handleChange(qid, val) {
    setAnswers({ ...answers, [qid]: parseInt(val) })
  }

  async function handleSubmit(e) {
    if (e) e.preventDefault()
    
    const timeTaken = Math.floor((Date.now() - start) / 1000)
    
    // Calculate score
    let correctCount = 0
    questions.forEach(q => {
      if (answers[q._id] === q.correctAnswer) {
        correctCount++
      }
    })

    const res = await submitContest(id, { 
      studentId: userId, 
      score: correctCount * (contest.marksPerQuestion || 1),
      timeTaken,
      negativeMarking: contest.negativeMarking || 0,
      totalQuestions: questions.length
    })
    
    setResult({
      score: correctCount,
      total: questions.length,
      timeTaken,
      status: res.data.status
    })
  }

  if (loading) return <LinearProgress />

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <EmojiEvents color="primary" sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h4" fontWeight={600}>
                {contest?.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {questions.length} Questions • {contest?.durationMinutes} minutes
              </Typography>
            </Box>
          </Box>
          <Chip 
            icon={<Timer />} 
            label={formatTime(timeLeft)} 
            color={timeLeft < 60 ? 'error' : 'primary'}
            sx={{ fontSize: 18, py: 3, px: 2 }}
          />
        </Box>
        
        {contest?.negativeMarking > 0 && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Negative marking: -{contest.negativeMarking} marks per wrong answer
          </Alert>
        )}

        <Divider sx={{ mb: 3 }} />

        <form onSubmit={handleSubmit}>
          {questions.map((q, idx) => (
            <Card key={q._id} elevation={2} sx={{ mb: 3, bgcolor: 'action.hover' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Q{idx + 1}. {q.question}
                </Typography>
                <RadioGroup
                  value={answers[q._id] ?? ''}
                  onChange={(e) => handleChange(q._id, e.target.value)}
                >
                  {q.options.map((opt, i) => (
                    <FormControlLabel
                      key={i}
                      value={i}
                      control={<Radio />}
                      label={opt}
                      sx={{ 
                        bgcolor: 'background.paper', 
                        mx: 0, 
                        mb: 1, 
                        px: 2, 
                        borderRadius: 1,
                        '&:hover': { bgcolor: 'action.hover' }
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
              Submit Contest
            </Button>
          </Box>
        </form>
      </Paper>

      <Dialog open={!!result} onClose={() => navigate('/contests')}>
        <DialogTitle sx={{ textAlign: 'center' }}>
          {result && result.score / result.total >= 0.7 ? (
            <CheckCircle color="success" sx={{ fontSize: 60, mb: 1 }} />
          ) : (
            <EmojiEvents color="primary" sx={{ fontSize: 60, mb: 1 }} />
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom fontWeight={600}>
              Contest Completed!
            </Typography>
            <Typography variant="h2" color="primary" fontWeight={700} gutterBottom>
              {result?.score} / {result?.total}
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={2}>
              Score: {result && Math.round(result.score / result.total * 100)}%
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Time Taken: {result && formatTime(result.timeTaken)}
            </Typography>
            <Chip label="Submitted to Leaderboard" color="success" size="large" icon={<EmojiEvents />} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button onClick={() => navigate('/contests')} variant="contained">
            View Leaderboard
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
