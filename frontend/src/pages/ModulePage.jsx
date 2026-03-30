import React, { useEffect, useState, useContext, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Container, Paper, Typography, Box, Button, Divider, Card, CardContent,
  LinearProgress, Alert, Tabs, Tab, Chip, Tooltip, CircularProgress
} from '@mui/material'
import {
  Quiz, VideoLibrary, Description, PlayCircleOutline, OpenInNew,
  CheckCircle, Lock, LockOpen, Timer, Visibility
} from '@mui/icons-material'
import { getModule, getProfile, openModule, updateVideoProgress } from '../api'
import { AuthContext } from '../context/AuthContext'

// ── Extract YouTube video ID from various URL formats ─────────────────────
// Handles: youtu.be/<id>, youtube.com/watch?v=<id>, youtube.com/embed/<id>
const extractYouTubeId = (url) => {
  if (!url) return null
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/))([A-Za-z0-9_-]{11})/
  const match = url.match(regExp)
  return match ? match[1] : null
}

function formatSeconds(secs) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}m ${s}s`
}

// ── YouTube IFrame Player component ──────────────────────────────────────
// Shows native controls (timeline visible, backward seek allowed).
// Forward seeking is blocked: a 500 ms polling guard detects any jump ahead
// of the furthest legitimately-watched position and snaps back immediately.
function YouTubePlayer({ videoId, videoIndex, onProgress, onEnded }) {
  const containerRef  = useRef(null)
  const intervalRef   = useRef(null)   // forward-seek guard interval
  const reportRef     = useRef(null)   // progress-report interval
  const playerObjRef  = useRef(null)
  const maxWatchedRef = useRef(0)      // furthest second legitimately watched

  useEffect(() => {
    let mounted = true

    function initPlayer() {
      if (!containerRef.current || !mounted) return
      if (playerObjRef.current) {
        playerObjRef.current.destroy()
        playerObjRef.current = null
      }
      maxWatchedRef.current = 0   // reset on video change

      playerObjRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          rel:            0,    // no related-video suggestions
          modestbranding: 1,
          controls:       1,    // ← show native controls (timeline visible)
          disablekb:      0,    // allow keyboard (guard catches forward KB seeks too)
          fs:             1,    // allow fullscreen
          iv_load_policy: 3,
          playsinline:    1,
        },
        events: {
          onStateChange: (e) => {
            if (!mounted) return
            const YT = window.YT.PlayerState

            if (e.data === YT.PLAYING) {
              // ── Forward-seek guard (500 ms) ─────────────────────────────
              clearInterval(intervalRef.current)
              intervalRef.current = setInterval(() => {
                const p = playerObjRef.current
                if (!p || !p.getCurrentTime) return
                const current  = p.getCurrentTime()
                const duration = p.getDuration()

                if (current > maxWatchedRef.current + 1.5) {
                  // User tried to seek forward → snap back
                  p.seekTo(maxWatchedRef.current, true)
                } else {
                  // Normal playback or backward seek → advance watermark
                  if (current > maxWatchedRef.current) {
                    maxWatchedRef.current = current
                  }
                  // Progress report every ~7 s (share interval tick count)
                }
              }, 500)

              // ── Separate 7-second progress reporter ─────────────────────
              clearInterval(reportRef.current)
              reportRef.current = setInterval(() => {
                const p = playerObjRef.current
                if (!p || !p.getCurrentTime) return
                const duration = p.getDuration()
                if (duration > 0) {
                  onProgress({
                    videoIndex,
                    currentTimeSec: maxWatchedRef.current,
                    durationSec:    duration,
                    eventType:      'timeupdate'
                  })
                }
              }, 7000)

            } else {
              clearInterval(intervalRef.current)
              clearInterval(reportRef.current)
            }

            if (e.data === YT.ENDED) {
              const p        = playerObjRef.current
              const duration = p ? p.getDuration() : 0
              maxWatchedRef.current = duration
              onEnded({ videoIndex, currentTimeSec: duration, durationSec: duration, eventType: 'ended' })
            }
          }
        }
      })
    }

    if (window.YT && window.YT.Player) {
      initPlayer()
    } else {
      if (!document.getElementById('yt-iframe-api')) {
        const tag    = document.createElement('script')
        tag.id       = 'yt-iframe-api'
        tag.src      = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(tag)
      }
      window.onYouTubeIframeAPIReady = initPlayer
    }

    return () => {
      mounted = false
      clearInterval(intervalRef.current)
      clearInterval(reportRef.current)
      if (playerObjRef.current) {
        try { playerObjRef.current.destroy() } catch (_) {}
        playerObjRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, videoIndex])

  return (
    <Box sx={{ position: 'relative', paddingTop: '56.25%', bgcolor: 'black', borderRadius: 2, overflow: 'hidden' }}>
      <div
        ref={containerRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      />
      {/* No overlay — native YouTube controls are fully accessible */}
    </Box>
  )
}


// ── Unlock status badge ───────────────────────────────────────────────────
function UnlockStatusBadge({ unlockStatus, readingRemainingSeconds }) {
  if (!unlockStatus) return null
  const { isUnlocked, videoSatisfied, readTimerSatisfied, readSecondsRequired } = unlockStatus

  if (isUnlocked) {
    return (
      <Chip
        icon={<LockOpen />}
        label="Quiz Unlocked"
        color="success"
        variant="filled"
        sx={{ fontWeight: 700, fontSize: 14 }}
      />
    )
  }
  return (
    <Chip
      icon={<Lock />}
      label="Quiz Locked"
      color="warning"
      variant="filled"
      sx={{ fontWeight: 700, fontSize: 14 }}
    />
  )
}

// ── Unlock conditions panel ───────────────────────────────────────────────
function UnlockConditions({ unlockStatus, readingElapsedSeconds, readingRemainingSeconds }) {
  if (!unlockStatus) return null
  const {
    isUnlocked, videoSatisfied, readTimerSatisfied,
    videoRequired, readSecondsRequired, videoProgress
  } = unlockStatus

  if (isUnlocked) return null  // quiet after unlock

  const completedVideos = (videoProgress || []).filter(v => v.completed).length
  const totalVideos     = (videoProgress || []).length

  return (
    <Alert
      severity={isUnlocked ? 'success' : 'info'}
      icon={<Lock />}
      sx={{ mb: 3 }}
    >
      <Typography fontWeight={700} gutterBottom>Quiz unlock requirements</Typography>
      {videoRequired && totalVideos > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          {videoSatisfied
            ? <CheckCircle color="success" fontSize="small" />
            : <Visibility fontSize="small" color="warning" />}
          <Typography variant="body2">
            Watch all videos to ≥ 95% &nbsp;
            <Chip
              size="small"
              label={`${completedVideos}/${totalVideos} done`}
              color={videoSatisfied ? 'success' : 'default'}
            />
          </Typography>
        </Box>
      )}
      {readSecondsRequired > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {readTimerSatisfied
            ? <CheckCircle color="success" fontSize="small" />
            : <Timer fontSize="small" color="warning" />}
          <Typography variant="body2">
            Spend {Math.ceil(readSecondsRequired / 60)} min reading the content &nbsp;
            {!readTimerSatisfied && (
              <Chip
                size="small"
                label={`${formatSeconds(readingRemainingSeconds)} remaining`}
                color="warning"
              />
            )}
          </Typography>
        </Box>
      )}
    </Alert>
  )
}

// ── Main ModulePage component ─────────────────────────────────────────────
export default function ModulePage() {
  const { id } = useParams()
  const { userId } = useContext(AuthContext)
  const navigate = useNavigate()

  const [module, setModule]                 = useState(null)
  const [isCompleted, setIsCompleted]       = useState(false)
  const [activeVideoIndex, setActiveVideoIndex] = useState(0)

  // Unlock state
  const [unlockStatus, setUnlockStatus]     = useState(null)
  const [readingElapsed, setReadingElapsed]  = useState(0)
  const [readingRemaining, setReadingRemaining] = useState(0)
  const [unlockLoading, setUnlockLoading]    = useState(true)

  // Reading timer tick (client-side countdown mirrors server check)
  const readingTimerRef = useRef(null)

  // ── Load module + profile + open (unlock) ──────────────────────────────
  useEffect(() => {
    getModule(id).then(r => setModule(r.data))

    if (userId) {
      getProfile(userId).then(r => {
        const completed = r.data.completedModules || []
        setIsCompleted(completed.map(String).includes(String(id)))
      }).catch(() => {})

      // Call /open to register first open and get unlock status
      openModule(id)
        .then(r => {
          setUnlockStatus(r.data.unlockStatus)
          setReadingElapsed(r.data.readingElapsedSeconds || 0)
          setReadingRemaining(r.data.readingRemainingSeconds || 0)
        })
        .catch(() => {})
        .finally(() => setUnlockLoading(false))
    } else {
      setUnlockLoading(false)
    }
  }, [id, userId])

  // ── Client-side reading countdown (polls unlock-status every 15s) ──────
  useEffect(() => {
    if (!userId || unlockStatus?.isUnlocked) return

    readingTimerRef.current = setInterval(() => {
      openModule(id)
        .then(r => {
          setUnlockStatus(r.data.unlockStatus)
          setReadingElapsed(r.data.readingElapsedSeconds || 0)
          setReadingRemaining(r.data.readingRemainingSeconds || 0)
        })
        .catch(() => {})
    }, 15000)

    return () => clearInterval(readingTimerRef.current)
  }, [id, userId, unlockStatus?.isUnlocked])

  // ── YouTube video progress callback ────────────────────────────────────
  const handleVideoProgress = useCallback((progressData) => {
    updateVideoProgress(id, progressData)
      .then(r => {
        setUnlockStatus(r.data.unlockStatus)
      })
      .catch(() => {})
  }, [id])

  const handleVideoEnded = useCallback((progressData) => {
    updateVideoProgress(id, { ...progressData, eventType: 'ended' })
      .then(r => {
        setUnlockStatus(r.data.unlockStatus)
      })
      .catch(() => {})
  }, [id])

  // ── Derived state ───────────────────────────────────────────────────────
  const isUnlocked   = unlockStatus?.isUnlocked || false
  const hasVideos    = module?.videoLinks?.length > 0

  if (!module) return <LinearProgress />

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mb: 3 }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 1 }}>
          <Typography variant="h3" fontWeight={600} color="primary">
            {module.title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {isCompleted && (
              <Chip
                icon={<CheckCircle />}
                label="Completed"
                color="success"
                variant="filled"
                sx={{ fontWeight: 700, fontSize: 14 }}
              />
            )}
            {!unlockLoading && (
              <UnlockStatusBadge
                unlockStatus={unlockStatus}
                readingRemainingSeconds={readingRemaining}
              />
            )}
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" mb={2}>
          Module {module.moduleNo}
        </Typography>

        {isCompleted && (
          <Alert severity="success" sx={{ mb: 2 }}>
            You have already completed this module. Re-attempting the quiz will not award additional XP.
          </Alert>
        )}

        {/* ── Unlock requirements panel ─────────────────────────────────── */}
        {!unlockLoading && !isUnlocked && (
          <UnlockConditions
            unlockStatus={unlockStatus}
            readingElapsedSeconds={readingElapsed}
            readingRemainingSeconds={readingRemaining}
          />
        )}

        <Divider sx={{ mb: 3 }} />

        {/* ── Context / Reading section ─────────────────────────────────── */}
        <Card elevation={0} sx={{ bgcolor: 'action.hover', mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Description color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" fontWeight={600}>
                Context &amp; Notes
              </Typography>
              {unlockStatus && !unlockStatus?.readTimerSatisfied && (
                <Chip
                  icon={<Timer />}
                  label={readingRemaining > 0 ? `${formatSeconds(readingRemaining)} left` : 'Timing…'}
                  size="small"
                  color="warning"
                  sx={{ ml: 'auto' }}
                />
              )}
              {unlockStatus?.readTimerSatisfied && (
                <Chip
                  icon={<CheckCircle />}
                  label="Reading done"
                  size="small"
                  color="success"
                  sx={{ ml: 'auto' }}
                />
              )}
            </Box>
            <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
              {module.context}
            </Typography>
          </CardContent>
        </Card>

        {/* ── Video section ─────────────────────────────────────────────── */}
        <Card elevation={0} sx={{ bgcolor: 'action.hover', mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <VideoLibrary color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" fontWeight={600}>
                Watch Videos
              </Typography>
              {hasVideos && unlockStatus && (
                <Chip
                  size="small"
                  icon={unlockStatus.videoSatisfied ? <CheckCircle /> : <Visibility />}
                  label={
                    unlockStatus.videoSatisfied
                      ? 'Videos complete'
                      : `${(unlockStatus.videoProgress || []).filter(v => v.completed).length}/${(unlockStatus.videoProgress || []).length} watched`
                  }
                  color={unlockStatus.videoSatisfied ? 'success' : 'default'}
                  sx={{ ml: 'auto' }}
                />
              )}
            </Box>

            {hasVideos ? (
              <Box>
                {/* Video Tabs */}
                {module.videoLinks.length > 1 && (
                  <Tabs
                    value={activeVideoIndex}
                    onChange={(e, v) => setActiveVideoIndex(v)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
                  >
                    {module.videoLinks.map((_, i) => {
                      const vp = unlockStatus?.videoProgress?.[i]
                      return (
                        <Tab
                          key={i}
                          label={`Video ${i + 1}`}
                          icon={
                            vp?.completed
                              ? <CheckCircle color="success" fontSize="small" />
                              : <PlayCircleOutline fontSize="small" />
                          }
                          iconPosition="start"
                        />
                      )
                    })}
                  </Tabs>
                )}

                {/* Video Players — use YouTube IFrame API */}
                {module.videoLinks.map((videoUrl, i) => {
                  const videoId = extractYouTubeId(videoUrl)
                  const vp = unlockStatus?.videoProgress?.[i]

                  return (
                    <Box key={i} sx={{ display: activeVideoIndex === i ? 'block' : 'none' }}>
                      {videoId ? (
                        <Box>
                          <YouTubePlayer
                            key={`${videoId}-${i}`}
                            videoId={videoId}
                            videoIndex={i}
                            onProgress={handleVideoProgress}
                            onEnded={handleVideoEnded}
                          />
                          {vp?.completed && (
                            <Chip
                              icon={<CheckCircle />}
                              label="Video watched ✓"
                              color="success"
                              size="small"
                              sx={{ mt: 1 }}
                            />
                          )}
                          {vp && !vp.completed && vp.watchedSec > 0 && (
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(100, (vp.watchedSec / Math.max(vp.durationSec, 1)) * 100)}
                              sx={{ mt: 1, height: 6, borderRadius: 3 }}
                            />
                          )}
                        </Box>
                      ) : (
                        <Alert
                          severity="info"
                          action={
                            <Button size="small" endIcon={<OpenInNew />} href={videoUrl} target="_blank" rel="noreferrer">
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

        {/* ── Start Quiz button ─────────────────────────────────────────── */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4, gap: 1 }}>
          {unlockLoading ? (
            <CircularProgress size={32} />
          ) : (
            <Tooltip
              title={
                !isUnlocked
                  ? 'Complete all requirements above to unlock the quiz'
                  : ''
              }
            >
              <span>
                <Button
                  variant={isCompleted ? 'outlined' : 'contained'}
                  size="large"
                  startIcon={
                    !isUnlocked
                      ? <Lock />
                      : isCompleted
                        ? <CheckCircle />
                        : <Quiz />
                  }
                  color={isCompleted ? 'success' : 'primary'}
                  onClick={() => navigate(`/module/${id}/quiz`)}
                  disabled={!isUnlocked}
                  sx={{ px: 6, py: 1.5 }}
                >
                  {!isUnlocked
                    ? 'Quiz Locked — Complete Requirements'
                    : isCompleted
                      ? 'Review Quiz (No XP)'
                      : 'Start Quiz'}
                </Button>
              </span>
            </Tooltip>
          )}
          {!unlockLoading && !isUnlocked && unlockStatus && (
            <Typography variant="caption" color="text.secondary">
              {!unlockStatus.videoSatisfied && 'Watch all videos · '}
              {!unlockStatus.readTimerSatisfied && `${formatSeconds(readingRemaining)} reading time remaining`}
            </Typography>
          )}
        </Box>

      </Paper>
    </Container>
  )
}
