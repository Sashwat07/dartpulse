# Product Requirements Document (PRD): DartPulse

**Product Name:** DartPulse  
**Tagline:** Track Every Throw. Own Every Match.  
**Document Status:** Draft  

---

## 1. Product Overview
**DartPulse** is a web-based dart match dashboard and analytics platform designed to allow players to track dart games, manage tournaments, analyze performance, and replay match insights. It combines live dart match scoring, tournament playoff brackets, leaderboard rankings, performance analytics, and gamification to create a premium esports-style interface. The experience should feel like a hybrid between an arcade-style gaming interface, a sports broadcast dashboard, and a performance analytics platform.

---

## 2. Target Audience & Core Goals

### Target Users
- **Casual Dart Players:** Friends looking for an intuitive, engaging way to track scores and determine winners.
- **Competitive Players:** Serious players wanting deeper insights, player rankings, statistics, and performance trends over time.

### Core Product Goals
1. Provide extremely simple, frictionless live match scoring.
2. Support tournament-style gameplay with structured playoffs.
3. Offer insightful post-match analytics and player tracking.
4. Introduce gamification to make matches more engaging (e.g., achievements, archetypes).
5. Deliver a premium, esports-style aesthetic that wows users at first glance.

---

## 3. Feature Breakdown

### 3.1 Match Management
Allows users to configure and start matches effortlessly.
- **Create Match:** Define match name, add players (in the desired base order), set the number of rounds, shots per round, optional playoff shots per round, and select game mode (casual or tournament).
- **Match Attributes:** Match Name, Players list (base order), Total Rounds, Shots Per Round, optional Playoff Shots Per Round (defaults to Shots Per Round if not set), Game Mode, Timestamp.
- **Base Player Order:** The default base order is the user-selected order when setting up the match. A "Shuffle Players" option may randomize this order. Shuffle is only allowed **before** the match starts. Once the match starts, the base order is fixed and cannot change.
- **Auto-Ranking:** Automatically assign rankings to players based on live match scores.

### 3.2 Live Match Scoring
The core dashboard used during active play.
- **Score Entry:** Each shot is recorded as a discrete event. Allowed shot values follow dart-style scoring: Single (1–20), Double (2×[1–20] → 2–40), Triple (3×[1–20] → 3–60). Quick buttons and/or modal for custom entry as needed.
- **Live Scoreboard:** The live match screen must display a scoreboard where:
  - Players are shown as rows.
  - Rounds are shown as columns.
  - Individual shot scores per player per round are visible (or summarised as desired).
  - Round total (sum of shots in that round) per player is visible.
  - Match total (sum of all round scores) per player is visible.
  - The current player row is highlighted.
  - The current round column is highlighted.
  - The scoreboard updates immediately after each shot.
  - The scoreboard is derived from recorded throw events; round scores and totals are not persisted independently.
- **Dashboards:** Track round progress, view the live leaderboard.
- **Live Match Insights:** Display current hot streaks, highest throw of the match, last bullseye, and round leader.

### 3.3 Dynamic Leaderboard
Tracks and ranks players during the match to identify playoff contenders. The dynamic leaderboard during a live match displays only match-specific statistics. Long-term player statistics are displayed in the Global Leaderboard.
- **Metrics Tracked:** Rank, Player Name, Round Score, Total Score.
- **Playoff Cutoff Indicator:** Visual line/highlight showing the top 4 players qualifying for playoffs.

### 3.4 Playoff System Structure
Triggered after regular rounds conclude. A top-4 elimination bracket. Once playoffs begin, match winners are determined by defined playoff rules (head-to-head match outcomes) rather than overall score rankings.
- **Qualifier 1:** Rank 1 vs Rank 2 
  - *Winner* → Final
  - *Loser* → Eliminator
- **Qualifier 2:** Rank 3 vs Rank 4
  - *Winner* → Eliminator
  - *Loser* → Eliminated
- **Eliminator:** Winner (Qualifier 2) vs Loser (Qualifier 1)
  - *Winner* → Final
  - *Loser* → Eliminated
- **Final:** Winner (Qualifier 1) vs Winner (Eliminator)
  - *Winner* → Crowned Champion

### 3.5 Match History & Detail Pages
- **Match History:** Browse past matches showing date, players, winner, total rounds, and key stats.
- **Match Detail Page:** Deep dive into a completed match.
  - Winner banner, overall summary, round timeline line chart.
  - Player performance breakdown.
  - Match Awards (e.g., Bullseye King, Longest Streak, Clutch Performer, Most Consistent).

### 3.6 Analytics Hub
Unified dashboard for deep gameplay insights.
- **Filters:** Season, Match, Player, Time Range.
- **Visualizations:**
  - Performance Radar Chart (Strengths/Weaknesses)
  - Score Trend Chart (Time-series data)
  - Score Distribution Histogram
- **Other Elements:** Summary metrics, leaderboard insights, achievements, and an auto-generated "Match Story".

### 3.7 Completed Match UX — Match Outcome Summary
When a regular match is completed (`match.status === "matchFinished"`), the UI must always show a **Match Outcome Summary** before the user navigates to playoffs or the final.

- **Visibility:** The Match Outcome Summary is always visible when the match is finished. It applies to all player counts (2, 3, and 4+ players).
- **Content:** It displays the **final ranking** (fully resolved, including any sudden-death tie-breaks) and, depending on player count:
  - **2 players:** Winner (no playoffs, no final).
  - **3 players:** Qualified players for the final; final pairing (rank 1 vs rank 2); who has the right to decide first throw for the final (rank 1).
  - **4+ players:** Qualified players for playoffs; initial playoff pairings (qualifier1 = rank 1 vs rank 2, qualifier2 = rank 3 vs rank 4); who has the right to decide first throw for each qualifier (qualifier1 → rank 1, qualifier2 → rank 3).
- **Placement:** The Match Outcome Summary is displayed **before** the “Go to playoffs” (or next-stage) navigation action. Qualification and pairings must come from the **fully resolved final regular-match ranking**; if sudden death was required to resolve ranking, that resolved ranking must be used. The UI must not infer ranking from raw totals alone.

### 3.8 Gamification
- **Achievements/Badges:** Bullseye King, Hot Streak, Comeback Player, Clutch Performer, Consistency Master.
- **Player Archetypes:** Sniper, Aggressor, Clutch Player, Consistent Player (assigned via logic based on their variance and peak scores).

#### Player Streak Tracking
Streak tracking rewards players across rounds or matches and may trigger achievements. Examples include:
- **Win Streak:** Consecutive matches won.
- **Bullseye Streak:** Consecutive bullseyes hit.
- **High Score Streak:** Consecutive high-scoring throws.

---

## 4. User Flows

### Flow 1: Match Setup to Live Gameplay
`Home` → `Create Match` → `Configure Players & Rounds` → `Start Match` → `Live Scoring Dashboard`.

### Flow 2: Live Gameplay to Playoffs
`Live Scoring Dashboard` (Round End) → `Final Leaderboard View` → `Auto-generate Playoff Bracket` → `Play Qualifier 1` → ... → `Final` → `Crowning Champion` → `Match Detail Summary`.

### Flow 3: Post-Match Analysis
`Home` → `Analytics` → `Select Player/Season` → `View Radar Chart & Trends`.

---

## 5. Key Screens / Navigation Structure

1. **Home:** Quick actions (Start Match), recent match summary, high-level global stats.
2. **Live Match:** The core scoring interface, active animations, live insights panel.
3. **Leaderboard:** Live rankings with playoff cutoff lines.
4. **Playoffs:** Interactive visual tournament bracket.
5. **Analytics:** Global and filtered charting dashboard.
6. **Match History:** Paginated list of past matches.
7. **Profile:** Individual player stats, archetypes, and achievements.
8. **Settings:** Preferences and system configurations.

---

## 6. UI Design Principles

To achieve the desired "arcade-meets-sports-broadcast" feel, follow these guidelines:
- **Theme:** Dark, immersive background to make UI elements pop.
- **Materials:** Glassmorphism (blur backgrounds) for panels and modals to feel modern and premium.
- **Accents:** Neon highlights for live score updates, hot streaks, and active states. Gold highlights exclusively reserved for winners and champions.
- **Motion:** Animated score feedback (e.g., numbers counting up, neon flash on bullseye). Micro-animations on hover and state changes.

---

## 7. Epics and Tasks (For AI/Cursor Workflow)

### Epic 1: Project Setup & UI Foundation
- [ ] Initialize Next.js / React project with TailwindCSS (or Vanilla CSS with variables if preferred).
- [ ] Setup base layout, navigation sidebar/header, routing.
- [ ] Define global design tokens (neon colors, glassmorphic utilities, dark background).
- [ ] Build reusable UI components (Glass Panels, Neon Buttons, Score Inputs).

### Epic 2: Match & State Management
- [ ] Design JSON/State schema for `Match`, `Player`, `Round`, `Throw`.
- [ ] Implement context/store to handle live match data mutations.
- [ ] Create Match Management screens (Create, Add Players).

### Epic 3: Live Scoring & Leaderboards
- [ ] Build the Live Dashboard layout (Scorepad left, Leaderboard right).
- [ ] Implement rapid score entry logic and round progression.
- [ ] Build the dynamic leaderboard component with the top 4 cutoff indicator.
- [ ] Implement live insights detection (hot streak logic, max score tracker).

### Epic 4: Playoff Engine
- [ ] Write logic to transition top 4 players from Leaderboard to Playoff state.
- [ ] Implement the UI bracket for Qualifier 1 & 2, Eliminator, and Final.
- [ ] Handle winner/loser state transitions sequentially to the Champion screen.

### Epic 5: Analytics & Gamification
- [ ] Implement Match History list and Detail views.
- [ ] Integrate charting library (e.g., Recharts or Chart.js) for radar/distribution.
- [ ] Write logic definitions for Archetypes and Awards based on match data history.
- [ ] Build the Profile and Unified Analytics interfaces.

---

## 8. Technical Considerations

- **State Management:** Because the Live Scoring and Playoff brackets are deeply stateful, robust state management (Zustand, Redux, or well-structured Context) is critical. Keep 'MatchState' immutable and track throw history to allow for 'undo' functionality.
- **Data Persistence:** Initially, LocalStorage or IndexedDB is sufficient for MVP to save match histories without a backend.
- **Animations:** Use Framer Motion or robust CSS transitions for the neon/arcade feel.
- **Charting:** Utilize lightweight graphing libraries for radar / timelines. Ensure they accept customized styling to match the neon dark theme.

---

## 9. MVP Scope vs. Future Roadmap

### MVP Scope (V1)
- Local setup (no backend required, LocalStorage persistent).
- Match creation and live quick-scoring.
- Live Leaderboard with Top 4 playoff cutoff.
- Automated Playoff bracket progression.
- Match Detail summary with simple awards.
- Unified dark/glassmorphic interface.

### Future Roadmap (V2+)
- **Seasonal Ranking System:** Global persistent Elo or ladder rankings across multiple sessions.
- **Dartboard Heatmap:** Visual click-to-score interface directly on a virtual dartboard.
- **AI Match Commentary:** LLM-driven flavor text during the match based on live events.
- **Online Multiplayer:** WebSockets for live remote play.
- **Mobile Native App:** Progressive Web App (PWA) or React Native migration for phone scorekeepers.
- **Player Performance Trends over Time:** Cross-match analytics.

---

## 10. Round System and Gameplay Mechanics
This section explains how rounds and shots work during a match, clarifying the gameplay loop for scoring operations.

### Match Configuration
- **totalRounds:** Number of rounds in the match.
- **shotsPerRound:** Number of shots each player takes per round (configurable; e.g. 1, 2, 3).
- **playoffShotsPerRound (optional):** Shots per player per playoff match round. If not specified, it defaults to **shotsPerRound**.

### Base Player Order
- **Default:** Base order = user-selected order when setting up the match.
- **Shuffle:** A "Shuffle Players" option may randomize this order. Shuffle is only allowed **before** the match starts. Once the match has started, the base order is fixed and cannot change.

### Regular Match Turn Order (Rotating Start)
Regular rounds follow a **rotating starting player** rule. The round order is the base order rotated so that a different player starts each round.

**Formula:** `startingPlayerIndex = (roundNumber - 1) mod playerCount`. The round order is the base order rotated by this index.

**Example** (base order B, A, C):
- Round 1: B → A → C  
- Round 2: A → C → B  
- Round 3: C → B → A  
- Round 4: B → A → C  

### Round Structure (Multi-Shot)
- A match consists of **totalRounds** rounds. In each round, every player takes **shotsPerRound** shots.
- **Turn order within a round:** Each player completes **all** of their shots for the round before the next player begins. The order of players within the round is determined by the rotating rule above.

**Example** (shotsPerRound = 3, round order B → A → C):  
B shot 1, B shot 2, B shot 3 → A shot 1, A shot 2, A shot 3 → C shot 1, C shot 2, C shot 3. A round completes when every player has taken all **shotsPerRound** shots.

- **Round score:** Sum of that player's shot scores in that round. **Match total:** Sum of all round scores for that player.
- **Score recording:** Each shot is recorded as one ThrowEvent. Round scores and match totals are derived from ThrowEvents (not stored independently).

### Shot Values
Allowed shot values are dart-style:
- **Single:** 1–20
- **Double:** 2×[1–20] → 2–40
- **Triple:** 3×[1–20] → 3–60

The UI must show individual shot scores, round total, and match total.

### Ranking and Tie-Breaker
- **Ranking recalculations:** After each round concludes, the live leaderboard rankings are recalculated based on the new total scores.
- **Tie-breaker handling:** If two players have the exact same score, ties are broken by the highest single throw in the match, followed by the highest total bullseyes. If still tied, they share the rank until the next round (or until sudden death resolves).

### Regular Match Ranking and Playoff Qualification
During the regular match phase, players are ranked by **highest total score** (from regular-round throws only). Playoff eligibility and match outcome depend on **player count**:

- **2 players:** No playoffs, no final. The player with the highest total score after regular rounds is the winner. If tied, sudden death determines rank 1 and rank 2.
- **3 players:** No qualifier or eliminator. The top 2 after regular rounds (and any tie-break) go directly to the final.
- **4 or more players:** The top 4 after regular rounds (and any tie-break) qualify for playoffs. Ranking order determines bracket seeding (Rank 1, Rank 2, Rank 3, Rank 4).

The regular-round scoreboard is based only on regular throws. Sudden-death scores must be visible in the live match UI in a **separate** area so users can see who hit what during tie-break; they are not mixed into the regular round columns.

### Winner Determination Logic
- During the regular match phase, the "winner" is the player with the highest total score after all regular rounds are completed (or, for 2 players, rank 1 after tie-break if tied).
- If two or more players have identical final scores (within a tied group), the following tie-breaking rules apply in order:
  1. Highest single throw in the match
  2. Highest number of bullseyes
  3. Highest score in the final round
  4. If still tied, sudden death is used.

**Sudden-Death Throw-Off**
If players remain tied after all standard tie-breaker checks, the tied players enter sudden death. Sudden death always consists of **exactly 1 shot per tied player** per cycle: only tied players participate; each cycle each tied player throws exactly one shot; **tied players maintain a fixed order during sudden death cycles**; the same allowed shot values apply. The player with the highest score in that cycle advances in rank. If a cycle partially resolves the group but still leaves an unresolved tie among a subset, sudden death **continues for the still-tied subset** only with 1 shot per player per cycle. If the tie persists, another cycle begins. Sudden-death scores must be shown clearly and separately in the live match UI. This rule applies both after regular rounds when determining playoff qualification and during playoff matches when determining which player advances.

These rules ensure deterministic ranking for playoffs and correct progression by player count.

### Playoff Match Structure
- Playoff matches (Qualifier 1, Qualifier 2, Eliminator, Final) always have **exactly one round**.
- In that round, each player takes **playoffShotsPerRound** shots (or **shotsPerRound** if playoffShotsPerRound is not specified).
- If the playoff round ends in a tie, **playoff sudden death** begins: **1 shot per player** per cycle until the tie is broken.

### Playoff First-Throw Decision
Before a playoff match begins, one player has the right to decide **who throws first**. The deciding player may choose:
- themselves, or  
- their opponent.

The chosen player is the **starting player** for that playoff match. This decision must be **persisted** (see Persisting First Throw below) so that recovery after refresh or reconnection is deterministic.

### Playoff Decision Rights (Who Decides Who Throws First)
- **3-player final:** Rank 1 decides who throws first.  
- **Qualifier 1:** Rank 1 decides who throws first.  
- **Qualifier 2:** Rank 3 decides who throws first.  
- **Eliminator:** The player with the **higher score in their immediately previous playoff match** decides who throws first. (This refers only to the score in that previous playoff match—not regular match totals or seed rank.)  
- **Final (4+ player bracket):** Winner of Qualifier 1 decides who throws first.

### Persisting First Throw
The first-throw decision must be persisted so that turn order is deterministic after refresh or reconnection. Each **PlayoffMatch** must store:
- **startingPlayerId** — the player who throws first in that playoff match.

Optionally:
- **decidedByPlayerId** — the player who had the decision right (for display or audit).

This ensures deterministic recovery and consistent replay of playoff matches.

### Playoff Winner Determination
Once playoffs begin, match winners are determined by defined playoff rules rather than overall score rankings (see Playoff System Structure). Playoff matches are head-to-head contests, clearly distinguishing between the regular match phase (ranking players) and the playoff phase (determining the champion).

### Playoff Undo
A completed playoff match can still be undone until the **first throw of the next dependent playoff match** is recorded.

**Dependency chain:**
- Qualifier 1 → Qualifier 2 (downstream)
- Qualifier 2 → Eliminator (downstream)
- Eliminator → Final (downstream)
- Final → no downstream match

**“Started”** means the first throw of that downstream playoff match has been persisted. The following do **not** count as started: the downstream match row exists; the downstream match is visible in the bracket; the downstream match is shown in the UI; first-throw choice exists but no throw has been recorded.

**Stage-specific undo rules:**
1. **Qualifier 1** — If Qualifier 2 has 0 throws, Qualifier 1 can still be undone. If Qualifier 2 has 1 or more throws, undo is blocked.
2. **Qualifier 2** — If Eliminator has 0 throws, Qualifier 2 can still be undone. If Eliminator has 1 or more throws, undo is blocked.
3. **Eliminator** — If Final has 0 throws, Eliminator can still be undone. If Final has 1 or more throws, undo is blocked.
4. **Final** — Always undoable (no downstream match).

Undo is scoped only to the current playoff match (the last throw of that `playoffMatchId`). Undo must never affect regular-match throws or throws from another playoff match. The server must decide whether playoff undo is allowed; the client must not determine bracket safety by itself.

### Backward Compatibility
Matches created before the multi-shot model (or without the new configuration) should behave as: **shotsPerRound = 1** and **playoffShotsPerRound = shotsPerRound**. This preserves existing match behaviour.

---

## 11. Live Match Interaction Rules
The Live Match UI must prioritize speed and minimal friction so scorekeepers can watch the game rather than the screen.
- **Active Player Highlight:** The UI clearly indicates the current active player with a glowing neon border or bright highlight.
- **Score Entry Workflow:** Each shot is recorded and advances within the round (same player takes all shotsPerRound shots in order, then the next player). Quick entry (buttons or custom) registers the score and advances to the next shot or next player as appropriate.
- **Round Progression:** When the current player has completed all shotsPerRound shots, focus moves to the next player. When the last player has completed all shots for the round, the system automatically transitions to the next round.
- **Score Animations:** Entering points triggers an animated feedback (e.g., numbers counting up dynamically, a neon flash for a high score or bullseye) to enhance the arcade feel.
- **Undo Functionality:** A prominent button to undo the last throw if a mistake was made, reverting the state instantly.
- **Editing Scores:** Users can click on any previous score within the current round to edit it without disrupting the flow.

---

## 12. Match Momentum and Story Analytics
The momentum analytics layer transforms raw numeric scores into storytelling insights to make matches highly engaging.
- **Momentum Timeline:** A visual chart showing who was leading the match after each round.
- **Comeback Detection:** System identifies and highlights when a player climbs from a lower rank (e.g., last place) to a significantly higher rank or the lead.
- **Clutch Performance:** Measures and rewards performance in the final rounds of the match (e.g., scoring high when the pressure is on).
- **Match Story:** Automatically generates a short, engaging narrative summary of the match (e.g., "Player A dominated early, but Player B delivered a clutch final round to steal the win!").
- **Round Heatmap:** A visual grid showing player performance across rounds, with color-coded intensity (brighter colors for higher scoring rounds).
- **Match Energy Meter:** Calculates overall match intensity based on score variance, back-and-forth lead changes, and high-score density.

---

## 13. Player Data Model
The player profile data structure supports analytics and individual player profiles. Key attributes include:
- `player_id`: Unique identifier for the player.
- `player_name`: Display name.
- `avatar`: URL or reference to the player's profile image/icon.
- `matches_played`: Total number of matches participated in.
- `wins`: Total matches won.
- `average_round_score`: The player's lifetime average score per round.
- `best_throw`: The highest single score the player has ever recorded.
- `archetype`: The assigned gameplay style based on historical data (e.g., Sniper, Aggressor).
- `achievements`: An array of earned badges/awards (e.g., Bullseye King).

---

## 14. Match Data Model
This conceptual structure describes match-related data and the relationships between entities for the architecture phase.
- **Match:** The root entity. Contains match metadata (name, rules, timestamp), **totalRounds**, **shotsPerRound**, optional **playoffShotsPerRound**, **basePlayerOrder** (persisted fixed order of playerIds used for rotating turn order; set at setup/shuffle and must not change after match start), and multiple `Rounds`. Round score is derived from the sum of shot scores in that round; match total is derived from the sum of round scores.
- **Round:** A logical grouping. In the regular match, each round has **shotsPerRound** shots per player; round score = sum of those shots. Contains multiple `Throws` (one ThrowEvent per shot).
- **Throw (ThrowEvent):** One shot. Linked to a specific `Player` and records the exact score and timestamp. ThrowEvent remains per shot; round score and match total are derived.
- **Player:** The user entity participating in the match.
- **PlayoffMatch:** A specialized match entity representing a head-to-head bracket game (e.g., Qualifier, Eliminator, Final), linking back to the original regular `Match`. Each playoff match has one round; each player takes **playoffShotsPerRound** (or **shotsPerRound**) shots in that round. Each PlayoffMatch stores **startingPlayerId** (who was **actually chosen** to throw first) and optionally **decidedByPlayerId** (who **had the right** to choose who throws first) so that first-throw and recovery are deterministic.
- **Relationships:**
  - `Match` → contains multiple `Rounds`
  - `Round` → contains multiple `Throws` (shots)
  - `Throw` → linked to `Player`
  - `PlayoffMatch` → linked to `Match` (as the parent tournament context) and exactly two `Players`.

---

## 15. Error Handling and Score Correction
To ensure real gameplay usability, the system must gracefully handle scoring mistakes.
- **Undo Last Throw:** A one-click action that removes the immediate previous throw and reverts the active player state.
- **Edit Round Score:** Ability to tap on a specific player's throw in the current or previous rounds to manually correct a typo.
- **Confirm Round Completion:** Optional setting (or default behavior) that requires the scorekeeper to quickly confirm the visual summary of the round's scores before locking them in and starting the next round.

---

## 16. Analytics Extensions
Additional metrics extend the core analytics system to improve player engagement and provide deeper insights.
- **Highest Throw:** Tracks the absolute highest single-throw score achieved by a player during a season or all-time.
- **Fastest Finish:** Measures the player who secured the strongest closing performance in the final rounds of the match, typically achieving the highest score increase during the final phase of gameplay.
- **Comeback Player:** Metric tracking how often a player wins after being in the bottom half of the leaderboard at the midpoint of the match.
- **Round Consistency:** Measures the standard deviation of a player's round-by-round scores. Lower variance results in a higher "Consistency" rating.

---

## 17. Bullseye Definition
A Bullseye represents hitting the center of the dartboard. In the MVP scoring model, this corresponds to **50 points**. 
Bullseye events are used for:
- tie-breakers
- achievements
- analytics metrics

---

### 17.1 Dart Scoring Model
A throw score is calculated using a **multiplier** and **board value**.

**Multipliers**
- **S (Single)** → 1×
- **D (Double)** → 2×
- **T (Triple)** → 3×

**Board values:** 1–20

**Special:** Bull = 50

**Examples**
- S20 = 20  
- D20 = 40  
- T20 = 60  
- Bull = 50  

**Maximum single throw score:** 60  

**Maximum round score:** shotsPerRound × 60  

*Scoring constants are centralized in `constants/gameRules.ts` (DART_SCORE_MIN, DART_SCORE_MAX, BULLSEYE_SCORE) and `constants/scoringLimits.ts` (MAX_SINGLE_SHOT = 60, BIG_THROW_THRESHOLD = 50, getMaxRoundScore(shotsPerRound)). These constants are used by throw validation, analytics, and achievements.*

---

## 18. Score Metric Definitions
It is important to clarify the difference between throw-level and round-level scoring metrics to prevent ambiguity in analytics calculations.
- **`average_throw_score`**: total throw points / total throws
- **`average_round_score`**: total points / total rounds
- **`best_throw`**: the highest score achieved in a single throw
- **`total_match_score`**: the cumulative score for a player across all completed rounds

---

## 19. Match Leaderboard vs Global Leaderboard
There are two different leaderboard contexts in the application:

### Match Leaderboard
Used during live gameplay. The match leaderboard determines playoff qualification.
- `rank`
- `player`
- `round_score`
- `total_score`

### Global Leaderboard
Used for player statistics across matches for long-term analytics.
- `matches_played`
- `wins`
- `average_round_score`
- `best_throw`
- `achievements`

---

## 20. Scoring System Flexibility
DartPulse supports configurable scoring models to ensure the architecture remains flexible for different scoring modes.
- **Shot values (dart-style):** Single (1–20), Double (2×[1–20] → 2–40), Triple (3×[1–20] → 3–60). The UI shows individual shot scores, round total, and match total.
- **Configurable shots per round:** Regular match uses **shotsPerRound**; playoff matches use **playoffShotsPerRound** (defaulting to shotsPerRound when not set). Sudden death always uses 1 shot per player per cycle.
- **Future extensions:** Additional scoring modes (e.g. Cricket, 301) may be introduced; the event-per-shot model supports them.

---

## 21. Match State Machine
The match lifecycle is managed through a state machine to help manage UI transitions and prevent inconsistent game states. Example states include:
- `MatchCreated`
- `MatchStarted`
- `RoundActive`
- `RoundComplete`
- `PlayoffPhase`
  - `Qualifier1Active`
  - `Qualifier2Active`
  - `EliminatorActive`
  - `FinalActive`
- `MatchFinished`

These sub-states within the Playoff Phase explicitly help manage UI transitions and playoff bracket progression.

---

## 22. Match Data Persistence Strategy
**MVP Requirement:** Use LocalStorage or IndexedDB to persist data, allowing match history to function without requiring a backend. 
- Data to persist includes: `players`, `matches`, `rounds`, `throws`, and `playoff bracket results`.
- **Future Roadmap:** Future versions may introduce a cloud database for cross-device sync and centralized global leaderboards.

---

## 23. Match Event History
Each shot is recorded as one discrete ThrowEvent to enable undo, analytics, and momentum visualizations. Round score and match total are derived from the sum of shot scores.
- **Event Payload (per shot):**
  - `event_id`
  - `match_id`
  - `player_id`
  - `round_number`
  - `score`
  - `timestamp`
  - (and any shot index / turn index as needed for ordering within a round)

---

## 24. Analytics Calculation Concepts
Key analytics metrics are calculated using the following concepts:
- **Momentum Score:** Calculated by measuring leaderboard rank changes across rounds.
- **Clutch Performance:** Calculated by comparing the average score in the final two rounds to the overall average score.
- **Match Energy:** Computed using score variance and the frequency of lead changes.
- **Round Consistency:** Measured using the statistical score variance across rounds.

---

## 25. Accessibility and Usability Requirements
The UI must remain usable in environments such as bars or clubs where lighting conditions vary.
- Dart-style score input (multiplier S/D/T/Bull + number 1–20) for quick, error-free entry.
- High contrast colors for readability in dark environments.
- Clear active player indicators.
- Responsive layout to ensure it works beautifully on tablets and desktops.

---

## 26. Design System Consistency
All UI components must follow a strict, consistent design system, utilizing reusable components across screens.
- Elements include: glassmorphism panels, neon accent colors, and a dark theme background.
- Emphasize consistent spacing and typography throughout the application.
