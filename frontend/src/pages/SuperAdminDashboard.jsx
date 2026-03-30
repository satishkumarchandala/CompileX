import React, { useState, useEffect } from 'react'
import {
    Container, Grid, Card, CardContent, Typography, Box, Paper,
    Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
    Alert, Snackbar, IconButton, List, ListItem, ListItemText,
    ListItemSecondaryAction, Chip, Divider, Avatar, LinearProgress,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    FormControl, InputLabel, Select, MenuItem, OutlinedInput, Checkbox,
    ListItemIcon, Tooltip, CircularProgress
} from '@mui/material'
import {
    AdminPanelSettings, People, SupervisorAccount, Close, Add,
    PersonAdd, Assessment, LibraryBooks, EmojiEvents, Refresh,
    School, TrendingUp, Delete, Visibility, CheckBox, CheckBoxOutlineBlank
} from '@mui/icons-material'
import {
    getSuperAdminStats, getAdmins, getAllStudents,
    createAdminAccount, assignStudents, unassignStudent, rebuildLeaderboard
} from '../api'

// ── Shared stat card (same pattern as AdminDashboard) ─────────────────────
function StatCard({ label, value, icon, gradient, sub }) {
    return (
        <Card elevation={0} sx={{
            height: '100%',
            background: gradient,
            color: 'white',
            transition: 'all 0.3s',
            '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 }
        }}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                        <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>{label}</Typography>
                        <Typography variant="h3" fontWeight={700}>{value ?? 0}</Typography>
                    </Box>
                    <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2, p: 1.5, display: 'flex' }}>
                        {icon}
                    </Box>
                </Box>
                {sub && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 2 }}>
                        <Typography variant="caption" sx={{ opacity: 0.9 }}>{sub}</Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    )
}

export default function SuperAdminDashboard() {
    const [stats, setStats] = useState(null)
    const [admins, setAdmins] = useState([])
    const [students, setStudents] = useState([])
    const [loading, setLoading] = useState(true)
    const [openDialog, setOpenDialog] = useState('')
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

    // Create Admin form
    const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '' })
    const [adminFormLoading, setAdminFormLoading] = useState(false)

    // Assign students form
    const [assignForm, setAssignForm] = useState({ instructorId: '', studentIds: [] })
    const [assignLoading, setAssignLoading] = useState(false)

    // View admin detail
    const [selectedAdmin, setSelectedAdmin] = useState(null)
    const [adminStudents, setAdminStudents] = useState([])

    useEffect(() => { loadAll() }, [])

    const loadAll = async () => {
        setLoading(true)
        try {
            const [sRes, aRes, stRes] = await Promise.all([
                getSuperAdminStats(),
                getAdmins(),
                getAllStudents()
            ])
            setStats(sRes.data)
            setAdmins(aRes.data.admins || [])
            setStudents(stRes.data.students || [])
        } catch (e) {
            showSnackbar('Failed to load data', 'error')
        } finally {
            setLoading(false)
        }
    }

    const showSnackbar = (message, severity = 'success') =>
        setSnackbar({ open: true, message, severity })

    const closeDialog = () => {
        setOpenDialog('')
        setAdminForm({ name: '', email: '', password: '' })
        setAssignForm({ instructorId: '', studentIds: [] })
        setSelectedAdmin(null)
        setAdminStudents([])
    }

    // ── Create Admin ──────────────────────────────────────────────────────────
    const handleCreateAdmin = async () => {
        if (!adminForm.name || !adminForm.email || !adminForm.password) {
            showSnackbar('All fields are required', 'error'); return
        }
        setAdminFormLoading(true)
        try {
            await createAdminAccount(adminForm)
            showSnackbar('Admin account created successfully!')
            closeDialog()
            loadAll()
        } catch (e) {
            showSnackbar(e.response?.data?.error || 'Failed to create admin', 'error')
        } finally {
            setAdminFormLoading(false)
        }
    }

    // ── Assign Students ───────────────────────────────────────────────────────
    const handleAssign = async () => {
        if (!assignForm.instructorId || assignForm.studentIds.length === 0) {
            showSnackbar('Select an instructor and at least one student', 'error'); return
        }
        setAssignLoading(true)
        try {
            const res = await assignStudents(assignForm)
            const d = res.data
            let msg = `Assigned ${d.assigned} student(s). ${d.alreadyAssigned} already assigned.`
            if (d.emailStatus === 'sent') {
                msg += ' Email notifications sent ✓'
                showSnackbar(msg, 'success')
            } else if (d.emailStatus === 'partial_failure' || d.emailStatus === 'failed') {
                showSnackbar(msg, 'success')
                setTimeout(() => showSnackbar(
                    'Warning: Some email notifications failed to send. Check server logs.',
                    'warning'
                ), 500)
            } else {
                showSnackbar(msg)
            }
            closeDialog()
            loadAll()
        } catch (e) {
            showSnackbar(e.response?.data?.error || 'Assignment failed', 'error')
        } finally {
            setAssignLoading(false)
        }
    }

    // ── Unassign a student ────────────────────────────────────────────────────
    const handleUnassign = async (instructorId, studentId) => {
        if (!window.confirm('Remove this student from the instructor?')) return
        try {
            await unassignStudent({ instructorId, studentId })
            showSnackbar('Student unassigned')
            loadAll()
        } catch (e) {
            showSnackbar(e.response?.data?.error || 'Failed to unassign', 'error')
        }
    }

    // ── View admin's students ─────────────────────────────────────────────────
    const handleViewAdmin = (admin) => {
        setSelectedAdmin(admin)
        const assigned = students.filter(s => s.instructorId === admin._id)
        setAdminStudents(assigned)
        setOpenDialog('viewAdmin')
    }

    // ── Rebuild leaderboard ───────────────────────────────────────────────────
    const handleRebuild = async () => {
        try {
            await rebuildLeaderboard()
            showSnackbar('Global leaderboard rebuilt successfully!')
        } catch {
            showSnackbar('Rebuild failed', 'error')
        }
    }

    if (loading) return <LinearProgress />

    // Unassigned students (no instructorId)
    const unassignedStudents = students.filter(s => !s.instructorId)

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            {/* ── Header ─────────────────────────────────────────────────────── */}
            <Paper elevation={0} sx={{
                mb: 4, p: 4,
                background: 'linear-gradient(135deg, #fa8231 0%, #f7b731 100%)',
                color: 'white', borderRadius: 3
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2, p: 1.5, display: 'flex' }}>
                            <AdminPanelSettings sx={{ fontSize: 40 }} />
                        </Box>
                        <Box>
                            <Typography variant="h3" fontWeight={700} gutterBottom sx={{ mb: 0.5 }}>
                                Super Admin Dashboard
                            </Typography>
                            <Typography variant="body1" sx={{ opacity: 0.95 }}>
                                Manage instructors, assign students, and oversee the platform
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            variant="outlined"
                            startIcon={<Refresh />}
                            onClick={handleRebuild}
                            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.6)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
                        >
                            Rebuild Leaderboard
                        </Button>
                    </Box>
                </Box>
            </Paper>

            {/* ── Stats ──────────────────────────────────────────────────────── */}
            <Typography variant="h5" fontWeight={600} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Assessment color="primary" /> Platform Overview
            </Typography>
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard label="Total Users" value={stats?.totalUsers} icon={<People sx={{ fontSize: 35 }} />}
                        gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                        sub={`${stats?.studentCount || 0} students · ${stats?.adminCount || 0} instructors`} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard label="Instructors" value={stats?.adminCount} icon={<SupervisorAccount sx={{ fontSize: 35 }} />}
                        gradient="linear-gradient(135deg, #fa8231 0%, #f7b731 100%)"
                        sub={`${stats?.totalAssignments || 0} total assignments`} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard label="Total Modules" value={stats?.totalModules} icon={<LibraryBooks sx={{ fontSize: 35 }} />}
                        gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
                        sub={`${stats?.totalCourses || 0} course(s)`} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard label="Total Contests" value={stats?.totalContests} icon={<EmojiEvents sx={{ fontSize: 35 }} />}
                        gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
                        sub={`${stats?.totalQuizAttempts || 0} quiz attempts`} />
                </Grid>
            </Grid>

            {/* ── Quick Actions ──────────────────────────────────────────────── */}
            <Typography variant="h5" fontWeight={600} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp color="primary" /> Quick Actions
            </Typography>
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {[
                    { title: 'Create Instructor', icon: <PersonAdd />, color: '#fa8231', desc: 'Add a new Admin (Course Instructor) account', key: 'createAdmin' },
                    { title: 'Assign Students', icon: <SupervisorAccount />, color: '#667eea', desc: 'Assign students to a course instructor', key: 'assignStudents' },
                    { title: 'View All Instructors', icon: <People />, color: '#4facfe', desc: 'Manage instructors and their student lists', key: 'viewAdmins' },
                    { title: 'Unassigned Students', icon: <School />, color: '#fa709a', desc: `${unassignedStudents.length} student(s) without an instructor`, key: 'unassigned' },
                ].map(action => (
                    <Grid item xs={12} sm={6} md={3} key={action.key}>
                        <Card elevation={0} sx={{
                            height: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 2,
                            transition: 'all 0.3s', cursor: 'pointer',
                            '&:hover': {
                                transform: 'translateY(-4px)', boxShadow: 4,
                                borderColor: action.color,
                                '& .action-icon': {
                                    background: `linear-gradient(135deg, ${action.color} 0%, ${action.color}dd 100%)`,
                                    color: 'white', transform: 'scale(1.1)'
                                }
                            }
                        }} onClick={() => setOpenDialog(action.key)}>
                            <CardContent sx={{ p: 3 }}>
                                <Box className="action-icon" sx={{
                                    width: 60, height: 60, borderRadius: 2, display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover',
                                    color: action.color, mb: 2, transition: 'all 0.3s'
                                }}>
                                    <Box sx={{ fontSize: 30, display: 'flex' }}>{action.icon}</Box>
                                </Box>
                                <Typography variant="h6" fontWeight={600} gutterBottom>{action.title}</Typography>
                                <Typography variant="body2" color="text.secondary">{action.desc}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* ── Instructors Table ───────────────────────────────────────────── */}
            <Typography variant="h5" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <SupervisorAccount color="primary" /> Instructors
            </Typography>
            <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden', mb: 4 }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'action.hover' }}>
                                <TableCell><Typography fontWeight={700}>Name</Typography></TableCell>
                                <TableCell><Typography fontWeight={700}>Email</Typography></TableCell>
                                <TableCell align="center"><Typography fontWeight={700}>Assigned Students</Typography></TableCell>
                                <TableCell align="right"><Typography fontWeight={700}>Actions</Typography></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {admins.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                                        <Typography color="text.secondary">No instructors yet. Create one to get started.</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : admins.map(admin => (
                                <TableRow key={admin._id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Avatar sx={{ bgcolor: '#667eea', width: 36, height: 36, fontSize: 14 }}>
                                                {admin.name?.[0]?.toUpperCase()}
                                            </Avatar>
                                            <Typography fontWeight={600}>{admin.name}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell><Typography color="text.secondary">{admin.email}</Typography></TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={`${admin.assignedStudentCount || 0} students`}
                                            color={admin.assignedStudentCount > 0 ? 'primary' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="View students">
                                            <IconButton size="small" color="primary" onClick={() => handleViewAdmin(admin)}>
                                                <Visibility />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* ── All Students Table ──────────────────────────────────────────── */}
            <Typography variant="h5" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <School color="primary" /> All Students
            </Typography>
            <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden', mb: 4 }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'action.hover' }}>
                                <TableCell><Typography fontWeight={700}>Student</Typography></TableCell>
                                <TableCell><Typography fontWeight={700}>Email</Typography></TableCell>
                                <TableCell align="center"><Typography fontWeight={700}>XP / Level</Typography></TableCell>
                                <TableCell align="center"><Typography fontWeight={700}>Instructor</Typography></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {students.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                                        <Typography color="text.secondary">No students registered yet.</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : students.map(s => {
                                const instructor = admins.find(a => a._id === s.instructorId)
                                return (
                                    <TableRow key={s._id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Avatar sx={{ bgcolor: '#43e97b', width: 36, height: 36, fontSize: 14 }}>
                                                    {s.name?.[0]?.toUpperCase()}
                                                </Avatar>
                                                <Typography fontWeight={600}>{s.name}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell><Typography color="text.secondary">{s.email}</Typography></TableCell>
                                        <TableCell align="center">
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                                <Chip label={`${s.xp || 0} XP`} size="small" color="secondary" />
                                                <Chip label={`Lv ${s.level || 1}`} size="small" color="primary" />
                                            </Box>
                                        </TableCell>
                                        <TableCell align="center">
                                            {instructor
                                                ? <Chip label={instructor.name} size="small" color="primary" variant="outlined" />
                                                : <Chip label="Unassigned" size="small" color="warning" variant="outlined" />
                                            }
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* ────────────────── DIALOGS ────────────────────────────────────── */}
            {/* Create Admin */}
            <Dialog open={openDialog === 'createAdmin'} onClose={closeDialog} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ background: 'linear-gradient(135deg,#fa8231,#f7b731)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><PersonAdd /> Create Instructor Account</Box>
                    <IconButton onClick={closeDialog} size="small" sx={{ color: 'white' }}><Close /></IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <TextField fullWidth label="Full Name" value={adminForm.name}
                        onChange={e => setAdminForm({ ...adminForm, name: e.target.value })} margin="normal" />
                    <TextField fullWidth label="Email Address" type="email" value={adminForm.email}
                        onChange={e => setAdminForm({ ...adminForm, email: e.target.value })} margin="normal" />
                    <TextField fullWidth label="Initial Password" type="password" value={adminForm.password}
                        onChange={e => setAdminForm({ ...adminForm, password: e.target.value })} margin="normal"
                        helperText="Instructor should change this after first login" />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={closeDialog}>Cancel</Button>
                    <Button onClick={handleCreateAdmin} variant="contained" disabled={adminFormLoading}
                        sx={{ background: 'linear-gradient(135deg,#fa8231,#f7b731)' }}>
                        {adminFormLoading ? <CircularProgress size={20} /> : 'Create Instructor'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Assign Students */}
            <Dialog open={openDialog === 'assignStudents'} onClose={closeDialog} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><SupervisorAccount /> Assign Students to Instructor</Box>
                    <IconButton onClick={closeDialog} size="small" sx={{ color: 'white' }}><Close /></IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Select Instructor</InputLabel>
                        <Select value={assignForm.instructorId} label="Select Instructor"
                            onChange={e => setAssignForm({ ...assignForm, instructorId: e.target.value })}>
                            {admins.map(a => <MenuItem key={a._id} value={a._id}>{a.name} ({a.email})</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Select Students</InputLabel>
                        <Select multiple value={assignForm.studentIds} label="Select Students"
                            input={<OutlinedInput label="Select Students" />}
                            onChange={e => setAssignForm({ ...assignForm, studentIds: e.target.value })}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map(id => {
                                        const s = students.find(st => st._id === id)
                                        return <Chip key={id} label={s?.name || id} size="small" />
                                    })}
                                </Box>
                            )}>
                            {students.map(s => (
                                <MenuItem key={s._id} value={s._id}>
                                    <Checkbox checked={assignForm.studentIds.includes(s._id)}
                                        icon={<CheckBoxOutlineBlank />} checkedIcon={<CheckBox />} />
                                    <Box sx={{ ml: 1 }}>
                                        <Typography>{s.name}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {s.email} {s.instructorId ? '(already assigned)' : ''}
                                        </Typography>
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    {assignForm.studentIds.length > 0 && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                            {assignForm.studentIds.length} student(s) selected
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={closeDialog}>Cancel</Button>
                    <Button onClick={handleAssign} variant="contained" disabled={assignLoading}>
                        {assignLoading ? <CircularProgress size={20} /> : 'Assign'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* View Admins List */}
            <Dialog open={openDialog === 'viewAdmins'} onClose={closeDialog} maxWidth="md" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    All Instructors
                    <IconButton onClick={closeDialog}><Close /></IconButton>
                </DialogTitle>
                <DialogContent>
                    <List>
                        {admins.map(a => (
                            <ListItem key={a._id} sx={{ bgcolor: 'action.hover', borderRadius: 1, mb: 1 }}>
                                <ListItemIcon>
                                    <Avatar sx={{ bgcolor: '#667eea' }}>{a.name?.[0]?.toUpperCase()}</Avatar>
                                </ListItemIcon>
                                <ListItemText
                                    primary={<Typography fontWeight={600}>{a.name}</Typography>}
                                    secondary={`${a.email} • ${a.assignedStudentCount || 0} students assigned`}
                                />
                                <ListItemSecondaryAction>
                                    <Button size="small" variant="outlined" onClick={() => { closeDialog(); handleViewAdmin(a) }}>
                                        View Students
                                    </Button>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                </DialogContent>
                <DialogActions><Button onClick={closeDialog}>Close</Button></DialogActions>
            </Dialog>

            {/* View Admin's Students */}
            <Dialog open={openDialog === 'viewAdmin'} onClose={closeDialog} maxWidth="md" fullWidth>
                <DialogTitle sx={{ background: 'linear-gradient(135deg,#4facfe,#00f2fe)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <People /> {selectedAdmin?.name}'s Students
                    </Box>
                    <IconButton onClick={closeDialog} size="small" sx={{ color: 'white' }}><Close /></IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    {adminStudents.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <School sx={{ fontSize: 60, color: '#d1d5db', mb: 2 }} />
                            <Typography color="text.secondary">No students assigned to this instructor yet.</Typography>
                        </Box>
                    ) : (
                        <List>
                            {adminStudents.map(s => (
                                <ListItem key={s._id} sx={{ bgcolor: 'action.hover', borderRadius: 1, mb: 1 }}>
                                    <ListItemIcon>
                                        <Avatar sx={{ bgcolor: '#43e97b', width: 36, height: 36 }}>
                                            {s.name?.[0]?.toUpperCase()}
                                        </Avatar>
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={<Typography fontWeight={600}>{s.name}</Typography>}
                                        secondary={
                                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                                                <Chip label={`${s.xp || 0} XP`} size="small" color="secondary" />
                                                <Chip label={`Level ${s.level || 1}`} size="small" color="primary" />
                                                <Chip label={`${(s.completedModules || []).length} modules`} size="small" />
                                                <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                                                    {s.email}
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                    <ListItemSecondaryAction>
                                        <Tooltip title="Unassign student">
                                            <IconButton size="small" color="error"
                                                onClick={() => handleUnassign(selectedAdmin._id, s._id)}>
                                                <Delete />
                                            </IconButton>
                                        </Tooltip>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => { closeDialog(); setOpenDialog('assignStudents'); setAssignForm({ instructorId: selectedAdmin?._id || '', studentIds: [] }) }}
                        variant="outlined" startIcon={<Add />}>
                        Add More Students
                    </Button>
                    <Button onClick={closeDialog}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Unassigned Students */}
            <Dialog open={openDialog === 'unassigned'} onClose={closeDialog} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    Unassigned Students ({unassignedStudents.length})
                    <IconButton onClick={closeDialog}><Close /></IconButton>
                </DialogTitle>
                <DialogContent>
                    {unassignedStudents.length === 0 ? (
                        <Alert severity="success">All students are assigned to an instructor! 🎉</Alert>
                    ) : (
                        <List>
                            {unassignedStudents.map(s => (
                                <ListItem key={s._id} sx={{ bgcolor: 'action.hover', borderRadius: 1, mb: 1 }}>
                                    <ListItemIcon>
                                        <Avatar sx={{ bgcolor: '#fa709a', width: 36, height: 36 }}>
                                            {s.name?.[0]?.toUpperCase()}
                                        </Avatar>
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={<Typography fontWeight={600}>{s.name}</Typography>}
                                        secondary={s.email}
                                    />
                                    <Chip label="Unassigned" color="warning" size="small" />
                                </ListItem>
                            ))}
                        </List>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { closeDialog(); setOpenDialog('assignStudents') }} variant="contained">
                        Assign Now
                    </Button>
                    <Button onClick={closeDialog}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    )
}
