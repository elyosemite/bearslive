# Bears Live — Developer Guide

## Project Overview

Bears Live is a blockchain analysis platform for investigating cryptocurrency
transactions across multiple networks. The primary use case is supporting
government agencies and financial institutions in identifying illicit activities
such as tax evasion and money laundering.

**Current Status:** Phase 1 — Foundation (Bitcoin address investigation with
transaction history)

---

## Tech Stack

| Technology      | Purpose                        | Version |
| --------------- | ------------------------------ | ------- |
| React           | UI framework                   | 19.2.0  |
| TypeScript      | Type safety                    | 5.9.3   |
| Vite            | Build tool and dev server      | 7.3.1   |
| TanStack Router | Client-side routing            | 1.161.1 |
| TanStack Query  | Server state and data fetching | 5.90.21 |
| Zustand         | Global client state            | 5.0.11  |
| React Hook Form | Form handling                  | 7.71.1  |
| Zod             | Schema validation              | 4.3.6   |

---

## Project Structure

```
src/
├── main.tsx                               # App entry point with providers
├── router.ts                              # Assembles route tree, exports router
├── index.css                              # Global styles
│
├── features/
│   ├── investigation/                     # Bitcoin address investigation feature
│   │   ├── components/
│   │   │   ├── Hero.tsx                   # Landing search form
│   │   │   └── Hero.css
│   │   ├── pages/
│   │   │   ├── HomePage.tsx               # Route component for /
│   │   │   └── AddressPage.tsx            # Route component for /addresses/$address
│   │   ├── routes/
│   │   │   ├── indexRoute.ts              # createRoute for /
│   │   │   └── addressRoute.ts            # createRoute for /addresses/$address
│   │   ├── services/
│   │   │   └── blockstream.ts             # Blockstream API integration
│   │   ├── store/
│   │   │   └── useInvestigationStore.ts   # Investigation Zustand store
│   │   └── types/
│   │       └── address.schema.ts          # Zod schemas + inferred types
│   │
│   └── bear-counter/                      # Zustand learning exercise
│       ├── components/
│       │   ├── BearCounter.tsx
│       │   └── Controls.tsx
│       ├── pages/
│       │   ├── BearCounterPage.tsx        # Previously App.tsx
│       │   └── BearCounterPage.css        # Previously App.css
│       ├── routes/
│       │   └── bearCounterRoute.ts        # createRoute for /demo
│       └── store/
│           └── useBearStore.ts
│
├── components/                            # Shared UI components (cross-feature)
│
├── pages/                                 # Pages not owned by any feature
│   └── NotFoundPage.tsx
│
├── routes/                                # Root-level route config
│   ├── __root.tsx                         # RootLayout component
│   └── rootRoute.ts                       # createRootRoute definition
│
├── store/                                 # Global Zustand stores (cross-feature)
│
├── hooks/                                 # Global hooks
│
└── context/                               # React contexts
```

### Where things live

| Type | Belongs in |
| ---- | ---------- |
| Component used by one feature | `features/<name>/components/` |
| Component used across features | `components/` |
| Page rendered directly by a route | `features/<name>/pages/` or `pages/` |
| Route definition (`createRoute`) | `features/<name>/routes/` |
| API service for a feature | `features/<name>/services/` |
| Zod schemas + inferred types | `features/<name>/types/` |
| Zustand store scoped to a feature | `features/<name>/store/` |
| Zustand store used across features | `store/` |
| Hook scoped to a feature | `features/<name>/hooks/` |
| Hook used across features | `hooks/` |

`router.ts` only imports route definitions and assembles the tree — no component or business logic.

---

## Code Conventions

### Naming

- **Files:** PascalCase for components (`AddressPage.tsx`), camelCase for
  utilities (`blockstream.ts`)
- **Components:** PascalCase function components (`export function HomePage()`)
- **Hooks:** camelCase with `use` prefix (`useInvestigation`)
- **Types:** PascalCase interfaces and types (`AddressFormData`)

### Imports

Order imports as follows:

1. React and external libraries
2. Internal modules (schemas, services, stores)
3. Components
4. Styles

```tsx
import { useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchTransactions } from "../services/blockstream";
```

### TypeScript

- Prefer `interface` for object shapes, `type` for unions and primitives
- Use Zod schemas as the single source of truth for validation
- Infer types from Zod schemas using `z.infer<typeof schema>`
- Avoid `any` — use `unknown` if type is truly unknown

---

## Working with the Stack

### TanStack Router

Each feature defines its own routes in `features/<name>/routes/`. The root
route lives in `src/routes/rootRoute.ts`. `src/router.ts` only assembles the
tree:

```ts
// src/router.ts
import { rootRoute }    from './routes/rootRoute'
import { indexRoute }   from './features/investigation/routes/indexRoute'
import { addressRoute } from './features/investigation/routes/addressRoute'

const routeTree = rootRoute.addChildren([indexRoute, addressRoute])
export const router = createRouter({ routeTree })
```

A route definition lives alongside its feature, not in `router.ts`:

```ts
// src/features/investigation/routes/addressRoute.ts
import { createRoute } from '@tanstack/react-router'
import { rootRoute }   from '../../../routes/rootRoute'
import { AddressPage } from '../pages/AddressPage'

export const addressRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/addresses/$address",
    component: AddressPage,
})
```

Access route params with `useParams`:

```tsx
const { address } = useParams({ from: "/addresses/$address" });
```

Navigate programmatically with `useNavigate`:

```tsx
const navigate = useNavigate();
navigate({ to: "/addresses/$address", params: { address: data.address } });
```

### TanStack Query

Define queries with `useQuery`:

```tsx
const { data, isLoading, isError } = useQuery({
    queryKey: ["transactions", address],
    queryFn: () => fetchTransactions(address),
});
```

- `queryKey` must be unique and include all variables the query depends on
- `queryFn` is the async function that fetches data
- Queries are cached automatically based on `queryKey`

### Zustand

Define stores with `create<State>`:

```ts
export const useInvestigation = create<InvestigationState>((set) => ({
    activeAddress: null,
    setActiveAddress: (address) => set({ activeAddress: address }),
}));
```

Access state with selectors:

```tsx
const activeAddress = useInvestigation((state) => state.activeAddress);
const setActiveAddress = useInvestigation((state) => state.setActiveAddress);
```

### React Hook Form + Zod

Define schema first:

```ts
export const addressSchema = z.object({
    address: z.string().regex(/pattern/, "Error message"),
});
export type AddressFormData = z.infer<typeof addressSchema>;
```

Use in form:

```tsx
const { register, handleSubmit, formState: { errors } } = useForm<
    AddressFormData
>({
    resolver: zodResolver(addressSchema),
});

const onSubmit = (data: AddressFormData) => {
    // data is typed and validated
};
```

---

## API Integration

### Blockstream API (Bitcoin)

Base URL: `https://blockstream.info/api`

Endpoints currently used:

- `GET /address/{address}/txs` — Get all transactions for an address

Response structure:

```ts
interface Transaction {
    txid: string;
    fee: number;
    vout: Vout[];
    status: {
        confirmed: boolean;
        block_time?: number;
    };
}
```

All amounts are in satoshis (1 BTC = 100,000,000 satoshis).

---

## Development Workflow

### Running the app

```bash
pnpm dev
```

Vite dev server runs on `http://localhost:5173` with HMR.

### Type checking

```bash
pnpm build
```

Runs TypeScript compiler before building. Fix all type errors before committing.

### Linting

```bash
pnpm lint
```

ESLint with TypeScript, React Hooks, and React Refresh rules enabled.

---

## Feature Development Checklist

When implementing a new feature, create a folder at `src/features/<name>/` and
add only the sub-folders that the feature actually needs:

1. `types/` — Zod schemas and inferred TypeScript types (if the feature has
   forms or validated data)
2. `services/` — async functions that call external APIs (if the feature fetches
   data)
3. `store/` — Zustand store slice (if the feature needs local client state);
   promote to `src/store/` only if the state is shared across features
4. `routes/` — `createRoute` definitions, one file per route; import `rootRoute`
   from `src/routes/rootRoute.ts`
5. `pages/` — page components that routes render directly
6. `components/` — smaller UI blocks used by the pages; promote to
   `src/components/` only if other features use them too
7. `hooks/` — custom hooks scoped to this feature (if needed)
8. Register the new routes in `src/router.ts` (import and add to `addChildren`)
9. Use TanStack Query for server state, Zustand for client state
10. Test manually with dev server before committing

---

## Current Implementation Status

### Completed (Phase 1)

- TanStack Router setup with root layout and two routes
- Home page with address submission form
- React Hook Form integration with Zod validation
- Blockstream API service for fetching Bitcoin transactions
- Address detail page with transaction list
- Zustand store for active investigation state
- TanStack Query integration with automatic caching

### Next Steps (Phase 2)

- Transaction graph visualization
- Address clustering heuristics (common-input-ownership)
- Risk scoring algorithm (initial implementation)
- Transaction filtering and sorting
- Pagination for large transaction lists
- Error handling improvements
- Loading states and skeletons

---

## Common Patterns

### Loading and error states

```tsx
if (isLoading) return <p>Loading...</p>;
if (isError) return <p>Error loading data</p>;
return <div>{/* render data */}</div>;
```

### Form submission with navigation

```tsx
const onSubmit = (data: FormData) => {
    // Update global state if needed
    setActiveAddress(data.address);
    // Navigate to result page
    navigate({ to: "/addresses/$address", params: { address: data.address } });
};
```

### Conditional rendering based on Zustand state

```tsx
const activeAddress = useInvestigation((state) => state.activeAddress);
if (activeAddress) {
    return <div>Currently investigating: {activeAddress}</div>;
}
```

---

## External Resources

- [TanStack Router Docs](https://tanstack.com/router)
- [TanStack Query Docs](https://tanstack.com/query)
- [Zustand GitHub](https://github.com/pmndrs/zustand)
- [React Hook Form Docs](https://react-hook-form.com)
- [Zod Documentation](https://zod.dev)
- [Blockstream API](https://github.com/Blockstream/esplora/blob/master/API.md)

---

## Notes

- The `bear-counter` feature (`BearCounter`, `Controls`, `useBearStore`) was the
  initial Zustand learning exercise — it is kept as a working reference at `/demo`
- Bitcoin addresses come in three formats: P2PKH (starts with 1), P2SH (starts
  with 3), and Bech32 (starts with bc1)
- All blockchain data is public — no authentication required for Blockstream API
