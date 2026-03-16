# Phase 12 — Charts & Data Visualization

**Status:** Final revision before implementation.  
**Dependencies:** Phase 11 complete.  
**Principle:** Reusable chart system across Analytics and Player Profile; no new backend unless strictly required; incremental, testable steps.

---

## 1. Goals

1. **Scope & sequence** — Task groups are well-scoped and run in a clear order.
2. **Incremental delivery** — Large tasks are broken into smaller steps so development can proceed step-by-step.
3. **Minimal backend** — No new APIs or backend changes unless clearly justified.
4. **Reusable chart system** — One chart system used on both Analytics and Player Profile pages.
5. **Library choice** — Recharts is chosen and documented as the chart library.
6. **Responsiveness** — Responsive behavior is explicitly specified and verified.

---

## 2. Chart Library: Recharts

**Choice:** [Recharts](https://recharts.org/) (React-only, composable, good TypeScript support).

**Rationale:**
- React-native API fits the existing component model.
- Composable building blocks (e.g. `LineChart`, `BarChart`, `XAxis`, `YAxis`, `Tooltip`) support shared wrappers and consistent theming.
- Theming via props and CSS variables aligns with the design system.
- No extra canvas or DOM abstraction layer; works with existing layout and GlassCard.

**Documentation:** This plan and the design system (Charts & Analytics) define the contract. Implementation will add a short `docs/charts-recharts.md` (or a section in `design-system.md`) that states Recharts as the standard and references color tokens, wrapper usage, and GlassCard embedding.

**Not in scope for Phase 12:** Evaluating or swapping to another library; Recharts is the chosen standard.

---

## 3. Design Constraints

- **Containers:** All charts render inside existing **GlassCard** components. Do not introduce new chart-specific container components.
- **Colors:** Use design-system chart tokens: `primarySeries`, `secondarySeries`, `highlightSeries`, `mutedSeries` (see design-system.md §10). Map to Recharts via theme or wrapper props.
- **Player profile data:** Player profile charts **only** use data already provided by existing analytics (e.g. `getPerPlayerAnalytics`, payloads used on history detail). No new APIs for “recent matches” or “ranking history” in this phase unless explicitly justified and called out.

---

## 4. Implementation Order

Work in this order so dependencies are clear and each slice can be tested on its own:

1. **Chart system foundation** — Wrappers, tokens, typography, spacing; one sample chart to validate.
2. **Analytics page charts** — Add or convert Analytics charts using the foundation.
3. **Player profile charts** — Add profile-specific charts using existing analytics data only.
4. **Heatmap enhancement** — Improve round heatmap (visual or UX) using the same system where applicable.
5. **Responsiveness verification** — Audit and fix breakpoints, overflow, and touch targets.

---

## 5. Task Groups

### Task Group 1 — Chart System Foundation

**Goal:** Reusable chart wrappers and shared styling so all charts share spacing, typography, and color tokens.

**Scope:** No new pages or new data; only shared infrastructure and one proof-of-concept chart.

**Steps:**

1. **Add Recharts**  
   - Add `recharts` to dependencies.  
   - Document the choice (e.g. in `docs/charts-recharts.md` or design-system) and reference design-system §10 for colors.

2. **Chart color tokens**  
   - Ensure chart color tokens are available where Recharts runs (e.g. CSS variables or a small `chartTheme.ts` that exports hex/values for `primarySeries`, `secondarySeries`, `highlightSeries`, `mutedSeries`).  
   - Align token names with design-system.md §10.

3. **Chart wrapper(s)**  
   - Introduce a small set of reusable wrappers (e.g. `ChartCard` or `ChartContainer`) that:  
     - Accept a title and optional description.  
     - Apply consistent internal padding and spacing.  
     - Render **inside** a GlassCard (wrapper composes GlassCard, not replaces it).  
     - Apply consistent typography for title/axis labels (e.g. existing card label style: `text-xs font-semibold uppercase tracking-wider text-mutedForeground`).  
   - Wrappers should not replace GlassCard; they sit inside it and provide consistent chart layout.

4. **Recharts theme / default props**  
   - Create a shared theme or default props (e.g. font family, font size, grid stroke, axis stroke) so every Recharts usage gets the same look without repetition.  
   - Use chart tokens for series colors.

5. **Proof-of-concept chart**  
   - Implement one simple chart (e.g. a single-series line or bar) inside a GlassCard using the wrapper and theme.  
   - Verify: spacing, typography, colors, and responsiveness at one breakpoint.  
   - No new API; use mock or existing analytics data.

**Verification:**
- [ ] Recharts is in dependencies and choice is documented.
- [ ] Chart tokens are defined and used by Recharts.
- [ ] At least one wrapper exists that composes with GlassCard and provides consistent title + spacing.
- [ ] One PoC chart renders correctly with the wrapper and theme.
- [ ] No new backend or API added.

---

### Task Group 2 — Analytics Page Charts

**Goal:** Add or convert Analytics page charts using the chart system; keep or refactor existing components (e.g. MomentumTimeline, MatchEnergyMeter) to use wrappers and tokens where applicable.

**Scope:** `/analytics` and history-detail analytics sections only. No new analytics APIs.

**Steps:**

1. **Audit current Analytics visuals**  
   - List existing components (e.g. MomentumTimeline, RoundHeatmap, MatchEnergyMeter, overview cards, top-by-wins/total-points).  
   - Decide which will become Recharts-based and which stay custom (e.g. list/table) but use the same wrappers/spacing/titles.

2. **Momentum / timeline (if converted to Recharts)**  
   - If MomentumTimeline is converted to a line/area chart: implement using shared wrapper + theme; data from existing `getMomentumTimeline(payload)`.  
   - If kept as list: ensure it uses the same card title style and spacing as other analytics blocks.  
   - Implement in one step; verify on history detail and optionally on a dedicated analytics view if applicable.

3. **Match energy / distribution (if applicable)**  
   - If MatchEnergyMeter or similar is converted to a bar/radar chart: use wrapper + theme; data from existing `getMatchEnergy(payload)`.  
   - One step per chart type; verify independently.

4. **Overview or trend chart on Analytics page**  
   - Add one overview or trend chart on `/analytics` using existing data (e.g. from `getAnalyticsOverview` or `getPerPlayerAnalytics`).  
   - Use GlassCard + chart wrapper; no new API.  
   - Implement and test this chart in isolation.

5. **Consistency pass**  
   - Ensure all analytics chart blocks use the same section title style and consistent spacing (e.g. `space-y-*` between blocks).  
   - Ensure all sit inside GlassCard.

**Verification:**
- [ ] All analytics charts/sections use the shared wrapper (or same title/spacing rules) and live inside GlassCard.
- [ ] No new backend or analytics API; all data from existing functions.
- [ ] Each new or converted chart can be toggled or viewed in isolation for testing.
- [ ] Analytics page and history-detail analytics sections look consistent.

---

### Task Group 3 — Player Profile Charts

**Goal:** Add charts to the player profile page using **only** existing analytics data.

**Scope:** `/players/[playerId]` only. Data from existing APIs only (e.g. `getPerPlayerAnalytics`, or data already loaded for the profile page). No “recent matches” or “ranking history” APIs unless explicitly justified in this document (none planned for this phase).

**Steps:**

1. **Data mapping**  
   - Document which existing data sources feed profile charts (e.g. single-player slice from `getPerPlayerAnalytics`, or payload used on history detail).  
   - No new server routes or repository methods for this phase.

2. **First profile chart**  
   - Implement one chart on the profile page (e.g. “Score distribution” or “Rounds trend” from per-player stats).  
   - Use GlassCard + chart wrapper + theme.  
   - Implement and test in isolation.

3. **Second profile chart (if applicable)**  
   - Add a second chart only if data is already available (e.g. another view of the same per-player analytics).  
   - Same pattern: GlassCard, wrapper, theme.  
   - Implement and test independently.

4. **Integration**  
   - Place charts in the profile layout without changing routing or data-fetch structure.  
   - Ensure section headings match the rest of the app (e.g. same label style as other cards).

**Verification:**
- [ ] All profile charts use only existing analytics data; no new APIs.
- [ ] Each chart uses the shared chart wrapper and GlassCard.
- [ ] Charts can be developed and tested one at a time.
- [ ] Profile page layout and responsiveness are preserved.

---

### Task Group 4 — Heatmap Enhancement

**Goal:** Improve the round heatmap (visual or UX) while keeping it consistent with the chart system and existing data.

**Scope:** RoundHeatmap (and any related round-score visualization). No new data sources.

**Steps:**

1. **Current behavior**  
   - Confirm RoundHeatmap’s current implementation (table vs. Recharts) and data source (`getRoundHeatmap` or equivalent).  
   - Decide: keep as table with styling improvements, or replace with a Recharts-based heatmap/cell visualization.

2. **Enhancement (choose one path)**  
   - **Path A — Table polish:** Improve table styling (borders, typography, spacing) to match card labels and token usage; ensure it sits in GlassCard with the shared section title style.  
   - **Path B — Recharts heatmap:** If Recharts supports a suitable heatmap/cell chart, implement it using the same wrapper + theme; keep the same data interface.  
   - Only one path per step; verify in isolation.

3. **Responsive and a11y**  
   - Ensure heatmap (table or chart) has horizontal scroll on small screens if needed; no layout breaks.  
   - Preserve or add minimal accessibility (e.g. table semantics or chart title/desc).

**Verification:**
- [ ] Round heatmap uses shared title style and sits in GlassCard.
- [ ] Heatmap uses chart tokens for color scale (if applicable).
- [ ] No new API; same data as today.
- [ ] Works on small viewport (e.g. overflow-x-auto or responsive Recharts).

---

### Task Group 5 — Responsiveness Verification

**Goal:** Explicitly verify and fix responsive behavior of all chart-related UI.

**Scope:** All chart wrappers, Analytics page, Player profile charts, Heatmap. No new features.

**Steps:**

1. **Breakpoints**  
   - Define or confirm breakpoints (e.g. sm/md/lg) used for chart layout (e.g. when charts stack vs. sit side-by-side).  
   - Document in this plan or in design-system.

2. **Audit**  
   - For each surface (Analytics page, history detail analytics, player profile, heatmap):  
     - Check behavior at narrow (e.g. 320px), medium (e.g. 768px), and wide widths.  
     - Check overflow (horizontal scroll where intended, no unintended overflow).  
     - Check touch targets for any interactive chart elements (e.g. legend, tooltip trigger).

3. **Fixes**  
   - Apply minimal, targeted fixes: container max-width, padding, font size, or Recharts `responsiveContainer` usage.  
   - Do not redesign layouts from scratch.

4. **Documentation**  
   - Add a short “Charts – responsive” note (e.g. in `docs/charts-recharts.md` or design-system) listing breakpoints and any chart-specific rules.

**Verification:**
- [ ] All chart surfaces have been audited at 320px, 768px, and a large width.
- [ ] No critical overflow or layout breaks; scroll is intentional where used.
- [ ] Responsive rules are documented.
- [ ] No new backend or logic changes; UI-only.

---

## 6. Out of Scope for Phase 12

- New backend routes, new analytics APIs, or new repository methods (unless explicitly justified above).
- “Recent matches” or “ranking history” APIs for player profile.
- New container components that replace or bypass GlassCard.
- Replacing every custom component (e.g. lists/tables) with Recharts; only convert where it adds value and fits the system.
- E2E or unit tests for charts (can be a later phase); verification here is checklist-based.

---

## 7. Summary

| Order | Task group                      | Purpose                                      |
|-------|----------------------------------|----------------------------------------------|
| 1     | Chart system foundation         | Wrappers, tokens, theme, one PoC chart      |
| 2     | Analytics page charts           | Add/convert analytics charts with the system |
| 3     | Player profile charts           | Profile charts from existing data only       |
| 4     | Heatmap enhancement             | Polish or Recharts-based round heatmap      |
| 5     | Responsiveness verification     | Audit and fix breakpoints/overflow           |

Phase 12 stays focused on a **reusable chart system**, **Recharts** as the standard, **GlassCard-only** embedding, **existing data only** on the profile, and **explicit responsiveness**, with small steps and verification criteria so each part can be implemented and validated independently.
