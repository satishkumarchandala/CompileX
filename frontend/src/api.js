import axios from 'axios'

const API = axios.create({
  baseURL: 'https://compilex-1-u5bd.onrender.com/api',
  headers: { 'Content-Type': 'application/json' }
})

API.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// ── Auth ──────────────────────────────────────────────────────────────────
export const register = (data) => API.post('/auth/register', data)
export const login = (data) => API.post('/auth/login', data)

// ── Courses & Modules (student) ───────────────────────────────────────────
export const getCourses = () => API.get('/courses')
export const getAllModules = () => API.get('/modules')
export const getModule = (id) => API.get(`/modules/${id}`)
export const getQuestions = (id) => API.get(`/modules/${id}/questions`)
export const submitQuiz = (id, data) => API.post(`/modules/${id}/submit`, data)

// ── Student profile / progress ────────────────────────────────────────────
export const getProfile = (studentId) => API.get(`/student/profile?studentId=${studentId}`)
export const getProgress = (studentId) => API.get(`/student/progress?studentId=${studentId}`)

// ── Contests (student) ────────────────────────────────────────────────────
export const getContests = () => API.get('/contests')
export const getContestQuestions = (contestId) => API.get(`/contests/${contestId}/questions`)
export const joinContest = (id, data) => API.post(`/contests/join/${id}`, data)
export const submitContest = (id, data) => API.post(`/contests/submit/${id}`, data)
export const getContestResult = (cid, sid) => API.get(`/contests/result/${cid}/${sid}`)
export const getContestLeaderboard = (id) => API.get(`/contests/leaderboard/${id}`)

// ── Global Leaderboard (public) ───────────────────────────────────────────
export const getGlobalLeaderboard = () => API.get('/leaderboard/global')

// ── Admin (Course Instructor) ─────────────────────────────────────────────
export const getAdminStats = () => API.get('/admin/stats')
export const getMyStudents = () => API.get('/admin/my-students')
export const getStudentDetail = (id) => API.get(`/admin/student/${id}/progress`)
export const getAllStudentsProgress = () => API.get('/admin/students/progress')
export const getAdminGlobalLeaderboard = () => API.get('/admin/leaderboard/global')

export const createModule = (data) => API.post('/admin/module/create', data)
export const updateModule = (id, data) => API.put(`/admin/module/update/${id}`, data)
export const deleteModule = (id) => API.delete(`/admin/module/delete/${id}`)

export const createQuestion = (data) => API.post('/admin/question/create', data)
export const updateQuestion = (id, data) => API.put(`/admin/question/update/${id}`, data)
export const deleteQuestion = (id) => API.delete(`/admin/question/delete/${id}`)
export const getAdminModuleQuestions = (id) => API.get(`/admin/module/${id}/questions`)

export const uploadPDF = (fd) => API.post('/admin/pdf/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
export const generateModuleFromPDF = (fd) => API.post('/admin/pdf/generate-module', fd, { headers: { 'Content-Type': 'multipart/form-data' } })

export const createContest = (data) => API.post('/admin/contest/create', data)
export const updateContest = (id, data) => API.put(`/admin/contest/update/${id}`, data)
export const deleteContest = (id) => API.delete(`/admin/contest/delete/${id}`)

// Kept for backward compatibility (leaderboard result per contest)
export const getLeaderboard = (id) => API.get(`/contests/leaderboard/${id}`)

// ── Super Admin ───────────────────────────────────────────────────────────
export const getSuperAdminStats = () => API.get('/superadmin/stats')
export const getAdmins = () => API.get('/superadmin/admins')
export const getAllStudents = () => API.get('/superadmin/students')
export const createAdminAccount = (data) => API.post('/superadmin/create-admin', data)
export const assignStudents = (data) => API.post('/superadmin/assign-student', data)
export const unassignStudent = (data) => API.delete('/superadmin/unassign-student', { data })
export const rebuildLeaderboard = () => API.post('/superadmin/rebuild-leaderboard')

export default API
