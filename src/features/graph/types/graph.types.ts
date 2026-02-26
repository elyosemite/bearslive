export interface GraphNode {
    id:       string   // Bitcoin address
    isOrigin: boolean
    balance?: number   // satoshis, optional
}

export interface GraphEdge {
    id:            string  // "${txid}-${source}-${target}"
    source:        string
    target:        string
    valueSatoshis: number
    confirmed:     boolean
}

export interface GraphData {
    nodes: GraphNode[]
    edges: GraphEdge[]
}
