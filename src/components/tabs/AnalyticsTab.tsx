"use client";

import { useState, useEffect } from "react";
import { Tag } from "@/components/ui";

function MetricBig({ value, label }: { value: React.ReactNode; label: string }) {
    return (
        <div className="metric-card text-center">
            <div className="font-display text-3xl font-extrabold mb-1">{value}</div>
            <div className="text-xs text-slate-500 font-mono">{label}</div>
        </div>
    );
}

export default function AnalyticsTab() {
    const [analyticsData, setAnalyticsData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch analytics data from API
    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/analytics');
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Failed to fetch analytics');
            }

            setAnalyticsData(result.data);
        } catch (err) {
            console.error('Failed to fetch analytics:', err);
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-slate-400">Loading analytics...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="text-red-800 font-medium mb-2">Error loading analytics</div>
                <div className="text-red-600 text-sm mb-3">{error}</div>
                <button
                    onClick={fetchAnalytics}
                    className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!analyticsData) {
        return <div className="text-slate-400">No analytics data available</div>;
    }
    return (
        <div>
            {/* Header */}
            <div className="fade-in mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="font-mono text-xs text-teal-400 tracking-widest uppercase">// performance analytics</div>
                    <div className="flex-1 h-px bg-gradient-to-r from-teal-400/20 to-transparent" />
                </div>
                <h1 className="font-display text-3xl font-extrabold text-white">
                    System <span className="shimmer-text">Analytics</span>
                </h1>
                <p className="text-slate-400 text-sm mt-1 font-body">
                    PSNR benchmarks, payload capacity analysis, and security metrics across audio carriers.
                </p>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 fade-in">
                <MetricBig value={<span className="text-teal-400">{analyticsData.totalRecords}</span>} label="Records Protected" />
                <MetricBig value={<span className="text-cyan-400">{analyticsData.totalCarriers}</span>} label="Audio Carriers" />
                <MetricBig value={<span className="text-emerald-400">{analyticsData.recoveryRate}</span>} label="Recovery Rate" />
                <MetricBig value={<span className="text-amber-400">{analyticsData.breaches}</span>} label="Detected Breaches" />
            </div>

            {/* PSNR Chart + Carrier Bars */}
            <div className="grid lg:grid-cols-3 gap-6 fade-in fade-in-delay-1">
                {/* SVG Chart */}
                <div className="lg:col-span-2 glass rounded-2xl p-6">
                    <h2 className="font-display font-bold text-white mb-1">PSNR vs Payload Size</h2>
                    <p className="text-xs text-slate-500 font-mono mb-5">Proposed method vs existing algorithms</p>
                    <div className="relative" style={{ height: 220 }}>
                        <svg width="100%" height="100%" viewBox="0 0 560 220" preserveAspectRatio="none">
                            {/* Grid */}
                            <line x1="40" y1="10" x2="40" y2="190" stroke="rgba(45,212,191,0.08)" strokeWidth="1" />
                            <line x1="40" y1="190" x2="550" y2="190" stroke="rgba(45,212,191,0.08)" strokeWidth="1" />
                            {[145, 100, 55].map((y) => (
                                <line key={y} x1="40" y1={y} x2="550" y2={y} stroke="rgba(45,212,191,0.05)" strokeWidth="1" strokeDasharray="4,4" />
                            ))}
                            {/* Y labels */}
                            {[{ y: 195, v: "95" }, { y: 150, v: "105" }, { y: 105, v: "115" }, { y: 60, v: "125" }].map(({ y, v }) => (
                                <text key={v} x="32" y={y} fill="#475569" fontSize="9" textAnchor="end" fontFamily="Space Mono">{v}</text>
                            ))}
                            {/* Competing methods */}
                            <polyline points="60,62 165,90 270,108 375,130 480,150" fill="none" stroke="#fb7185" strokeWidth="1.5" strokeDasharray="5,3" opacity="0.6" />
                            <polyline points="60,79 165,98 270,120 375,150 480,167" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="5,3" opacity="0.6" />
                            <polyline points="60,70 165,94 270,114 375,140 480,158" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="5,3" opacity="0.6" />
                            {/* Proposed */}
                            <defs>
                                <linearGradient id="proposedGrad" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#2dd4bf" />
                                    <stop offset="100%" stopColor="#22d3ee" />
                                </linearGradient>
                            </defs>
                            <polyline points="60,37 165,55 270,70 375,82 480,100" fill="none" stroke="url(#proposedGrad)" strokeWidth="2.5" />
                            {[[60, 37], [165, 55], [270, 70], [375, 82], [480, 100]].map(([cx, cy], i) => (
                                <circle key={i} cx={cx} cy={cy} r="4" fill={i % 2 === 0 ? "#2dd4bf" : "#22d3ee"} />
                            ))}
                            {/* X labels */}
                            {[{ x: 60, v: "1kb" }, { x: 165, v: "10kb" }, { x: 270, v: "30kb" }, { x: 375, v: "70kb" }, { x: 480, v: "100kb" }].map(({ x, v }) => (
                                <text key={v} x={x} y="205" fill="#475569" fontSize="9" textAnchor="middle" fontFamily="Space Mono">{v}</text>
                            ))}
                        </svg>
                        {/* Legend */}
                        <div className="absolute top-0 right-0 space-y-1">
                            {[
                                { color: "bg-teal-400", label: "Proposed", bright: true },
                                { color: "bg-rose-400", label: "Samudra", bright: false },
                                { color: "bg-amber-400", label: "Amrulloh", bright: false },
                                { color: "bg-slate-400", label: "Prayogi", bright: false },
                            ].map(({ color, label, bright }) => (
                                <div key={label} className="flex items-center gap-2">
                                    <div className={`w-5 h-0.5 ${color} ${!bright ? "opacity-60" : ""}`} />
                                    <span className={`text-xs font-mono ${bright ? "text-teal-400" : "text-slate-500"}`}>{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Carrier PSNR Bars */}
                <div className="glass rounded-2xl p-6">
                    <h2 className="font-display font-bold text-white mb-1">Avg PSNR by Carrier</h2>
                    <p className="text-xs text-slate-500 font-mono mb-4">Per instrument type</p>
                    <div className="space-y-3">
                        {analyticsData.psnrByCarrier?.map((d: any) => {
                            const pct = ((d.val - 109.5) / (112 - 109.5)) * 100;
                            return (
                                <div key={d.label}>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-xs text-slate-400 font-mono">{d.label}</span>
                                        <span className="text-xs font-mono" style={{ color: d.color }}>{d.val} dB</span>
                                    </div>
                                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(13,34,71,0.8)" }}>
                                        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: d.color }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Quick Stats */}
                    <div className="mt-6 space-y-2">
                        <div className="font-mono text-xs text-slate-600 uppercase tracking-widest">Quick Stats</div>
                        {[
                            { l: "Avg PSNR", v: `${analyticsData.avgPSNR} dB`, c: "text-teal-400" },
                            { l: "Protected", v: `${analyticsData.protectedRecords}`, c: "text-emerald-400" },
                            { l: "Recovery", v: `${analyticsData.recoveryRate}`, c: "text-cyan-400" }
                        ].map(s => (
                            <div key={s.l} className="flex justify-between items-center">
                                <span className="text-xs text-slate-500">{s.l}</span>
                                <span className={`font-mono text-xs font-bold ${s.c}`}>{s.v}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Benchmark Table */}
            <div className="glass rounded-2xl p-6 mt-6 fade-in fade-in-delay-2">
                <h2 className="font-display font-bold text-white mb-5">Benchmark Comparison</h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-teal-400/10">
                                {["Method", "PSNR @ 1kb", "PSNR @ 100kb", "Max Payload", "Features"].map(h => (
                                    <th key={h} className={`py-2 px-3 font-mono text-xs text-slate-500 uppercase tracking-wider ${h === "Method" || h === "Features" ? "text-left" : "text-right"}`}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {analyticsData.benchmarks?.map((row: any) => (
                                <tr key={row.method} className={`border-b border-teal-400/05 ${row.isProposed ? "bg-teal-400/[0.03]" : ""}`}>
                                    <td className="py-3 px-3">
                                        <span className={`font-mono text-sm ${row.isProposed ? "text-teal-400 font-bold" : "text-slate-300"}`}>
                                            {row.method}
                                        </span>
                                    </td>
                                    <td className={`py-3 px-3 text-right font-mono text-sm ${row.isProposed ? "text-teal-400" : "text-slate-400"}`}>{row.psnr1kb}</td>
                                    <td className={`py-3 px-3 text-right font-mono text-sm ${row.isProposed ? "text-teal-400" : "text-rose-400"}`}>{row.psnr100kb}</td>
                                    <td className={`py-3 px-3 text-right font-mono text-sm ${row.isProposed ? "text-teal-400" : "text-slate-400"}`}>{row.maxPayload}</td>
                                    <td className="py-3 px-3">
                                        <div className="flex flex-wrap gap-1">
                                            {row.features.map((f: string) => (
                                                <Tag key={f} variant={row.isProposed ? "teal" : "amber"}>{f}</Tag>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
