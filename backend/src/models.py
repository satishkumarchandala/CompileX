from typing import List, Optional, Dict, Any

# ─────────────────────────────────────────────
#  XP → Level mapping
# ─────────────────────────────────────────────
XP_THRESHOLDS = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200]

def level_for_xp(xp: int) -> int:
    """Return the level (1-indexed) for a given XP value."""
    level = 1
    for i, threshold in enumerate(XP_THRESHOLDS, start=1):
        if xp >= threshold:
            level = i
    return level


def xp_for_next_level(xp: int) -> int:
    """Return the XP required to reach the next level, or 0 if max level."""
    current = level_for_xp(xp)
    if current >= len(XP_THRESHOLDS):
        return 0
    return XP_THRESHOLDS[current] - xp


# ─────────────────────────────────────────────
#  Badge constants
# ─────────────────────────────────────────────
BADGE_PERFECT        = 'Perfect Score'
BADGE_QUICK          = 'Quick Learner'
BADGE_MODULE_MASTER  = 'Module Master'
BADGE_CONTEST_WINNER = 'Contest Winner'
BADGE_FIRST_STEP     = 'First Step'      # complete first module
BADGE_SPEED_DEMON    = 'Speed Demon'     # finish quiz in under 60 s
BADGE_STREAK_3       = 'On a Roll'       # 3 modules passed in a row

ALL_BADGES = [
    BADGE_PERFECT,
    BADGE_QUICK,
    BADGE_MODULE_MASTER,
    BADGE_CONTEST_WINNER,
    BADGE_FIRST_STEP,
    BADGE_SPEED_DEMON,
    BADGE_STREAK_3,
]


# ─────────────────────────────────────────────
#  Role constants
# ─────────────────────────────────────────────
ROLE_SUPER_ADMIN = 'super_admin'
ROLE_ADMIN       = 'admin'
ROLE_STUDENT     = 'student'

VALID_ROLES = {ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_STUDENT}
