"use client";

import { Download, Upload, FileText, BarChart2 } from "lucide-react";

interface MobileDrawerProps {
    open: boolean;
    activeTab: string;
    onTabChange: (tab: string) => void;
}

const NAV_ITEMS = [
    { id: "embed", label: "Embed Keyword", icon: <Download className="w-4 h-4" />, description: "Hide keywords in audio" },
    { id: "extract", label: "Extract Keyword", icon: <Upload className="w-4 h-4" />, description: "Recover hidden keywords" },
];

export default function MobileDrawer({ open, activeTab, onTabChange }: MobileDrawerProps) {
    return (
        <>
            {/* Backdrop */}
            {open && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={() => onTabChange(activeTab)} // Close drawer
                />
            )}

            {/* Drawer */}
            <div
                className={`fixed top-16 left-0 right-0 bg-white border-b border-slate-200 z-50 lg:hidden transform transition-transform duration-300 ${open ? 'translate-y-0' : '-translate-y-full'
                    }`}
                id="mobileDrawer"
            >
                <div className="p-4 space-y-1">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-3">
                        Navigation
                    </div>

                    {NAV_ITEMS.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${activeTab === item.id
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            {item.icon}
                            <div className="text-left">
                                <div className="font-medium">{item.label}</div>
                                <div className="text-xs text-slate-500">{item.description}</div>
                            </div>
                        </button>
                    ))}

                    <div className="pt-3 border-t border-slate-200 mt-4">
                        <div className="flex items-center gap-2 px-3 text-xs text-slate-500">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            Audio Processing Tool
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
