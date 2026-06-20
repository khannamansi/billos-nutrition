# Billo — AI Nutrition Tracker

A production-grade nutrition tracking app built on Next.js 15, Supabase, and LangChain. The focus is on clean architecture — a service layer that separates HTTP concerns from business logic, typed API boundaries, and an AI pipeline built to evolve.

The core product insight: most nutrition apps have poor coverage of Indian cuisine. Billo solves this with a curated Indian foods database (250+ dishes) merged with USDA data, fuzzy search, and AI-generated recipes personalised to your macro goals.

---

## Features

- Meal logging with day navigation and food search (Indian + USDA)
- Streaming AI recipe and shopping list generation via LangChain
- Pantry tracking with stocked/unstocked state
- Supabase Auth — email/password and Google OAuth, with guest mode
- Rate-limited AI endpoints (Upstash Redis, sliding window)

---

## Stack

| | |
|---|---|
| Framework | Next.js 15 (App Router) |
| Database & Auth | Supabase (PostgreSQL + RLS) |
| AI | LangChain + OpenAI (streaming) |
| Food data | USDA FoodData Central + custom Supabase table |
| Fuzzy search | Fuse.js (server-side, threshold 0.4) |
| Rate limiting | Upstash Redis sliding window |
| Validation | Zod at every API boundary |
| Testing | Jest + React Testing Library (255 tests) |
| Deployment | Vercel |

---

## Architecture

```
app/api/        → HTTP layer: auth, Zod validation, delegates to services
lib/services/   → Business logic + DB queries (pure functions, Supabase client injected)
lib/api-client  → Typed fetch wrapper used by all UI pages
components/     → Shared UI
__tests__/      → Mirrors src structure
```

### Service layer with dependency injection

All database logic lives in `lib/services/` as pure functions that accept a `SupabaseClient` as their first argument. Route handlers create the client, authenticate the request, and pass it in. Services never create their own clients.

This keeps two things clean: routes handle HTTP concerns only, and services are testable without spinning up a server. It also means the same service functions work directly from server components or a mobile app hitting the same endpoints — no rewrite needed when the surface changes.

### Explicit error handling end-to-end

`lib/api-client.ts` wraps every client-side fetch and throws with the API's error message on any non-2xx response. Every page wraps calls in try/catch and renders errors inline. The backend routes catch service-layer exceptions and return structured `{ error: string }` JSON with the appropriate status code. No silent failures anywhere in the stack.

### Indian food search

USDA is barcode-optimised and doesn't cover Indian dishes. Rather than stitching together unreliable third-party APIs, a `custom_foods` table in Supabase is seeded with 255+ dishes with per-100g macro data. Fuse.js fuzzy matching runs server-side in the service layer (not the UI), keeping the logic portable. Results are merged with USDA, deduplicated by description, and custom foods always rank first.

### Streaming AI responses

`/api/recipes` and `/api/shopping` stream LLM output directly to the client. The client reads chunks and accumulates until a valid JSON envelope is complete, so results appear incrementally rather than after a full round-trip. Rate limiting (Upstash Redis, 10 req/hr per user) is enforced before the first token is generated.

---

## Running Locally

```bash
npm install
cp .env.example .env.local   # Supabase, OpenAI, USDA, Upstash keys
npm run dev                  # http://localhost:3000
```

Seed Indian foods by running `scripts/seed-indian-foods.sql` in the Supabase SQL editor, then disable RLS on the `custom_foods` table (public reference data).

```bash
npm test              # 255 tests
npm test -- --watch
```

---

## Roadmap (V2)

- Image-based meal logging — multimodal vision model identifies food and estimates macros from photos
- LangGraph agent pipeline — stateful multi-step AI workflows with input/output guardrails
- Model routing abstraction — swap or combine models without changing calling code
