from typing import List, Optional, Dict, Any

def level_for_xp(xp: int) -> int:
    thresholds = [0, 100, 200, 350, 500, 700]
    level = 1
    for i, t in enumerate(thresholds, start=1):
        if xp >= t:
            level = i
    return level

BADGE_PERFECT = 'Perfect Score'
BADGE_QUICK = 'Quick Learner'
BADGE_MODULE_MASTER = 'Module Master'
BADGE_CONTEST_WINNER = 'Contest Winner'
