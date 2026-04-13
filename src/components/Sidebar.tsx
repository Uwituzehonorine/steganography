"use client";

import { Download, Upload, FileText, BarChart2, Key, Shield } from "lucide-react";

interface SidebarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

const MAIN_LINKS = [
    { id: "embed", label: "Embed Keyword", icon: <Download className="w-4 h-4" /> },
    { id: "extract", label: "Extract Keyword", icon: <Upload className="w-4 h-4" /> },
];

// const SECONDARY_LINKS = [
//     { id: "records", label: "Records & History", icon: <FileText className="w-4 h-4" /> },
//     { id: "analytics", label: "Analytics", icon: <BarChart2 className="w-4 h-4" /> },
// ];

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
    return (
        <aside className="hidden lg:flex flex-col w-56 fixed top-16 bottom-0 left-0 bg-white border-r border-slate-200 p-4">
            <div className="space-y-1 mt-8 pt-4">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-3">
                    Operations
                </div>
                {MAIN_LINKS.map((link) => (
                    <button
                        key={link.id}
                        className={`nav-link w-full ${activeTab === link.id ? "active" : ""}`}
                        onClick={() => onTabChange(link.id)}
                    >
                        {link.icon}
                        {link.label}
                    </button>
                ))}

                {/* <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-3 mt-6">
                    Tools
                </div> */}
                {/* {SECONDARY_LINKS.map((link) => (
                    <button
                        key={link.id}
                        className={`nav-link w-full ${activeTab === link.id ? "active" : ""}`}
                        onClick={() => onTabChange(link.id)}
                    >
                        {link.icon}
                        {link.label}
                    </button>
                ))} */}
            </div>

            {/* Status Card */}
            <div className="mt-auto card p-4 border">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Audio Processing</h3>
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <span className="text-xs text-slate-600">System Ready</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-xs text-slate-600">Audio Formats Supported</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
