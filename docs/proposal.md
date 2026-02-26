# Bears Live — Blockchain Analysis Platform

## Overview

Bears Live is a blockchain analysis platform designed to support government
agencies and private enterprises in investigating financial crimes conducted
through cryptocurrency networks. The system enables the tracking, visualization,
and analysis of transactions across multiple blockchain networks, with a focus
on identifying patterns associated with tax evasion, money laundering, and other
illicit financial activities.

---

## Problem Statement

Cryptocurrencies have become increasingly attractive to bad actors seeking to
obscure the origin, movement, and destination of funds. The pseudonymous nature
of blockchain addresses, combined with the volume and speed of transactions,
makes manual investigation impractical. Current tools available to law
enforcement and compliance teams are either too generic, too expensive, or not
adapted to the regulatory and investigative workflows of Brazilian and
international institutions.

---

## Objectives

- Provide a centralized interface for submitting cryptocurrency addresses for
  investigation
- Trace the full transaction history of a given address across supported
  blockchains
- Apply analytical algorithms to identify suspicious patterns and flag high-risk
  addresses
- Generate structured reports suitable for legal proceedings and regulatory
  compliance
- Support cross-chain analysis, covering Bitcoin, Ethereum, and other major
  networks

---

## Target Audience

- Government tax enforcement agencies
- Financial intelligence units
- Compliance departments in banks and financial institutions
- Law enforcement investigative divisions
- Cryptocurrency exchanges operating under regulatory obligations

---

## Supported Blockchains (Planned)

| Network             | Symbol | Type          |
| ------------------- | ------ | ------------- |
| Bitcoin             | BTC    | UTXO          |
| Ethereum            | ETH    | Account-based |
| Tron                | TRX    | Account-based |
| Binance Smart Chain | BNB    | Account-based |
| Solana              | SOL    | Account-based |
| Litecoin            | LTC    | UTXO          |

Additional networks may be added based on investigative demand.

---

## Core Features

### Address Investigation

- Submit a single address and retrieve its full transaction history
- Identify connected addresses through input/output tracing
- Display wallet balance over time

### Transaction Graph

- Visual representation of fund flows between addresses
- Expand nodes to trace funds forward and backward in the chain
- Highlight clusters of addresses likely controlled by the same entity

### Risk Scoring

- Each address receives a risk score based on analytical algorithms
- Scores consider transaction patterns, volume, frequency, and known
  associations
- Flags for known darknet markets, mixers, exchanges, and sanctioned entities

### Analytical Algorithms

- Heuristic-based address clustering (common-input-ownership for UTXO chains)
- Peel chain detection (tracing fund movement through sequential single-output
  transactions)
- Mixer and CoinJoin detection
- Entity identification through exchange deposit address patterns
- Time-based behavior analysis (transaction timing, dormancy periods)
- High-velocity transaction detection

### Cross-Chain Tracing

- Detect bridge transactions that move funds between blockchains
- Correlate entities across different networks
- Track stablecoin usage as a layering mechanism

### Reporting

- Generate PDF and structured JSON reports per investigation
- Include transaction maps, risk scores, flagged addresses, and narrative
  summaries
- Audit trail for all investigative actions taken within the platform

---

## Technical Stack

### Frontend

- **React 19** with **TypeScript** — component-based UI
- **TanStack Router** — client-side routing and navigation
- **TanStack Query** — server state management and data fetching
- **Zustand** — global client state (active investigation, filters, UI
  preferences)
- **React Hook Form** + **Zod** — form handling and schema validation for
  address submissions and investigation configuration

### Backend (Planned)

- REST or GraphQL API consuming blockchain node data and third-party indexers
- Integration with public blockchain APIs (Blockstream, Etherscan, etc.)
- Internal database for caching transaction graphs and storing investigation
  history

### Data Sources

- Full node access or trusted indexer APIs per supported blockchain
- OSINT databases for known entity tagging (exchanges, mixers, sanctioned
  addresses)
- Internal label registry maintained by analysts

---

## Proposed Application Structure

```
src/
├── routes/
│   ├── index.tsx                  # Dashboard and investigation entry point
│   ├── investigations/
│   │   ├── index.tsx              # List of ongoing and past investigations
│   │   ├── new.tsx                # Form to start a new investigation
│   │   └── $investigationId.tsx   # Investigation detail and transaction graph
│   ├── addresses/
│   │   ├── $address.tsx           # Address profile and transaction history
│   │   └── cluster.tsx            # Address cluster view
│   └── reports/
│       └── $reportId.tsx          # Generated report viewer
├── schemas/
│   ├── address.schema.ts          # Zod schema for address submission
│   └── investigation.schema.ts    # Zod schema for investigation configuration
├── stores/
│   ├── useInvestigationStore.ts   # Active investigation state
│   └── useFilterStore.ts          # Transaction filter state
├── components/
│   ├── TransactionGraph/
│   ├── RiskBadge/
│   ├── AddressCard/
│   └── InvestigationForm/
└── services/
    ├── blockstream/               # Bitcoin — Blockstream.info
    │   ├── blockstream.ts         # Barrel re-export
    │   ├── address.ts
    │   └── transaction.ts
    ├── etherscan/                 # Ethereum — Etherscan (planned)
    ├── binance/                   # Exchange data (planned)
    └── analysis.ts                # Algorithm wrappers (pure, no HTTP)
```

---

## Compliance and Legal Considerations

- All data accessed is publicly available on-chain; no private keys or personal
  data are stored
- The platform is designed for use by authorized personnel only, with role-based
  access control
- Investigations and reports must be conducted under legal authorization in
  accordance with applicable law
- Findings generated by the platform are analytical aids and not legal
  conclusions

---

## Development Phases

### Phase 1 — Foundation

- Project scaffolding with full tech stack configured
- TanStack Router with base routes
- Address submission form with Zod validation and React Hook Form
- TanStack Query integration with a single blockchain data source (Bitcoin via
  Blockstream API)
- Basic transaction list view per address

### Phase 2 — Analysis Engine

- Transaction graph visualization
- Address clustering algorithm (UTXO chains)
- Risk scoring model (initial heuristics)
- Zustand-based investigation state management

### Phase 3 — Multi-Chain and Reporting

- Ethereum and EVM-compatible chain support
- Cross-chain tracing detection
- Report generation (PDF export)
- Investigation history and audit trail

### Phase 4 — Advanced Algorithms and Integrations

- Mixer and CoinJoin detection
- Known entity database integration
- Role-based access control and authentication
- Dashboard with aggregate analytics
