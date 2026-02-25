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
├── main.tsx                      # App entry point with providers
├── router.ts                     # TanStack Router configuration
├── routes/
│   ├── __root.tsx                # Root layout component
│   ├── index.tsx                 # Home page (address submission form)
│   └── addresses/
│       └── AddressPage.tsx       # Address detail page with transactions
├── schemas/
│   └── address.schema.ts         # Zod validation schemas
├── services/
│   └── blockstream.ts            # Blockstream API integration
├── stores/
│   ├── useBearStore.ts           # (Legacy) Bear counter store
│   └── useInvestigationStore.ts  # Active investigation state
└── components/
    ├── BearCounter.tsx           # (Legacy) Demo component
    └── Controls.tsx              # (Legacy) Demo component
```

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
import { fetchTransactions } from "../../services/blockstream";
```

### TypeScript

- Prefer `interface` for object shapes, `type` for unions and primitives
- Use Zod schemas as the single source of truth for validation
- Infer types from Zod schemas using `z.infer<typeof schema>`
- Avoid `any` — use `unknown` if type is truly unknown

---

## Working with the Stack

### TanStack Router

Routes are defined in `src/router.ts` using `createRoute`:

```ts
const addressRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/addresses/$address",
    component: AddressPage,
});
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

When implementing a new feature:

1. Define Zod schema in `src/schemas/` if the feature involves forms or
   validation
2. Create service function in `src/services/` if the feature needs external data
3. Add Zustand store slice in `src/stores/` if the feature needs global state
4. Create route in `src/router.ts` if the feature needs a new page
5. Create component in `src/routes/` or `src/components/`
6. Use TanStack Query for server state, Zustand for client state
7. Test manually with dev server before committing

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

- The original `BearCounter` and `Controls` components are legacy demo code and
  can be removed once the blockchain features are stable
- The `useBearStore` is not used in the blockchain analysis features — it was
  the initial learning exercise for Zustand
- Bitcoin addresses come in three formats: P2PKH (starts with 1), P2SH (starts
  with 3), and Bech32 (starts with bc1)
- All blockchain data is public — no authentication required for Blockstream API
