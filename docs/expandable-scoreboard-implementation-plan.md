# Expandable Scoreboard Rows — Implementation Plan

**Status:** Planning only. Do not implement code until approved.

**Goal:** Replace the standalone Shot History section with inline expandable scoreboard rows on both Live Match and History Detail. Clicking a player row expands that player’s shot history (regular + sudden death) directly under the row. One row expanded at a time.

---

## 1. Repository / Component Analysis

### 1.1 Live Match surface

| Asset | Role |
|-------|------|
| [features/liveMatch/components/LiveMatchScoring.tsx](features/liveMatch/components/LiveMatchScoring.tsx) | Renders ScoreTable, SuddenDeathScoreSection, ShotHistorySection in sequence. |
| [features/liveMatch/components/ScoreTable.tsx](features/liveMatch/components/ScoreTable.tsx) | Single GlassCard "Scoreboard"; table with thead + tbody; maps `table.rows` to ScoreTableRow. Data from `selectRoundScoreTable`, `selectThrowEvents`, `selectActiveMatch`. |
| [features/liveMatch/components/ScoreTableRow.tsx](features/liveMatch/components/ScoreTableRow.tsx) | One `<tr>` per player: Player cell (name + ShotDots), round cells, Total. No expand behavior. Props: `row` (RoundScoreRow), `roundNumbers`, `currentRound`, `isCurrentPlayer`, `shotsTaken`, `shotsPerRound`. |
| [features/liveMatch/components/ShotHistorySection.tsx](features/liveMatch/components/ShotHistorySection.tsx) | Standalone GlassCard "Shot history". Uses `selectShotHistoryDisplay` (store); renders internal `ThrowsList` for "By round" and "Sudden death" (all players). |

**Live data:** `RoundScoreRow` (store/selectors) = `playerId`, `playerName`, `roundScores`, `totalScore`. `ShotHistoryDisplay` (store/selectors) = `regular: ThrowEvent[]`, `suddenDeath: ThrowEvent[]` (same shape as [lib/shotHistoryDisplay.ts](lib/shotHistoryDisplay.ts)). No change to selectors or derivation.

### 1.2 History Detail surface

| Asset | Role |
|-------|------|
| [app/history/[matchId]/page.tsx](app/history/[matchId]/page.tsx) | Server component; loads payload, renders HistoryScoreTable(table), sudden-death card (if any), then HistoryShotHistory(matchPlayers, totalRounds, shotHistoryDisplay). |
| [components/history/HistoryScoreTable.tsx](components/history/HistoryScoreTable.tsx) | Read-only GlassCard "Scoreboard"; table with same column structure (Player, R1…Rn, Total). Rows are plain `<tr>` with no expand. Props: `table: RoundScoreTable` (from [lib/roundScoreTable.ts](lib/roundScoreTable.ts)). |
| [components/history/HistoryShotHistory.tsx](components/history/HistoryShotHistory.tsx) | Standalone GlassCard "Shot history". Props: `matchPlayers`, `totalRounds`, `shotHistoryDisplay` (type from [lib/shotHistoryDisplay.ts](lib/shotHistoryDisplay.ts)). Internal `ThrowsList` for "By round" and "Sudden death". |

**History data:** `RoundScoreTable` / `RoundScoreRow` from lib (same row shape as live). `shotHistoryDisplay` from payload (getMatchHistoryPayload). No change to payload or derivation.

### 1.3 Shared display model

- **Shot history:** Both surfaces use the same logical model: `{ regular: ThrowEvent[], suddenDeath: ThrowEvent[] }` (regular + sudden death, no playoff). Live: from store `selectShotHistoryDisplay`. History: from payload `shotHistoryDisplay` (derived in [lib/matchHistory.ts](lib/matchHistory.ts) via [lib/shotHistoryDisplay.ts](lib/shotHistoryDisplay.ts)).
- **Per-player filtering:** For expandable content, filter `regular` and `suddenDeath` by `row.playerId`. No new selectors or API; presentational filtering only.
- **ThrowsList pattern:** Both ShotHistorySection and HistoryShotHistory use an internal `ThrowsList(throws, matchPlayers, label, roundLabel)` that groups by round and renders "Name score" per throw. For per-player expansion, reuse the same grouping/labels but either pass single-player throws and keep "Name score" or show only scores (e.g. "R1: 6, 7") for a more compact expansion. Recommendation: single shared component that accepts optional `playerId`; when set, filter throws and show only scores in the list to keep expansion compact.

### 1.4 Playoffs

- Playoffs do **not** use ScoreTable, HistoryScoreTable, or the same scoreboard component. They use [features/playoffs/components/ActivePlayoffMatch.tsx](features/playoffs/components/ActivePlayoffMatch.tsx) and their own "Shot history" block.
- **Out of scope:** No change to playoffs for this work.

---

## 2. Files to Modify

| File | Change |
|------|--------|
| [features/liveMatch/components/LiveMatchScoring.tsx](features/liveMatch/components/LiveMatchScoring.tsx) | Remove import and usage of `ShotHistorySection`. |
| [features/liveMatch/components/ScoreTable.tsx](features/liveMatch/components/ScoreTable.tsx) | Add expand state (`expandedPlayerId`), wire trigger and detail row; render per-player shot history in detail row (see Section 4). |
| [features/liveMatch/components/ScoreTableRow.tsx](features/liveMatch/components/ScoreTableRow.tsx) | Add optional expand trigger (shadcn Button or native button with aria-expanded/aria-controls) in first cell; optional `isExpanded`, `onToggle`, `ariaControlsId`. Do not make the whole `<tr>` the only click target. |
| [components/history/HistoryScoreTable.tsx](components/history/HistoryScoreTable.tsx) | Add expand behavior: accept optional `shotHistoryDisplay`, `matchPlayers`, `totalRounds`; when provided, render expandable rows and a detail row with per-player shot history (reuse shared shot-history content component). |
| [app/history/[matchId]/page.tsx](app/history/[matchId]/page.tsx) | Remove standalone `HistoryShotHistory`; pass `shotHistoryDisplay`, `matchPlayers`, `match.totalRounds` into `HistoryScoreTable` so it can render inline expansion. |
| New shared component (e.g. `components/shared/PlayerShotHistoryContent.tsx` or under `history/`) | Reusable per-player shot history UI: takes `playerId`, `regular`, `suddenDeath`, `matchPlayers`, `totalRounds`; filters throws by `playerId`; renders "By round" and "Sudden death" (compact, scores only or with label). Used inside both ScoreTable and HistoryScoreTable expansion content. |

**Optional / cleanup:**

- [features/liveMatch/components/ShotHistorySection.tsx](features/liveMatch/components/ShotHistorySection.tsx): Remove from layout; either delete or keep and export `ThrowsList` for reuse. Prefer extracting the list UX into the shared `PlayerShotHistoryContent` and then deleting or deprecating ShotHistorySection.
- [components/history/HistoryShotHistory.tsx](components/history/HistoryShotHistory.tsx): Remove from history detail page; component can be deleted or kept for reuse elsewhere. If shared content lives in `PlayerShotHistoryContent`, HistoryShotHistory is redundant.

---

## 3. Recommended Architecture

### 3.1 Table semantics preserved

- Scoreboard remains a real `<table>` with `<thead>` and `<tbody>`.
- Each player remains a normal `<tr>` (data row).
- An **additional detail row** is rendered immediately after the expanded player’s row: one `<tr>` with a single `<td colSpan={roundNumbers.length + 2}>`. The cell content is the player’s shot history (regular + sudden death).
- No conversion to cards or non-table layout.

### 3.2 One expanded row at a time

- State: `expandedPlayerId: string | null` (live: in ScoreTable; history: in HistoryScoreTable, which must become a client component or use a small client wrapper for expand state).
- Clicking a row’s expand trigger: set `expandedPlayerId` to that row’s `playerId` if currently null or different; if already expanded, set to `null` (collapse).
- Only one detail row is visible at any time.

### 3.3 Trigger vs content

- **Trigger:** A focusable control (button) inside the first cell of each data row, e.g. "Show shot history" / chevron. Not the entire `<tr>` as the only interactive element (accessibility and semantics).
- **Content:** The expanded content lives in the next row’s single cell; optionally wrapped with shadcn Collapsible for open/close animation, without wrapping `<tr>` elements (see Section 5).

### 3.4 Data flow (unchanged)

- **Live:** `selectRoundScoreTable`, `selectShotHistoryDisplay`, `matchPlayers`, `activeMatch.totalRounds` — no changes.
- **History:** `roundScoreTable`, `shotHistoryDisplay`, `matchPlayers`, `match.totalRounds` from existing payload — no changes.
- Per-player view: filter `shotHistoryDisplay.regular` and `shotHistoryDisplay.suddenDeath` by `row.playerId` in the UI only.

---

## 4. Minimal Implementation Strategy

### 4.1 Shared per-player shot history content

- Add a single shared component (e.g. `PlayerShotHistoryContent`) that:
  - Accepts `playerId`, `regular: ThrowEvent[]`, `suddenDeath: ThrowEvent[]`, `matchPlayers`, `totalRounds`.
  - Filters `regular` and `suddenDeath` by `playerId`.
  - Renders the same "By round" / "Sudden death" structure as current ThrowsList, but for one player (scores only in list items to keep expansion compact).
- Use this inside both live and history detail rows.

### 4.2 Live Match (ScoreTable)

1. Add `useState<string | null>(null)` for `expandedPlayerId`.
2. Subscribe to `selectShotHistoryDisplay` and `matchPlayers` / `activeMatch?.totalRounds`.
3. For each row, render `ScoreTableRow` with new props: `isExpanded={expandedPlayerId === row.playerId}`, `onToggle={() => setExpandedPlayerId(...)}`, and a stable `ariaControlsId` for the detail row.
4. Inside ScoreTableRow, add a **button** (or shadcn Button) in the first cell (e.g. icon-only chevron or "Shot history") that calls `onToggle` and has `aria-expanded`, `aria-controls`, and keyboard support.
5. After each `ScoreTableRow`, if `expandedPlayerId === row.playerId`, render a second `<tr>` with one `<td colSpan={...}>` containing `PlayerShotHistoryContent` with that row’s `playerId` and filtered throws.
6. Remove `ShotHistorySection` from `LiveMatchScoring`.

### 4.3 History Detail (HistoryScoreTable + page)

1. HistoryScoreTable currently receives only `table`. Extend props to optionally accept `shotHistoryDisplay`, `matchPlayers`, `totalRounds`. When these are provided, enable expandable behavior.
2. HistoryScoreTable must hold expand state; therefore it must be a client component ("use client") when expand is enabled, or a thin client wrapper (e.g. `HistoryScoreTableWithExpand`) that wraps the table and owns state. Recommendation: make HistoryScoreTable the client component and pass the extra props from the page.
3. Same pattern as live: one expand trigger per row (button in first cell), one detail row per table with `colSpan`, content = `PlayerShotHistoryContent`.
4. In [app/history/[matchId]/page.tsx](app/history/[matchId]/page.tsx): remove `<HistoryShotHistory ... />`; pass `shotHistoryDisplay`, `matchPlayers`, `match.totalRounds` into `HistoryScoreTable`.

### 4.4 Shot history section removal

- Live: already covered (remove ShotHistorySection from LiveMatchScoring).
- History: remove HistoryShotHistory from the history detail page once HistoryScoreTable renders inline expansion.

---

## 5. shadcn/ui Usage and Table Semantics

### 5.1 Current state

- The repo has custom UI primitives (Button, Card, etc.) and `cn()` but no existing Radix/shadcn Collapsible or Accordion. Plan assumes adding shadcn-style primitives where they improve consistency and accessibility.

### 5.2 Recommended use of shadcn

- **Collapsible:** Use for the **expanded content** only. Do not wrap `<tr>` in Collapsible (invalid: table rows cannot be direct children of a div). Structure:
  - Data row: `<tr>…<td><button aria-expanded aria-controls="…">…</button></td>…</tr>`.
  - Detail row: `<tr><td colSpan={…}><Collapsible open={expanded}><CollapsibleContent id="…">…PlayerShotHistoryContent…</CollapsibleContent></Collapsible></td></tr>`.
  - So: one `<Collapsible>` per expandable row, with `open` controlled by `expandedPlayerId === row.playerId`. Trigger is the button; content is inside the detail cell. Table semantics preserved; Collapsible only wraps the content div inside the cell.
- **Button:** Use shadcn Button (or existing project Button) for the expand trigger in the first cell (icon + optional "Shot history" text) for consistent focus and styling.
- **Separator:** Optional: use inside the expanded content between "By round" and "Sudden death" if the design system provides it and it improves readability.
- **Accordion:** Not recommended; we need single-open behavior and a table layout. Collapsible with external state is a better fit.

### 5.3 Balance

- **Table semantics:** Keep `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<td>` structure. No div-based card layout for the scoreboard.
- **shadcn:** Use for trigger (Button) and for content reveal (Collapsible content only, inside the detail cell).
- **Accessibility:** Trigger is a real button with aria-expanded and aria-controls; focus and keyboard handled by the button, not the row (see Section 6).

---

## 6. Accessibility Considerations

- **Keyboard access:** The expand control must be a focusable element (button). Support Enter and Space to toggle. Do not rely on the `<tr>` alone as the only interactive element; row click can be a secondary convenience (e.g. onClick on row that calls the same handler as the button) but the button must be the primary focusable control.
- **Focusable trigger:** Place a `<button>` (or shadcn Button) in the first cell of each data row. Use `aria-expanded={true|false}` and `aria-controls="id-of-detail-content"` so assistive tech knows the relationship. Use a stable `id` on the CollapsibleContent (or wrapper div) for the expanded player.
- **Expanded/collapsed state:** Expose via `aria-expanded`. Optional: `aria-label="Show shot history for {playerName}"` / "Hide shot history for {playerName}" depending on state.
- **Screen readers:** The detail row can be announced as part of the table; avoid redundant live regions unless we add dynamic announcements. Keeping the detail content in a table cell is sufficient for flow.

---

## 7. Responsive Considerations

- **Table scroll:** Both ScoreTable and HistoryScoreTable already sit in `GlassCard` with `overflow-x-auto`; horizontal scroll on narrow screens is unchanged. Ensure the new detail row does not force excessive width (e.g. shot history as a compact list, not a wide grid).
- **Readability of expanded content:** Keep the inline shot history compact: single column of "R1: 6, 7 · R2: …" and "Sudden death: …" so it stacks well on small viewports.
- **Avoid duplicate layouts:** Do not duplicate the full scoreboard in the expansion; only the list of throws for that player.
- **Touch:** Ensure the trigger button has a sufficient hit area (min touch target) on mobile.

---

## 8. Verification Checklist

- [ ] **Live Match:** Scoreboard rows are expandable; clicking the trigger expands that player’s shot history inline.
- [ ] **Live Match:** Clicking the same row again (or the same trigger) collapses the expansion.
- [ ] **Live Match:** Only one row can be expanded at a time (opening another collapses the first).
- [ ] **Live Match:** Standalone Shot History section is removed from the live match page.
- [ ] **Live Match:** Expanded content shows regular throws by round and sudden-death throws when present.
- [ ] **History Detail:** Same expand/collapse and single-open behavior on the scoreboard table.
- [ ] **History Detail:** Standalone Shot History section is removed from the history detail page.
- [ ] **History Detail:** Sudden-death throws appear correctly in the expanded row when present.
- [ ] **Data/logic:** No change to gameplay, scoreboard calculation, shot-history derivation, APIs, or history payload semantics.
- [ ] **Responsive:** Table still scrolls horizontally on narrow screens; expanded content remains readable and compact.
- [ ] **Accessibility:** Expand trigger is a button with aria-expanded and keyboard support; table structure preserved.

---

## 9. Out of Scope

- **Playoffs:** Unchanged. They do not use the same scoreboard component; no changes to ActivePlayoffMatch or playoff shot history.
- **Gameplay:** No changes to scoring, turn order, or match state.
- **Analytics:** No changes to analytics or leaderboard logic.
- **Routes/APIs:** No changes to routes or API contracts.
- **History payload:** `getMatchHistoryPayload` and `shotHistoryDisplay` derivation remain as-is; only consumption moves from a separate section to inline expansion.

---

## 10. Summary

| Surface | Scoreboard component | Shot history today | After change |
|---------|----------------------|--------------------|--------------|
| Live Match | ScoreTable (GlassCard + table) | ShotHistorySection (separate card) | Expandable rows; detail row with PlayerShotHistoryContent; ShotHistorySection removed |
| History Detail | HistoryScoreTable (GlassCard + table) | HistoryShotHistory (separate card) | Expandable rows; detail row with PlayerShotHistoryContent; HistoryShotHistory removed from page |

**Shared:** One reusable `PlayerShotHistoryContent` (or equivalent) for per-player shot history; same data shape (`ShotHistoryDisplay`) and filtering by `playerId`. **Table semantics** kept; **shadcn** used for trigger (Button) and content reveal (Collapsible inside detail cell only). **Single expanded row** and **regular + sudden death** in expansion as required.
