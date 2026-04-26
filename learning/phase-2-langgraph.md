# Phase 2 — LangGraph: State Graphs, Multi-step Reasoning, Memory

## Progress checklist

- [ ] I understand why AgentExecutor is limiting and what LangGraph solves
- [ ] I understand nodes, edges, and conditional edges in a StateGraph
- [ ] I understand what "state" means in LangGraph and how it flows
- [ ] I replaced AgentExecutor with a StateGraph in `buildGraph.ts`
- [ ] I implemented `MemorySaver` with `sessionId` as the thread ID
- [ ] Conversation history persists across messages in the same session
- [ ] I understand the difference between MemorySaver and a persistent checkpointer
- [ ] I can explain what a "checkpoint" is and why it matters
- [ ] Quiz completed and reviewed

---

## Concepts

### 1. Why AgentExecutor is not enough

`AgentExecutor` is a black box. You give it a prompt and tools, and it runs until it has an answer. That's fine for Phase 1. But it has real limitations:

- **You can't intercept between steps.** If you want to validate tool output, retry with a different tool, or ask the user a clarifying question, you can't — the loop is opaque.
- **Memory is external and manual.** You'd have to manually prepend conversation history to every prompt.
- **No streaming intermediate steps.** You can't show "Thinking... calling get_player_stats..." in the UI — the executor runs synchronously and returns a final answer only.
- **No conditional branching.** What if the first tool call fails? You can't say "if tool X failed, call tool Y instead" — the model decides, and you have no control point.

LangGraph solves all of this by making the agent loop **explicit and inspectable** as a directed graph.

### 2. The StateGraph mental model

A LangGraph `StateGraph` has three things:

**State** — a TypeScript object that flows through the graph and accumulates changes at each node. For a chat agent:
```typescript
type AgentState = {
  messages: BaseMessage[];  // the full conversation history
};
```

**Nodes** — functions that take state and return a (partial) update to state. There are two in a basic agent:
```
"agent" node:  receives messages → calls the LLM → appends LLM response to messages
"tools" node:  finds the tool call in the last message → runs it → appends tool result to messages
```

**Edges** — connections between nodes that determine what runs next. Edges can be:
- **Static:** always go from A to B
- **Conditional:** inspect the current state and choose which node to go to next

The conditional edge after the "agent" node looks like:
```typescript
// After the LLM responds:
// - If it called a tool → go to "tools" node
// - If it gave a final answer → go to END
graph.addConditionalEdges("agent", (state) => {
  const lastMessage = state.messages.at(-1);
  return lastMessage.tool_calls?.length > 0 ? "tools" : END;
});
```

The full graph for a basic chat agent:
```
START → agent → (conditional) → tools → agent → (conditional) → END
                              ↑___________________________|
                              (loop back if more tool calls needed)
```

### 3. Memory — why sessionId was in the Phase 1 API

LangGraph has first-class memory via **checkpointers**. A checkpointer saves the full graph state (all messages, all tool call results) after every node execution. When you invoke the graph again with the same `thread_id`, it restores the state automatically — the LLM receives the full conversation history without you doing anything manually.

```typescript
const memory = new MemorySaver();       // in-process, lost on server restart

await graph.invoke(
  { messages: [new HumanMessage(userMessage)] },
  { configurable: { thread_id: sessionId } }  // ← this is the key
);
```

The `sessionId` from the Phase 1 API is the `thread_id`. That's why it was threaded through from the beginning — the route handler doesn't change in Phase 2.

**MemorySaver vs persistent checkpointer:**
- `MemorySaver` stores state in memory on the server. It is lost when the server restarts (Next.js dev hot reload, Vercel cold start). Fine for learning.
- For production: use `MongoDBSaver` (from `@langchain/mongodb`) or `RedisSaver`. State persists across restarts. The `thread_id` (sessionId) is the key in the store.

### 4. The ReAct pattern — what LangGraph makes explicit

ReAct = **Re**asoning + **Act**ing. The LLM alternates between:
1. **Reasoning** — "The user wants player stats. I should call get_player_stats."
2. **Acting** — call the tool
3. **Observing** — read the tool result
4. **Reasoning again** — "I have the stats. Now I can answer."

In `AgentExecutor`, this loop is hidden inside the class. In LangGraph, you define each step as a node and each transition as an edge. You can now:
- Add a "validate" node between "tools" and "agent" that checks the tool result
- Add a "format" node at the end that enforces your JSON output structure
- Add a "human" node that pauses the graph and waits for user input
- Stream every node transition to the frontend so the UI shows progress

### 5. Multi-step reasoning

With `AgentExecutor`, multi-step is implicit — the LLM just calls tools until it has an answer. With LangGraph, you can make multi-step explicit and robust.

Example: user asks "Who improved the most over their last 5 matches?"
1. Agent calls `get_all_player_stats` → gets list of players
2. Agent calls `get_match_history` for each top player → gets per-match breakdown
3. Agent calls `calculate_trend` with the results
4. Agent writes final answer with table

With LangGraph, if step 2 partially fails, you have a control point to retry or skip. With `AgentExecutor`, you just get whatever the LLM decided to do.

---

## What you'll build (and why it teaches you)

| File you create/modify | LangGraph concept it teaches |
|------------------------|------------------------------|
| `features/ai/agent/buildGraph.ts` | `StateGraph`, nodes, conditional edges, END |
| `features/ai/agent/memory.ts` | `MemorySaver`, thread_id, checkpointing |
| `lib/ai/index.ts` (update) | How to swap implementation behind a stable interface |
| `app/api/ai/chat/route.ts` (minor update) | Passing `thread_id` to graph invocation |

The key architectural insight: `lib/ai/index.ts` is the only file the route handler imports. Swapping from `AgentExecutor` to `StateGraph` inside `buildGraph.ts` requires changing only `lib/ai/index.ts`. Everything above that seam (the route handler, the UI) is untouched.

---

## Quiz — take this after implementing Phase 2

---

**Q1.** A user has a conversation: "Show Alice's stats" → "Now compare Alice vs Bob" → "What was Alice's best throw?" The agent correctly uses the previous messages to understand that "Alice" in the third message refers to the same Alice from earlier. How does LangGraph enable this, and what would happen without memory?

*Your answer:*

---

**Q2.** You deploy to Vercel. A user has a 5-message conversation with `sessionId = "abc123"`. The Vercel function cold-starts for the next request. What happens to the conversation history if you use `MemorySaver`? What would you use instead?

*Your answer:*

---

**Q3.** In LangGraph, you add a new "validate" node between "tools" and "agent" that checks: if the tool returned an error, set a `retryCount` flag in state. Draw the edges. What does the conditional edge from "validate" look like?

*Your answer:*

---

**Q4.** Your graph's "agent" node calls the LLM. The LLM decides to call both `get_player_stats` AND `get_match_history` simultaneously (parallel tool calls, which some models support). How does LangGraph's "tools" node handle this? Is there anything special you need to do?

*Your answer:*

---

**Q5.** What is a "checkpoint" in LangGraph? At what points in the graph is a checkpoint saved?

*Your answer:*

---

**Q6.** You want to show a "Thinking... calling get_player_stats..." spinner in the chat UI while the agent is running. How does LangGraph enable this, and how would you wire it to the frontend?

*Your answer:*

---

## Answer Key

---

**A1.** LangGraph's `MemorySaver` stores the full `messages` array (HumanMessage + AIMessage + ToolMessage) in state keyed by `sessionId`. When the user sends the third message, LangGraph restores the full message history for that thread and prepends it to the LLM call. The LLM sees all 5 previous messages and understands "Alice" from context. Without memory, each message is a fresh context — the LLM has no idea what was discussed before, and "Alice" in message 3 would require the user to re-specify who they mean.

**A2.** `MemorySaver` is in-process. A Vercel cold start creates a fresh process with an empty `MemorySaver`. The conversation history is gone — the next message starts fresh. The fix: use `MongoDBSaver` (you already have MongoDB) — state is persisted in your DB, keyed by `sessionId`. Cold starts don't matter because the checkpointer reads from MongoDB on every invocation.

**A3.**
```
"tools" → "validate" → (conditional) →
  if no error → "agent"
  if error AND retryCount < 2 → "agent" (with error in state, LLM will try differently)
  if error AND retryCount >= 2 → END (return error message)
```
The conditional edge inspects `state.lastToolError` and `state.retryCount`.

**A4.** LangGraph's built-in `ToolNode` handles parallel tool calls natively — it runs all tool calls from the last AIMessage concurrently (with `Promise.all` internally), appends each result as a separate `ToolMessage`, and passes them all back to the "agent" node. You don't need to do anything special — this is one of the advantages of LangGraph's `ToolNode` over building the tool execution manually.

**A5.** A checkpoint is a snapshot of the full graph state (all messages, all intermediate values) saved to the checkpointer at a specific point in execution. LangGraph saves a checkpoint after EVERY node execution — so after "agent" runs, after "tools" runs, after "validate" runs, etc. This means: if your server crashes mid-graph, you can resume from the last checkpoint. It also means you can inspect exactly what the state was at any point — invaluable for debugging.

**A6.** LangGraph supports streaming via `graph.stream()` instead of `graph.invoke()`. It emits events for every node transition and state update. You change `route.ts` to use a `ReadableStream` response (SSE or streaming JSON), and the client uses `EventSource` or `fetch` with a streaming reader. Each event is a node completion — "agent node completed with tool call" → UI shows "Thinking..." → "tools node completed" → UI shows "Got data..." → "agent node completed with final answer" → UI renders the response. This is Phase 2's biggest UX improvement.

---

## Further reading

- [LangGraph JS — Conceptual Guide](https://langchain-ai.github.io/langgraphjs/concepts/) — read the "Agent architectures" section
- [LangGraph JS — How to add memory](https://langchain-ai.github.io/langgraphjs/how-tos/persistence/) — the checkpointer pattern you'll implement
- [ReAct Paper](https://arxiv.org/abs/2210.03629) — the original paper (2022) — worth 20 minutes to understand what you're building on
