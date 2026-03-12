"use client";

import { Download, Upload, FileText, BarChart2 } from "lucide-react";
import { StatusDot } from "@/components/ui";

interface MobileDrawerProps {
    open: boolean;
    activeTab: string;
    onTabChange: (tab: string) => void;
}

const NAV_ITEMS = [
    { id: "embed", label: "Embed EHR Data", icon: <Download className="w-4 h-4" /> },
    { id: "extract", label: "Extract Data", icon: <Upload className="w-4 h-4" /> },
    { id: "records", label: "EHR Records", icon: <FileText className="w-4 h-4" /> },
    { id: "analytics", label: "Analytics", icon: <BarChart2 className="w-4 h-4" /> },
];

export default function MobileDrawer({ open, activeTab, onTabChange }: MobileDrawerProps) {
    return (
        <div className={`mobile-drawer glass border-b border-teal-400/15 ${open ? "open" : ""}`} id="mobileDrawer">
            <div className="px-4 py-3 space-y-1">
                <div className="font-mono text-xs text-slate-600 uppercase tracking-widest mb-2 px-1">Navigation</div>
                {NAV_ITEMS.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onTabChange(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body transition-colors ${activeTab === item.id
                                ? "text-teal-400 bg-teal-400/08"
                                : "text-slate-300 hover:text-teal-400 hover:bg-teal-400/08"
                            }`}
                    >
                        {item.icon}
                        {item.label}
                    </button>
                ))}
                <div className="pt-2 pb-1 border-t border-teal-400/10 mt-2 flex items-center gap-2 px-1">
                    <StatusDot status="active" />
                    <span className="font-mono text-xs text-teal-400">SYSTEM SECURE · HIPAA ACTIVE</span>
                </div>
            </div>
        </div>
    );
}
