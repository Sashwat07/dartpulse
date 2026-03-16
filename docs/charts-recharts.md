# Charts: Recharts

DartPulse uses **Recharts** as the standard charting library for analytics and player profile visualizations.

## Why Recharts

- **React-native API** — Composable components (`LineChart`, `BarChart`, `XAxis`, `YAxis`, `Tooltip`, `Line`) fit the existing component model and work with Server/Client Component boundaries where needed.
- **Composable building blocks** — Shared wrappers and theme (spacing, typography, colors) can wrap any Recharts composition.
- **Theming** — Styling via props and CSS variables aligns with our design system (see [Design System §10 Charts & Analytics](./design-system.md)).
- **No extra abstraction** — Renders with the DOM; works with existing layout and GlassCard without a separate canvas layer.

**Phase 12 plan:** [Phase 12 — Charts & Data Visualization](./phase-12-plan.md)

## Chart token usage

All charts must use the shared tokens from `lib/charts/chartTheme.ts`:

| Token            | Usage                          | Design system reference   |
|------------------|--------------------------------|---------------------------|
| `primarySeries`  | Primary line/bar/series        | Cyan `#00E5FF`            |
| `secondarySeries`| Secondary series               | Purple `#A855F7`          |
| `highlightSeries`| Champion / highlight           | Gold `#FFD700`            |
| `mutedSeries`    | Muted or tertiary series       | Gray `#9CA3AF`            |

Import `chartColors` and use these values for `stroke`, `fill`, or Recharts `color` props so charts stay consistent and accessible on glass panels.

Shared axis, grid, and tooltip styles live in `lib/charts/chartDefaults.ts` and should be used by every chart.

## Embedding in GlassCard

Charts must be embedded **inside** the existing GlassCard layout:

1. **Use `ChartContainer`** — The reusable wrapper in `components/charts/ChartContainer.tsx` renders a `GlassCard` with consistent padding (`p-4`), spacing (`space-y-3`), and card label style for title/description. It wraps chart content in Recharts’ `ResponsiveContainer` for responsiveness.
2. **Do not introduce new container components** — Do not replace GlassCard with a chart-specific card; ChartContainer composes GlassCard.
3. **Placement** — On Analytics and Player Profile pages, place each chart inside a section and pass the chart (e.g. `<LineChart>…</LineChart>`) as children of `ChartContainer`.

Example:

```tsx
<ChartContainer title="Round scores" description="Score per round">
  <LineChart data={data}>
    <CartesianGrid strokeDasharray="3 3" {...gridStyle} />
    <XAxis dataKey="name" {...axisStyle} />
    <YAxis {...axisStyle} />
    <Tooltip {...tooltipStyle} />
    <Line type="monotone" dataKey="score" stroke={chartColors.primarySeries} />
  </LineChart>
</ChartContainer>
```

This keeps spacing, typography, and container behavior consistent across all chart surfaces.

## Responsiveness

- **Containers:** Chart cards use `min-w-0` so they shrink correctly inside grid/flex layouts and do not overflow on narrow viewports. Chart section grids use `grid-cols-1` on small screens and `lg:grid-cols-2` (or similar) on large screens so charts stack on mobile.
- **Recharts:** All chart content is wrapped in Recharts’ `ResponsiveContainer` (via `ChartContainer`) with `width="100%"` and a fixed height so charts scale with the card and stay readable.
- **Axis labels:** When x-axis labels are crowded (e.g. many players), charts use rotated labels (`angle`, `textAnchor`) and safe truncation so labels remain readable. Y-axis widths are kept small to leave room for the plot.
- **Heatmap:** The round heatmap table uses `overflow-x-auto` on its card and a minimum table width so it scrolls horizontally on small screens instead of overflowing the page. The card uses `min-w-0` for layout containment.
- **Empty states:** Chart cards that show an empty-state message use `break-words` on description text so copy wraps cleanly on narrow screens.
