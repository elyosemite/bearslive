# Investigation Feature — Technical Guide

> **Audience:** Software engineers joining the Bears Live project.
> This guide explains the domain concepts behind the investigation feature,
> the data flow from the Bitcoin network to the UI, and the conventions to
> follow when adding or maintaining code.

---

## 1. Domain Concepts

### 1.1 Bitcoin Address Formats

Bitcoin addresses are the public-facing identifiers of an entity on-chain.
There are three formats currently in use, and Bears Live identifies them
automatically via `AddressFormatBadge`:

| Format | Prefix | Example | Notes |
|--------|--------|---------|-------|
| **P2PKH** — Pay to Public Key Hash | `1` | `1A1zP1eP…` | Oldest format (Satoshi's genesis address is P2PKH) |
| **P2SH** — Pay to Script Hash | `3` | `3J98t1WpEZ…` | Used for multisig wallets and SegWit-wrapped scripts |
| **Bech32** — Native SegWit | `bc1` | `bc1qar0srrr…` | Lower fees, better error detection; most modern wallets default to this |

> The format alone doesn't reveal the owner's identity, but it narrows the
> type of wallet software being used, which is relevant for attribution.

---

### 1.2 The UTXO Model and What the API Returns

Bitcoin does not have account balances. It uses the **UTXO (Unspent Transaction
Output)** model: every transaction consumes previous outputs (`vin`) and creates
new outputs (`vout`).

```
Transaction
├── vin[]  — inputs: references to previous outputs being spent
│   └── prevout.scriptpubkey_address  — the address that owned that coin
│   └── prevout.value                 — value in satoshis
└── vout[] — outputs: new coins being created
    └── scriptpubkey_address          — the address receiving the coin
    └── value                         — value in satoshis
```

All amounts are in **satoshis**. 1 BTC = 100,000,000 satoshis.

The Blockstream API (`GET /address/{address}/txs`) returns every transaction
that touched the address — both spending and receiving — in a single flat list.

---

### 1.3 Transaction Direction

Because the API returns all transactions without a direction label, Bears Live
derives direction client-side by inspecting `vin`:

```ts
// If the investigated address appears in any vin.prevout.scriptpubkey_address,
// it was SPENDING coins → the transaction is OUTGOING.
// Otherwise it was only receiving → INCOMING.

const spentFromOwn = tx.vin.some(
    (v) => v.prevout?.scriptpubkey_address === ownAddress
)
const direction = spentFromOwn ? 'out' : 'in'
```

> Commit [`e74825d`](../commits/e74825d) added the `Vin` interface and `vin`
> field to `Transaction`, unlocking direction detection across the feature.

---

### 1.4 Counterparties

A **counterparty** is any address that directly sent funds to or received funds
from the investigated address. Bears Live aggregates counterparties from the
full transaction history:

- **On outgoing txs** → the counterparties are the `vout` addresses (recipients)
- **On incoming txs** → the counterparties are the `vin.prevout` addresses (senders)

The result is a ranked list (top 10 by total BTC volume) that exposes the
entity's primary economic relationships — the starting point for network
traversal and clustering analysis.

> Implemented in [`c530aca`](../commits/c530aca) —
> `features/investigation/services/counterparties.ts`.

---

### 1.5 Address Profile Stats

The Blockstream API endpoint `GET /address/{address}` returns aggregated stats
split across two pools:

| Pool | Meaning |
|------|---------|
| `chain_stats` | Confirmed on-chain transactions only |
| `mempool_stats` | Unconfirmed transactions in the mempool |

Bears Live combines both pools to show the live state of the address:

```ts
const balance =
    (info.chain_stats.funded_txo_sum - info.chain_stats.spent_txo_sum) +
    (info.mempool_stats.funded_txo_sum - info.mempool_stats.spent_txo_sum)
```

> Implemented in [`e80426e`](../commits/e80426e).

---

## 2. Architecture Overview

### 2.1 Feature Boundary

All investigation code lives inside `src/features/investigation/`. Nothing
inside this directory is imported by other features — only shared primitives
(components, hooks, stores) cross feature boundaries.

```
src/
├── features/
│   └── investigation/
│       ├── components/          # UI components private to this feature
│       │   ├── AddressProfile/
│       │   ├── CounterpartyList/
│       │   ├── TransactionFilters/
│       │   └── TransactionList/
│       ├── pages/               # Route-level components (one per route)
│       │   ├── AddressPage.tsx
│       │   └── HomePage.tsx
│       ├── routes/              # TanStack Router route definitions
│       │   ├── addressRoute.ts
│       │   └── indexRoute.ts
│       ├── services/            # API calls and pure data utilities
│       │   ├── blockstream.ts
│       │   └── counterparties.ts
│       ├── store/               # Zustand slices scoped to this feature
│       │   └── useInvestigationStore.ts
│       └── types/               # TypeScript interfaces and Zod schemas
│           ├── address.schema.ts
│           └── transaction.types.ts
│
├── components/                  # Shared UI (used by 2+ features)
│   ├── Pagination/              # ← promoted here because graph/risk will reuse it
│   └── ThemeToggle/
│
└── store/                       # Global Zustand stores
    └── useThemeStore.ts
```

### 2.2 Data Flow

```
User submits address (HomePage)
        │
        ▼
  useNavigate → /addresses/$address
        │
        ▼
  addressRoute.ts (validateSearch parses URL params)
        │
        ▼
  AddressPage.tsx
    ├── useQuery(['address-info', address])  → fetchAddressInfo()  → GET /address/{address}
    │       └── <AddressProfile />
    │
    ├── useQuery(['transactions', address])  → fetchTransactions()  → GET /address/{address}/txs
    │       ├── <TransactionFilters />   (reads/writes URL search params)
    │       ├── <TransactionList />      (client-side filter + pagination)
    │       ├── <Pagination />           (reads/writes ?page=)
    │       └── <CounterpartyList />     (extractCounterparties() over the same data)
    │
    └── (no second network request for counterparties — reuses cached tx data)
```

---

## 3. Key Implementation Details

### 3.1 Type-Safe URL Search Params (US-02)

Search params are validated at the route level using Zod. This means the values
are always typed and have defaults — no `parseInt`, no `undefined` guards in
components.

```ts
// src/features/investigation/routes/addressRoute.ts  (c514e0f)
validateSearch: z.object({
    page:      z.number().int().min(1).default(1),
    direction: z.enum(['all', 'in', 'out']).default('all'),
    status:    z.enum(['all', 'confirmed', 'unconfirmed']).default('all'),
})
```

Reading search params in a component:

```ts
// Always pass `from` so TypeScript knows which route's params to infer
const { page, direction, status } = useSearch({ from: '/addresses/$address' })
```

Updating a single param without resetting the others:

```ts
// Always pass `from` to useNavigate for the same reason
const navigate = useNavigate({ from: '/addresses/$address' })

navigate({ search: (prev) => ({ ...prev, direction: 'in', page: 1 }) })
```

> Without `from`, TypeScript cannot narrow the search shape and will type the
> result as `never`, causing a build error. This is not a bug — it is the
> router enforcing correctness across the route tree.

---

### 3.2 Client-Side Filtering vs Server-Side Pagination

The Blockstream API does not support server-side filtering by direction or
status. Bears Live fetches the full transaction list once and caches it via
TanStack Query. All filtering and pagination happen in `TransactionList`:

```ts
// src/features/investigation/components/TransactionList/TransactionList.tsx
const filtered = transactions.filter((tx) => {
    if (status === 'confirmed'   && !tx.status.confirmed) return false
    if (status === 'unconfirmed' &&  tx.status.confirmed) return false
    if (direction !== 'all') {
        const spentFromOwn = tx.vin.some(
            (v) => v.prevout?.scriptpubkey_address === ownAddress
        )
        if ((spentFromOwn ? 'out' : 'in') !== direction) return false
    }
    return true
})

const pageSlice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
```

`totalPages` is computed from `filtered.length` and reported back to
`AddressPage` via an `onTotalPages` callback so `Pagination` always reflects
the filtered count, not the raw total.

---

### 3.3 extractCounterparties

Pure function — no side effects, no network calls.

```ts
// src/features/investigation/services/counterparties.ts  (c530aca)
export function extractCounterparties(
    txs: Transaction[],
    ownAddress: string,
): Counterparty[]
```

Algorithm:

1. For each transaction, determine direction (same logic as `TransactionRow`).
2. Collect peer addresses from `vout` (outgoing) or `vin.prevout` (incoming),
   excluding `ownAddress` and addresses without a known script.
3. Group by address in a `Map`, accumulating `interactionCount` and
   `totalVolumeSatoshis`.
4. Sort by `totalVolumeSatoshis` descending, slice to top 10.

The counterparty list intentionally reuses the transaction data already in the
TanStack Query cache — there is no second network call.

---

### 3.4 TanStack Query Cache Keys

| Key | Fetcher | Scope |
|-----|---------|-------|
| `['address-info', address]` | `fetchAddressInfo` | One entry per address |
| `['transactions', address]` | `fetchTransactions` | One entry per address |

Both are cached indefinitely during the session. Navigating from
`CounterpartyList` to a new address will fetch fresh data for that address
while keeping the previous address cached for instant back-navigation.

---

## 4. How to Add or Maintain Code

### Adding a new component to the investigation feature

1. Create a directory inside `src/features/investigation/components/YourComponent/`.
2. Add `YourComponent.tsx` and `YourComponent.css`.
3. Import CSS directly in the `.tsx` file.
4. If the component will be reused by another feature, move it to
   `src/components/` instead.

### Adding a new API endpoint

1. Add the function to `src/features/investigation/services/blockstream.ts`.
2. Define the response shape in `src/features/investigation/types/transaction.types.ts`.
3. Call it via `useQuery` with a unique `queryKey` that includes all variables
   the query depends on (e.g. `['endpoint-name', address]`).

### Adding a new URL search param

1. Extend the `validateSearch` Zod schema in `addressRoute.ts`.
2. Add a default value so existing URLs without the new param remain valid.
3. Read with `useSearch({ from: '/addresses/$address' })`.
4. Write with `useNavigate({ from: '/addresses/$address' })` and the
   functional `search` updater to preserve existing params.

### Adding a new route

1. Create `src/features/<feature>/routes/<name>Route.ts`.
2. Use `createRoute({ getParentRoute: () => rootRoute, path: '...' })`.
3. Register it in `src/router.ts` inside `rootRoute.addChildren([...])`.

---

## 5. Implemented User Stories Reference

| US | Title | Key Commits |
|----|-------|-------------|
| US-01 | Address Profile | `e80426e` — feature structure + profile card |
| US-02 | Paginated Transaction History with Filters | `e74825d` types · `c514e0f` route · `ed62337` components · `75c21a5` composition |
| US-03 | Counterparty Network | `30d35b4` types · `c530aca` service · `a81ba41` component |

Full user story definitions: [`docs/us-investigation.md`](./us-investigation.md)
