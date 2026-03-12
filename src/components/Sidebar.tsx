"use client";

import { Download, Upload, FileText, BarChart2, Key, Shield, Settings } from "lucide-react";
import { Tag, StatusDot } from "@/components/ui";

interface SidebarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

const MAIN_LINKS = [
    { id: "embed", label: "Embed Data", icon: <Download className="w-4 h-4" /> },
    { id: "extract", label: "Extract Data", icon: <Upload className="w-4 h-4" /> },
    { id: "records", label: "EHR Records", icon: <FileText className="w-4 h-4" /> },
    { id: "analytics", label: "Analytics", icon: <BarChart2 className="w-4 h-4" /> },
];

const SECURITY_LINKS = [
    { id: "keys", label: "Key Management", icon: <Key className="w-4 h-4" /> },
    { id: "audit", label: "Audit Log", icon: <Shield className="w-4 h-4" /> },
    { id: "settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
];

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
    return (
        <aside className="hidden lg:flex flex-col w-56 fixed top-16 bottom-0 left-0 glass border-r border-teal-400/10 p-4 gap-1 overflow-y-auto">
            <div className="font-mono text-xs text-slate-600 uppercase tracking-widest mb-2 px-1 mt-1">
                Operations
            </div>
            {MAIN_LINKS.map((link) => (
                <button
                    key={link.id}
                    className={`sidebar-link ${activeTab === link.id ? "active" : ""}`}
                    onClick={() => onTabChange(link.id)}
                >
                    {link.icon}
                    {link.label}
                </button>
            ))}

            <div className="font-mono text-xs text-slate-600 uppercase tracking-widest mb-2 px-1 mt-5">
                Security
            </div>
            {SECURITY_LINKS.map((link) => (
                <button key={link.id} className="sidebar-link">
                    {link.icon}
                    {link.label}
                </button>
            ))}

            {/* System Status Card */}
            <div className="mt-auto glass-light rounded-xl p-3 border border-teal-400/15 mt-6">
                <div className="font-mono text-xs text-teal-400 mb-2">SYSTEM STATUS</div>
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">Encryption</span>
                        <Tag variant="emerald">AES-256</Tag>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">Algorithm</span>
                        <Tag variant="teal">FOURFOLD</Tag>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">HIPAA</span>
                        <Tag variant="emerald">✓ Active</Tag>
                    </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5">
                    <StatusDot status="active" />
                    <span className="font-mono text-xs text-slate-500">All systems nominal</span>
                </div>
            </div>
        </aside>
    );
}
