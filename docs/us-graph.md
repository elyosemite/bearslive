# User Story — Graph Feature

## Context

Money laundering relies on *layering* — moving funds through multiple
intermediate addresses to obscure origin and destination. A table of transactions
cannot reveal this pattern at a glance. The `graph` feature gives investigators
a visual, interactive map of fund flows, making layering chains and suspicious
clusters immediately apparent.

This feature lives in `src/features/graph/`. It depends on transaction data
already fetched by the `investigation` feature, but owns its own graph state,
layout logic, and visualization components.

**Recommended library:** `@xyflow/react` (React Flow v12) — purpose-built for
interactive node-edge graphs, handles pan, zoom, and node expansion out of the
box without requiring D3 expertise.

---

## US-01 — Transaction Flow Graph

**As an** investigator,
**I want** to see the transactions of an address visualized as an interactive
graph where each address is a node and each transaction is a directed edge,
**so that** I can identify layering patterns and fund flow routes at a glance
instead of reading rows in a table.

### Acceptance Criteria

- Navigating to `/graph/$address` renders a full-screen interactive graph
- Nodes are laid out in three columns: **senders on the left**, **origin in the
  centre**, **receivers on the right** — making the direction of fund flow
  immediately readable
- Each node category has a consistent color: senders = green, origin = blue,
  receivers = amber; the same palette is used in both the nodes and the edges
- Each directed edge is annotated with BTC value and colored by direction:
  incoming edges (sender → origin) are green; outgoing edges (origin → receiver)
  are amber
- Edges connect to whichever side of the node is geometrically closest at
  render time — top/bottom when nodes are vertically aligned, left/right when
  horizontally aligned — and update live as nodes are dragged
- Every node is draggable; the user can freely rearrange the graph to separate
  clusters or follow a specific chain
- A legend panel (top-left) labels the three categories with matching colors
- The graph supports pan and zoom with mouse or trackpad
- A minimap is shown for orientation on large graphs
- Unconfirmed (mempool) edges are rendered with a dashed animation
- The graph loads with the same data the `investigation` feature already fetches
  (no redundant API calls — shared via TanStack Query cache)

### Implementation Notes

**Bipartite column layout** (`buildNodes`):

| Column | X | Population |
|--------|---|------------|
| Left | −440 | Nodes where `edge.target === originId` (senders) |
| Centre | 0 | Origin node |
| Right | +440 | Nodes where `edge.source === originId` (receivers) |

Bidirectional nodes (appear as both sender and receiver) are assigned to the
column with the higher total volume. Nodes within each column are distributed
vertically around `y = 0` with 90 px spacing.

**Color scheme:**

| Role | Background | Border / Text | Edge stroke |
|------|-----------|---------------|-------------|
| Sender | `--th-green-dim` | `--th-green` | `--th-green` |
| Origin | `--th-blue-dim` | `--th-blue` / `--th-blue-br` | — |
| Receiver | `--th-amber-dim` | `--th-amber` | `--th-amber` |

**Floating / smart edges** (`SmartEdge` component):

- `useInternalNode(id)` reads each node's current absolute position and
  measured dimensions at render time
- Compares `dx` and `dy` between node centres:
  - `|dx| ≥ |dy|` → connects Right→Left or Left→Right
  - `|dy| > |dx|` → connects Bottom→Top or Top→Bottom
- Path generated with `getBezierPath` (smooth cubic Bézier curves)
- Label rendered via `EdgeLabelRenderer` (HTML overlay, always readable)
- The `animated` CSS class is applied directly to the `<path>` element for
  mempool dashes
- Default ReactFlow handles (top/bottom dots) are hidden with
  `.react-flow__handle { visibility: hidden }`

### Tasks

**1. Install React Flow**
- Run: `pnpm add @xyflow/react`

**2. Define graph data types**
- File: `features/graph/types/graph.types.ts` (create)
  ```ts
  interface GraphNode {
    id: string          // Bitcoin address
    isOrigin: boolean
    balance?: number    // satoshis, optional
  }

  interface GraphEdge {
    id: string          // "${txid}-${source}-${target}"
    source: string      // sender address
    target: string      // receiver address
    valueSatoshis: number
    confirmed: boolean
  }

  interface GraphData {
    nodes: GraphNode[]
    edges: GraphEdge[]
  }
  ```

**3. Create `buildGraphData` service**
- File: `features/graph/services/graphBuilder.ts` (create)
- `buildGraphData(txs: Transaction[], originAddress: string): GraphData`
- Outgoing tx (origin in `vin`): edge `originAddress → vout.address`,
  skips change outputs (`target === originAddress`)
- Incoming tx (otherwise): edge `vin.prevout.address → originAddress`,
  skips `source === originAddress`
- Deduplicates nodes and edges via `Map` keyed by `id`

**4. Create `SmartEdge` component**
- File: `features/graph/components/TransactionGraph/SmartEdge.tsx` (create)
- Custom ReactFlow edge type; bypasses fixed handles entirely
- Uses `useInternalNode` + `getBezierPath` for dynamic, smooth routing
- Renders BTC label via `EdgeLabelRenderer`
- Registered as `edgeTypes = { smart: SmartEdge }` in `TransactionGraph`

**5. Create the `GraphPage`**
- File: `features/graph/pages/GraphPage.tsx` (create)
- Reads `address` param with `useParams({ from: '/graph/$address' })`
- Fetches transactions with `useQuery({ queryKey: ['transactions', address] })`
  — same key as `AddressPage`, zero extra API calls
- Passes data to `<TransactionGraph data={graphData} />`

**6. Define the graph route**
- File: `features/graph/routes/graphRoute.ts` (create)
  ```ts
  export const graphRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/graph/$address',
    component: GraphPage,
  })
  ```
- File: `src/router.ts` — import `graphRoute` and add to `routeTree`

**7. Create `TransactionGraph` component**
- File: `features/graph/components/TransactionGraph/TransactionGraph.tsx` (create)
- File: `features/graph/components/TransactionGraph/TransactionGraph.css` (create)
- Receives `data: GraphData`
- `buildNodes(data, originId)` → bipartite column layout, per-role styles
- `buildEdges(data, originId)` → `type: 'smart'`, stroke by direction
- `useNodesState` + `onNodesChange` for live drag support
- `useEffect` resets layout when `originId` changes (cross-address navigation)
- Renders: `<MiniMap />`, `<Controls showInteractive={false} />`,
  `<Background variant=Dots />`, `<Panel>` legend

**8. Add "View Graph" link in `AddressPage`**
- File: `features/investigation/pages/AddressPage.tsx` (extend)
- Add after the address breadcrumb:
  ```tsx
  <Link to="/graph/$address" params={{ address }} className="inv-nav__graph-link">
    View Graph ↗
  </Link>
  ```
- File: `features/investigation/pages/AddressPage.css` (extend)
- New class `.inv-nav__graph-link` — same anatomy as `.inv-nav__back`

---

## US-02 — Node Expansion (Follow the Money)

**As an** investigator,
**I want** to click on any address node in the graph and expand it to reveal
its own transactions and connections,
**so that** I can follow the money hop by hop without leaving the graph view.

### Acceptance Criteria

- Clicking an address node that has not been expanded fetches its transactions
  and adds its peer addresses as new nodes and edges to the graph
- Expanded nodes are visually marked (different border or fill)
- A loading indicator appears on the node while its data is being fetched
- The graph layout re-runs automatically after new nodes are added
- Already-expanded nodes do not trigger a second fetch when clicked again

### Tasks

**1. Create `useGraphStore`**
- File: `features/graph/store/useGraphStore.ts` (create)
- Manages:
  ```ts
  interface GraphStore {
    expandedAddresses: Set<string>
    expandAddress: (address: string) => void
  }
  ```
- `expandAddress` adds the address to `expandedAddresses`

**2. Create `useNodeExpansion` hook**
- File: `features/graph/hooks/useNodeExpansion.ts` (create)
- Receives `address: string`
- Checks `useGraphStore` to skip already-expanded nodes
- Calls `useQuery({ queryKey: ['transactions', address], queryFn: ... })`
  with `enabled: false` (manual trigger)
- On click: marks as expanded in store, triggers the query, merges new nodes
  and edges into the existing graph data

**3. Create `AddressNode` custom React Flow node**
- File: `features/graph/components/AddressNode/AddressNode.tsx` (create)
- File: `features/graph/components/AddressNode/AddressNode.css` (create)
- Receives `data: { address, isOrigin, isExpanded, isLoading }`
- Shows a spinner overlay when `isLoading` is true
- Shows a distinct style when `isExpanded`
- Calls `useNodeExpansion` on click

**4. Register `AddressNode` in `TransactionGraph`**
- File: `features/graph/components/TransactionGraph/TransactionGraph.tsx` (extend)
- Pass `nodeTypes={{ address: AddressNode }}` to `<ReactFlow />`
- Map `GraphNode` data to React Flow node format including the custom type

**5. Auto-layout after expansion**
- File: `features/graph/hooks/useGraphLayout.ts` (create)
- Uses a simple force-directed or dagre layout to reposition nodes when new
  ones are added
- `dagre` is a lightweight option: `pnpm add dagre @types/dagre`
- Recalculates positions whenever the node list changes

---

## US-03 — Path Highlighting Between Two Addresses

**As an** investigator,
**I want** to select two addresses in the graph and highlight the shortest path
of transactions connecting them,
**so that** I can produce clear visual evidence of a fund flow between a suspect
and a target address for legal proceedings.

### Acceptance Criteria

- A "Trace Path" panel allows the investigator to type or click-select an origin
  and a destination address
- On confirmation, edges and nodes along the shortest path are highlighted;
  the rest of the graph is dimmed
- If no path exists within the loaded graph, a message informs the investigator
  to expand more nodes first
- Clicking "Clear" removes the highlight and restores the full graph

### Tasks

**1. Create `findShortestPath` utility**
- File: `features/graph/services/pathFinder.ts` (create)
- `findShortestPath(edges: GraphEdge[], from: string, to: string): string[]`
- BFS over `GraphEdge[]` treating the graph as directed
- Returns an ordered list of addresses forming the path, or `[]` if none found

**2. Extend `useGraphStore` with path state**
- File: `features/graph/store/useGraphStore.ts` (extend)
  ```ts
  highlightedPath: string[]   // ordered address IDs
  setHighlightedPath: (path: string[]) => void
  clearHighlight: () => void
  ```

**3. Create `PathTracePanel` component**
- File: `features/graph/components/PathTracePanel/PathTracePanel.tsx` (create)
- File: `features/graph/components/PathTracePanel/PathTracePanel.css` (create)
- Two inputs: origin address, destination address (pre-filled with the page's
  origin address)
- On submit: calls `findShortestPath`, stores result in `useGraphStore`
- Shows "No path found" message when result is empty
- "Clear" button calls `clearHighlight`

**4. Apply highlight in `TransactionGraph`**
- File: `features/graph/components/TransactionGraph/TransactionGraph.tsx` (extend)
- Reads `highlightedPath` from `useGraphStore`
- When a path is active:
  - Nodes in path: full opacity, highlighted stroke
  - Edges in path: full opacity, colored stroke
  - Everything else: reduced opacity (dimmed)
- Applies via React Flow's `className` or `style` on each node/edge

**5. Compose `PathTracePanel` in `GraphPage`**
- File: `features/graph/pages/GraphPage.tsx` (extend)
- Render `<PathTracePanel />` as a floating panel overlaid on the graph
  (absolutely positioned, does not interrupt the graph canvas)
