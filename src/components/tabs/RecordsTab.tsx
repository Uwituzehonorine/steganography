"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Plus, X, Lock } from "lucide-react";
import { Tag } from "@/components/ui";
import { EHRRecord, ExtractResult } from "@/types";
import { MOCK_RECORDS } from "@/lib/data";

const STATUS_VARIANT: Record<string, "emerald" | "teal" | "amber"> = {
    Protected: "emerald",
    Extracted: "teal",
    Pending: "amber",
};

// ── Extract Modal (inline) ──────────────────────────────────────
function ExtractModal({
    record,
    onClose,
}: {
    record: EHRRecord | null;
    onClose: () => void;
}) {
    const [step, setStep] = useState<"auth" | "processing" | "result">("auth");
    const [password, setPassword] = useState("");
    const [reason, setReason] = useState("Clinical Review");
    const [progress, setProgress] = useState(0);
    const [progressLabel, setProgressLabel] = useState("");
    const [logs, setLogs] = useState<string[]>([]);
    const [result, setResult] = useState<ExtractResult | null>(null);
    const [activeETab, setActiveETab] = useState("summary");

    const appendLog = (text: string) => setLogs((p) => [...p, text]);

    const runExtraction = async () => {
        if (!password.trim()) {
            (document.getElementById("extractPwd") as HTMLInputElement)?.focus();
            return;
        }
        setStep("processing");
        setLogs(["[INIT] Starting extraction pipeline..."]);
        setProgress(0);

        const steps = [
            { pct: 15, label: "Authenticating credentials...", log: "[00:00.011] AES-256 key derived" },
            { pct: 30, label: "Normalizing stego audio...", log: "[00:00.035] Stego audio normalized" },
            { pct: 48, label: "Reversing smoothing process...", log: "[00:00.071] Desmoothing applied" },
            { pct: 65, label: "Re-interpolating samples...", log: "[00:00.102] Samples reconstructed" },
            { pct: 80, label: "Extracting payload bits via key...", log: "[00:00.138] Key-guided extraction complete" },
            { pct: 95, label: "Verifying data integrity...", log: "[00:00.159] Checksum verified · Clean" },
            { pct: 100, label: "Decryption complete!", log: "[00:00.178] ✓ EHR data recovered · HIPAA logged" },
        ];

        for (const s of steps) {
            await new Promise((r) => setTimeout(r, 300 + Math.random() * 150));
            setProgress(s.pct);
            setProgressLabel(s.label);
            appendLog(s.log);
        }

        try {
            const res = await fetch("/api/steganography/extract", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ extractionKey: "mock-key", password, reason }),
            });
            const json = await res.json();
            if (json.success) {
                setResult({ ...json.data, patientId: record!.id, type: record!.type, date: record!.date, diagnosis: record!.diagnosis, icd: record!.icd, psnr: record!.psnr, carrier: record!.carrier, reason });
            } else throw new Error("API error");
        } catch {
            setResult({
                patientId: record!.id, type: record!.type, date: record!.date,
                diagnosis: record!.diagnosis, icd: record!.icd, psnr: record!.psnr,
                carrier: record!.carrier, accessTime: new Date().toISOString(), reason,
            });
        }
        setStep("result");
    };

    const downloadRecord = () => {
        if (!result) return;
        const content = `SECUREAUDIO EHR - DECRYPTED RECORD\n${"=".repeat(40)}\nPatient ID: ${result.patientId}\nType: ${result.type}\nDate: ${result.date}\nDiagnosis: ${result.diagnosis}\nICD-10: ${result.icd}\nCarrier: ${result.carrier}\nPSNR: ${result.psnr} dB\nAccessed: ${result.accessTime}\nAccess By: Dr. R. Uwituze\n\n[HIPAA COMPLIANT · CONFIDENTIAL]`;
        const a = document.createElement("a");
        a.href = `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`;
        a.download = `EHR_${result.patientId}_decrypted.txt`;
        a.click();
    };

    if (!record) return null;

    return (
        <div className="extract-modal open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="extract-modal-box glass rounded-2xl border border-teal-400/25" style={{ boxShadow: "0 30px 80px rgba(2,9,22,0.95)" }}>
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-teal-400/15">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-teal-500/15 flex items-center justify-center border border-teal-400/25">
                            <Lock className="w-5 h-5 text-teal-400" />
                        </div>
                        <div>
                            <div className="font-display font-bold text-white text-base">Extract: {record.type}</div>
                            <div className="font-mono text-xs text-slate-500">Patient ID: {record.id}</div>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg glass-light flex items-center justify-center text-slate-400 hover:text-white transition-colors flex-shrink-0">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5">
                    {/* Step 1: Auth */}
                    {step === "auth" && (
                        <div>
                            <div className="ehr-section mb-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="status-dot status-warning" />
                                    <span className="font-mono text-xs text-amber-400">AUTHENTICATION REQUIRED</span>
                                </div>
                                <p className="text-sm text-slate-400 font-body">
                                    Extracting this record requires your decryption password. Access is logged for HIPAA compliance.
                                </p>
                            </div>
                            <div className="mb-4">
                                <label className="text-xs text-slate-500 font-mono uppercase tracking-wider mb-1.5 block">Decryption Password</label>
                                <input id="extractPwd" type="password" className="input-field" placeholder="Enter your password to decrypt this record" value={password} onChange={(e) => setPassword(e.target.value)} />
                            </div>
                            <div className="mb-5">
                                <label className="text-xs text-slate-500 font-mono uppercase tracking-wider mb-1.5 block">Reason for Access</label>
                                <select className="select-field" value={reason} onChange={(e) => setReason(e.target.value)}>
                                    {["Clinical Review", "Emergency Treatment", "Audit / Compliance", "Patient Request", "Research (Anonymized)"].map(r => <option key={r}>{r}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-3">
                                <button className="btn-primary flex-1" onClick={runExtraction}>🔓 Decrypt & Extract Record</button>
                                <button className="btn-secondary" onClick={onClose}>Cancel</button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Processing */}
                    {step === "processing" && (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 rounded-2xl glass-light mx-auto flex items-center justify-center border border-teal-400/25 mb-4 teal-glow">
                                <svg className="w-8 h-8 text-teal-400 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                            </div>
                            <div className="font-mono text-teal-400 text-sm mb-1">{progressLabel}</div>
                            <div className="font-mono text-xs text-slate-600">Please wait · Do not close this window</div>
                            <div className="mt-4 mx-auto max-w-xs h-1 rounded-full overflow-hidden" style={{ background: "rgba(9,22,48,0.8)" }}>
                                <div className="progress-bar h-full" style={{ width: `${progress}%` }} />
                            </div>
                            <div className="mt-3 glass-light rounded-xl p-3 text-left max-h-28 overflow-y-auto">
                                {logs.map((l, i) => <div key={i} className="log-entry log-process text-xs">{l}</div>)}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Results */}
                    {step === "result" && result && (
                        <div>
                            <div className="flex items-center gap-3 mb-4 ehr-section">
                                <div className="status-dot status-active flex-shrink-0" style={{ width: 10, height: 10 }} />
                                <div>
                                    <div className="font-mono text-sm text-emerald-400 font-bold">EXTRACTION SUCCESSFUL</div>
                                    <div className="font-mono text-xs text-slate-500">Extracted at {new Date(result.accessTime).toLocaleTimeString()}</div>
                                </div>
                                <div className="ml-auto flex gap-2 flex-wrap">
                                    <Tag variant="emerald">✓ Integrity OK</Tag>
                                    <Tag variant="teal">HIPAA Logged</Tag>
                                </div>
                            </div>

                            {/* ETab buttons */}
                            <div className="flex gap-1 mb-4 flex-wrap">
                                {["summary", "vitals", "meds", "meta"].map((tab) => (
                                    <button key={tab} className={`etab-btn ${activeETab === tab ? "active" : ""}`} onClick={() => setActiveETab(tab)}>
                                        {tab.charAt(0).toUpperCase() + tab.slice(1).replace("meds", "Medications").replace("meta", "Stego Meta")}
                                    </button>
                                ))}
                            </div>

                            {activeETab === "summary" && (
                                <div>
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div className="ehr-section"><div className="ehr-label">Patient ID</div><div className="ehr-value mono">{result.patientId}</div></div>
                                        <div className="ehr-section"><div className="ehr-label">Record Type</div><div className="ehr-value">{result.type}</div></div>
                                        <div className="ehr-section"><div className="ehr-label">Date of Service</div><div className="ehr-value">{result.date}</div></div>
                                        <div className="ehr-section"><div className="ehr-label">Blood Type</div><div className="ehr-value good">O+</div></div>
                                    </div>
                                    <div className="ehr-section"><div className="ehr-label">Primary Diagnosis</div><div className="ehr-value font-medium">{result.diagnosis}</div><div className="font-mono text-xs text-slate-500 mt-1">ICD-10: {result.icd}</div></div>
                                    <div className="ehr-section"><div className="ehr-label">Attending Physician</div><div className="ehr-value">Dr. R. Uwituze · CHUK, Kigali, Rwanda</div></div>
                                </div>
                            )}

                            {activeETab === "vitals" && (
                                <div>
                                    <div className="grid grid-cols-3 gap-2 mb-3">
                                        {[{ l: "WBC", v: "12.4", u: "×10³/μL ↑", c: "text-rose-400" }, { l: "CRP", v: "48", u: "mg/L ↑", c: "text-amber-400" }, { l: "O₂ Sat", v: "94%", u: "SpO₂ ↓", c: "text-amber-400" }].map(x => (
                                            <div key={x.l} className="ehr-section text-center"><div className="ehr-label">{x.l}</div><div className={`font-display text-xl font-bold ${x.c}`}>{x.v}</div><div className="font-mono text-xs text-slate-500">{x.u}</div></div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="ehr-section"><div className="ehr-label">Temperature</div><div className="ehr-value highlight">38.7 °C</div></div>
                                        <div className="ehr-section"><div className="ehr-label">Heart Rate</div><div className="ehr-value good">88 bpm</div></div>
                                        <div className="ehr-section"><div className="ehr-label">Blood Pressure</div><div className="ehr-value">122 / 78 mmHg</div></div>
                                        <div className="ehr-section"><div className="ehr-label">Resp. Rate</div><div className="ehr-value highlight">22 breaths/min</div></div>
                                    </div>
                                </div>
                            )}

                            {activeETab === "meds" && (
                                <div className="space-y-2">
                                    {[{ name: "Amoxicillin 875 mg", dose: "PO · BID · 7 days · Start: 2024-11-15", cat: "Antibiotic", color: "teal" },
                                    { name: "Azithromycin 500 mg", dose: "PO · QD · 5 days · Start: 2024-11-15", cat: "Antibiotic", color: "teal" },
                                    { name: "Paracetamol 1000 mg", dose: "PO · TID · PRN fever · Max 3g/day", cat: "Analgesic / Antipyretic", color: "amber" }].map(m => (
                                        <div key={m.name} className="ehr-section flex items-start gap-3">
                                            <div className={`w-8 h-8 rounded-lg bg-${m.color}-500/15 flex items-center justify-center flex-shrink-0 mt-0.5 border border-${m.color}-400/20`}>
                                                <span className={`text-${m.color}-400 text-xs font-bold`}>Rx</span>
                                            </div>
                                            <div><div className="text-sm text-white font-medium">{m.name}</div><div className="font-mono text-xs text-slate-500">{m.dose}</div><Tag variant={m.color === "teal" ? "teal" : "amber"} className="mt-1">{m.cat}</Tag></div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeETab === "meta" && (
                                <div className="space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="ehr-section"><div className="ehr-label">PSNR Value</div><div className="ehr-value mono">{result.psnr} dB</div></div>
                                        <div className="ehr-section"><div className="ehr-label">MSE</div><div className="ehr-value mono">0.0731</div></div>
                                        <div className="ehr-section"><div className="ehr-label">Carrier File</div><div className="ehr-value mono text-xs">{result.carrier}</div></div>
                                        <div className="ehr-section"><div className="ehr-label">Payload Size</div><div className="ehr-value mono">4.2 kb</div></div>
                                    </div>
                                    <div className="ehr-section"><div className="ehr-label">Algorithm Used</div><div className="flex flex-wrap gap-1 mt-1"><Tag variant="teal">Interpolation</Tag><Tag variant="teal">Multi-Layering</Tag><Tag variant="teal">Opt. Sample Space</Tag><Tag variant="emerald">Smoothing</Tag></div></div>
                                    <div className="ehr-section"><div className="ehr-label">Extraction Key Fingerprint</div><div className="font-mono text-xs text-teal-300 mt-1 break-all">1010 1011 1010 1110 · 1110 1110 1011 1111</div></div>
                                    <div className="ehr-section"><div className="ehr-label">Access Log</div><div className="font-mono text-xs text-slate-400 mt-1">Accessed by Dr. R. Uwituze · {new Date(result.accessTime).toLocaleString()}</div><div className="font-mono text-xs text-slate-500">Reason: {result.reason}</div></div>
                                </div>
                            )}

                            <div className="flex gap-2 mt-4 flex-wrap">
                                <button className="btn-primary flex-1" onClick={downloadRecord}>⬇ Download Decrypted Record</button>
                                <button className="btn-secondary" onClick={() => window.print()}>🖨 Print</button>
                                <button className="btn-secondary" onClick={onClose}>Close</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Main Records Tab ────────────────────────────────────────────
export default function RecordsTab() {
    const [records, setRecords] = useState<EHRRecord[]>(MOCK_RECORDS);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("All Types");
    const [statusFilter, setStatusFilter] = useState("All Status");
    const [extractRecord, setExtractRecord] = useState<EHRRecord | null>(null);
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 6;

    const filtered = records.filter((r) => {
        const matchSearch =
            !search ||
            r.id.toLowerCase().includes(search.toLowerCase()) ||
            r.type.toLowerCase().includes(search.toLowerCase()) ||
            r.diagnosis.toLowerCase().includes(search.toLowerCase());
        const matchType = typeFilter === "All Types" || r.type === typeFilter;
        const matchStatus = statusFilter === "All Status" || r.status === statusFilter;
        return matchSearch && matchType && matchStatus;
    });

    const total = filtered.length;
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const totalPages = Math.ceil(total / PAGE_SIZE);

    return (
        <div>
            <div className="fade-in mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="font-mono text-xs text-teal-400 tracking-widest uppercase">// ehr records vault</div>
                    <div className="flex-1 h-px bg-gradient-to-r from-teal-400/20 to-transparent" />
                </div>
                <h1 className="font-display text-3xl font-extrabold text-white">
                    Protected <span className="shimmer-text">Health Records</span>
                </h1>
                <p className="text-slate-400 text-sm mt-1 font-body">
                    All health records protected via audio steganography. Access requires extraction key and decryption password.
                </p>
            </div>

            {/* Filters */}
            <div className="glass rounded-2xl p-4 mb-5 flex flex-wrap gap-3 items-center">
                <div className="flex-1 min-w-48 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        className="input-field pl-9"
                        placeholder="Search by patient ID, name, record type..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
                <select className="select-field w-40" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
                    {["All Types", "Lab Results", "Prescriptions", "Imaging", "Diagnoses", "Demographics"].map(t => <option key={t}>{t}</option>)}
                </select>
                <select className="select-field w-36" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                    {["All Status", "Protected", "Pending", "Extracted"].map(t => <option key={t}>{t}</option>)}
                </select>
                <button className="btn-primary">
                    <Plus className="w-4 h-4" /> Add Record
                </button>
            </div>

            {/* Table */}
            <div className="glass rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-teal-400/10">
                                {["Patient ID", "Record Type", "Audio Carrier", "PSNR", "Date", "Status", "Actions"].map(h => (
                                    <th key={h} className="text-left py-3 px-4 font-mono text-xs text-slate-500 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-slate-600 font-mono text-sm">
                                        No records found matching your filters.
                                    </td>
                                </tr>
                            ) : paginated.map((r) => (
                                <tr key={r.id} className="border-b border-teal-400/05 hover:bg-teal-400/[0.03] transition-colors">
                                    <td className="py-3 px-4 font-mono text-xs text-teal-300">{r.id}</td>
                                    <td className="py-3 px-4 text-sm text-slate-300">{r.type}</td>
                                    <td className="py-3 px-4 font-mono text-xs text-slate-500 hidden md:table-cell">{r.carrier}</td>
                                    <td className="py-3 px-4 font-mono text-xs text-teal-400 hidden sm:table-cell">{r.psnr} dB</td>
                                    <td className="py-3 px-4 text-xs text-slate-500 hidden md:table-cell">{r.date}</td>
                                    <td className="py-3 px-4">
                                        <Tag variant={STATUS_VARIANT[r.status] ?? "amber"}>{r.status}</Tag>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex gap-1.5">
                                            <button className="btn-secondary py-1 px-2 text-xs">View</button>
                                            <button className="btn-primary py-1 px-2 text-xs" onClick={() => setExtractRecord(r)}>
                                                Extract
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="border-t border-teal-400/10 px-4 py-3 flex items-center justify-between">
                    <span className="font-mono text-xs text-slate-500">
                        Showing {paginated.length} of {total} records
                    </span>
                    <div className="flex gap-2">
                        <button className="btn-secondary py-1.5 px-3 text-xs" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                        <span className="font-mono text-xs text-slate-500 self-center">{page} / {totalPages}</span>
                        <button className="btn-primary py-1.5 px-3 text-xs" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
                    </div>
                </div>
            </div>

            {/* Extract Modal */}
            {extractRecord && (
                <ExtractModal record={extractRecord} onClose={() => setExtractRecord(null)} />
            )}
        </div>
    );
}
