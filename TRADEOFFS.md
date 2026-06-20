# Billo's Nutrition — Technical Decisions & Tradeoffs

---

## 1. Streaming vs Waiting for Full JSON Response (AI endpoints)

**Decision:** Stream AI responses token by token using `ReadableStream` instead of waiting for the full response.

**Why:**
GPT-4o-mini takes 3-5 seconds to generate a full recipe or shopping list. If you wait for the complete response before returning anything, the user stares at a spinner for the entire duration. Streaming sends tokens as they arrive, so the UI starts rendering immediately.

**Tradeoff:**
Streaming makes error handling harder. If the model produces malformed JSON mid-stream, you only find out at the end when you try to parse it. With a full JSON response you can validate instantly. The fix is to accumulate the stream and parse at the end — you still get the perceived speed benefit of streaming without losing parse safety.

**Alternative considered:**
Returning a full JSON response synchronously. Simpler code, easier error handling, but 3-5 second blank screens kill perceived performance. Streaming wins for UX.

---

## 2. SWR (Stale-While-Revalidate) vs Fetch on Every Mount

**Decision:** Used SWR for caching profile and saved recipes instead of `fetch` inside `useEffect`.

**Why:**
Every time a user navigates back to a page that uses `useEffect` + `fetch`, the data is gone — React unmounts the component, state resets, and you fetch again. SWR keeps a global in-memory cache keyed by URL. Return visits serve cached data instantly and revalidate in the background silently.

**Tradeoff:**
SWR makes your app AP (Available + Partition Tolerant) rather than CP (Consistent + Partition Tolerant). A user might see data that is a few seconds stale. For a nutrition app this is completely acceptable — seeing yesterday's saved recipes for half a second before they update is not a problem. It would matter if this were a trading platform or a real-time inventory system.

**Alternative considered:**
React Query — more powerful (mutations, optimistic updates, devtools) but heavier. SWR is smaller and covers everything needed here. If the app grows in complexity, React Query is the natural upgrade.

---

## 3. Zod Validation on Every POST Route

**Decision:** All 7 POST routes validate input with Zod before any database or LLM call.

**Why:**
Without validation, any caller can send malformed data that either crashes the database insert, produces a nonsense LLM response, or causes a silent 500. Zod gives structured 400 errors with field-level detail so the client knows exactly what was wrong.

**Tradeoff:**
Zod adds a schema maintenance burden — every time you change a field, you update the schema too. For a small app this is fine. At scale, generating Zod schemas from a single source of truth (e.g. a database schema or OpenAPI spec) reduces drift.

**What Zod doesn't do:**
It validates structure and types, not content. A string of gibberish passes `z.string().min(1)`. The 500-character limit on ingredient input reduces prompt injection payload size but doesn't prevent it. Real content-level protection requires either a pre-check prompt or rate limiting that makes abuse expensive.

---

## 4. Upstash Redis — Sliding Window vs Fixed Window Rate Limiting

**Decision:** 10 requests per hour per user on AI endpoints using a sliding window limiter via Upstash Redis.

**Why Upstash:**
Serverless functions (Vercel) spin up fresh on every request — they share no memory between invocations. An in-memory counter resets to zero on every cold start. Redis is external, persistent, and fast enough for this use case. Upstash specifically because it has an HTTP API (no persistent TCP connection needed, which serverless environments don't support well).

**Why sliding window over fixed window:**
A fixed window resets at a hard boundary (e.g. every hour on the hour). A user who hits the limit at 11:58 has to wait until 12:00 — only 2 minutes. But a user who hits the limit at 12:01 waits until 13:00 — 59 minutes. Inconsistent and frustrating. A sliding window looks back exactly 1 hour from the current moment, so the limit is always fair regardless of when the user started.

**Tradeoff:**
Sliding window uses slightly more Redis memory than fixed window (it stores timestamps of individual requests rather than just a counter). At this scale it's negligible. At millions of requests per day you'd want to benchmark.

**10 requests per hour:**
Generous enough for legitimate use (most users won't generate 10 recipe lists in an hour) but expensive enough to deter automated abuse. Can be tightened per environment or per user tier in V2.

---

## 5. Cookie-Based Sessions vs localStorage

**Decision:** Used `createBrowserClient` from `@supabase/ssr` instead of `createClient` from `@supabase/supabase-js`.

**Why:**
`createClient` stores the session JWT in localStorage. Next.js API routes run on the server — they cannot access localStorage. Every authenticated API call returned 401 because the server had no way to verify who was making the request. `createBrowserClient` stores the session in cookies, which are sent automatically with every HTTP request and are readable server-side.

**Tradeoff:**
Cookies introduce CSRF risk that localStorage doesn't have (a malicious site can trigger a cookie-authenticated request from a victim's browser). Supabase SSR mitigates this with same-site cookie settings. The practical risk for an app of this scale is low but worth knowing.

**What `proxy.ts` does:**
On every request, the middleware calls `supabase.auth.getUser()` which silently refreshes the session cookie if it's close to expiry. Without this, users would get logged out mid-session when their JWT expires.

---

## 6. TDD — Test First, Implement Second

**Decision:** Every feature was written test-first. Tests were written against the expected API contract before the implementation existed.

**Why:**
Writing the test first forces you to define the interface before you write the code. You can't accidentally make a test pass by writing the test after you already know how the code works. It also gives you a safety net — any future change that breaks existing behaviour fails immediately.

**Coverage: 97% statements, 100% API routes and components**
The gaps (3%) are mostly in the history page's more complex UI branches and the ratelimit module itself (which talks to a real Redis instance and can't be meaningfully unit tested without integration tests).

**Tradeoff:**
TDD slows you down initially. Writing a failing test, then implementation, then refactor is more steps than just writing the implementation. The payoff is confidence when refactoring — the test suite caught several regressions during the Zod and SWR migrations that would have shipped silently otherwise.

**What wasn't TDD:**
The UI pages (history, shopping, recipes) were mostly implementation-first because UI behaviour is harder to specify upfront. The API routes and lib utilities were strictly TDD.

---

## 7. GPT-4o-mini vs Other Models

**Decision:** GPT-4o-mini for all AI generation.

**Why:**
Fast, cheap, and good enough for structured JSON generation. Recipe and shopping list generation doesn't require deep reasoning — it needs to follow a format consistently. GPT-4o-mini does this reliably at a fraction of the cost of GPT-4o.

**Tradeoff:**
GPT-4o-mini is more susceptible to prompt injection and more likely to hallucinate with nonsense input than larger models. For V2, adding a content validation step before building the prompt would reduce this risk. The 500-character limit on ingredient input already constrains the attack surface.

**Alternative considered:**
Claude (Anthropic) — stronger at following instructions precisely and more resistant to prompt injection. More expensive at scale. Worth revisiting in V2 if GPT-4o-mini produces inconsistent JSON formatting under load.
