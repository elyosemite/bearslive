import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate } from "@tanstack/react-router"
import { addressSchema } from "../types/address.schema"
import { useInvestigation } from "../store/useInvestigationStore"
import type { AddressFormData } from "../types/address.schema"
import "./Hero.css"

// ── Network data ─────────────────────────────────────────────────────────────

interface NetworkNode {
    id: string
    x: number
    y: number
    color: string
    label: string
    size: number
    pulseDelay: string
    pulseDur: string
}

interface NetworkEdge {
    from: string
    to: string
    scanDelay: string
    scanDur: string
}

const NODES: NetworkNode[] = [
    { id: "O", x: 210, y: 158, color: "#2C65C8", label: "bc1q...7f3a", size: 27, pulseDelay: "0s",    pulseDur: "2.6s" },
    { id: "A", x: 80,  y: 72,  color: "#2A7A46", label: "1A4z...9e2d", size: 19, pulseDelay: "0.5s",  pulseDur: "2.8s" },
    { id: "B", x: 340, y: 72,  color: "#B63C28", label: "3J8k...1c9f", size: 21, pulseDelay: "1.2s",  pulseDur: "2.4s" },
    { id: "C", x: 72,  y: 252, color: "#2A7A46", label: "bc1p...4a7b", size: 17, pulseDelay: "1.9s",  pulseDur: "3s"   },
    { id: "D", x: 348, y: 252, color: "#C05410", label: "1F3m...8d2a", size: 20, pulseDelay: "0.8s",  pulseDur: "2.6s" },
    { id: "E", x: 210, y: 28,  color: "#B63C28", label: "bc1q...2k8p", size: 18, pulseDelay: "1.5s",  pulseDur: "2.9s" },
]

const EDGES: NetworkEdge[] = [
    { from: "O", to: "A", scanDelay: "0s",    scanDur: "2.8s" },
    { from: "O", to: "B", scanDelay: "1.1s",  scanDur: "2.8s" },
    { from: "O", to: "C", scanDelay: "0.5s",  scanDur: "3.2s" },
    { from: "O", to: "D", scanDelay: "1.7s",  scanDur: "3s"   },
    { from: "O", to: "E", scanDelay: "0.25s", scanDur: "2.5s" },
]

// ── Sub-components ────────────────────────────────────────────────────────────

function NetworkAnimation() {
    const nodeMap = new Map(NODES.map((n) => [n.id, n]))

    return (
        <div className="network-wrap">
            <svg
                viewBox="0 0 420 308"
                className="network-svg"
                aria-label="Animated transaction network visualization"
            >
                <defs>
                    <filter id="scan-glow" x="-80%" y="-80%" width="260%" height="260%">
                        <feGaussianBlur stdDeviation="2.5" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Edges + scanning dots */}
                {EDGES.map((edge) => {
                    const src = nodeMap.get(edge.from)!
                    const dst = nodeMap.get(edge.to)!
                    const dx = dst.x - src.x
                    const dy = dst.y - src.y

                    return (
                        <g key={`e-${edge.from}-${edge.to}`}>
                            <line
                                x1={src.x} y1={src.y}
                                x2={dst.x} y2={dst.y}
                                stroke="#C9BBA0"
                                strokeWidth="1"
                                strokeDasharray="3 5"
                            />
                            <circle cx={src.x} cy={src.y} r="3.5" fill="#2C65C8" filter="url(#scan-glow)">
                                <animateMotion
                                    path={`M 0 0 L ${dx} ${dy}`}
                                    dur={edge.scanDur}
                                    begin={edge.scanDelay}
                                    repeatCount="indefinite"
                                    calcMode="linear"
                                />
                            </circle>
                        </g>
                    )
                })}

                {/* Nodes */}
                {NODES.map((node) => (
                    <g key={`n-${node.id}`}>
                        <circle
                            cx={node.x}
                            cy={node.y}
                            r={node.size}
                            fill="none"
                            stroke={node.color}
                            strokeWidth="1"
                        >
                            <animate
                                attributeName="r"
                                values={`${node.size};${Math.round(node.size * 2.3)}`}
                                dur={node.pulseDur}
                                begin={node.pulseDelay}
                                repeatCount="indefinite"
                            />
                            <animate
                                attributeName="opacity"
                                values="0.55;0"
                                dur={node.pulseDur}
                                begin={node.pulseDelay}
                                repeatCount="indefinite"
                            />
                        </circle>

                        <circle
                            cx={node.x}
                            cy={node.y}
                            r={node.size}
                            fill={`${node.color}18`}
                            stroke={node.color}
                            strokeWidth={node.id === "O" ? "2" : "1.5"}
                        />

                        <circle
                            cx={node.x}
                            cy={node.y}
                            r={node.id === "O" ? 7 : 4}
                            fill={node.color}
                        />

                        <text
                            x={node.x}
                            y={node.y + node.size + 13}
                            textAnchor="middle"
                            className="node-label"
                        >
                            {node.label}
                        </text>
                    </g>
                ))}
            </svg>

            <div className="network-legend">
                <div className="legend-item">
                    <div className="legend-dot" style={{ background: "#2C65C8" }} />
                    <span>Origin</span>
                </div>
                <div className="legend-item">
                    <div className="legend-dot" style={{ background: "#2A7A46" }} />
                    <span>Clean</span>
                </div>
                <div className="legend-item">
                    <div className="legend-dot" style={{ background: "#C05410" }} />
                    <span>Suspicious</span>
                </div>
                <div className="legend-item">
                    <div className="legend-dot" style={{ background: "#B63C28" }} />
                    <span>Flagged</span>
                </div>
            </div>
        </div>
    )
}

// ── Main export ───────────────────────────────────────────────────────────────

export function Hero() {
    const navigate = useNavigate()
    const setActiveAddress = useInvestigation((s) => s.setActiveAddress)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<AddressFormData>({ resolver: zodResolver(addressSchema) })

    const onSubmit = (data: AddressFormData) => {
        setActiveAddress(data.address)
        navigate({ to: "/addresses/$address", params: { address: data.address } })
    }

    return (
        <section className="hero">
            <div className="hero-grid">
                <div className="hero-left">
                    <div className="hero-eyebrow">
                        <span className="eyebrow-rule" />
                        Bears Live
                        <span className="eyebrow-badge">Blockchain Forensics</span>
                    </div>

                    <h1 className="hero-headline">
                        Follow<br />
                        <em>The Chain.</em>
                    </h1>

                    <p className="hero-copy">
                        Forensic-grade blockchain intelligence for government agencies
                        and financial institutions. Trace illicit cryptocurrency flows
                        across Bitcoin and 40+ networks in real time.
                    </p>

                    <div className="hero-stats">
                        <div className="stat">
                            <span className="stat-value">$4.2B</span>
                            <span className="stat-label">Traced in 2024</span>
                        </div>
                        <div className="stat-sep" />
                        <div className="stat">
                            <span className="stat-value">48h</span>
                            <span className="stat-label">Avg. Resolution</span>
                        </div>
                        <div className="stat-sep" />
                        <div className="stat">
                            <span className="stat-value">12+</span>
                            <span className="stat-label">Gov. Partners</span>
                        </div>
                    </div>
                </div>

                <div className="hero-right">
                    <NetworkAnimation />
                </div>
            </div>

            <div className="hero-input-area">
                <p className="input-eyebrow">Enter a wallet address to begin your investigation</p>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="address-input-wrap">
                        <span className="input-icon" aria-hidden="true">
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.6" />
                                <path d="M21 21l-4.4-4.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                            </svg>
                        </span>

                        <input
                            {...register("address")}
                            className="address-input"
                            placeholder="1A1zP1... · 3J98t1... · bc1q..."
                            spellCheck={false}
                            autoComplete="off"
                        />

                        {errors.address && (
                            <div className="form-hint">
                                <span className="form-error">{errors.address.message}</span>
                            </div>
                        )}

                        <button type="submit" className="trace-btn">
                            <span>Trace</span>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                </form>
            </div>
        </section>
    )
}
