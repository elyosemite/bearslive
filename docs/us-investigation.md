# User Story — Investigation Feature

## Context

The `investigation` feature is the core entry point of Bears Live. An
investigator starts every case by submitting a Bitcoin address. From there, they
need to build a complete picture of that entity: who it is, what it has done,
and who it talks to.

This feature lives entirely in `src/features/investigation/`. Files that are
shared with other features (e.g. a generic `Pagination` component) are promoted
to `src/components/` only when reuse is confirmed.

---

## US-01 — Address Profile

**As an** investigator, **I want** to submit a Bitcoin address and immediately
see a complete profile (balance, total received, total sent, transaction count,
first and last activity), **so that** I can understand the scale and history of
the entity before diving into individual transactions.

### Acceptance Criteria

- Submitting the form navigates to `/addresses/$address`
- The profile card shows: current balance in BTC, total received, total sent,
  transaction count, first activity date, last activity date
- The address format is identified and labeled (P2PKH · P2SH · Bech32)
- If the address does not exist on-chain, a clear error state is shown (not a
  generic crash)

### Tasks

**1. Add `AddressInfo` type**

- File: `features/investigation/types/transaction.types.ts` (create)
- Add interface:
  ```ts
  interface ChainStats {
    funded_txo_sum: number;
    spent_txo_sum: number;
    tx_count: number;
  }
  interface AddressInfo {
    address: string;
    chain_stats: ChainStats;
    mempool_stats: ChainStats;
  }
  ```

**2. Add `fetchAddressInfo` to the service**

- File: `features/investigation/services/blockstream.ts` (extend)
- Add `fetchAddressInfo(address: string): Promise<AddressInfo>` calling
  `GET /address/{address}`
- Throw a descriptive error when the response is not ok

**3. Create `AddressFormatBadge` component**

- File: `features/investigation/components/AddressFormatBadge.tsx` (create)
- Pure component — receives `address: string`, derives format from prefix,
  returns a `<span>` with the label
- Stays inside the feature; not shared

**4. Create `AddressProfile` component**

- File: `features/investigation/components/AddressProfile/AddressProfile.tsx`
  (create)
- File: `features/investigation/components/AddressProfile/AddressProfile.css`
  (create)
- Calls
  `useQuery({ queryKey: ['address-info', address], queryFn: () => fetchAddressInfo(address) })`
- Renders balance (BTC), received, sent, tx count, and `<AddressFormatBadge />`
- Handles loading and error states internally

**5. Compose in `AddressPage`**

- File: `features/investigation/pages/AddressPage.tsx` (extend)
- Add `<AddressProfile address={address} />` above the existing transaction
  table

---

## US-02 — Paginated Transaction History with Filters

**As an** investigator, **I want** to browse the full transaction history of an
address with pagination and filters by direction (incoming / outgoing) and
confirmation status, **so that** I can isolate relevant transactions without
being overwhelmed by volume in high-activity addresses.

### Acceptance Criteria

- Transactions are shown 25 per page with previous / next controls
- Filter by direction: All · Incoming · Outgoing
- Filter by status: All · Confirmed · Unconfirmed
- Active filters and current page are stored in the URL as search params (the
  filtered view is shareable and survives a browser refresh)
- Each row shows: TXID (truncated, linked to Blockstream), direction, value in
  BTC, fee in BTC, status, date
- A skeleton is shown while fetching

### Tasks

**1. Add search param validation to the address route**

- File: `features/investigation/routes/addressRoute.ts` (extend)
- Add `validateSearch` using Zod:
  ```ts
  import { z } from "zod";

  validateSearch: z.object({
    page: z.number().int().min(1).default(1),
    direction: z.enum(["all", "in", "out"]).default("all"),
    status: z.enum(["all", "confirmed", "unconfirmed"]).default("all"),
  });
  ```
- Search params are now type-safe and validated on navigation

**2. Create `TransactionFilters` component**

- File: `features/investigation/components/TransactionFilters.tsx` (create)
- Reads active filters with `useSearch({ from: '/addresses/$address' })`
- Updates a single param without resetting the others:
  ```ts
  navigate({ search: (prev) => ({ ...prev, direction: "in", page: 1 }) });
  ```
- Renders two segmented control groups (direction, status)
- Stays inside the feature

**3. Create `TransactionRow` component**

- File: `features/investigation/components/TransactionList/TransactionRow.tsx`
  (create)
- Receives `tx: Transaction` and `ownAddress: string`
- Derives direction by checking whether `ownAddress` appears in `vin` or `vout`
- Renders a single `<tr>` with all required columns

**4. Create `TransactionList` component**

- File: `features/investigation/components/TransactionList/TransactionList.tsx`
  (create)
- File: `features/investigation/components/TransactionList/TransactionList.css`
  (create)
- Receives `transactions: Transaction[]` and `isLoading: boolean`
- Applies client-side filter by reading search params
- Renders `<TransactionRow />` for each item
- Renders skeleton rows when `isLoading` is true

**5. Create `Pagination` component**

- File: `src/components/Pagination.tsx` (create — shared from the start)
- Rationale: pagination will be needed in `graph` (node list) and `risk`
  (flagged addresses list), so it goes directly into the global `components/`
- Receives `currentPage`, `totalPages`, `onPageChange`
- Updates the `page` search param on click

**6. Compose in `AddressPage`**

- File: `features/investigation/pages/AddressPage.tsx` (extend)
- Layout: `<TransactionFilters />` → `<TransactionList />` → `<Pagination />`
- `useQuery` result feeds both `TransactionList` and `Pagination`

---

## US-03 — Counterparty Network

**As an** investigator, **I want** to see which addresses interacted most with
the address under investigation, ranked by volume and interaction count, **so
that** I can identify the key nodes in this entity's network and decide which
address to investigate next.

### Acceptance Criteria

- A "Counterparties" section lists the top 10 addresses that sent to or received
  from the current address
- Each row shows: address (truncated), interaction count, total BTC volume
- Clicking any address navigates to `/addresses/$address` for that address,
  starting a new investigation branch
- The list is sorted by total volume descending by default
- The section is only rendered after transactions finish loading

### Tasks

**1. Add `Counterparty` type**

- File: `features/investigation/types/transaction.types.ts` (extend)
  ```ts
  interface Counterparty {
    address: string;
    interactionCount: number;
    totalVolumeSatoshis: number;
  }
  ```

**2. Create `extractCounterparties` utility**

- File: `features/investigation/services/counterparties.ts` (create)
- `extractCounterparties(txs: Transaction[], ownAddress: string): Counterparty[]`
- Parses `vin` and `vout` of each transaction to collect peer addresses
- Groups by address, counts interactions, sums satoshi volume
- Returns sorted by `totalVolumeSatoshis` descending, sliced to top 10

**3. Create `CounterpartyList` component**

- File:
  `features/investigation/components/CounterpartyList/CounterpartyList.tsx`
  (create)
- File:
  `features/investigation/components/CounterpartyList/CounterpartyList.css`
  (create)
- Receives `transactions: Transaction[]` and `ownAddress: string`
- Calls `extractCounterparties` internally
- Renders a table with `<Link to="/addresses/$address" params={{ address }}>` on
  each row

**4. Compose in `AddressPage`**

- File: `features/investigation/pages/AddressPage.tsx` (extend)
- Add `<CounterpartyList />` below the transaction list, inside a collapsible
  section
- Pass the already-fetched `data` (transactions) to avoid a second network call
