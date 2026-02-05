import axios from 'axios'

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' }
})

API.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

export const register = (data) => API.post('/auth/register', data)
export const login = (data) => API.post('/auth/login', data)
export const getCourses = () => API.get('/courses')
export const getAllModules = () => API.get('/modules')
export const getModule = (id) => API.get(`/modules/${id}`)
export const getQuestions = (id) => API.get(`/modules/${id}/questions`)
export const submitQuiz = (id, data) => API.post(`/modules/${id}/submit`, data)
export const getProfile = (studentId) => API.get(`/student/profile?studentId=${studentId}`)
export const getProgress = (studentId) => API.get(`/student/progress?studentId=${studentId}`)
export const getContests = () => API.get('/contests')
export const getContestQuestions = (contestId) => API.get(`/contests/${contestId}/questions`)
export const joinContest = (id, data) => API.post(`/contests/join/${id}`, data)
export const submitContest = (id, data) => API.post(`/contests/submit/${id}`, data)
export const getLeaderboard = (id) => API.get(`/contests/leaderboard/${id}`)
export const getAdminStats = () => API.get('/admin/stats')
export const createModule = (data) => API.post('/admin/module/create', data)
export const updateModule = (moduleId, data) => API.put(`/admin/module/update/${moduleId}`, data)
export const deleteModule = (moduleId) => API.delete(`/admin/module/delete/${moduleId}`)
export const createQuestion = (data) => API.post('/admin/question/create', data)
export const uploadPDF = (formData) => API.post('/admin/pdf/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const generateModuleFromPDF = (formData) => API.post('/admin/pdf/generate-module', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const createContest = (data) => API.post('/admin/contest/create', data)
export const updateContest = (contestId, data) => API.put(`/admin/contest/update/${contestId}`, data)
export const deleteContest = (contestId) => API.delete(`/admin/contest/delete/${contestId}`)
export const getAdminModuleQuestions = (moduleId) => API.get(`/admin/module/${moduleId}/questions`)
export const updateQuestion = (questionId, data) => API.put(`/admin/question/update/${questionId}`, data)
export const deleteQuestion = (questionId) => API.delete(`/admin/question/delete/${questionId}`)

export default API
