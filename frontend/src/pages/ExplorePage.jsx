import React, { useEffect, useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Container, Grid, Card, CardContent, Typography, Box, Chip, Button,
  CardActionArea, LinearProgress
} from '@mui/material'
import { PlayCircle, Article, CheckCircle } from '@mui/icons-material'
import { getCourses, getAllModules, getProfile } from '../api'
import { AuthContext } from '../context/AuthContext'

export default function ExplorePage() {
  const { userId } = useContext(AuthContext)
  const [courses, setCourses] = useState([])
  const [modules, setModules] = useState([])
  const [completedModules, setCompletedModules] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadData()

    // Auto-refresh when returning to page
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const loadData = async () => {
    try {
      const [coursesRes, modulesRes, profileRes] = await Promise.all([
        getCourses(),
        getAllModules(),
        getProfile(userId)
      ])
      setCourses(coursesRes.data.courses)
      setModules(modulesRes.data.modules)
      setCompletedModules(profileRes.data.completedModules || [])
      setLoading(false)
    } catch (err) {
      setLoading(false)
    }
  }

  if (loading) return <LinearProgress />

  const moduleColors = ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a']

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom fontWeight={600}>
          Explore Courses
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Choose a module to begin your learning journey
        </Typography>
      </Box>

      {courses.map(c => {
        const courseModules = modules.filter(m => m.courseId === c._id)
        
        return (
          <Box key={c._id} sx={{ mb: 4 }}>
            <Card elevation={2} sx={{ mb: 3, p: 2 }}>
              <Typography variant="h5" gutterBottom fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Article color="primary" /> {c.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                {c.description}
              </Typography>
              <Chip label={`${courseModules.length} Modules`} color="primary" variant="outlined" />
            </Card>

            <Grid container spacing={3}>
              {courseModules.map((module, idx) => {
                const isCompleted = completedModules.includes(module._id)
                return (
                  <Grid item xs={12} sm={6} md={4} key={module._id}>
                    <Card 
                      elevation={3}
                      sx={{ 
                        height: '100%',
                        background: isCompleted 
                          ? 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
                          : `linear-gradient(135deg, ${moduleColors[idx % moduleColors.length]} 0%, ${moduleColors[(idx + 1) % moduleColors.length]} 100%)`,
                        color: 'white',
                        transition: 'transform 0.2s',
                        '&:hover': { transform: 'translateY(-4px)' },
                        position: 'relative'
                      }}
                    >
                      {isCompleted && (
                        <CheckCircle 
                          sx={{ 
                            position: 'absolute', 
                            top: 10, 
                            right: 10, 
                            fontSize: 30,
                            bgcolor: 'rgba(255,255,255,0.3)',
                            borderRadius: '50%'
                          }} 
                        />
                      )}
                      <CardActionArea onClick={() => navigate(`/module/${module._id}`)} sx={{ height: '100%' }}>
                        <CardContent sx={{ height: 180, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <Typography variant="h6" gutterBottom fontWeight={600}>
                            Module {module.moduleNo}
                          </Typography>
                          <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
                            {module.title}
                          </Typography>
                          {isCompleted ? (
                            <Chip 
                              label="Completed" 
                              icon={<CheckCircle />}
                              sx={{ 
                                bgcolor: 'rgba(255,255,255,0.3)', 
                                color: 'white',
                                fontWeight: 600,
                                alignSelf: 'flex-start'
                              }}
                            />
                          ) : (
                            <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
                              Click to view content and take quiz
                            </Typography>
                          )}
                          <Button 
                            variant="contained" 
                            startIcon={isCompleted ? <CheckCircle /> : <PlayCircle />}
                            sx={{ 
                              bgcolor: 'rgba(255,255,255,0.2)', 
                              '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                              alignSelf: 'flex-start',
                              mt: 'auto'
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/module/${module._id}`)
                            }}
                          >
                            {isCompleted ? 'Review' : 'Start Learning'}
                          </Button>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                )
              })}
            </Grid>
          </Box>
        )
      })}
    </Container>
  )
}
