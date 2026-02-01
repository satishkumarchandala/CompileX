import React, { useState, useEffect } from 'react'
import { 
  Container, Grid, Card, CardContent, CardActionArea, Typography, Box, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Select, MenuItem, FormControl, InputLabel, Alert, Snackbar, IconButton,
  List, ListItem, ListItemText, ListItemSecondaryAction, Chip, Divider
} from '@mui/material'
import { 
  Dashboard as DashboardIcon, LibraryBooks, Quiz, EmojiEvents, CloudUpload, 
  People, Close, Edit, Delete, Visibility, School, QuestionAnswer, 
  EmojiPeople, TrendingUp, Assessment, Speed
} from '@mui/icons-material'
import { getAdminStats, createModule, updateModule, deleteModule, createQuestion, uploadPDF, generateModuleFromPDF, createContest, updateContest, deleteContest, getCourses, getAllModules } from '../api'

export default function AdminDashboard() {
  const [openDialog, setOpenDialog] = useState('')
  const [courses, setCourses] = useState([])
  const [allModules, setAllModules] = useState([])
  const [allContests, setAllContests] = useState([])
  const [editingModule, setEditingModule] = useState(null)
  const [editingContest, setEditingContest] = useState(null)
  const [stats, setStats] = useState(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })
  
  // Module form state
  const [moduleForm, setModuleForm] = useState({
    courseId: '',
    moduleNo: '',
    title: '',
    context: '',
    videoLinks: ''
  })

  // Question form state
  const [questionForm, setQuestionForm] = useState({
    moduleId: '',
    question: '',
    option1: '',
    option2: '',
    option3: '',
    option4: '',
    correctAnswer: 0,
    difficulty: 'easy'
  })

  // Contest form state
  const [contestForm, setContestForm] = useState({
    title: '',
    moduleIds: [],
    startTime: '',
    endTime: '',
    durationMinutes: 30,
    marksPerQuestion: 1,
    negativeMarking: 0
  })

  // PDF upload state
  const [pdfFile, setPdfFile] = useState(null)
  const [pdfResult, setPdfResult] = useState(null)
  const [pdfModuleForm, setPdfModuleForm] = useState({
    courseId: '',
    moduleTitle: '',
    numQuestions: 10
  })
  const [generatingModule, setGeneratingModule] = useState(false)

  useEffect(() => {
    loadCourses()
  }, [])

  const loadCourses = async () => {
    try {
      const coursesRes = await getCourses()
      setCourses(coursesRes.data.courses)
      
      // Load all modules directly
      const modulesRes = await getAllModules()
      setAllModules(modulesRes.data.modules)
      
      // Load all contests
      const { getContests } = await import('../api')
      const contestsRes = await getContests()
      setAllContests(contestsRes.data.contests)
      
      // Load admin stats
      const statsRes = await getAdminStats()
      setStats(statsRes.data)
    } catch (err) {
      console.error('Failed to load data', err)
      showSnackbar('Failed to load courses and modules', 'error')
    }
  }

  const handleCloseDialog = () => {
    setOpenDialog('')
    setEditingModule(null)
    setEditingContest(null)
    setModuleForm({ courseId: '', moduleNo: '', title: '', context: '', videoLinks: '' })
    setQuestionForm({ moduleId: '', question: '', option1: '', option2: '', option3: '', option4: '', correctAnswer: 0, difficulty: 'easy' })
    setContestForm({ title: '', moduleIds: [], startTime: '', endTime: '', durationMinutes: 30, marksPerQuestion: 1, negativeMarking: 0 })
    setPdfFile(null)
    setPdfResult(null)
    setPdfModuleForm({ courseId: '', moduleTitle: '', numQuestions: 10 })
    setGeneratingModule(false)
  }

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity })
  }

  const handleCreateModule = async () => {
    try {
      const videoLinks = moduleForm.videoLinks.split('\n').filter(v => v.trim())
      await createModule({
        courseId: moduleForm.courseId,
        moduleNo: parseInt(moduleForm.moduleNo),
        title: moduleForm.title,
        context: moduleForm.context,
        videoLinks
      })
      showSnackbar('Module created successfully!')
      handleCloseDialog()
      await loadCourses() // Reload to update stats
    } catch (err) {
      showSnackbar(err.response?.data?.error || 'Failed to create module', 'error')
    }
  }

  const handleEditModule = (module) => {
    setEditingModule(module)
    setModuleForm({
      courseId: module.courseId,
      moduleNo: module.moduleNo,
      title: module.title,
      context: module.context,
      videoLinks: (module.videoLinks || []).join('\n')
    })
    setOpenDialog('editModule')
  }

  const handleUpdateModule = async () => {
    try {
      const videoLinks = moduleForm.videoLinks.split('\n').filter(v => v.trim())
      await updateModule(editingModule._id, {
        courseId: moduleForm.courseId,
        moduleNo: parseInt(moduleForm.moduleNo),
        title: moduleForm.title,
        context: moduleForm.context,
        videoLinks
      })
      showSnackbar('Module updated successfully!')
      handleCloseDialog()
      loadCourses()
    } catch (err) {
      showSnackbar(err.response?.data?.error || 'Failed to update module', 'error')
    }
  }

  const handleDeleteModule = async (moduleId) => {
    if (!window.confirm('Are you sure you want to delete this module?')) return
    try {
      await deleteModule(moduleId)
      showSnackbar('Module deleted successfully!')
      loadCourses()
    } catch (err) {
      showSnackbar(err.response?.data?.error || 'Failed to delete module', 'error')
    }
  }

  const handleCreateQuestion = async () => {
    try {
      await createQuestion({
        moduleId: questionForm.moduleId,
        question: questionForm.question,
        options: [questionForm.option1, questionForm.option2, questionForm.option3, questionForm.option4],
        correctAnswer: parseInt(questionForm.correctAnswer),
        difficulty: questionForm.difficulty
      })
      showSnackbar('Question created successfully!')
      handleCloseDialog()
      await loadCourses() // Reload to update stats
    } catch (err) {
      showSnackbar(err.response?.data?.error || 'Failed to create question', 'error')
    }
  }

  const handleUploadPDF = async () => {
    if (!pdfFile) return
    try {
      const formData = new FormData()
      formData.append('file', pdfFile)
      const res = await uploadPDF(formData)
      setPdfResult(res.data)
      showSnackbar('PDF processed successfully!')
    } catch (err) {
      showSnackbar(err.response?.data?.error || 'Failed to upload PDF', 'error')
    }
  }

  const handleGenerateModuleFromPDF = async () => {
    if (!pdfFile || !pdfModuleForm.courseId || !pdfModuleForm.moduleTitle) {
      showSnackbar('Please select PDF, course, and provide module title', 'error')
      return
    }
    
    setGeneratingModule(true)
    try {
      const formData = new FormData()
      formData.append('file', pdfFile)
      formData.append('courseId', pdfModuleForm.courseId)
      formData.append('moduleTitle', pdfModuleForm.moduleTitle)
      formData.append('numQuestions', pdfModuleForm.numQuestions)
      
      const res = await generateModuleFromPDF(formData)
      showSnackbar(res.data.message || 'Module and questions generated successfully!', 'success')
      handleCloseDialog()
      await loadCourses() // Reload to show new module
    } catch (err) {
      showSnackbar(err.response?.data?.error || 'Failed to generate module from PDF', 'error')
    } finally {
      setGeneratingModule(false)
    }
  }

  const handleCreateContest = async () => {
    try {
      await createContest(contestForm)
      showSnackbar('Contest created successfully!')
      handleCloseDialog()
      await loadCourses() // Reload to update stats
    } catch (err) {
      showSnackbar(err.response?.data?.error || 'Failed to create contest', 'error')
    }
  }

  const handleEditContest = (contest) => {
    setEditingContest(contest)
    setContestForm({
      title: contest.title,
      moduleIds: contest.moduleIds || [],
      startTime: contest.startTime || '',
      endTime: contest.endTime || '',
      durationMinutes: contest.durationMinutes || 30,
      marksPerQuestion: contest.marksPerQuestion || 1,
      negativeMarking: contest.negativeMarking || 0
    })
    setOpenDialog('editContest')
  }

  const handleUpdateContest = async () => {
    try {
      await updateContest(editingContest._id, contestForm)
      showSnackbar('Contest updated successfully!')
      handleCloseDialog()
      await loadCourses()
    } catch (err) {
      showSnackbar(err.response?.data?.error || 'Failed to update contest', 'error')
    }
  }

  const handleDeleteContest = async (contestId) => {
    if (!window.confirm('Are you sure you want to delete this contest? This will also delete all leaderboard entries.')) return
    try {
      await deleteContest(contestId)
      showSnackbar('Contest deleted successfully!')
      await loadCourses()
    } catch (err) {
      showSnackbar(err.response?.data?.error || 'Failed to delete contest', 'error')
    }
  }

  const actions = [
    { title: 'Create Module', icon: <LibraryBooks />, color: '#667eea', desc: 'Add new learning modules', key: 'module' },
    { title: 'Manage Modules', icon: <Visibility />, color: '#fa709a', desc: 'View and edit modules', key: 'manageModules' },
    { title: 'Create Question', icon: <Quiz />, color: '#f093fb', desc: 'Add quiz questions manually', key: 'question' },
    { title: 'Generate from PDF', icon: <CloudUpload />, color: '#4facfe', desc: 'Auto-create module from PDF', key: 'pdfGenerate' },
    { title: 'Preview PDF Questions', icon: <Quiz />, color: '#fa8231', desc: 'Preview questions from PDF', key: 'pdf' },
    { title: 'Create Contest', icon: <EmojiEvents />, color: '#43e97b', desc: 'Set up new contests', key: 'contest' },
    { title: 'Manage Contests', icon: <EmojiEvents />, color: '#ff6b6b', desc: 'View and edit contests', key: 'manageContests' },
  ]

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header Section with Gradient */}
      <Paper
        elevation={0}
        sx={{
          mb: 4,
          p: 4,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: 3
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                borderRadius: 2,
                p: 1.5,
                display: 'flex'
              }}
            >
              <DashboardIcon sx={{ fontSize: 40 }} />
            </Box>
            <Box>
              <Typography variant="h3" fontWeight={700} gutterBottom sx={{ mb: 0.5 }}>
                Admin Dashboard
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.95 }}>
                Manage and monitor your learning platform
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Stats Overview Section */}
      <Typography variant="h5" fontWeight={600} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Assessment color="primary" />
        Platform Overview
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              height: '100%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              transition: 'all 0.3s',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Total Modules
                  </Typography>
                  <Typography variant="h3" fontWeight={700}>
                    {stats?.totalModules || 0}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    borderRadius: 2,
                    p: 1.5,
                    display: 'flex'
                  }}
                >
                  <LibraryBooks sx={{ fontSize: 35 }} />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 2 }}>
                <TrendingUp fontSize="small" />
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Active content units
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              height: '100%',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              transition: 'all 0.3s',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Total Questions
                  </Typography>
                  <Typography variant="h3" fontWeight={700}>
                    {stats?.totalQuestions || 0}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    borderRadius: 2,
                    p: 1.5,
                    display: 'flex'
                  }}
                >
                  <QuestionAnswer sx={{ fontSize: 35 }} />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 2 }}>
                <Speed fontSize="small" />
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Assessment items
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              height: '100%',
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              transition: 'all 0.3s',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Total Contests
                  </Typography>
                  <Typography variant="h3" fontWeight={700}>
                    {stats?.totalContests || 0}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    borderRadius: 2,
                    p: 1.5,
                    display: 'flex'
                  }}
                >
                  <EmojiEvents sx={{ fontSize: 35 }} />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 2 }}>
                <EmojiEvents fontSize="small" />
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Competitive events
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              height: '100%',
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              color: 'white',
              transition: 'all 0.3s',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Total Users
                  </Typography>
                  <Typography variant="h3" fontWeight={700}>
                    {stats?.totalUsers || 0}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    borderRadius: 2,
                    p: 1.5,
                    display: 'flex'
                  }}
                >
                  <EmojiPeople sx={{ fontSize: 35 }} />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                <School fontSize="small" />
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  {stats?.studentCount || 0} students • {stats?.adminCount || 0} admins
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions Section */}
      <Typography variant="h5" fontWeight={600} sx={{ mb: 3, mt: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Speed color="primary" />
        Quick Actions
      </Typography>

      <Grid container spacing={3}>
        {actions.map((action, idx) => (
          <Grid item xs={12} sm={6} md={4} key={idx}>
            <Card 
              elevation={0}
              sx={{ 
                height: '100%',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                transition: 'all 0.3s',
                cursor: 'pointer',
                '&:hover': { 
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                  borderColor: action.color,
                  '& .action-icon': {
                    background: `linear-gradient(135deg, ${action.color} 0%, ${action.color}dd 100%)`,
                    color: 'white',
                    transform: 'scale(1.1)'
                  }
                }
              }}
              onClick={() => setOpenDialog(action.key)}
            >
              <CardContent sx={{ p: 3 }}>
                <Box
                  className="action-icon"
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'action.hover',
                    color: action.color,
                    mb: 2,
                    transition: 'all 0.3s'
                  }}
                >
                  <Box sx={{ fontSize: 30, display: 'flex' }}>
                    {action.icon}
                  </Box>
                </Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {action.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {action.desc}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Create Module Dialog */}
      <Dialog open={openDialog === 'module' || openDialog === 'editModule'} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingModule ? 'Edit Module' : 'Create New Module'}
          <IconButton onClick={handleCloseDialog} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Course</InputLabel>
            <Select value={moduleForm.courseId} onChange={e => setModuleForm({...moduleForm, courseId: e.target.value})} label="Course">
              {courses.map(c => <MenuItem key={c._id} value={c._id}>{c.title}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Module Number"
            type="number"
            value={moduleForm.moduleNo}
            onChange={e => setModuleForm({...moduleForm, moduleNo: e.target.value})}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Module Title"
            value={moduleForm.title}
            onChange={e => setModuleForm({...moduleForm, title: e.target.value})}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Context/Notes"
            multiline
            rows={4}
            value={moduleForm.context}
            onChange={e => setModuleForm({...moduleForm, context: e.target.value})}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Video Links (one per line)"
            multiline
            rows={3}
            value={moduleForm.videoLinks}
            onChange={e => setModuleForm({...moduleForm, videoLinks: e.target.value})}
            margin="normal"
            placeholder="https://www.youtube.com/watch?v=VIDEO_ID&#10;https://youtu.be/VIDEO_ID"
            helperText="Add YouTube URLs - students will see embedded videos in the module"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={editingModule ? handleUpdateModule : handleCreateModule} variant="contained">
            {editingModule ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manage Modules Dialog */}
      <Dialog open={openDialog === 'manageModules'} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Manage Modules
          <IconButton onClick={handleCloseDialog} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {allModules.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
              No modules found. Create a new module to get started.
            </Typography>
          ) : (
            <List>
              {allModules.map((module, idx) => (
                <Box key={module._id}>
                  <ListItem
                    sx={{
                      bgcolor: 'action.hover',
                      borderRadius: 1,
                      mb: 1,
                      '&:hover': { bgcolor: 'action.selected' }
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip label={`Module ${module.moduleNo}`} size="small" color="primary" />
                          <Typography variant="subtitle1" fontWeight={600}>
                            {module.title}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {module.context?.substring(0, 100)}...
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {module.videoLinks?.length || 0} video(s)
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton 
                        edge="end" 
                        onClick={() => handleEditModule(module)}
                        sx={{ mr: 1 }}
                        color="primary"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton 
                        edge="end" 
                        onClick={() => handleDeleteModule(module._id)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {idx < allModules.length - 1 && <Divider sx={{ my: 1 }} />}
                </Box>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Create Question Dialog */}
      <Dialog open={openDialog === 'question'} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Create New Question
          <IconButton onClick={handleCloseDialog} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Module</InputLabel>
            <Select 
              value={questionForm.moduleId} 
              onChange={e => setQuestionForm({...questionForm, moduleId: e.target.value})} 
              label="Module"
            >
              {allModules.map(m => (
                <MenuItem key={m._id} value={m._id}>
                  Module {m.moduleNo}: {m.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Question"
            multiline
            rows={2}
            value={questionForm.question}
            onChange={e => setQuestionForm({...questionForm, question: e.target.value})}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Option 1"
            value={questionForm.option1}
            onChange={e => setQuestionForm({...questionForm, option1: e.target.value})}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Option 2"
            value={questionForm.option2}
            onChange={e => setQuestionForm({...questionForm, option2: e.target.value})}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Option 3"
            value={questionForm.option3}
            onChange={e => setQuestionForm({...questionForm, option3: e.target.value})}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Option 4"
            value={questionForm.option4}
            onChange={e => setQuestionForm({...questionForm, option4: e.target.value})}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Correct Answer</InputLabel>
            <Select value={questionForm.correctAnswer} onChange={e => setQuestionForm({...questionForm, correctAnswer: e.target.value})} label="Correct Answer">
              <MenuItem value={0}>Option 1</MenuItem>
              <MenuItem value={1}>Option 2</MenuItem>
              <MenuItem value={2}>Option 3</MenuItem>
              <MenuItem value={3}>Option 4</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Difficulty</InputLabel>
            <Select value={questionForm.difficulty} onChange={e => setQuestionForm({...questionForm, difficulty: e.target.value})} label="Difficulty">
              <MenuItem value="easy">Easy</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="hard">Hard</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleCreateQuestion} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Upload PDF Dialog */}
      <Dialog open={openDialog === 'pdf'} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Preview PDF Questions
          <IconButton onClick={handleCloseDialog} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            This preview mode only shows generated questions. Use "Generate from PDF" to create a complete module.
          </Alert>
          <Box sx={{ mt: 2 }}>
            <Button variant="contained" component="label" startIcon={<CloudUpload />}>
              Choose PDF File
              <input type="file" accept=".pdf" hidden onChange={e => setPdfFile(e.target.files[0])} />
            </Button>
            {pdfFile && <Typography sx={{ mt: 1 }}>Selected: {pdfFile.name}</Typography>}
          </Box>
          {pdfResult && (
            <Box sx={{ mt: 3 }}>
              <Alert severity="success" sx={{ mb: 2 }}>Generated {pdfResult.generatedQuestions?.length || 0} questions</Alert>
              <Typography variant="subtitle2" gutterBottom>Extracted Text Preview:</Typography>
              <Paper sx={{ p: 2, bgcolor: 'action.hover', maxHeight: 200, overflow: 'auto' }}>
                <Typography variant="body2">{pdfResult.extractedText}</Typography>
              </Paper>
              <Typography variant="subtitle2" sx={{ mt: 2 }} gutterBottom>Generated Questions:</Typography>
              {pdfResult.generatedQuestions?.map((q, i) => (
                <Paper key={i} sx={{ p: 2, mt: 1, bgcolor: 'action.hover' }}>
                  <Typography variant="body2" fontWeight={600}>{i + 1}. {q.question}</Typography>
                  <Box sx={{ pl: 2, mt: 1 }}>
                    {q.options.map((opt, idx) => (
                      <Typography key={idx} variant="body2" color={idx === q.correctAnswer ? 'success.main' : 'text.secondary'}>
                        {idx === q.correctAnswer ? '✓ ' : ''}{opt}
                      </Typography>
                    ))}
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
          <Button onClick={handleUploadPDF} variant="contained" disabled={!pdfFile}>Preview Questions</Button>
        </DialogActions>
      </Dialog>

      {/* Generate Module from PDF Dialog */}
      <Dialog open={openDialog === 'pdfGenerate'} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Generate Module from PDF
          <IconButton onClick={handleCloseDialog} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Upload a PDF to automatically create a new module with questions
          </Alert>
          <FormControl fullWidth margin="normal">
            <InputLabel>Select Course</InputLabel>
            <Select
              value={pdfModuleForm.courseId}
              onChange={e => setPdfModuleForm({...pdfModuleForm, courseId: e.target.value})}
              label="Select Course"
            >
              {courses.map(c => (
                <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Module Title"
            value={pdfModuleForm.moduleTitle}
            onChange={e => setPdfModuleForm({...pdfModuleForm, moduleTitle: e.target.value})}
            margin="normal"
            placeholder="e.g., Introduction to Data Structures"
          />
          <TextField
            fullWidth
            label="Number of Questions"
            type="number"
            value={pdfModuleForm.numQuestions}
            onChange={e => setPdfModuleForm({...pdfModuleForm, numQuestions: parseInt(e.target.value) || 10})}
            margin="normal"
            inputProps={{ min: 5, max: 50 }}
          />
          <Box sx={{ mt: 2 }}>
            <Button variant="contained" component="label" startIcon={<CloudUpload />} fullWidth>
              Choose PDF File
              <input type="file" accept=".pdf" hidden onChange={e => setPdfFile(e.target.files[0])} />
            </Button>
            {pdfFile && (
              <Alert severity="success" sx={{ mt: 1 }}>
                Selected: {pdfFile.name}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={generatingModule}>Cancel</Button>
          <Button 
            onClick={handleGenerateModuleFromPDF} 
            variant="contained" 
            disabled={!pdfFile || !pdfModuleForm.courseId || !pdfModuleForm.moduleTitle || generatingModule}
          >
            {generatingModule ? 'Generating...' : 'Generate Module'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create/Edit Contest Dialog */}
      <Dialog open={openDialog === 'contest' || openDialog === 'editContest'} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingContest ? 'Edit Contest' : 'Create New Contest'}
          <IconButton onClick={handleCloseDialog} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Contest Title"
            value={contestForm.title}
            onChange={e => setContestForm({...contestForm, title: e.target.value})}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Select Modules</InputLabel>
            <Select
              multiple
              value={contestForm.moduleIds}
              onChange={e => setContestForm({...contestForm, moduleIds: e.target.value})}
              label="Select Modules"
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map(id => {
                    const module = allModules.find(m => m._id === id)
                    return <Chip key={id} label={module ? `Module ${module.moduleNo}` : id} size="small" />
                  })}
                </Box>
              )}
            >
              {allModules.map(m => (
                <MenuItem key={m._id} value={m._id}>
                  Module {m.moduleNo}: {m.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Start Time"
            type="datetime-local"
            value={contestForm.startTime}
            onChange={e => setContestForm({...contestForm, startTime: e.target.value})}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="End Time"
            type="datetime-local"
            value={contestForm.endTime}
            onChange={e => setContestForm({...contestForm, endTime: e.target.value})}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="Duration (minutes)"
            type="number"
            value={contestForm.durationMinutes}
            onChange={e => setContestForm({...contestForm, durationMinutes: parseInt(e.target.value)})}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Marks per Question"
            type="number"
            value={contestForm.marksPerQuestion}
            onChange={e => setContestForm({...contestForm, marksPerQuestion: parseInt(e.target.value)})}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Negative Marking"
            type="number"
            value={contestForm.negativeMarking}
            onChange={e => setContestForm({...contestForm, negativeMarking: parseFloat(e.target.value)})}
            margin="normal"
            inputProps={{ step: 0.25 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={editingContest ? handleUpdateContest : handleCreateContest} variant="contained">
            {editingContest ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manage Contests Dialog */}
      <Dialog open={openDialog === 'manageContests'} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Manage Contests
          <IconButton onClick={handleCloseDialog} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {allContests.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
              No contests found. Create a new contest to get started.
            </Typography>
          ) : (
            <List>
              {allContests.map((contest, idx) => (
                <Box key={contest._id}>
                  <ListItem
                    sx={{
                      bgcolor: 'action.hover',
                      borderRadius: 1,
                      mb: 1,
                      '&:hover': { bgcolor: 'action.selected' }
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <EmojiEvents color="primary" sx={{ fontSize: 20 }} />
                          <Typography variant="subtitle1" fontWeight={600}>
                            {contest.title}
                          </Typography>
                          <Chip label={`${contest.durationMinutes} min`} size="small" color="primary" />
                          {contest.negativeMarking > 0 && (
                            <Chip label={`-${contest.negativeMarking} penalty`} size="small" color="error" variant="outlined" />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Modules: {contest.moduleIds?.length || 0} • 
                            Marks per Q: {contest.marksPerQuestion || 1}
                          </Typography>
                          {contest.startTime && (
                            <Typography variant="caption" color="text.secondary">
                              Start: {new Date(contest.startTime).toLocaleString()} • 
                              End: {new Date(contest.endTime).toLocaleString()}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" onClick={() => handleEditContest(contest)} sx={{ mr: 1 }}>
                        <Edit color="primary" />
                      </IconButton>
                      <IconButton edge="end" onClick={() => handleDeleteContest(contest._id)}>
                        <Delete color="error" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {idx < allContests.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({...snackbar, open: false})}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({...snackbar, open: false})}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  )
}
