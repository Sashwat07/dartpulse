# Phase 4 — Production: Streaming, Structured Output v2, Caching, Cost

## Progress checklist

- [ ] I understand why streaming is important for UX and how it works technically
- [ ] I switched from `graph.invoke()` to `graph.stream()` with SSE
- [ ] I understand `withStructuredOutput()` and why it's more reliable than manual parsing
- [ ] I added response caching for expensive analytics calls
- [ ] I added basic rate limiting to the chat route
- [ ] Chart responses render correctly in the UI (ResponseChart.tsx is real now)
- [ ] I can explain the cost tradeoffs between gpt-4o-mini and gpt-4o
- [ ] Quiz completed and reviewed

---

## Concepts

### 1. Streaming — why it matters

Without streaming: the user clicks send → waits 3–8 seconds → the full response appears at once.

With streaming: the user clicks send → text appears token by token within 300ms → feels instant.

For your agent, streaming has two levels:

**Token streaming** — the LLM streams output tokens as they're generated. The final answer text appears progressively.

**Event streaming** — LangGraph streams node-level events: "agent started thinking", "called get_player_stats", "got result", "writing answer". This lets you show a progress indicator like "Analyzing your stats..." before the text even starts.

**How it works technically:**

The route handler returns a `ReadableStream` (SSE — Server-Sent Events) instead of `NextResponse.json(...)`. The client reads it with the Fetch API's streaming response interface.

```typescript
// route.ts (Phase 4)
const stream = new ReadableStream({
  async start(controller) {
    const eventStream = graph.streamEvents(
      { messages: [new HumanMessage(message)] },
      { version: "v2", configurable: { thread_id: sessionId } }
    );
    for await (const event of eventStream) {
      if (event.event === "on_chat_model_stream") {
        controller.enqueue(`data: ${JSON.stringify({ token: event.data.chunk.content })}\n\n`);
      }
      if (event.event === "on_tool_start") {
        controller.enqueue(`data: ${JSON.stringify({ status: `Calling ${event.name}...` })}\n\n`);
      }
    }
    controller.close();
  }
});
return new Response(stream, { headers: { "Content-Type": "text/event-stream" } });
```

### 2. `withStructuredOutput()` — structured output done right

In Phase 1, you manually parse JSON from the LLM's text output. This works but is fragile. In Phase 4, you use LangChain's built-in structured output:

```typescript
const structuredModel = model.withStructuredOutput(aiResponseZodSchema, {
  name: "ai_response",
});
```

What this does:
- For OpenAI: uses the `response_format: { type: "json_schema" }` API parameter — OpenAI guarantees valid JSON matching your schema
- For Ollama: adds stronger JSON instructions and validates the output

The LLM now returns a typed `AIResponse` object directly — no parsing, no fallbacks needed for the happy path. You still keep a fallback for edge cases.

**Why not in Phase 1?** Learning to do it manually first teaches you what `withStructuredOutput()` is abstracting. If you use it from day one, you won't understand what to do when it fails.

### 3. Caching — where to add it and why

Two expensive operations in your agent:
1. `getPerPlayerAnalytics()` — aggregates all throw events for all players. Runs on every tool call involving player stats. The underlying data changes only when a match completes.
2. `listVisibleCompletedMatches()` — DB query, but fast. Still, no need to hit the DB on every chat message.

The right tool for Next.js: `unstable_cache` (stable as of Next.js 15):
```typescript
// lib/analytics/cachedPlayerStats.ts
import { unstable_cache } from "next/cache";

export const getCachedPerPlayerAnalytics = unstable_cache(
  () => getPerPlayerAnalytics(),
  ["per-player-analytics"],
  { revalidate: 60 }  // cache for 60 seconds
);
```

Use this in your tools instead of calling `getPerPlayerAnalytics()` directly. The analytics data is stale by at most 60 seconds — acceptable for a chat assistant.

### 4. Rate limiting — basic production hygiene

Every chat message costs money (OpenAI) or compute (Ollama). Without rate limiting, a single user or a script can send unlimited requests.

Simple approach using an in-memory map (acceptable for a single-instance deployment):
```typescript
// lib/ai/rateLimit.ts
const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = requestCounts.get(userId);
  if (!entry || entry.resetAt < now) {
    requestCounts.set(userId, { count: 1, resetAt: now + 60_000 });
    return true;  // allowed
  }
  if (entry.count >= 20) return false;  // 20 requests per minute
  entry.count++;
  return true;
}
```

For a multi-instance deployment (Vercel), use Redis (`ioredis` + Upstash Redis is the standard Vercel pattern). The in-memory approach is fine for learning and single-instance.

### 5. Charts — the data pipeline was already right

`ResponseChart.tsx` was a stub in Phase 1. In Phase 4 you implement it. The `AIResponse.chart` shape already works with Recharts:

```typescript
// features/ai/components/ResponseChart.tsx
import { LineChart, BarChart, ... } from "recharts";
import { ChartContainer } from "@/components/charts/ChartContainer";

export function ResponseChart({ chart }: { chart: NonNullable<AIResponse["chart"]> }) {
  return (
    <ChartContainer title={chart.title}>
      {chart.type === "line" ? (
        <LineChart data={chart.data}>
          {/* derive keys from the first data object */}
        </LineChart>
      ) : (
        <BarChart data={chart.data}>...</BarChart>
      )}
    </ChartContainer>
  );
}
```

The chart data format was designed in Phase 1 specifically to be compatible with Recharts' `data` prop. Phase 4 is just the renderer.

### 6. Cost optimization — model selection tradeoffs

| Model | Cost (input/output per 1M tokens) | Tool calling | Structured output | Best for |
|-------|-----------------------------------|--------------|-------------------|----------|
| gpt-4o-mini | $0.15 / $0.60 | Excellent | Excellent | DartPulse AI chat |
| gpt-4o | $2.50 / $10.00 | Excellent | Excellent | Complex multi-step reasoning |
| claude-haiku-4-5 | $0.80 / $4.00 | Good | Good | Alternative to gpt-4o-mini |
| llama3.1 (Ollama) | Free | Good | Moderate | Local dev only |

For DartPulse: `gpt-4o-mini` is correct for production. The queries are not complex — get stats, compare players. `gpt-4o` would be overkill and 15–20x more expensive.

Estimate your costs: each chat message is roughly 1,000 input tokens + 500 output tokens. At `gpt-4o-mini` prices, that's ~$0.00045 per message. 1,000 messages/day = $0.45/day.

---

## Quiz — take this after implementing Phase 4

---

**Q1.** A user sends a message. The streaming response starts appearing immediately, but after 2 seconds the connection drops and the message is cut off. The user refreshes the page. What happens to the conversation history? What would need to be true for the user to be able to resume?

*Your answer:*

---

**Q2.** You switch to `model.withStructuredOutput(aiResponseZodSchema)`. In production, you see errors: "Validation failed: expected string for field 'text', got undefined." This happens ~2% of the time with Ollama but never with OpenAI. What is the likely cause and how do you handle it?

*Your answer:*

---

**Q3.** Your `unstable_cache` with `revalidate: 60` caches `getPerPlayerAnalytics()`. A match finishes at 11:00pm. A user asks "what are my stats?" at 11:00:30pm. They get the old stats. Is this acceptable? How would you fix it if it wasn't?

*Your answer:*

---

**Q4.** Your rate limiter uses an in-memory `Map`. You deploy to Vercel with 3 serverless function instances. User A sends 15 requests, distributed across all 3 instances (5 each). Your limit is 20/minute. They are not rate-limited. Why? How do you fix it?

*Your answer:*

---

**Q5.** A user asks "Plot my score trend over my last 10 matches." The agent calls `get_match_history` and returns the data. The LLM returns:
```json
{
  "text": "Here is your score trend over the last 10 matches.",
  "chart": {
    "type": "line",
    "title": "Your Score Trend",
    "data": [
      { "match": "Match 1", "score": 38 },
      { "match": "Match 2", "score": 42 },
      ...
    ]
  }
}
```
Your `ResponseChart` component needs to know the x-axis key ("match") and y-axis key ("score") to render the chart. How do you derive these dynamically without hardcoding them?

*Your answer:*

---

**Q6.** What is the difference between `graph.stream()` and `graph.streamEvents()`? When would you use each?

*Your answer:*

---

## Answer Key

---

**A1.** With `MemorySaver` (in-process), the conversation history is still intact — the drop was a network issue, not a server crash. The messages array in the graph state was saved as a checkpoint before streaming began. If you store state in MongoDB (`MongoDBSaver`), the history is fully recoverable: on page refresh, the client sends the same `sessionId`, the graph restores from the checkpoint, and the user can continue the conversation. For the cut-off message specifically, the partial streaming response was never committed to state — the LangGraph checkpoint captures completed node executions, not in-progress streams. The user sees an incomplete response, but the conversation history up to that message is intact.

**A2.** Ollama's structured output is less reliable than OpenAI's because Ollama uses prompt-based JSON coercion rather than a native API-level schema enforcement. The 2% failure rate is the model occasionally deviating from the schema. Fix: (a) keep the Phase 1 output parser as a fallback layer around `withStructuredOutput` — if the Zod validation fails, catch the error and fall through to manual parsing, (b) in `model.ts`, only use `withStructuredOutput` for the OpenAI provider; for Ollama, keep manual parsing, (c) add `format: "json"` to `ChatOllama` constructor which adds an extra nudge.

**A3.** Acceptable for most cases — a 30-second delay in stats update is reasonable for a chat assistant. If it weren't acceptable, fix via cache invalidation: when `updateMatchToFinished()` is called in the match completion flow, also call `revalidateTag("per-player-analytics")` (Next.js cache tag invalidation). Tag the cache: `unstable_cache(fn, key, { tags: ["per-player-analytics"] })`. Now stats are fresh within milliseconds of match completion.

**A4.** Each Vercel serverless function instance has its own process and its own `Map`. Instance 1 sees 5 requests from User A, Instance 2 sees 5, Instance 3 sees 5 — none of them reaches 20. The rate limit is per-instance, not per-user globally. Fix: use Redis (Upstash Redis on Vercel is the standard solution — it's a shared external store all instances read/write). The rate limiter increments a Redis key (`ratelimit:userId`) with a TTL. All instances see the same count.

**A5.** Derive axis keys dynamically from the first data object:
```typescript
const keys = Object.keys(chart.data[0] ?? {});
// Convention: first key = x-axis (category), remaining keys = y-axis (values)
const xKey = keys[0];  // "match"
const yKeys = keys.slice(1);  // ["score"]
```
This works because your system prompt instructs the LLM to put the category dimension first and metric dimensions after. Alternatively, extend the `chart` type to explicitly include `xKey` and `yKeys` fields, and update the system prompt to populate them. Explicit is more robust than convention for this.

**A6.** `graph.stream()` emits the state updates after each node completes — you get full snapshots of the state at each step. `graph.streamEvents()` emits fine-grained events including token-level LLM output, tool start/end, chain start/end — much more granular. Use `graph.stream()` when you only need to show "step completed" progress. Use `graph.streamEvents()` when you want token streaming (text appearing letter by letter) and intermediate status messages like "Calling get_player_stats...". For the DartPulse chat UI, `streamEvents()` is the right choice — it enables both token streaming and the status indicator.

---

## Further reading

- [LangGraph JS — Streaming](https://langchain-ai.github.io/langgraphjs/how-tos/stream-tokens/) — token streaming with `streamEvents`
- [Next.js — Streaming with Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers#streaming) — how to return a ReadableStream
- [LangChain — withStructuredOutput](https://js.langchain.com/docs/how_to/structured_output/) — the right way to enforce JSON output
- [Upstash Redis](https://upstash.com/) — serverless Redis for Vercel, used for rate limiting and persistent sessions
