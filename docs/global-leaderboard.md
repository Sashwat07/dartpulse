# Global Leaderboard (`/leaderboard`)

## Purpose

The **global leaderboard** is a cross-player ranking page. It is **not** the per-match leaderboard used during live scoring (`/match/[matchId]`). It aggregates results across **all completed matches** only.

## Scope

- **Completed matches only** (`match.status === "matchFinished"`). In-progress matches are excluded.
- **Read-only.** No edits; data is server-derived from persisted match history and throw events.

## Ranking basis: final resolved placement

- Each completed match contributes **one final placement per participant** (rank 1 … rank N).
- Placement is **canonical**: same rules as history / completed-match summary. Do not double-count regular-match rank and playoff result separately.
- **2 players:** Final placement = regular-match resolved ranking (rank 1 = winner).
- **3 players:** Rank 1 = playoff final winner, rank 2 = final loser, rank 3 = player who did not reach the final.
- **4+ players:** Ranks **1–4** are derived from the **completed playoff bracket**: **1st** = final winner, **2nd** = final loser, **3rd** = Qualifier 2 loser, **4th** = eliminator loser (3rd vs 4th match). Ranks **5+** are the **canonical regular-match ranking** for players **outside** the playoff qualifiers (top four by regular total), unchanged in order vs. regular leaderboard ranks 5, 6, …

Global metrics (wins, podiums, average finish) use only these final placements. Scoring metrics (total points, average score per round, best throw) follow **Phase 9 analytics** semantics (completed matches; regular-match throws only; exclude playoff throws; include sudden death within the regular match).

## Tabs and default ranking model

The page exposes tabs; each tab applies a **sort order** to the same standing rows (no separate ranking engine per tab).

| Tab | Sort order (then tie-breakers) |
|-----|--------------------------------|
| **Overall** (default) | Wins DESC, average finish ASC, average score per round DESC, best throw DESC |
| **Wins** | Wins DESC, average finish ASC, average score per round DESC |
| **Avg Score** | Average score per round DESC, best throw DESC, wins DESC |
| **Total Points** | Total points DESC, wins DESC |

## Future extension (not default)

A **weighted-score** model (e.g. place points for 1st/2nd/3rd plus bonuses) may be added later as an **optional** tab or mode. The default model remains wins + finish + performance metrics as above. Implementation should stay structured so a weighted tab can be added without replacing the canonical default.

## Domain ownership

- **Final resolved placement** per completed match is defined in the shared **history / match-history layer** (e.g. `getFinalPlacementFromPayload`), not only inside the leaderboard feature. The leaderboard consumes that helper; history and analytics may reuse it where placement is needed.
