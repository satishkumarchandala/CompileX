import React, { useState, useEffect } from 'react'
import {
    Container, Grid, Card, CardContent, Typography, Box, Paper,
    LinearProgress, Avatar, Chip, Divider, Button, Dialog, DialogTitle,
    DialogContent, DialogActions, IconButton, List, ListItem, ListItemText,
    ListItemIcon, Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, Tooltip, Alert
} from '@mui/material'
import {
    SupervisorAccount, Close, TrendingUp, EmojiEvents, School,
    CheckCircle, Star, Speed, WorkspacePremium, MilitaryTech, Lock,
    FlashOn, Bolt
} from '@mui/icons-material'
import { getMyStudents, getStudentDetail } from '../api'

// ── Badge metadata (mirrors HomePage) ───────────────────────────────────────
const BADGE_META = {
    'Perfect Score': { icon: <Star sx={{ color: '#f59e0b' }} />, color: '#fff8e1', border: '#f59e0b' },
    'Quick Learner': { icon: <Speed sx={{ color: '#3b82f6' }} />, color: '#eff6ff', border: '#3b82f6' },
    'Module Master': { icon: <WorkspacePremium sx={{ color: '#8b5cf6' }} />, color: '#f5f3ff', border: '#8b5cf6' },
    'Contest Winner': { icon: <MilitaryTech sx={{ color: '#10b981' }} />, color: '#ecfdf5', border: '#10b981' },
    'First Step': { icon: <FlashOn sx={{ color: '#f59e0b' }} />, color: '#fff8e1', border: '#f59e0b' },
    'Speed Demon': { icon: <Bolt sx={{ color: '#6366f1' }} />, color: '#eef2ff', border: '#6366f1' },
}

const XP_THRESHOLDS = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200]

function xpProgress(xp, level) {
    const cur = XP_THRESHOLDS[level - 1] || 0
    const next = XP_THRESHOLDS[level] ?? null
    if (next == null) return 100
    return Math.min(100, ((xp - cur) / (next - cur)) * 100)
}

// ── Mini stat card (same pattern as AdminDashboard) ───────────────────────
function MiniStat({ label, value, color }) {
    return (
        <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: color + '22', border: `1px solid ${color}44` }}>
            <Typography variant="h4" fontWeight={700} color={color}>{value}</Typography>
            <Typography variant="caption" color="text.secondary">{label}</Typography>
        </Box>
    )
}

// ── Detailed student progress dialog ────────────────────────────────────────
function StudentDetailDialog({ open, onClose, studentId }) {
    const [detail, setDetail] = useState(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (open && studentId) {
            setLoading(true)
            getStudentDetail(studentId)
                .then(r => setDetail(r.data))
                .catch(() => setDetail(null))
                .finally(() => setLoading(false))
        }
    }, [open, studentId])

    if (!open) return null

    const xp = detail?.xp || 0
    const level = detail?.level || 1
    const prog = xpProgress(xp, level)

    const nextXP = XP_THRESHOLDS[level] ?? null

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{
                background: 'linear-gradient(135deg,#667eea,#764ba2)',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SupervisorAccount /> Student Progress — {detail?.name || '…'}
                </Box>
                <IconButton onClick={onClose} size="small" sx={{ color: 'white' }}><Close /></IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 3 }}>
                {loading ? (
                    <LinearProgress />
                ) : !detail ? (
                    <Alert severity="error">Failed to load student details.</Alert>
                ) : (
                    <>
                        {/* Stat cards row */}
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={6} sm={3}>
                                <MiniStat label="XP Earned" value={xp} color="#667eea" />
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <MiniStat label="Level" value={level} color="#764ba2" />
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <MiniStat label="Modules Done" value={detail.completedModulesCount || 0} color="#4facfe" />
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <MiniStat label="Total Attempts" value={detail.totalAttempts || 0} color="#43e97b" />
                            </Grid>
                        </Grid>

                        {/* XP Progress bar */}
                        <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" fontWeight={600}>XP Progress — Level {level}</Typography>
                                <Typography variant="body2" color="primary" fontWeight={600}>
                                    {xp} / {nextXP ?? '∞'} XP
                                </Typography>
                            </Box>
                            <LinearProgress variant="determinate" value={prog} sx={{
                                height: 10, borderRadius: 5, bgcolor: '#e5e7eb',
                                '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg,#667eea,#764ba2)', borderRadius: 5 }
                            }} />
                            {nextXP && (
                                <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
                                    {nextXP - xp} XP to Level {level + 1}
                                </Typography>
                            )}
                        </Paper>

                        {/* Badges */}
                        <Typography variant="subtitle1" fontWeight={700} mb={1.5}>Badges</Typography>
                        {(detail.badges || []).length === 0 ? (
                            <Typography color="text.secondary" variant="body2" mb={2}>No badges earned yet.</Typography>
                        ) : (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                                {(detail.badges || []).map(b => {
                                    const meta = BADGE_META[b] || {}
                                    return (
                                        <Chip
                                            key={b}
                                            label={b}
                                            icon={meta.icon}
                                            sx={{ bgcolor: meta.color, border: `1px solid ${meta.border}`, fontWeight: 600 }}
                                        />
                                    )
                                })}
                            </Box>
                        )}

                        <Divider sx={{ mb: 2 }} />

                        {/* Completed modules */}
                        <Typography variant="subtitle1" fontWeight={700} mb={1.5}>Completed Modules</Typography>
                        {(detail.completedModules || []).length === 0 ? (
                            <Typography color="text.secondary" variant="body2" mb={2}>No modules completed yet.</Typography>
                        ) : (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                                {detail.completedModules.map(m => (
                                    <Chip key={m.moduleId} icon={<CheckCircle />}
                                        label={m.title || `Module ${m.moduleNo || ''}`}
                                        color="success" variant="outlined" size="small" />
                                ))}
                            </Box>
                        )}

                        <Divider sx={{ mb: 2 }} />

                        {/* Attempt history */}
                        <Typography variant="subtitle1" fontWeight={700} mb={1.5}>Attempt History</Typography>
                        {(detail.attempts || []).length === 0 ? (
                            <Typography color="text.secondary" variant="body2">No quiz attempts yet.</Typography>
                        ) : (
                            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                                            <TableCell><Typography variant="caption" fontWeight={700}>Module</Typography></TableCell>
                                            <TableCell align="center"><Typography variant="caption" fontWeight={700}>Score</Typography></TableCell>
                                            <TableCell align="center"><Typography variant="caption" fontWeight={700}>XP</Typography></TableCell>
                                            <TableCell align="center"><Typography variant="caption" fontWeight={700}>First?</Typography></TableCell>
                                            <TableCell align="right"><Typography variant="caption" fontWeight={700}>Date</Typography></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {detail.attempts.slice(0, 15).map((a, i) => (
                                            <TableRow key={i} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                                                <TableCell>
                                                    <Typography variant="caption" color="text.secondary">{a.moduleId?.slice(-6)}</Typography>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Chip
                                                        label={`${a.score}/${a.total}`}
                                                        size="small"
                                                        color={a.score / Math.max(a.total, 1) >= 0.7 ? 'success' : 'error'}
                                                        variant="outlined"
                                                    />
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Typography variant="caption" fontWeight={600} color="primary">
                                                        {a.xpEarned > 0 ? `+${a.xpEarned}` : '—'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="center">
                                                    {a.isFirstCompletion
                                                        ? <CheckCircle color="success" fontSize="small" />
                                                        : <Typography variant="caption" color="text.disabled">—</Typography>
                                                    }
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="caption" color="text.secondary">
                                                        {new Date(a.attemptedAt).toLocaleDateString()}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} variant="contained" sx={{ borderRadius: 2 }}>Close</Button>
            </DialogActions>
        </Dialog>
    )
}

// ── Main InstructorStudentsPage ──────────────────────────────────────────────
export default function InstructorStudentsPage() {
    const [students, setStudents] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedId, setSelectedId] = useState(null)
    const [dialogOpen, setDialogOpen] = useState(false)

    useEffect(() => {
        getMyStudents()
            .then(r => setStudents(r.data.students || []))
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [])

    const openDetail = (id) => { setSelectedId(id); setDialogOpen(true) }

    if (loading) return <LinearProgress />

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            {/* Header */}
            <Paper elevation={0} sx={{
                mb: 4, p: 4,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white', borderRadius: 3
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2, p: 1.5, display: 'flex' }}>
                        <SupervisorAccount sx={{ fontSize: 40 }} />
                    </Box>
                    <Box>
                        <Typography variant="h3" fontWeight={700} gutterBottom sx={{ mb: 0.5 }}>
                            My Students
                        </Typography>
                        <Typography variant="body1" sx={{ opacity: 0.95 }}>
                            {students.length} student{students.length !== 1 ? 's' : ''} assigned to you
                        </Typography>
                    </Box>
                </Box>
            </Paper>

            {/* Summary stats row */}
            {students.length > 0 && (
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={6} sm={3}>
                        <Card elevation={0} sx={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', color: 'white', borderRadius: 2, p: 0 }}>
                            <CardContent>
                                <Typography variant="h3" fontWeight={700}>{students.length}</Typography>
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>Total Students</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <Card elevation={0} sx={{ background: 'linear-gradient(135deg,#43e97b,#38f9d7)', color: 'white', borderRadius: 2 }}>
                            <CardContent>
                                <Typography variant="h3" fontWeight={700}>
                                    {Math.round(students.reduce((s, u) => s + (u.completedModulesCount || 0), 0) / students.length) || 0}
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>Avg Modules Done</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <Card elevation={0} sx={{ background: 'linear-gradient(135deg,#f093fb,#f5576c)', color: 'white', borderRadius: 2 }}>
                            <CardContent>
                                <Typography variant="h3" fontWeight={700}>
                                    {Math.round(students.reduce((s, u) => s + (u.xp || 0), 0) / students.length) || 0}
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>Avg XP</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <Card elevation={0} sx={{ background: 'linear-gradient(135deg,#4facfe,#00f2fe)', color: 'white', borderRadius: 2 }}>
                            <CardContent>
                                <Typography variant="h3" fontWeight={700}>
                                    {students.filter(u => (u.completedModulesCount || 0) > 0).length}
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>Active Learners</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Students Table */}
            {students.length === 0 ? (
                <Paper elevation={2} sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
                    <School sx={{ fontSize: 80, color: '#d1d5db', mb: 2 }} />
                    <Typography variant="h5" color="text.secondary" gutterBottom>No students assigned yet</Typography>
                    <Typography color="text.secondary">Ask your Super Admin to assign students to your account.</Typography>
                </Paper>
            ) : (
                <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'action.hover' }}>
                                    <TableCell><Typography fontWeight={700}>Student</Typography></TableCell>
                                    <TableCell align="center"><Typography fontWeight={700}>XP / Level</Typography></TableCell>
                                    <TableCell align="center"><Typography fontWeight={700}>Modules Completed</Typography></TableCell>
                                    <TableCell align="center"><Typography fontWeight={700}>Badges</Typography></TableCell>
                                    <TableCell align="center"><Typography fontWeight={700}>Progress</Typography></TableCell>
                                    <TableCell align="right"><Typography fontWeight={700}>Actions</Typography></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {students.map(s => {
                                    const prog = xpProgress(s.xp || 0, s.level || 1)
                                    return (
                                        <TableRow key={s._id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Avatar sx={{ bgcolor: '#667eea', width: 38, height: 38, fontWeight: 700 }}>
                                                        {s.name?.[0]?.toUpperCase()}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography fontWeight={600}>{s.name}</Typography>
                                                        <Typography variant="caption" color="text.secondary">{s.email}</Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                                                    <Typography fontWeight={700} color="primary">{s.xp || 0} XP</Typography>
                                                    <Chip label={`Level ${s.level || 1}`} size="small" color="primary" />
                                                </Box>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    label={`${s.completedModulesCount || 0} / 5`}
                                                    color={s.completedModulesCount >= 5 ? 'success' : s.completedModulesCount > 0 ? 'primary' : 'default'}
                                                    icon={s.completedModulesCount >= 5 ? <CheckCircle /> : undefined}
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
                                                    {(s.badges || []).length === 0 ? (
                                                        <Typography variant="caption" color="text.disabled">None</Typography>
                                                    ) : (s.badges || []).slice(0, 3).map(b => {
                                                        const meta = BADGE_META[b] || {}
                                                        return (
                                                            <Tooltip key={b} title={b}>
                                                                <Avatar sx={{ width: 28, height: 28, bgcolor: (meta.border || '#999') + '22', fontSize: 14 }}>
                                                                    {meta.icon || '🎖️'}
                                                                </Avatar>
                                                            </Tooltip>
                                                        )
                                                    })}
                                                    {(s.badges || []).length > 3 && (
                                                        <Chip label={`+${s.badges.length - 3}`} size="small" />
                                                    )}
                                                </Box>
                                            </TableCell>
                                            <TableCell align="center" sx={{ minWidth: 140 }}>
                                                <Box>
                                                    <LinearProgress variant="determinate" value={prog} sx={{
                                                        height: 8, borderRadius: 5, bgcolor: '#e5e7eb',
                                                        '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg,#667eea,#764ba2)', borderRadius: 5 }
                                                    }} />
                                                    <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
                                                        {Math.round(prog)}% to next level
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Button size="small" variant="outlined" startIcon={<TrendingUp />}
                                                    onClick={() => openDetail(s._id)}>
                                                    View
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            {/* Student Detail Dialog */}
            <StudentDetailDialog open={dialogOpen} onClose={() => setDialogOpen(false)} studentId={selectedId} />
        </Container>
    )
}
