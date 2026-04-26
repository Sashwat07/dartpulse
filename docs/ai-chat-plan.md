# AI Chat Feature — Architecture & Implementation Plan

**Status:** Planned — Phase 1 ready to implement.  
**Dependencies:** Auth system, player system, analytics layer, match history — all complete.  
**Principle:** Tool-based AI with server-enforced access control; model-agnostic from day one; incremental phases that each deliver working software.

---

## 1. Goals

1. **Natural-language analytics** — Users ask questions about their dart data in plain English and get structured, accurate answers.
2. **No fabricated statistics** — All numeric data comes from database-backed tools. The LLM formats and explains; it does not invent.
3. **Same access control as the app** — The AI can only access data the user could already see (owner + participant visibility). Enforced at the tool layer, not the prompt.
4. **Model-agnostic** — Ollama locally, OpenAI in production. No code change required to switch.
5. **Incremental learning architecture** — Phases introduce LangChain, then LangGraph, then RAG in an order that compounds understanding.

---

## 2. Feature Overview

A `/ai` page with a chat interface where users can:

- Ask about their own stats ("What are my stats?", "Show my last 10 matches")
- Compare players ("Compare me vs Alice")
- Ask global questions ("Who has the most wins?")
- Eventually: get chart visualizations, trend analysis, narrative insights from match history

**Response format** — all API responses are structured:

```typescript
type AIResponse = {
  text: string;                          // always present
  table?: {
    columns: string[];
    rows: Record<string, string | number>[];
  };
  chart?: {                              // Phase 4 only — system prompt suppresses this in Phase 1–3
    type: "line" | "bar";
    title: string;
    data: Record<string, unknown>[];
  };
};
```

---

## 3. Architecture

### 3.1 Core principle: tools as the only data path

The LLM never touches the database. All data flows through server-side tool functions that the LLM can request but cannot bypass or parameterize with arbitrary values.

```
User message
  → Route handler (auth gate, session resolution)
  → AuthContext built from verified session
  → getPerPlayerAnalytics() called once; result memoized for this request
  → LangChain agent (model + tools bound with AuthContext + memoized data)
  → Agent decides which tool to call
  → Tool function runs on server (queries DB via repositories or uses memoized data)
  → Tool result returned to LLM as a JSON string
  → LLM writes final structured JSON response
  → outputParser.ts parses + falls back to { text: raw } on failure
  → Route handler returns AIResponse
```

### 3.2 Access control via closure

Each tool is a factory function that closes over `AuthContext`:

```typescript
export function buildGetMatchHistoryTool(ctx: AuthContext) {
  return new DynamicStructuredTool({
    name: "get_match_history",
    schema: z.object({ limit: z.number().min(1).max(20).default(5) }),
    func: async ({ limit }) => {
      // ctx.userId is captured from the route handler — the LLM cannot override it
      const matches = await listVisibleCompletedMatches(ctx.userId, ctx.linkedPlayerId);
      return JSON.stringify(matches.slice(0, limit));  // tools always return strings
    },
  });
}
```

**Tool return contract:** Every tool `func` must return `JSON.stringify(data)`. LangChain feeds the return value back into the model context as text. Returning a raw object produces `[object Object]` in the prompt and breaks reasoning. Never return undefined or throw — return `JSON.stringify({ error: "reason" })` for failure cases.

The Zod schema exposed to the LLM contains only `limit` — no `userId`, no `linkedPlayerId`. A prompt injection attack cannot pass alternative auth values because those fields do not exist in the schema.

### 3.3 "me" resolution contract

`AuthContext` carries a nullable `linkedPlayerId` and `linkedPlayerName`. Tools that support `"me"` as a `playerName` input must resolve it inside the tool function, not in the LLM:

```typescript
// Inside tool func:
const resolvedName =
  playerName === "me"
    ? ctx.linkedPlayerName          // null if user has no linked player
    : playerName;

if (!resolvedName) {
  return JSON.stringify({ error: "You have no linked player. Ask about a player by name." });
}
```

`buildAuthContext()` accepts `(userId: string, linkedPlayerId: string | null, linkedPlayerName: string | null)`. The route handler resolves both from the session before building the context.

### 3.4 Player name matching

`getPerPlayerAnalytics()` returns exact stored names. The LLM often writes partial or differently-cased names, and multiple players can share the same name. A shared utility handles all three cases — not found, unique match, and ambiguous match:

```typescript
// features/ai/tools/findPlayerByName.ts
export type PlayerLookupResult =
  | { found: PlayerAnalytics }
  | { ambiguous: PlayerAnalytics[] }
  | { notFound: true };

export function findPlayerByName(
  input: string,
  players: PlayerAnalytics[],
): PlayerLookupResult {
  const lower = input.toLowerCase();
  const exact = players.filter((p) => p.playerName.toLowerCase() === lower);

  if (exact.length === 1) return { found: exact[0] };
  if (exact.length > 1)   return { ambiguous: exact };

  const partial = players.filter((p) => p.playerName.toLowerCase().includes(lower));
  if (partial.length === 1) return { found: partial[0] };
  if (partial.length > 1)   return { ambiguous: partial };

  return { notFound: true };
}
```

All three tools call this utility. The tool `func` handles each case:

```typescript
const result = findPlayerByName(playerName, allStats);

if ("notFound" in result)
  return JSON.stringify({ error: `No player found named "${playerName}".` });

if ("ambiguous" in result)
  return JSON.stringify({
    error: `Found ${result.ambiguous.length} players named "${playerName}". Be more specific.`,
    matches: result.ambiguous.map((p) => ({
      name: p.playerName,
      matchesPlayed: p.matchesPlayed,
    })),
  });

const stat = result.found;
```

When disambiguation is required, the LLM receives the `matches` array and responds to the user: *"I found 2 players named Alice — one played 8 matches and one played 3. Which did you mean?"* The user can then clarify and re-ask.

### 3.5 Memoizing expensive analytics within a request

`getPerPlayerAnalytics()` does four parallel DB queries across all matches, players, and throws. If the agent calls both `get_player_stats` and `compare_players` in one run (which it will for comparison questions), that's two full scans.

Fix: call `getPerPlayerAnalytics()` once in `buildAllTools(ctx)`, then close the result over all tools that need it:

```typescript
// features/ai/tools/index.ts
export async function buildAllTools(ctx: AuthContext): Promise<DynamicStructuredTool[]> {
  const allStats = await getPerPlayerAnalytics();   // one call, shared across tools
  return [
    buildGetPlayerStatsTool(ctx, allStats),
    buildGetMatchHistoryTool(ctx),
    buildComparePlayersTool(ctx, allStats),
  ];
}
```

`lib/ai/index.ts` awaits `buildAllTools(ctx)` before creating the agent.

### 3.6 Final response format (Phase 1 approach)

`createToolCallingAgent` + `AgentExecutor` produces a plain-text final response — not JSON. The system prompt instructs the model to format its final answer as JSON matching `AIResponse`. `outputParser.ts` strips Markdown code fences, parses the JSON, and falls back to `{ text: rawOutput }` on failure. This is the Phase 1 approach (simple, occasionally imperfect).

Phase 4 upgrades to `model.withStructuredOutput(aiResponseZodSchema)` for guaranteed valid output via OpenAI's native `response_format: json_schema`. The manual parser is kept as Ollama fallback in all phases.

### 3.7 Folder structure

```
features/ai/
  types.ts                      ← AIResponse, ChatMessage, ChatRequest types
  validators.ts                 ← Zod schema for POST body
  tools/
    toolContext.ts              ← AuthContext type + buildAuthContext()
    findPlayerByName.ts         ← case-insensitive, substring-tolerant player lookup
    getPlayerStats.ts           ← Tool 1
    getMatchHistory.ts          ← Tool 2
    comparePlayers.ts           ← Tool 3
    index.ts                    ← buildAllTools(ctx): calls getPerPlayerAnalytics() once
  agent/
    model.ts                    ← env-driven model selection (Ollama / OpenAI)
    prompts.ts                  ← SYSTEM_PROMPT constant
    outputParser.ts             ← JSON extraction with graceful fallback
    buildAgent.ts               ← AgentExecutor factory (Phase 1); replaced by LangGraph in Phase 2
  components/
    MessageBubble.tsx           ← chat bubble shell: user (right-aligned) / assistant (left-aligned)
    AssistantResponseCard.tsx   ← inner content for assistant bubbles: text + ResponseTable + ResponseChart
    ResponseTable.tsx           ← renders AIResponse.table
    ResponseChart.tsx           ← stub in Phase 1; real renderer in Phase 4
    ChatInput.tsx               ← textarea + submit, Enter to send, loading state
    SuggestedPrompts.tsx        ← starter chips shown on empty state

lib/ai/
  index.ts                      ← runAiChat(message, ctx): Promise<AIResponse>
                                   Single seam between app and LangChain.
                                   Swapping LangGraph in Phase 2 changes only this file.

app/api/ai/chat/
  route.ts                      ← POST /api/ai/chat

app/(shell)/ai/
  page.tsx                      ← Server component: auth gate
  AiChatClient.tsx              ← "use client": message state, sendMessage, rendering
```

**Component hierarchy:** `MessageBubble` is the outer bubble shell. For assistant messages, it renders `AssistantResponseCard` as its inner content. `AssistantResponseCard` composes `ResponseTable` (when `AIResponse.table` is present) and `ResponseChart` (when `AIResponse.chart` is present). User messages render their text directly inside `MessageBubble` with no card wrapper.

### 3.8 API contract

**`POST /api/ai/chat`**

Request:
```json
{ "message": "Show my last 5 matches", "sessionId": "<uuid, optional>" }
```

Success `200`:
```json
{
  "reply": { "text": "Here are your last 5 matches...", "table": { ... } },
  "sessionId": "<uuid>"
}
```

Errors: `400 VALIDATION_ERROR` · `401 UNAUTHORIZED` · `429 RATE_LIMITED` · `500 AGENT_ERROR`

`sessionId` is present from Phase 1 (even though Phase 1 ignores it) so the Phase 2 memory upgrade requires no API or client changes.

**Client state:** `AiChatClient.tsx` uses a TanStack Query `useMutation` for sending messages. This is consistent with the rest of the app and gives loading/error state for free without manual `useState` management.

---

## 4. Phase Breakdown

### Phase 1 — MVP (LangChain, Tools, Structured Output)

**Goal:** Working chat page with accurate tool-backed responses. Text and table output only.

**Known Phase 1 limitation:** No streaming. The agent runs to completion (~5–15 seconds) before the response appears. A loading spinner covers this. Streaming is deferred to Phase 4.

**Dependencies to install:**
```bash
pnpm add @langchain/core @langchain/openai @langchain/ollama langchain
```

**Pre-requisite: create `listVisibleCompletedMatches`**

This function does not exist yet. It must be written before any tool file. Add it to `lib/repositories/matchRepository.ts`:

```typescript
// A match is visible if the user created it OR their linked player participated.
export async function listVisibleCompletedMatches(
  userId: string,
  linkedPlayerId: string | null,
): Promise<Match[]>
```

Implementation: fetch completed matches where `createdByUserId === userId` OR `linkedPlayerId` appears in `matchPlayers`. Use existing repository primitives — do not add a Prisma call outside `lib/repositories/`.

**Tools:**

| Tool | Input | Data source | Access rule |
|------|-------|-------------|-------------|
| `get_player_stats` | `{ playerName }` ("me" supported) | `allStats` (memoized) | Global analytics — any authed user |
| `get_match_history` | `{ limit: 1–20 }` | `listVisibleCompletedMatches(userId, linkedPlayerId)` | Same as History page |
| `compare_players` | `{ playerNameA, playerNameB }` ("me" supported) | `allStats` (memoized) | Same as get_player_stats |

**Model setup:**

```typescript
// features/ai/agent/model.ts
// AI_PROVIDER=ollama  →  ChatOllama  (local dev)
// AI_PROVIDER=openai  →  ChatOpenAI  (production)
```

Environment variables:
```
# .env.local
AI_PROVIDER=ollama
OLLAMA_MODEL=llama3.1
OLLAMA_BASE_URL=http://localhost:11434

# Vercel (production)
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

**Ollama local setup (required before running dev):**
```bash
ollama pull llama3.1   # download the model (~4GB)
ollama serve           # start inference server on :11434
```

**Output parsing:**

The LLM is instructed to return JSON. It sometimes wraps JSON in Markdown code fences. `outputParser.ts` strips fences, parses, and falls back to `{ text: rawOutput }` on failure — never throws. The system prompt must explicitly instruct the model **not to include `chart` fields** until Phase 4.

**`AgentExecutor` config:**
- `maxIterations: 3` — sufficient for single-tool queries; prevents infinite loops
- `verbose: true` in development — logs every intermediate step to console
- `temperature: 0` — deterministic tool selection, reduces hallucination risk

**Rate limiting (Phase 1 placeholder):**

Add the following comment block to `route.ts` immediately after the auth check. Do not implement it in Phase 1 — but put the marker so it cannot be forgotten:

```typescript
// TODO Phase 4: add per-user rate limiting (20 req/min)
// Without this, one user can exhaust the OpenAI budget with rapid requests.
// Use an in-memory token bucket for single-instance; Upstash Redis for Vercel multi-instance.
```

**Implementation order:**
1. `lib/repositories/matchRepository.ts` — add `listVisibleCompletedMatches`
2. `features/ai/types.ts` + `features/ai/validators.ts`
3. `features/ai/tools/toolContext.ts` — `AuthContext` type, `buildAuthContext()`
4. `features/ai/tools/findPlayerByName.ts`
5. Three tool files + `features/ai/tools/index.ts` (with `getPerPlayerAnalytics()` memoization)
6. `features/ai/agent/model.ts` → `prompts.ts` → `outputParser.ts` → `buildAgent.ts`
7. `lib/ai/index.ts` — `runAiChat(message, ctx): Promise<AIResponse>`
8. `app/api/ai/chat/route.ts` — **testable via curl after this step**
9. Six UI component files in `features/ai/components/`
10. `app/(shell)/ai/AiChatClient.tsx`
11. `app/(shell)/ai/page.tsx`
12. Add "AI Chat" nav entry (Bot icon from lucide-react) to sidebar

**Deliverable:** `POST /api/ai/chat` responds correctly. `/ai` page renders chat with text + table responses. Loading spinner shown during agent execution.

---

### Phase 2 — LangGraph (Multi-step Reasoning, Session Memory)

**Goal:** Replace `AgentExecutor` with a `StateGraph`. Add conversation memory within a session. Enable streaming progress indicators.

**Dependencies to install:**
```bash
pnpm add @langchain/langgraph
```

**What changes:**

`features/ai/agent/buildAgent.ts` → `features/ai/agent/buildGraph.ts`

Graph structure:
```
START → agent → (conditional: tool call?) → tools → agent → ... → END
```

**Memory — critical design decision:**

`MemorySaver` is in-process RAM. In a serverless environment, every cold start is a new process — session history is lost on each new invocation. Use it only during local development to understand the API:

```typescript
// Local dev only — for learning LangGraph's checkpointer API
const memory = new MemorySaver();
await graph.invoke(input, { configurable: { thread_id: sessionId } });
```

**Before shipping Phase 2 to any real environment, replace `MemorySaver` with `MongoDBSaver`** (`@langchain/mongodb` — already planned for Phase 3). Do not use `MemorySaver` in production. This is a high-likelihood failure that causes subtle bugs: users' conversations appear to reset randomly, not consistently, because some requests hit warm instances and others hit cold ones.

`lib/ai/index.ts` is the only file that changes at the app boundary. Route handler and all UI are untouched.

**Deliverable:** Conversation history persists within a session. "Compare Alice and Bob" followed by "Who has more wins?" correctly resolves the context.

---

### Phase 3 — RAG (Embeddings, Vector Store, Narrative Context)

**Goal:** Embed match summaries and player performance narratives into MongoDB Atlas Vector Search. Add a retrieval tool for contextual, non-numeric answers.

**Dependencies to install:**
```bash
pnpm add @langchain/mongodb
```

Also install `MongoDBSaver` here for Phase 2 production memory if not already done.

**Data source priority:**
1. Tools (structured DB queries) → facts and numbers
2. RAG (vector similarity search) → narrative patterns and context
3. LLM synthesis → combines both into a coherent answer

The LLM does NOT choose between tools and RAG — both run independently and results are provided together. RAG is never a substitute for a tool when a tool can answer the question.

**New files:**
```
lib/ai/rag/
  embeddings.ts      ← OpenAIEmbeddings or OllamaEmbeddings (env-driven)
  vectorStore.ts     ← MongoDB Atlas Vector Search (no new infrastructure)
  retriever.ts       ← similarity search, filtered by access control metadata
  ingest.ts          ← batch embedding of match summaries + player insights
scripts/
  ingest-ai-embeddings.ts   ← run offline: pnpm tsx scripts/ingest-ai-embeddings.ts
```

**New tool:** `search_player_context(query, playerName)` — retrieves top-4 narrative chunks by semantic similarity, filtered to the user's visible matches.

**Access control in retriever:**
```typescript
vectorStore.asRetriever({
  filter: {
    $or: [
      { "metadata.createdByUserId": ctx.userId },
      { "metadata.participantPlayerIds": ctx.linkedPlayerId },
    ],
  },
  k: 4,
});
```

Filter is applied inside the `$vectorSearch` stage (not post-retrieval) to ensure restricted documents are never candidates.

**What to embed:**
- One chunk per completed match: summary of players, winner, notable moments
- One chunk per player per match: per-match performance narrative

**What NOT to embed:** individual throw events, raw scores, player IDs — these belong in tools.

**Deliverable:** "Why does Alice keep winning?" returns both her win statistics (tool) and a narrative about her pattern of strong late-round performance (RAG).

---

### Phase 4 — Charts, Streaming, Production Hardening

**Goal:** Real chart rendering, streaming responses, structured output v2, caching, rate limiting.

**Charts:**

`ResponseChart.tsx` (stub since Phase 1) gets real implementation using `ChartContainer` + Recharts. The `AIResponse.chart` data shape was designed to be Recharts-compatible:

```typescript
// x-axis key = first key of data objects, y-axis = remaining keys
const xKey = Object.keys(chart.data[0])[0];
const yKeys = Object.keys(chart.data[0]).slice(1);
```

Update the system prompt to allow `chart` fields only in Phase 4.

**Streaming:**

Route handler switches from `NextResponse.json()` to a `ReadableStream` (SSE). Client uses fetch with streaming reader. LangGraph's `graph.streamEvents()` emits token-level LLM output and node transitions — enables "Calling get_player_stats..." status indicators and progressive text rendering.

**Structured output v2:**

```typescript
const structuredModel = model.withStructuredOutput(aiResponseZodSchema);
```

Uses OpenAI's native `response_format: json_schema` for guaranteed valid output. Manual `outputParser.ts` kept as fallback for Ollama.

**Caching:**

```typescript
export const getCachedPerPlayerAnalytics = unstable_cache(
  () => getPerPlayerAnalytics(),
  ["per-player-analytics"],
  { revalidate: 60, tags: ["per-player-analytics"] }
);
```

Invalidate by calling `revalidateTag("per-player-analytics")` in `updateMatchToFinished()`. Replace the in-request memoization from Phase 1 with this cross-request cache.

**Rate limiting:** 20 requests/minute per user. In-memory map for single-instance; Redis (Upstash) for Vercel multi-instance.

**Serverless timeout:** Add `export const maxDuration = 60` in `app/api/ai/chat/route.ts`.

**Deliverable:** Streaming chat responses with live progress. Chart responses for trend questions. Production-ready performance and cost controls.

---

## 5. Risk Register

| Risk | Likelihood | Mitigation |
|------|-----------|-----------|
| LLM hallucinating statistics | Medium | `temperature: 0`; system prompt forbids invented numbers; all stats come from tools |
| Structured output failure (Ollama) | Medium | `outputParser.ts` graceful fallback; `format: "json"` on ChatOllama |
| Prompt injection bypassing auth | Low | Auth params absent from all tool Zod schemas — LLM cannot set them |
| Serverless timeout | Medium | `maxDuration: 60`; `maxIterations: 3`; cache expensive analytics calls |
| Ollama / OpenAI divergence | Medium | Test same prompts against both providers; keep manual output parser for Ollama |
| Memory loss on cold start | High (Phase 2) | **Use `MongoDBSaver` before any production use of conversation memory.** `MemorySaver` is dev-only. |
| Tool called twice with full DB scan | Medium (Phase 1) | `getPerPlayerAnalytics()` memoized in `buildAllTools()` — one call per request, shared across all tools |
| "me" with no linked player | Medium | Tool returns structured error string; system prompt instructs model to relay the message gracefully |
| Player name exact-match failure | Medium | `findPlayerByName()` utility handles case-insensitive + substring matching |
| RAG embedding drift after template changes | Low | Store `templateVersion` in metadata; re-index on template change |
| Vector search pre-filtering bypass | Low | Use Atlas `$vectorSearch` `filter` parameter (index-level), never post-retrieval `$match` |
| Missing rate limit in Phase 1 | Medium | Placeholder comment in `route.ts`; implemented in Phase 4 |

---

## 6. Technology Choices

| Technology | Role | Why |
|------------|------|-----|
| LangChain (`@langchain/core`) | Model abstraction + tool interface | Prevents lock-in; `BaseChatModel` works for Ollama + OpenAI + Anthropic |
| LangGraph (`@langchain/langgraph`) | Agent orchestration, memory | Makes the ReAct loop explicit and inspectable; first-class memory via checkpointers |
| MongoDB Atlas Vector Search | Vector store (Phase 3) | No new infrastructure; metadata filtering with access control; already on MongoDB |
| `createToolCallingAgent` | Agent type (Phase 1) | Uses native function-calling APIs; more reliable than ReAct text parsing |
| `MemorySaver` → `MongoDBSaver` | Conversation memory (Phase 2) | In-process for learning the API locally; MongoDB for persistence across cold starts |
| TanStack Query `useMutation` | Client-side chat state | Consistent with app conventions; free loading/error state |
| `gpt-4o-mini` | Production model | 15–20x cheaper than `gpt-4o`; excellent tool calling and structured output |
| `llama3.1` (Ollama) | Local dev model | Free; supports function calling; `format: "json"` available |

---

## 7. Verification Checklist

**Phase 1:**
- [ ] `ollama pull llama3.1` + `ollama serve` running before `pnpm dev`
- [ ] `pnpm dev` starts without errors after installing dependencies
- [ ] `curl -X POST http://localhost:3000/api/ai/chat -H "Content-Type: application/json" -d '{"message":"Who has the most wins?"}' -b "<session cookie>"` → `200` with `{ reply: { text, table }, sessionId }`
- [ ] Unauthenticated request → `401`
- [ ] `/ai` page loads; suggested prompts visible
- [ ] "Show my stats" → loading spinner → text + table response
- [ ] "Compare me vs [player]" → two-row comparison table
- [ ] Ask as user with no linked player → graceful error message in chat, not 500
- [ ] `pnpm lint` passes
- [ ] `pnpm test` passes

**Phase 2:**
- [ ] "Show Alice's stats" → "Now compare Alice vs Bob" → second message uses context from first
- [ ] Server restart clears MemorySaver; conversation starts fresh (expected in dev)
- [ ] Streaming progress indicator appears during tool execution

**Phase 3:**
- [ ] Ingest script runs without errors; documents appear in MongoDB Atlas
- [ ] "Why does Alice keep winning?" returns both numeric stats and narrative context
- [ ] User cannot retrieve summaries from matches they cannot see in the History page

**Phase 4:**
- [ ] "Plot my score trend" → response includes chart data; chart renders in UI
- [ ] Streaming: text appears progressively, not all at once
- [ ] 21st request in one minute → `429 Too Many Requests`
- [ ] `pnpm test` passes
