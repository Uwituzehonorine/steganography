"use client";

import { cn } from "@/lib/utils";

interface TagProps {
    variant?: "teal" | "emerald" | "rose" | "amber";
    children: React.ReactNode;
    className?: string;
}

export function Tag({ variant = "teal", children, className }: TagProps) {
    return (
        <span className={cn("tag", `tag-${variant}`, className)}>
            {children}
        </span>
    );
}

interface StatusDotProps {
    status: "active" | "warning" | "idle";
    className?: string;
}

export function StatusDot({ status, className }: StatusDotProps) {
    return (
        <div
            className={cn(
                "status-dot",
                status === "active" && "status-active",
                status === "warning" && "status-warning",
                status === "idle" && "status-idle",
                className
            )}
        />
    );
}

interface MetricCardProps {
    label: string;
    value: React.ReactNode;
    sub?: React.ReactNode;
    className?: string;
}

export function MetricCard({ label, value, sub, className }: MetricCardProps) {
    return (
        <div className={cn("metric-card", className)}>
            <div className="font-mono text-xs text-slate-500 mb-1">{label}</div>
            <div className="font-display text-2xl font-bold">{value}</div>
            {sub && <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">{sub}</div>}
        </div>
    );
}

interface ToggleSwitchProps {
    checked: boolean;
    onChange: (v: boolean) => void;
    color?: string;
}

export function ToggleSwitch({ checked, onChange, color = "bg-teal-500" }: ToggleSwitchProps) {
    return (
        <label className="relative inline-flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="sr-only peer"
            />
            <div
                className={cn(
                    "w-9 h-5 bg-slate-700 rounded-full peer transition-colors",
                    "after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4",
                    "after:bg-white after:rounded-full after:transition-all",
                    "peer-checked:after:translate-x-4",
                    checked ? color : ""
                )}
            />
        </label>
    );
}
