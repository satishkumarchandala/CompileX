import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Container, Paper, Typography, Box, Button, Divider, Card, CardContent, 
  LinearProgress, Alert, Tabs, Tab
} from '@mui/material'
import { Quiz, VideoLibrary, Description, PlayCircleOutline, OpenInNew } from '@mui/icons-material'
import { getModule } from '../api'

// Extract YouTube video ID from various URL formats
const extractYouTubeId = (url) => {
  if (!url) return null
  
  // Regular YouTube URLs: https://www.youtube.com/watch?v=VIDEO_ID
  const regExp1 = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/
  const match1 = url.match(regExp1)
  if (match1 && match1[7].length === 11) {
    return match1[7]
  }
  
  // Short URLs: https://youtu.be/VIDEO_ID
  const regExp2 = /^.*youtu.be\/([^#&?]*).*/
  const match2 = url.match(regExp2)
  if (match2 && match2[1]) {
    return match2[1]
  }
  
  // Embedded URLs: https://www.youtube.com/embed/VIDEO_ID
  const regExp3 = /^.*\/embed\/([^#&?]*).*/
  const match3 = url.match(regExp3)
  if (match3 && match3[1]) {
    return match3[1]
  }
  
  return null
}

export default function ModulePage() {
  const { id } = useParams()
  const [module, setModule] = useState(null)
  const [activeVideoIndex, setActiveVideoIndex] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    getModule(id).then(r => setModule(r.data))
  }, [id])

  if (!module) return <LinearProgress />

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
        <Typography variant="h3" gutterBottom fontWeight={600} color="primary">
          {module.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Module {module.moduleNo}
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Card elevation={0} sx={{ bgcolor: 'action.hover', mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Description color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" fontWeight={600}>
                Context & Notes
              </Typography>
            </Box>
            <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
              {module.context}
            </Typography>
          </CardContent>
        </Card>

        <Card elevation={0} sx={{ bgcolor: 'action.hover', mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <VideoLibrary color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" fontWeight={600}>
                Watch Videos
              </Typography>
            </Box>
            {module.videoLinks?.length > 0 ? (
              <Box>
                {/* Video Tabs */}
                {module.videoLinks.length > 1 && (
                  <Tabs 
                    value={activeVideoIndex} 
                    onChange={(e, newValue) => setActiveVideoIndex(newValue)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
                  >
                    {module.videoLinks.map((_, i) => (
                      <Tab 
                        key={i} 
                        label={`Video ${i + 1}`} 
                        icon={<PlayCircleOutline />}
                        iconPosition="start"
                      />
                    ))}
                  </Tabs>
                )}
                
                {/* Video Player */}
                {module.videoLinks.map((videoUrl, i) => {
                  const videoId = extractYouTubeId(videoUrl)
                  
                  return (
                    <Box 
                      key={i} 
                      sx={{ display: activeVideoIndex === i ? 'block' : 'none' }}
                    >
                      {videoId ? (
                        <Box sx={{ position: 'relative', paddingTop: '56.25%', bgcolor: 'black', borderRadius: 2, overflow: 'hidden' }}>
                          <iframe
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              border: 'none'
                            }}
                            src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                            title={`Video Lesson ${i + 1}`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </Box>
                      ) : (
                        <Alert 
                          severity="info" 
                          action={
                            <Button 
                              size="small" 
                              endIcon={<OpenInNew />}
                              href={videoUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open Link
                            </Button>
                          }
                        >
                          <Typography variant="body2">
                            Video Lesson {i + 1}: {videoUrl}
                          </Typography>
                        </Alert>
                      )}
                    </Box>
                  )
                })}
              </Box>
            ) : (
              <Alert severity="info">No video lessons available for this module</Alert>
            )}
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<Quiz />}
            onClick={() => navigate(`/module/${id}/quiz`)}
            sx={{ px: 6, py: 1.5 }}
          >
            Take Quiz
          </Button>
        </Box>
      </Paper>
    </Container>
  )
}
