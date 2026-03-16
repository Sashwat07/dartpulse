# Design System: DartPulse

## 1. Design Philosophy
DartPulse aims to deliver a **gamified analytics experience** that feels like a professional esports analytics console.

**Key principles:**
- Competitive sports dashboard feel.
- Futuristic neon arcade theme.
- Focus strictly on readability despite the heavy use of glow effects.
- Glass panels floating over dark, deep backgrounds.
- Intentional motion used clearly to emphasize scoring events and progression.

---

## 2. Color Palette
The color system emphasizes high-contrast dark modes punctuated by saturated neon lighting.

**Theme support:** DartPulse supports **dark mode** (default) and **light mode**. Theme is controlled via CSS variables in `app/globals.css` (`:root` = light, `.dark` = dark) and switched with the theme toggle in the TopBar (persisted in `localStorage` under `dartpulse-theme`). Use semantic tokens (e.g. `background`, `foreground`, `glassBackground`, `surfaceSubtle`, `surfaceHover`) so components adapt to both themes; avoid hardcoded `bg-white/*` or `text-white` outside of theme-aware variables.

### Base Background
- **Primary background:** Deep navy / midnight blue (`#0B0F1A`).
- **Secondary background:** Subtle blues and purples.

### Primary Neon Accent
- **Color:** Neon Cyan (`#00E5FF`).
- **Used for:** Buttons, interactive highlights, active navigation styling, chart highlights, and selected rows.

### Victory / Champion Color
- **Color:** Gold (`#FFD700`).
- **Used for:** The #1 leaderboard row, season champion badges, and trophy icons.

### Secondary Accent
- **Color:** Neon Purple (`#A855F7`).
- **Used for:** Analytics graphs, achievement badges, and secondary UI emphasis.

### Status Colors
- **Success:** `#22C55E`
- **Warning:** `#F59E0B`
- **Error:** `#EF4444`
- **Neutral:** `#9CA3AF`

### Gradients
Standardized gradients used across the UI:
- **Primary background gradient:** `linear-gradient(180deg, #0B0F1A 0%, #0E1628 100%)` (Used for main background views)
- **Primary neon gradient:** `linear-gradient(90deg, #00E5FF 0%, #38BDF8 100%)` (Used for primary buttons and active highlights)
- **Victory gradient:** `linear-gradient(90deg, #FFD700 0%, #FACC15 100%)` (Used for champion badges and winning elements)

---

## 3. Glassmorphism System
To create depth, UI layers rely heavily on a standardized glass panel style. Panels should appear as **floating translucent layers**.

**Properties:**
- **Background:** `rgba(255,255,255,0.05)`
- **Border:** `rgba(255,255,255,0.15)`
- **Blur:** `backdrop-filter: blur(20px)`

**Used for:** Cards, side panels, analytics widgets, and match setup panels.

---

## 4. Glow / Elevation / Shadow System
Neon glow and shadows define visual hierarchy and interactive depth.

### Elevation / Shadow System
Consistent shadow levels establish visual hierarchy:
- `panelShadow`: `0 10px 40px rgba(0,0,0,0.4)` (Used for resting glass panels)
- `hoverShadow`: `0 12px 50px rgba(0,0,0,0.5)` (Used when interacting with elevated cards)
- `glowShadow`: `0 0 15px rgba(0,229,255,0.6)` (Used for active states and neon emphasis)

### Glow Effects
Neon glow is used sparingly to emphasize key interactive elements.
- **Primary Glow:** Cyan glow.
  - *Example:* `box-shadow: 0 0 10px rgba(0,229,255,0.6)`
- **Leaderboard Glow:** Stronger highlighting for elite rank.
  - *Golden glow example:* `box-shadow: 0 0 15px rgba(255,215,0,0.7)`

---

## 5. Typography
Hierarchy relies on bold weights to recreate esports broadcast aesthetics.

- **Primary font:** `Inter`
- **Fallback:** `system-ui`

**Scales:**
- **H1:** 48px (Bold)
- **H2:** 36px (Bold)
- **H3:** 24px (Bold)
- **Body text:** 16px
- **Small labels:** 14px

**Numbers:** Scores, statistics, and numeric tracking should always use a **semi-bold weight** to ensure clarity.

### Typography Weights
Standard weight tokens and their recommended usage:
- `regular` = 400 (Body text, standard labels)
- `medium` = 500 (Secondary headers, less dominant states)
- `semibold` = 600 (Scores, statistics, numeric tracking, and prominent labels)
- `bold` = 700 (H1/H2/H3 headings, emphasis)

---

## 6. Layout System
The layout provides structured, predictable spacing.

**Main Layout:**
- Left navigation sidebar.
- Top page header.
- Main content area.
- **Constraint:** `mainContentMaxWidth = 1440px`. The dashboard should cleanly center content on very large horizontal screens.

**Spacing System:**
- **Grid spacing:** Built on an 8px base unit.
- **Common paddings:** 16px, 24px, 32px.

### Spacing Tokens
Consistent spacing limits arbitrary bounds:
- `space1` = 8px
- `space2` = 16px
- `space3` = 24px
- `space4` = 32px
- `space5` = 48px

### Border Radius System
Standardized radius tokens used consistently across UI elements:
- `cardRadius` = 16px (Used for GlassCards)
- `panelRadius` = 20px (Used for main layout panels)
- `buttonRadius` = 12px
- `pillRadius` = 999px (Used for fully continuous round elements)

---

## 7. Navigation Design
The primary sidebar anchors the application experience.

- **Structure:** Icons + text label.
- **Active state:** Should feature a neon cyan glow and a subtle background highlight indicating selection.
- **Hover state:** Items should softly glow upon mouse-over.

---

## 8. Component Visual Guidelines

### GlassCard
- **Used for:** Leaderboards, analytics panels, and match cards.
- **Style:** Glass background, soft semi-transparent border, and rounded corners (`16px`).
- **Example CSS Framework:** `GlassCard` is the base container mapping used for most panels.
  ```css
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.15);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.4);
  ```

### Buttons
- **Primary Button:** High-contrast neon cyan gradient background.
- **Secondary Button:** Glassmorphic background with a sharp neon cyan border.

**Button Sizes:**
Standardized button sizing applies consistently across the UI:
- `small`: height `32px`, padding `0 12px`
- `default`: height `40px`, padding `0 16px`
- `large`: height `48px`, padding `0 24px`

### Player Chip Component
- **Used for:** Selecting players during match creation UI.
- **Structure:** Glass background, strictly using `pillRadius`, containing a small avatar, player name, and an optional remove icon.

### Leaderboard Rows
The top 3 rows visually stand apart to heavily gamify match positioning:
- **#1:** Gold glow.
- **#2:** Silver accent.
- **#3:** Bronze accent.

### Live Scoreboard (Round-by-Round Table)
The live match scoreboard presents players as rows and rounds as columns. Visual behavior:
- **Layout:** Players as rows; rounds as columns; a dedicated total column (emphasized). Each cell may show round total (sum of shots in that round) and/or individual shot scores as required by the game model (see docs/prd.md). Turn order follows the **rotating start** rule (base order rotated by round).
- **Current player row:** Highlight the row for the player whose turn it is (e.g. neon border or background).
- **Active round column:** Highlight the column for the current round.
- **Style:** Dark neon glassmorphism consistent with GlassCard and panel tokens; remain readable as the number of rounds increases (e.g. horizontal scroll for many rounds if needed).
- **Data source:** All cell values and totals are derived from ThrowEvent records (one per shot) via selectors; round score = sum of shots in that round; no independent persistence of scoreboard data.
- **Regular vs sudden-death:** Regular rounds and sudden-death scores must be visually distinguishable. The sudden-death score display must be separate, clear, and readable; do not mix sudden-death score columns into the regular rounds table.

### Match Outcome Summary (Completed-Match UI Block)
When the regular match is complete, a **MatchOutcomeSummary** component or section must be shown before the user can navigate to playoffs or the final. It supports:

1. **Final Ranking list**
   - Displays rank number and player name for each player, in final resolved order (including any sudden-death resolution).
   - Data must come from the same final resolved ranking source as playoff creation; do not derive from raw totals alone.

2. **Outcome block**
   - **2 players:** Winner (no playoffs, no final).
   - **3 players:** Qualified for Final (rank 1 and rank 2).
   - **4+ players:** Qualified for Playoffs (top 4).

3. **Pairing preview**
   - **3 players:** Final pairing (rank 1 vs rank 2).
   - **4+ players:** Qualifier1 pairing (rank 1 vs rank 2) and Qualifier2 pairing (rank 3 vs rank 4).

4. **Decision-right text**
   - Who has the right to decide first throw for the next stage: rank 1 for the 3-player final and for Qualifier1; rank 3 for Qualifier2 (4+ players).

**Placement:** The Match Outcome Summary appears after the regular match is complete and **before** “Go to playoffs” or other next-stage navigation.

### Playoff Match UI
- **First-throw decision:** Before a playoff match begins, the UI must allow the player with **decision rights** (see docs/prd.md) to choose who throws first (themselves or their opponent). The chosen **starting player** must be clearly indicated and persisted (**startingPlayerId** on PlayoffMatch) so that recovery after refresh is deterministic.
- **Playoff undo:** When a completed playoff match is still undoable (next dependent match has not yet recorded a throw), the UI may show a message such as: “Result recorded. Undo available until the next playoff match starts.” The **blocked** state (undo disabled or hidden) should occur only when the downstream dependent playoff match has **started** — i.e. has at least one persisted throw. Downstream match existence, bracket visibility, or first-throw choice alone must not cause the blocked state; the server determines allow/block.

### Avatar System
Player avatar design rules:
- **Border Radius:** `999px`
- **Sizes:**
  - `small` = 32px
  - `medium` = 48px
  - `large` = 96px
- Avatars may optionally use a **neon cyan ring** to denote active player tracking.

---

## 9. Motion & Animation
Animations are driven globally by **Framer Motion**, ensuring transitions are fast and silky smooth.

**Recommended durations:**
- 150ms
- 200ms

### Motion Easing Rules
Ensure consistent motion across score updates and leaderboard movement:
- **Standard easing:** `easeOut`
- **Spring animation defaults:** `stiffness = 200`, `damping = 20`

**Examples:**
- **Leaderboard position change:** Uses physical spring animation to bounce between ranks.
- **Score increase:** Heavy scale pulse (pop) to impact weight.
- **Panel hover:** Smooth glow intensity increase.

---

## 10. Charts & Analytics
All charting libraries must be styled to match the neon dark theme.
- **Lines:** Should emit a subtle glow but remain completely readable.
- **Containers:** All charts should be embedded strictly onto `GlassCard` backgrounds.

### Chart Color Rules
Chart series colors strictly assign to these tokens allowing high contrast against the glass panels:
- `primarySeries` → cyan (`#00E5FF`)
- `secondarySeries` → purple (`#A855F7`)
- `highlightSeries` → gold (`#FFD700`)
- `mutedSeries` → gray (`#9CA3AF`)

---

## 11. Icons
The application implements **Lucide Icons** exclusively. 

**Game-specific icons include:**
- dart
- bullseye
- trophy
- chart
- crown

**Style Rule:** All icons should maintain a strict **monoline style**.

### Icon Size System
Defined sizing for internal glyph constraint:
- `small` = 16px
- `default` = 20px
- `large` = 24px
- `navigation` = 28px

---

## 12. Asset Strategy
Static assets follow an organized domain inside the `/public` root.

```text
public/
  icons/
  dartboard/
  achievements/
  avatars/
  logos/
```
**Format:** Assets should be predominantly structured as vector **SVGs**.

---

## 13. Design Tokens for Tailwind
These specific tokens must be explicitly defined inside the Tailwind configuration to enforce consistency without arbitrary values stringed throughout the repository.

**Required Tokens Framework:**
- `colors.primaryNeon`
- `colors.championGold`
- `backgrounds.glassBackground`
- `borders.glassBorder`
- `boxShadow.panelGlow`

---

## 14. Accessibility Guidelines
DartPulse must maintain professional readability despite its neon/glow-heavy styling.

**Rules:**
- Content contrast ratios (text vs. background) must remain accessible.
- Avoid using heavy glow effects on standard body text. Ensure glow effects entirely do not reduce text readability.
- Ensure buttons rely on solid legibility rules in addition to their neon boundaries.
- **Keyboard focus ring:** Ensure strict application tracking via `focusRing = 2px solid #00E5FF`.
