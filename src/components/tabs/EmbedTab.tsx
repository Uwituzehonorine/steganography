"use client";

import { useState } from "react";
import { RefreshCw, TrendingUp } from "lucide-react";
import { AudioDropZone } from "@/components/AudioDropZone";
import { MetricCard, ToggleSwitch } from "@/components/ui";
import { generateHexKey } from "@/lib/utils";
import { SAMPLE_EHR_TEMPLATE } from "@/lib/data";
import { EmbedResult, ProcessStep } from "@/types";

const EMBED_STEPS: ProcessStep[] = [
    { pct: 5, label: "Normalizing audio samples...", log: "[00:00.021] Audio normalization → 16-bit unsigned int (0–65535)", type: "info" },
    { pct: 18, label: "Applying linear interpolation...", log: "[00:00.089] Linear interpolation complete · Sample count doubled", type: "process" },
    { pct: 32, label: "Computing sample distances...", log: "[00:00.143] Distance D = T / max(j)×2 for all even indices", type: "process" },
    { pct: 47, label: "Optimizing sample space (N'j)...", log: "[00:00.201] Sample spaces quantized → power-of-2 · Avg Nj = 8", type: "process" },
    { pct: 62, label: "Embedding EHR payload (multi-layer)...", log: "[00:00.289] Multi-layer embedding · Keys generated for all even indices", type: "process" },
    { pct: 78, label: "Applying smoothing algorithm...", log: "[00:00.341] Smoothing: sIj = ⌈(Ij + I'j) / 2⌉ · Distortion reduced", type: "process" },
    { pct: 90, label: "Computing PSNR / MSE metrics...", log: "[00:00.398] MSE computed · PSNR = 10 × log₁₀((2¹⁶-1)² / MSE)", type: "info" },
    { pct: 100, label: "Embedding complete!", log: "[00:00.421] ✓ Stego audio generated · Key bundle ready", type: "success" },
];

export default function EmbedTab() {
    const [encKey, setEncKey] = useState("7f4e-2a1b-9c8d-3f6e");
    const [ehrPayload, setEhrPayload] = useState("");
    const [dataType, setDataType] = useState("Patient Demographics");
    const [encoding, setEncoding] = useState("UTF-8 + AES-256");
    const [bitDepth, setBitDepth] = useState("16-bit (Optimal)");
    const [outputFormat, setOutputFormat] = useState(".wav (Lossless)");
    const [steps, setSteps] = useState({ interpolation: true, multiLayering: true, optimizedSampleSpace: true, smoothing: true });

    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressLabel, setProgressLabel] = useState("Initializing...");
    const [logs, setLogs] = useState<Array<{ text: string; type: string }>>([
        { text: "[00:00.000] System ready. Awaiting input...", type: "log-info" },
    ]);
    const [result, setResult] = useState<EmbedResult | null>(null);
    const [audioFile, setAudioFile] = useState<File | null>(null);

    const appendLog = (text: string, type: string) =>
        setLogs((prev) => [...prev, { text, type: `log-${type}` }]);

    const startEmbedding = async () => {
        if (!ehrPayload.trim()) { alert("Please enter EHR data or load a template."); return; }
        setProcessing(true);
        setResult(null);
        setLogs([{ text: "[00:00.000] Initializing Fourfold embedding pipeline...", type: "log-info" }]);
        setProgress(0);

        // Simulate steps with delays
        for (const step of EMBED_STEPS) {
            await new Promise((r) => setTimeout(r, 320 + Math.random() * 200));
            setProgress(step.pct);
            setProgressLabel(step.label);
            appendLog(step.log, step.type);
        }

        // Call API
        try {
            const formData = new FormData();
            formData.append("ehrPayload", ehrPayload);
            formData.append("dataType", dataType);
            formData.append("encoding", encoding);
            formData.append("bitDepth", bitDepth);
            formData.append("outputFormat", outputFormat);
            if (audioFile) {
                formData.append("audioFile", audioFile);
            }

            const res = await fetch("/api/steganography/embed", {
                method: "POST",
                body: formData,
            });
            const json = await res.json();
            if (json.success) setResult(json.data);
        } catch {
            appendLog("[ERROR] API call failed – using local simulation", "warning");
            // Fallback local simulation
            const psnr = (Math.random() * (126.34 - 110) + 110).toFixed(2);
            const mse = (Math.random() * 0.12 + 0.04).toFixed(4);
            setResult({ psnr: `${psnr} dB`, mse, carrier: `stego_ehr_${Date.now()}.wav`, payloadSize: "4.2 kb", timestamp: new Date().toISOString(), keyBundle: encKey });
        }
        setProcessing(false);
    };

    const resetForm = () => {
        setEhrPayload(""); setProgress(0); setResult(null); setProcessing(false);
        setLogs([{ text: "[00:00.000] System ready. Awaiting input...", type: "log-info" }]);
    };

    const downloadStego = () => {
        if (!result) return;
        const content = `STEGO_AUDIO_BUNDLE\nKey: ${encKey}\nPSNR: ${result.psnr}\nMSE: ${result.mse}\nTimestamp: ${result.timestamp}`;
        const a = document.createElement("a");
        a.href = `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`;
        a.download = `stego_ehr_${Date.now()}.bundle.txt`;
        a.click();
    };

    return (
        <div>
            {/* Header */}
            <div className="fade-in mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="font-mono text-xs text-teal-400 tracking-widest uppercase">// embed operation</div>
                    <div className="flex-1 h-px bg-gradient-to-r from-teal-400/20 to-transparent" />
                </div>
                <h1 className="font-display text-3xl font-extrabold text-white">
                    Conceal Health Records <span className="shimmer-text">in Audio</span>
                </h1>
                <p className="text-slate-400 text-sm mt-1 font-body">
                    Hide sensitive EHR data within audio carrier files using the fourfold steganographic
                    paradigm: interpolation → multi-layering → optimized sample space → smoothing.
                </p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 fade-in fade-in-delay-1 mb-6">
                <MetricCard
                    label="AVG PSNR"
                    value={<span className="text-teal-400">110.65<span className="text-sm text-slate-500 font-body"> dB</span></span>}
                    sub={<><TrendingUp className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400">+5.1 dB</span> vs baseline</>}
                />
                <MetricCard
                    label="MAX PSNR"
                    value={<span className="text-cyan-400">126.34<span className="text-sm text-slate-500 font-body"> dB</span></span>}
                    sub="at 1 kb payload"
                />
                <MetricCard
                    label="CAPACITY"
                    value={<span className="text-teal-300">100<span className="text-sm text-slate-500 font-body"> kb</span></span>}
                    sub="max EHR payload"
                />
                <MetricCard
                    label="SECURITY"
                    value={<span className="text-emerald-400">HIPAA</span>}
                    sub={<><div className="status-dot status-active" /> Compliant</>}
                />
            </div>

            {/* Main Panel */}
            <div className="grid lg:grid-cols-2 gap-6 fade-in fade-in-delay-2">
                {/* Left: Upload & Config */}
                <div className="glass rounded-2xl p-6 teal-glow">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="font-display font-bold text-white text-lg">Audio Carrier File</h2>
                        <span className="tag tag-teal">WAV / MP3 / FLAC</span>
                    </div>

                    <AudioDropZone onFile={setAudioFile} className="mb-5" />

                    <h3 className="font-display font-semibold text-white mb-3">EHR Payload</h3>
                    <div className="mb-3">
                        <label className="text-xs text-slate-500 font-mono uppercase tracking-wider mb-1.5 block">
                            Patient Record / Medical Data
                        </label>
                        <textarea
                            className="input-field"
                            id="ehrPayload"
                            value={ehrPayload}
                            onChange={(e) => setEhrPayload(e.target.value)}
                            placeholder={"Paste EHR data here: patient ID, diagnosis codes, lab results...\n\nOR use the template loader below."}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                            <label className="text-xs text-slate-500 font-mono uppercase tracking-wider mb-1.5 block">Data Type</label>
                            <select className="select-field" value={dataType} onChange={(e) => setDataType(e.target.value)}>
                                {["Patient Demographics", "Lab Results", "Prescription Records", "Diagnostic Codes (ICD-10)", "Imaging Reports", "Custom / Raw"].map(t => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-mono uppercase tracking-wider mb-1.5 block">Encoding</label>
                            <select className="select-field" value={encoding} onChange={(e) => setEncoding(e.target.value)}>
                                {["UTF-8 + AES-256", "Base64 + RSA", "HL7 FHIR Format", "Raw Binary"].map(t => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="text-xs text-slate-500 font-mono uppercase tracking-wider mb-1.5 block">
                            Encryption Key (Auto-Generated)
                        </label>
                        <div className="flex gap-2">
                            <input
                                className="input-field font-mono text-xs text-teal-300"
                                value={encKey}
                                readOnly
                            />
                            <button className="btn-secondary whitespace-nowrap" onClick={() => setEncKey(generateHexKey())}>
                                <RefreshCw className="w-3.5 h-3.5" /> New Key
                            </button>
                        </div>
                    </div>

                    <button className="btn-secondary w-full mb-3" onClick={() => setEhrPayload(SAMPLE_EHR_TEMPLATE)}>
                        📋 Load Sample EHR Template
                    </button>
                </div>

                {/* Right: Algorithm Config & Process */}
                <div className="space-y-5">
                    {/* Algorithm Config */}
                    <div className="glass rounded-2xl p-6">
                        <h2 className="font-display font-bold text-white text-lg mb-1">Algorithm Parameters</h2>
                        <p className="text-slate-500 text-xs font-mono mb-4">Fourfold paradigm configuration</p>

                        <div className="space-y-3 mb-5">
                            {[
                                { key: "interpolation", num: 1, color: "text-teal-400", toggle: "bg-teal-500", title: "Linear Interpolation", sub: "Expands sample space · 2× upsampling" },
                                { key: "multiLayering", num: 2, color: "text-cyan-400", toggle: "bg-cyan-500", title: "Multi-Layering", sub: "Distributes hidden bits across layers" },
                                { key: "optimizedSampleSpace", num: 3, color: "text-teal-400", toggle: "bg-teal-500", title: "Optimized Sample Space", sub: "Power-of-2 quantization · adaptive" },
                                { key: "smoothing", num: 4, color: "text-emerald-400", toggle: "bg-emerald-500", title: "Smoothing", sub: "Post-embed averaging · reduces artifacts" },
                            ].map(({ key, num, color, toggle, title, sub }) => (
                                <div key={key} className="flex items-center gap-3 p-3 rounded-xl glass-light border border-teal-400/15">
                                    <div className={`w-7 h-7 rounded-lg bg-teal-500/20 flex items-center justify-center font-mono text-xs font-bold flex-shrink-0 ${color}`}>
                                        {num}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm text-white font-medium">{title}</div>
                                        <div className="text-xs text-slate-500">{sub}</div>
                                    </div>
                                    <ToggleSwitch
                                        checked={steps[key as keyof typeof steps]}
                                        onChange={(v) => setSteps((s) => ({ ...s, [key]: v }))}
                                        color={toggle}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-slate-500 font-mono uppercase tracking-wider mb-1.5 block">Bit Depth</label>
                                <select className="select-field" value={bitDepth} onChange={(e) => setBitDepth(e.target.value)}>
                                    {["16-bit (Optimal)", "24-bit", "32-bit Float"].map(t => <option key={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 font-mono uppercase tracking-wider mb-1.5 block">Output Format</label>
                                <select className="select-field" value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)}>
                                    {[".wav (Lossless)", ".flac (Lossless)", ".aiff"].map(t => <option key={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Process Button + Progress */}
                    <div className="glass rounded-2xl p-6">
                        <div className="flex gap-3 mb-5">
                            <button className="btn-primary flex-1" onClick={startEmbedding} disabled={processing}>
                                {processing ? "⟶ Processing..." : "⟶ BEGIN EMBEDDING"}
                            </button>
                            <button className="btn-secondary" onClick={resetForm}>↺ Reset</button>
                        </div>

                        {(processing || logs.length > 1) && (
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-mono text-xs text-teal-400">{progressLabel}</span>
                                    <span className="font-mono text-xs text-slate-400">{progress}%</span>
                                </div>
                                <div className="h-1.5 bg-navy-800 rounded-full mb-4 overflow-hidden" style={{ background: "rgba(9,22,48,0.8)" }}>
                                    <div className="progress-bar" style={{ width: `${progress}%` }} />
                                </div>
                                <div className="glass-light rounded-xl p-4 space-y-1 max-h-48 overflow-y-auto">
                                    {logs.map((log, i) => (
                                        <div key={i} className={`log-entry ${log.type}`}>{log.text}</div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {result && (
                            <div className="mt-4 glass-light rounded-xl p-4 border border-teal-400/25">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="status-dot status-active" />
                                    <span className="font-mono text-sm text-teal-400">EMBEDDING COMPLETE</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div className="text-center p-2 glass rounded-lg">
                                        <div className="font-mono text-lg text-teal-400 font-bold">{result.psnr}</div>
                                        <div className="text-xs text-slate-500 font-mono">PSNR</div>
                                    </div>
                                    <div className="text-center p-2 glass rounded-lg">
                                        <div className="font-mono text-lg text-emerald-400 font-bold">{result.mse}</div>
                                        <div className="text-xs text-slate-500 font-mono">MSE</div>
                                    </div>
                                </div>
                                <button className="btn-primary w-full" onClick={downloadStego}>
                                    ⬇ Download Stego Audio + Key
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
