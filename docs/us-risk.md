# User Story — Risk Feature

## Context

Investigators cannot manually audit every address in a network. The `risk`
feature automates the triage by assigning a risk score (0–100) to each analyzed
address and flagging specific patterns known to appear in money laundering,
tax evasion, and darknet activity.

The score is not a legal conclusion — it is an analytical aid that tells the
investigator *where to look first*. The algorithms are heuristic-based and run
entirely on the client against transaction data already fetched from the
Blockstream API.

This feature lives in `src/features/risk/`. Two components (`RiskBadge` and
`EntityTag`) are promoted to `src/components/` from the start because they
are consumed by both the `investigation` and `graph` features.

---

## US-01 — Risk Score per Address

**As an** investigator,
**I want** each analyzed address to receive an automatic risk score from 0 to
100 based on observable transaction patterns,
**so that** I can prioritize which addresses in a network deserve deep
investigation and have an objective, auditable basis for that prioritization.

### Acceptance Criteria

- Every address page (`/addresses/$address`) shows a risk score badge
- The score is broken down by contributing factors with their individual weights
- Score ranges map to severity labels: 0–25 Low · 26–50 Medium · 51–75 High ·
  76–100 Critical
- The score is computed client-side from transaction data already in the
  TanStack Query cache (no extra API call)
- The breakdown is accessible as a tooltip or expandable panel

### Scoring Factors (initial heuristics)

| Factor | Max points | Description |
| ------ | ---------- | ----------- |
| High velocity | 20 | Funds received and re-sent within 24 h |
| Fan-out pattern | 15 | Single input split into many outputs (distribution) |
| Round amounts | 10 | Transactions with suspiciously round BTC values |
| High tx count | 10 | More than 500 transactions (high operational volume) |
| Unconfirmed ratio | 10 | More than 30 % of transactions unconfirmed |
| CoinJoin indicator | 20 | Many equal-value outputs in a single transaction |
| Dormancy break | 15 | Address inactive for 12+ months then suddenly active |

### Tasks

**1. Define risk types**
- File: `features/risk/types/risk.types.ts` (create)
  ```ts
  type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

  interface RiskFactor {
    id: string
    label: string
    score: number       // points contributed (0 to max)
    maxScore: number
    triggered: boolean
  }

  interface RiskResult {
    totalScore: number  // 0–100
    level: RiskLevel
    factors: RiskFactor[]
  }
  ```

**2. Implement scoring algorithms**
- File: `features/risk/services/riskEngine.ts` (create)
- `computeRisk(txs: Transaction[]): RiskResult`
- One function per factor, each returning `RiskFactor`
- Final score is the sum of triggered factors, clamped to 100
- Each factor function is pure and independently testable

**3. Create `useRiskScore` hook**
- File: `features/risk/hooks/useRiskScore.ts` (create)
- `useRiskScore(address: string): RiskResult | null`
- Reads from TanStack Query cache:
  ```ts
  const txs = queryClient.getQueryData<Transaction[]>(['transactions', address])
  ```
- Returns `null` if transactions are not yet cached
- Runs `computeRisk` only when `txs` changes (useMemo)

**4. Create `RiskBadge` component**
- File: `src/components/RiskBadge/RiskBadge.tsx` (create — shared)
- File: `src/components/RiskBadge/RiskBadge.css` (create)
- Rationale: used in `investigation` (AddressPage), `graph` (AddressNode),
  and `risk` (RiskPage) — goes directly into `src/components/`
- Receives `score: number` and `level: RiskLevel`
- Renders a colored chip with the numeric score and severity label

**5. Create `RiskBreakdown` component**
- File: `features/risk/components/RiskBreakdown/RiskBreakdown.tsx` (create)
- File: `features/risk/components/RiskBreakdown/RiskBreakdown.css` (create)
- Receives `factors: RiskFactor[]`
- Renders a list of all factors with a progress bar for each, highlighting
  triggered ones
- Stays inside the `risk` feature

**6. Create `RiskPage`**
- File: `features/risk/pages/RiskPage.tsx` (create)
- Route: `/risk/$address`
- Reads `address` param, calls `useRiskScore`, renders `<RiskBadge />` and
  `<RiskBreakdown />`
- Shows a message if transactions are not yet cached, with a link back to
  `/addresses/$address` to load them first

**7. Define the risk route**
- File: `features/risk/routes/riskRoute.ts` (create)
  ```ts
  export const riskRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/risk/$address',
    component: RiskPage,
  })
  ```
- File: `src/router.ts` — import `riskRoute` and add to `routeTree`

**8. Integrate `RiskBadge` in `AddressPage`**
- File: `features/investigation/pages/AddressPage.tsx` (extend)
- Import `RiskBadge` from `src/components/RiskBadge/RiskBadge`
- Import `useRiskScore` from `features/risk/hooks/useRiskScore`
- Add the badge next to the address title; link it to `/risk/$address`

---

## US-02 — Entity Classification

**As an** investigator,
**I want** each address to be classified by entity type (Exchange · Mixer ·
Darknet · Personal · Unknown) based on its behavioral fingerprint,
**so that** I can immediately understand the context of an address without
manual research.

### Acceptance Criteria

- Every address shows an entity type tag alongside the risk badge
- Classification is based on observable patterns (not a lookup database in
  Phase 2 — that comes in Phase 4)
- Each classification shows the primary behavioral signal that triggered it
- "Unknown" is the default when no pattern is strong enough

### Classification Heuristics (Phase 2 — behavioral only)

| Entity Type | Signal |
| ----------- | ------ |
| Exchange | High tx count + many unique counterparties + round amounts |
| Mixer | CoinJoin pattern + equal-value outputs + many inputs |
| Personal | Low tx count + few unique counterparties |
| Darknet | High velocity + fan-out + dormancy breaks |

### Tasks

**1. Add entity types**
- File: `features/risk/types/risk.types.ts` (extend)
  ```ts
  type EntityType = 'exchange' | 'mixer' | 'darknet' | 'personal' | 'unknown'

  interface EntityClassification {
    type: EntityType
    confidence: 'low' | 'medium' | 'high'
    primarySignal: string
  }
  ```

**2. Implement `classifyEntity` function**
- File: `features/risk/services/riskEngine.ts` (extend)
- `classifyEntity(txs: Transaction[], riskResult: RiskResult): EntityClassification`
- Uses the already-computed `RiskFactor[]` to avoid re-scanning transactions
- Returns the highest-confidence match, or `{ type: 'unknown', ... }`

**3. Extend `useRiskScore` to return entity classification**
- File: `features/risk/hooks/useRiskScore.ts` (extend)
  ```ts
  interface RiskAnalysis {
    risk: RiskResult
    entity: EntityClassification
  }
  // useRiskScore returns RiskAnalysis | null
  ```

**4. Create `EntityTag` component**
- File: `src/components/EntityTag/EntityTag.tsx` (create — shared)
- File: `src/components/EntityTag/EntityTag.css` (create)
- Rationale: displayed in `AddressPage`, `AddressNode` (graph), and `RiskPage`
- Receives `classification: EntityClassification`
- Renders a colored tag with the entity type and a confidence indicator
- Each entity type has a distinct color (exchange=blue, mixer=orange,
  darknet=red, personal=green, unknown=gray)

**5. Integrate `EntityTag` in `AddressPage`**
- File: `features/investigation/pages/AddressPage.tsx` (extend)
- Add `<EntityTag classification={entity} />` next to `<RiskBadge />`

**6. Integrate `EntityTag` in `AddressNode` (graph)**
- File: `features/graph/components/AddressNode/AddressNode.tsx` (extend)
- Add a small entity indicator below the address label inside the node

---

## US-03 — Automated Pattern Flags

**As an** investigator,
**I want** to see a list of specific red-flag patterns triggered by an address
with a plain-language description of each,
**so that** I have concrete, explainable evidence to include in an investigative
report rather than just a numeric score.

### Acceptance Criteria

- The risk page (`/risk/$address`) shows a "Flags" section listing only the
  patterns that were actually triggered (no false negatives shown as "passed")
- Each flag has: a short name, a plain-language description, and the data that
  triggered it (e.g. "14 transactions sent within 2 hours of receipt")
- Flags are sorted by severity (highest-contributing first)
- If no flags are triggered, a "No suspicious patterns detected" message is shown
- Each flag links to the relevant transactions in the `investigation` feature
  (deep link to `/addresses/$address?filter=...`)

### Tasks

**1. Extend `RiskFactor` with evidence**
- File: `features/risk/types/risk.types.ts` (extend)
  ```ts
  interface RiskFactor {
    // existing fields...
    evidence: string    // human-readable explanation of what triggered it
    txids?: string[]    // IDs of specific transactions that triggered the flag
  }
  ```
- Update each scoring function in `riskEngine.ts` to populate `evidence` and
  `txids` when triggered

**2. Create `FlagList` component**
- File: `features/risk/components/FlagList/FlagList.tsx` (create)
- File: `features/risk/components/FlagList/FlagList.css` (create)
- Receives `factors: RiskFactor[]`
- Filters to only `triggered === true` items, sorts by score descending
- Each item shows: flag name, evidence string, severity bar
- When `txids` is present, renders links to
  `/addresses/$address` with a filter search param pointing to those transactions
- Shows the empty state message when `factors.filter(f => f.triggered)` is empty

**3. Compose `FlagList` in `RiskPage`**
- File: `features/risk/pages/RiskPage.tsx` (extend)
- Add `<FlagList factors={risk.factors} address={address} />` below
  `<RiskBreakdown />`

**4. Add deep-link support in the address route**
- File: `features/investigation/routes/addressRoute.ts` (extend)
- Add `txids` as an optional search param:
  ```ts
  validateSearch: z.object({
    // existing params...
    txids: z.array(z.string()).optional(),
  })
  ```
- File: `features/investigation/components/TransactionList/TransactionList.tsx` (extend)
- When `txids` is present in search params, highlight those rows with a
  distinct background and scroll the first match into view on mount
