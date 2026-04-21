# Foresight Metrics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Gnosis dashboard cards for new Foresight global and custom-range POH user metrics without breaking existing Seer analytics.

**Architecture:** Extend the Gnosis analytics query path to read new `GlobalAnalytics` fields when available, with a fallback to the current schema when the deployed subgraph lags behind. Compute custom-range Foresight counts exactly by paging raw immutable entities and deduping `humanityId` values client-side.

**Tech Stack:** Next.js, TypeScript, React Query, graphql-request, The Graph subgraph

---

### Task 1: Extend analytics query shapes

**Files:**
- Modify: `src/lib/queries.ts`
- Modify: `src/types/analytics.ts`

- [ ] Add a Gnosis global query that requests `foresightParticipants` and `foresightCreditUsers`
- [ ] Keep the existing query as a legacy fallback for currently deployed schemas
- [ ] Add a raw immutable Foresight range query for `foresightTrades` and `foresightCreditUses`
- [ ] Extend analytics types with Foresight fields

### Task 2: Wire hook fallbacks and exact range counting

**Files:**
- Modify: `src/hooks/useAnalytics.ts`

- [ ] Add Gnosis global-query fallback handling so the UI stays stable before the new schema is deployed
- [ ] Compute range-level distinct Foresight traders and credit users by deduping `humanityId`
- [ ] Expose the new values through the existing hook return shape

### Task 3: Render new Gnosis dashboard cards

**Files:**
- Modify: `src/app/page.tsx`

- [ ] Add two global Foresight cards
- [ ] Add two period-analysis Foresight cards
- [ ] Use the purple variant for all Foresight cards

### Task 4: Verify

**Files:**
- Modify: none

- [ ] Run `npm run lint`
- [ ] Run `npm run build`
