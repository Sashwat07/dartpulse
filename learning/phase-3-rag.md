# Phase 3 — RAG: Embeddings, Vector Stores, Hybrid Search

## Progress checklist

- [ ] I understand what an embedding is and why it enables semantic search
- [ ] I understand what a vector store is and how similarity search works
- [ ] I understand the difference between what tools give you vs what RAG gives you
- [ ] I set up MongoDB Atlas Vector Search (no new infrastructure)
- [ ] I wrote the ingestion script to embed match summaries
- [ ] I implemented the retriever with access-control metadata filtering
- [ ] I added `search_player_context` as a fourth tool
- [ ] I tested a query that requires both tool data AND contextual retrieval
- [ ] I understand why RAG is for context, not facts
- [ ] Quiz completed and reviewed

---

## Concepts

### 1. What is an embedding?

An embedding is a list of numbers (a vector) that represents the meaning of a piece of text. Texts with similar meaning have vectors that are close together in space.

Example:
- "Alice dominated the final round" → `[0.23, -0.81, 0.45, ...]` (512 or 1536 numbers)
- "Alice performed extremely well at the end" → `[0.21, -0.79, 0.43, ...]` (very close)
- "The weather was nice today" → `[0.89, 0.12, -0.67, ...]` (very far away)

"Closeness" is measured by **cosine similarity** — the angle between two vectors. Vectors pointing in the same direction = similar meaning.

You generate embeddings using an embedding model:
- `OpenAIEmbeddings` (`text-embedding-3-small`) — fast, cheap, excellent quality
- `OllamaEmbeddings` (`nomic-embed-text`) — local, free, good quality

**The key insight:** Embeddings let you search by meaning, not keywords. "Who choked in the playoffs?" finds text about "struggled under pressure" even though neither word appears in the query.

### 2. What is a vector store?

A vector store is a database that stores embeddings and lets you query for the closest ones. For this project, you use **MongoDB Atlas Vector Search** — no new infrastructure, your data is already there.

The workflow:
```
Ingest (offline, one-time):
  text → embedding model → vector → store in MongoDB with metadata

Query (per request):
  user question → embedding model → query vector
  → find N most similar vectors in MongoDB (cosine similarity)
  → return the original text chunks
```

The `metadata` attached to each vector is critical. You store:
```typescript
{
  vector: [...],                          // the embedding
  text: "Alice consistently led...",      // the original text
  matchId: "abc123",                      // for filtering
  createdByUserId: "user_xyz",           // for access control
  participantPlayerIds: ["p1", "p2"],    // for access control
  type: "match_summary" | "player_insight"
}
```

### 3. Tools vs RAG — the distinction that matters

**Tools give you facts.** `get_player_stats` returns: Alice played 10 matches, won 7, average score 42.3. These are precise, structured, current numbers from the database.

**RAG gives you narrative context.** Match summaries and player insights are unstructured text like: "Alice tends to perform under pressure — she won three matches this season in final rounds where she was trailing going in." This kind of contextual, narrative knowledge cannot be expressed as a database query.

In DartPulse, the hybrid works like this:
- User: "Why does Alice keep winning?" 
- Tool call → gets Alice's stats (facts)
- RAG retrieval → finds match summaries where Alice's performance patterns are described (context)
- LLM synthesizes both → "Alice has won 7/10 matches. Looking at her match history, she consistently performs above her average in later rounds — her round 5+ average is 48.2 vs her overall 42.3, suggesting a strong finishing ability."

The LLM could NOT have said that last sentence from tool data alone. The pattern was in the narrative summaries.

### 4. Chunking — what you split and how

You cannot embed an entire match in one vector — it would be too long and the similarity search would be imprecise. You chunk text into meaningful units.

For DartPulse, natural chunks are:
- **Per-match summary** — one chunk per completed match: "Match on [date] between [players]. [Winner] won with [score]. Notable: [highlights]." Generate these programmatically from the match data.
- **Per-player insight** — one chunk per player per match: "Alice in match [id]: avg score [x], best throw [y], [trend description]." Also generated programmatically.

**Chunk size rule of thumb:** Each chunk should be independently meaningful. A chunk like "the match" with no context is useless. A chunk like "Alice scored 51 in round 4 of the playoff match on 2024-11-10, the highest single score of that match" is meaningful on its own.

### 5. Access control in the retriever

This is as critical here as it was for tools. The retriever must apply the same visibility rules as the rest of the app.

```typescript
// lib/ai/rag/retriever.ts
export function buildRetriever(ctx: AuthContext) {
  return vectorStore.asRetriever({
    filter: {
      $or: [
        { "metadata.createdByUserId": ctx.userId },
        { "metadata.participantPlayerIds": ctx.linkedPlayerId },
      ],
    },
    k: 4,  // return top 4 most similar chunks
  });
}
```

The `ctx` is closed over exactly like tools. The LLM cannot affect the filter. A user can only retrieve summaries from matches they could see in the History page.

### 6. The ingest script

Ingestion runs offline (not on every request). You run it:
- Once when you first set this up (to embed all historical matches)
- As a cron job or post-match webhook to embed new matches as they complete

```typescript
// scripts/ingest-ai-embeddings.ts
// pnpm tsx scripts/ingest-ai-embeddings.ts

const completedMatches = await listCompletedMatches();
for (const match of completedMatches) {
  const text = generateMatchSummaryText(match);  // your function
  await vectorStore.addDocuments([{
    pageContent: text,
    metadata: { matchId: match.matchId, createdByUserId: match.createdByUserId, ... }
  }]);
}
```

---

## What you'll build (and why it teaches you)

| File you create | RAG concept it teaches |
|-----------------|----------------------|
| `lib/ai/rag/embeddings.ts` | Embedding model abstraction, text → vector |
| `lib/ai/rag/vectorStore.ts` | MongoDB Atlas Vector Search setup, metadata |
| `lib/ai/rag/retriever.ts` | Similarity search, access control in retrieval, k parameter |
| `lib/ai/rag/ingest.ts` | Chunking strategy, what to embed and why |
| `scripts/ingest-ai-embeddings.ts` | Offline ingestion, incremental updates |
| `features/ai/tools/searchPlayerContext.ts` | RAG as a tool — the hybrid pattern |

---

## Quiz — take this after implementing Phase 3

---

**Q1.** A user searches for "who is the most consistent player?" Your `search_player_context` tool returns a chunk: "Alice has been remarkably consistent this season." Your `get_player_stats` tool returns Alice's standard deviation of round scores. Which result should the LLM trust more for the word "consistent", and how do you make the system prompt communicate this?

*Your answer:*

---

**Q2.** You embed match summaries when they complete. Six months later, you change the summary template to include new information. The old embeddings are still in MongoDB but were generated with the old template. What is the problem and how do you fix it?

*Your answer:*

---

**Q3.** The `k=4` parameter in the retriever returns the top 4 most similar chunks. A user asks a very specific question about one match. All 4 chunks are from different matches. What is the likely cause, and how would you improve precision?

*Your answer:*

---

**Q4.** You embed the text "Alice dominated the tournament" with `text-embedding-3-small`. You later switch to `nomic-embed-text` (Ollama). You run a similarity search and get completely wrong results. Why?

*Your answer:*

---

**Q5.** What is the difference between a vector store and a traditional database index? Give a concrete example of a query that a vector store handles well but a SQL/MongoDB index handles poorly.

*Your answer:*

---

**Q6.** A match has 4 players, 5 rounds, and 3 shots per round. That's 60 throw events. Should you embed each throw event as a separate chunk? Why or why not?

*Your answer:*

---

**Q7.** Your retriever has access control via metadata filter. A security researcher points out: "The metadata filter runs AFTER the vector similarity search in some implementations — the top-k results are selected first, then filtered, so a restricted document might appear in top-k and then be removed." Is this a security problem? What is the safe implementation?

*Your answer:*

---

## Answer Key

---

**A1.** The stats tool's standard deviation is objective fact — it should be trusted for the specific numerical claim. The RAG chunk is narrative interpretation — it should be used for qualitative framing. The system prompt should say something like: "When answering with statistics, always cite the tool data as the authoritative number. Use retrieved context to explain patterns and provide narrative, not to state precise figures." This is the hybrid contract: tools = ground truth for numbers, RAG = ground truth for patterns and narrative.

**A2.** Embedding drift — old embeddings were generated from shorter summaries with different vocabulary, so their vectors live in a different "region" of the embedding space relative to new queries. A query generated with the new template will find the new-format embeddings easily but miss the old ones. Fix: re-run the ingestion script with a forced reindex flag that deletes and re-embeds all documents. Best practice: store a `templateVersion` field in metadata and filter or reindex when it changes.

**A3.** The query is too general. "Tell me about the match on 2024-11-10" embeds as a question, and the match summary embeds as a statement — cosine similarity might not be high enough to rank it first if many other summaries contain similar vocabulary. Improvements: (a) add a `matchId` pre-filter when the user's question contains a specific match identifier, (b) use hybrid search (keyword + vector) — MongoDB Atlas supports `$vectorSearch` combined with `$search`, (c) increase `k` and re-rank.

**A4.** Different embedding models produce vectors in completely different spaces. A vector from `text-embedding-3-small` is not comparable to a vector from `nomic-embed-text` — they have different dimensions (1536 vs 768) and different "meanings" for each dimension. Switching models requires re-embedding all documents from scratch. This is called embedding incompatibility. Best practice: store the `embeddingModel` name in metadata alongside each vector, and refuse to query across mismatched models.

**A5.** A traditional database index finds exact or range matches: `{ score: { $gt: 40 } }` or `{ playerName: "Alice" }`. A vector store finds semantic similarity. Example query that a vector store handles well but a DB index handles poorly: "Who choked in high-pressure situations?" — there is no database field called `choked`. You'd have to hardcode rules like `(finalRoundScore < avgScore AND wasLeading)`. A vector store finds it by semantic similarity to summaries that describe poor clutch performance, regardless of the exact words used.

**A6.** No. Individual throw events are too granular and lack context. "Alice: score 45, round 3, shot 2" is a useless chunk — no narrative, no pattern, no insight. The purpose of RAG is to retrieve context that explains trends and patterns. A summary of Alice's round 3 performance across 10 matches is useful. Individual throws should stay in the database for tool queries (precise stats), not in the vector store. Embed: match summaries, player-per-match narratives, achievement descriptions. Don't embed: raw throw events, player IDs, timestamps.

**A7.** This IS a security problem if implemented naively. MongoDB Atlas Vector Search's `$vectorSearch` stage runs before `$match` by design — it selects top-k by similarity, then the pipeline continues. If your filter is in a `$match` stage AFTER `$vectorSearch`, a restricted document might be selected in top-k, then filtered out — but it was still accessed. The safe implementation: use Atlas Vector Search's `filter` parameter INSIDE the `$vectorSearch` stage itself (`{ filter: { "metadata.createdByUserId": ctx.userId } }`). This pushes the filter into the ANN index scan, so restricted documents are never candidates. Always filter at the index level, not post-retrieval.

---

## Further reading

- [MongoDB Atlas Vector Search](https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-overview/) — the actual docs for your vector store
- [LangChain JS — MongoDB Vector Store](https://js.langchain.com/docs/integrations/vectorstores/mongodb_atlas/) — how to wire it up
- [RAG vs Fine-tuning](https://www.pinecone.io/learn/retrieval-augmented-generation/) — important distinction: RAG is for knowledge, fine-tuning is for behavior
- [Chunking Strategies](https://www.pinecone.io/learn/chunking-strategies/) — goes deep on the chunk size problem
