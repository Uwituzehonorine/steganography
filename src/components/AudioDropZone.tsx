"use client";

import { useState, useRef, useCallback } from "react";
import { Music, Upload } from "lucide-react";
import { formatFileSize } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface AudioDropZoneProps {
    onFile: (file: File) => void;
    label?: string;
    sublabel?: string;
    className?: string;
}

export function AudioDropZone({ onFile, label, sublabel, className }: AudioDropZoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback(
        (f: File) => {
            setFile(f);
            onFile(f);
        },
        [onFile]
    );

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const f = e.dataTransfer.files[0];
        if (f) handleFile(f);
    };

    return (
        <div className="space-y-3">
            <div
                className={cn(
                    "upload-zone rounded-xl p-8 text-center cursor-pointer relative overflow-hidden",
                    isDragging && "drag-over",
                    className
                )}
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
            >
                <div className="scan-line" />
                {/* Waveform animation */}
                <div className="flex items-center justify-center gap-1 mb-4" style={{ height: 48 }}>
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div
                            key={i}
                            className={`waveform-bar w-2 rounded-sm opacity-70 ${i % 3 === 0 ? "bg-teal-500" : i % 3 === 1 ? "bg-teal-400" : "bg-cyan-400"
                                }`}
                        />
                    ))}
                </div>
                <p className="text-slate-400 text-sm font-body">
                    {label ?? "Drop audio carrier file here"}
                </p>
                <p className="text-slate-600 text-xs mt-1 font-mono">
                    {sublabel ?? "or click to browse · 132,299 sample optimal"}
                </p>
                <input
                    ref={inputRef}
                    type="file"
                    accept=".wav,.mp3,.flac,.aiff"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
            </div>

            {file && (
                <div className="glass-light rounded-xl p-4 border border-teal-400/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-teal-500/15 flex items-center justify-center">
                            <Music className="w-5 h-5 text-teal-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-white text-sm font-medium truncate">{file.name}</div>
                            <div className="text-slate-500 text-xs font-mono">
                                {formatFileSize(file.size)} · {file.name.split(".").pop()?.toUpperCase() ?? "WAV"} ·
                                44.1 kHz · 16-bit
                            </div>
                        </div>
                        <span className="tag tag-emerald flex-shrink-0">Ready</span>
                    </div>
                </div>
            )}

            {!file && (
                <button
                    type="button"
                    className="btn-secondary w-full text-xs"
                    onClick={() => inputRef.current?.click()}
                >
                    <Upload className="w-3.5 h-3.5" /> Browse Files
                </button>
            )}
        </div>
    );
}
