import React, { useState, useEffect, useContext } from 'react'
import {
    Container, Typography, Box, Paper, LinearProgress, Avatar, Chip,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Tabs, Tab, Divider, Alert, IconButton, Tooltip, Grid, Card, CardContent
} from '@mui/material'
import {
    EmojiEvents, TrendingUp, School, Refresh, Star,
    MilitaryTech, WorkspacePremium, Leaderboard as LeaderboardIcon
} from '@mui/icons-material'
import { getGlobalLeaderboard, getContests, getContestLeaderboard } from '../api'
import { AuthContext } from '../context/AuthContext'

// Top-3 medal colours
const MEDAL = ['#f59e0b', '#94a3b8', '#b45309']
const MEDAL_EMOJI = ['🥇', '🥈', '🥉']

function RankBadge({ rank }) {
    if (rank <= 3) {
        return (
            <Avatar sx={{
                width: 36, height: 36,
                bgcolor: MEDAL[rank - 1] + '33',
                border: `2px solid ${MEDAL[rank - 1]}`,
                fontSize: 18, fontWeight: 700, color: MEDAL[rank - 1]
            }}>
                {MEDAL_EMOJI[rank - 1]}
            </Avatar>
        )
    }
    return (
        <Avatar sx={{ width: 36, height: 36, bgcolor: '#e5e7eb', fontSize: 13, fontWeight: 700, color: '#6b7280' }}>
            {rank}
        </Avatar>
    )
}

// ── Global Leaderboard tab ──────────────────────────────────────────────────
function GlobalTab({ userId }) {
    const [entries, setEntries] = useState([])
    const [loading, setLoading] = useState(true)

    const load = () => {
        setLoading(true)
        getGlobalLeaderboard()
            .then(r => setEntries(r.data.leaderboard || []))
            .catch(() => { })
            .finally(() => setLoading(false))
    }

    useEffect(() => { load() }, [])

    const top3 = entries.slice(0, 3)
    const rest = entries.slice(3)

    if (loading) return <LinearProgress sx={{ mt: 2 }} />

    return (
        <>
            {/* Top 3 hero cards */}
            {top3.length > 0 && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    {[1, 0, 2].filter(i => top3[i]).map(i => {
                        const e = top3[i]
                        const isFirst = i === 0
                        return (
                            <Grid item xs={12} sm={4} key={e.studentId}>
                                <Card elevation={isFirst ? 4 : 2} sx={{
                                    background: `linear-gradient(135deg, ${MEDAL[i]}22, ${MEDAL[i]}44)`,
                                    border: `2px solid ${MEDAL[i]}66`,
                                    borderRadius: 3,
                                    textAlign: 'center',
                                    transform: isFirst ? 'scale(1.04)' : 'none',
                                    transition: 'all 0.2s'
                                }}>
                                    <CardContent sx={{ py: isFirst ? 4 : 3 }}>
                                        <Typography variant={isFirst ? 'h2' : 'h3'}>{MEDAL_EMOJI[i]}</Typography>
                                        <Avatar sx={{
                                            mx: 'auto', mt: 1, mb: 1,
                                            width: isFirst ? 64 : 48, height: isFirst ? 64 : 48,
                                            bgcolor: MEDAL[i], fontWeight: 700, fontSize: isFirst ? 22 : 18,
                                            border: `3px solid white`
                                        }}>
                                            {e.studentName?.[0]?.toUpperCase()}
                                        </Avatar>
                                        <Typography fontWeight={700} noWrap>{e.studentName}</Typography>
                                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 1 }}>
                                            <Chip label={`${e.xp} XP`} size="small" color="secondary" />
                                            <Chip label={`Lv ${e.level}`} size="small" color="primary" />
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        )
                    })}
                </Grid>
            )}

            {/* Full table */}
            <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'action.hover' }}>
                                <TableCell><Typography fontWeight={700}>Rank</Typography></TableCell>
                                <TableCell><Typography fontWeight={700}>Student</Typography></TableCell>
                                <TableCell align="center"><Typography fontWeight={700}>XP</Typography></TableCell>
                                <TableCell align="center"><Typography fontWeight={700}>Level</Typography></TableCell>
                                <TableCell align="center"><Typography fontWeight={700}>Modules Done</Typography></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {entries.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                        <Typography color="text.secondary">No data yet — complete some quizzes to appear here!</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : entries.map(e => {
                                const isMe = e.studentId === userId
                                return (
                                    <TableRow key={e.studentId} sx={{
                                        bgcolor: isMe ? '#667eea11' : 'transparent',
                                        border: isMe ? '2px solid #667eea44' : 'none',
                                        '&:hover': { bgcolor: isMe ? '#667eea22' : 'action.hover' }
                                    }}>
                                        <TableCell><RankBadge rank={e.rank} /></TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Avatar sx={{ bgcolor: e.rank <= 3 ? MEDAL[e.rank - 1] : '#667eea', width: 36, height: 36, fontWeight: 700 }}>
                                                    {e.studentName?.[0]?.toUpperCase()}
                                                </Avatar>
                                                <Box>
                                                    <Typography fontWeight={600}>{e.studentName}</Typography>
                                                    {isMe && <Chip label="You" size="small" color="primary" sx={{ height: 18, mt: 0.3 }} />}
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Typography fontWeight={700} color="secondary.main">{e.xp}</Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip label={`Level ${e.level}`} size="small" color="primary" />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip label={`${e.completedModulesCount || 0} / 5`}
                                                color={e.completedModulesCount >= 5 ? 'success' : 'default'} size="small" />
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </>
    )
}

// ── Contest Leaderboard tab ─────────────────────────────────────────────────
function ContestTab({ userId }) {
    const [contests, setContests] = useState([])
    const [selectedContest, setSelectedContest] = useState(null)
    const [entries, setEntries] = useState([])
    const [loading, setLoading] = useState(true)
    const [lbLoading, setLbLoading] = useState(false)

    useEffect(() => {
        getContests()
            .then(r => {
                const list = r.data.contests || []
                setContests(list)
                if (list.length > 0) loadContest(list[0])
            })
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [])

    const loadContest = (c) => {
        setSelectedContest(c)
        setLbLoading(true)
        getContestLeaderboard(c._id)
            .then(r => setEntries(r.data.leaderboard || []))
            .catch(() => setEntries([]))
            .finally(() => setLbLoading(false))
    }

    if (loading) return <LinearProgress sx={{ mt: 2 }} />
    if (contests.length === 0) return <Alert severity="info" sx={{ mt: 2 }}>No contests available yet.</Alert>

    return (
        <>
            {/* Contest selector tabs */}
            <Paper elevation={1} sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
                <Tabs
                    value={selectedContest?._id || false}
                    onChange={(_, id) => { const c = contests.find(x => x._id === id); if (c) loadContest(c) }}
                    variant="scrollable" scrollButtons="auto"
                    TabIndicatorProps={{ style: { background: '#667eea', height: 3 } }}
                >
                    {contests.map(c => (
                        <Tab key={c._id} value={c._id} label={c.title} sx={{ fontWeight: 600 }} />
                    ))}
                </Tabs>
            </Paper>

            {lbLoading ? <LinearProgress /> : (
                <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'action.hover' }}>
                                    <TableCell><Typography fontWeight={700}>Rank</Typography></TableCell>
                                    <TableCell><Typography fontWeight={700}>Student</Typography></TableCell>
                                    <TableCell align="center"><Typography fontWeight={700}>Score</Typography></TableCell>
                                    <TableCell align="center"><Typography fontWeight={700}>Correct</Typography></TableCell>
                                    <TableCell align="center"><Typography fontWeight={700}>Time (s)</Typography></TableCell>
                                    <TableCell align="center"><Typography fontWeight={700}>Status</Typography></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {entries.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                            <Typography color="text.secondary">No submissions yet for this contest.</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : entries.map(e => {
                                    const isMe = e.studentId === userId
                                    return (
                                        <TableRow key={e.studentId} sx={{
                                            bgcolor: isMe ? '#667eea11' : 'transparent',
                                            '&:hover': { bgcolor: isMe ? '#667eea22' : 'action.hover' }
                                        }}>
                                            <TableCell><RankBadge rank={e.rank || 999} /></TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Avatar sx={{ bgcolor: '#667eea', width: 36, height: 36, fontWeight: 700, fontSize: 14 }}>
                                                        {e.studentName?.[0]?.toUpperCase()}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography fontWeight={600}>{e.studentName || e.studentId?.slice(-6)}</Typography>
                                                        {isMe && <Chip label="You" size="small" color="primary" sx={{ height: 18 }} />}
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Typography fontWeight={700} color="secondary.main">{e.score || 0}</Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip label={`${e.correctCount || 0} ✓`} size="small" color="success" variant="outlined" />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Typography variant="body2">{e.timeTaken || '—'}</Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    label={e.isSubmitted ? 'Submitted' : 'Joined'}
                                                    size="small"
                                                    color={e.isSubmitted ? 'success' : 'warning'}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}
        </>
    )
}

// ── Main Leaderboard Page ───────────────────────────────────────────────────
export default function LeaderboardPage() {
    const { userId } = useContext(AuthContext)
    const [tab, setTab] = useState(0)

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Header */}
            <Paper elevation={0} sx={{
                mb: 4, p: 4,
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white', borderRadius: 3
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2, p: 1.5, display: 'flex' }}>
                        <LeaderboardIcon sx={{ fontSize: 40 }} />
                    </Box>
                    <Box>
                        <Typography variant="h3" fontWeight={700} gutterBottom sx={{ mb: 0.5 }}>
                            Leaderboards
                        </Typography>
                        <Typography variant="body1" sx={{ opacity: 0.95 }}>
                            Rankings based on XP, levels, and contest scores
                        </Typography>
                    </Box>
                </Box>
            </Paper>

            {/* Tabs */}
            <Paper elevation={1} sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)}
                    TabIndicatorProps={{ style: { background: 'linear-gradient(90deg,#f093fb,#f5576c)', height: 3 } }}>
                    <Tab label="🌍 Global Leaderboard" sx={{ fontWeight: 600 }} />
                    <Tab label="🏆 Contest Leaderboards" sx={{ fontWeight: 600 }} />
                </Tabs>
            </Paper>

            {tab === 0 && <GlobalTab userId={userId} />}
            {tab === 1 && <ContestTab userId={userId} />}
        </Container>
    )
}
