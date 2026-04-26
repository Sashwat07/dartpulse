# DartPulse AI Feature — Learning Plan

You are building a production-grade AI analytics assistant while learning LangChain, LangGraph, and RAG from the ground up. This folder tracks your learning alongside the implementation.

## How to use this

Each phase has its own file. Before you start implementing a phase:
1. Read the **Concepts** section — understand the "why" before the "how"
2. Check the **What you'll build** section — connect theory to your actual code
3. After implementing, take the **Quiz** — write your answers in the Answers section
4. Mark your **Progress checklist** as you go

The quizzes are not trivial. They are designed to surface the non-obvious things that trip people up in production.

---

## Progress Overview

| Phase | Topic | Status |
|-------|-------|--------|
| [Phase 1](./phase-1-langchain.md) | LangChain: Tools, Agents, Structured Output | Not started |
| [Phase 2](./phase-2-langgraph.md) | LangGraph: State Graphs, Multi-step Reasoning, Memory | Not started |
| [Phase 3](./phase-3-rag.md) | RAG: Embeddings, Vector Stores, Hybrid Search | Not started |
| [Phase 4](./phase-4-advanced.md) | Production: Streaming, Caching, Cost, Structured Output v2 | Not started |

> Update the Status column as you progress: `Not started` → `In progress` → `Done`

---

## Learning Principles

**Build to learn, not learn to build.** You will understand LangChain 10x better by debugging why your agent called the wrong tool than by reading the docs. The quizzes are designed to surface exactly those moments.

**The concepts compound.** Phase 1 (tools) is the foundation Phase 2 (LangGraph) builds on. Phase 3 (RAG) builds on both. Don't skip ahead.

**When you're stuck, ask the right question.** Instead of "why doesn't this work", ask "what did the LLM actually see?" — enable `verbose: true` on AgentExecutor and read the intermediate steps.
