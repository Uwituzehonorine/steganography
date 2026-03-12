"use client";

import { useState } from "react";
import { ChevronDown, User, Key, Settings, BarChart2, LogOut } from "lucide-react";
import { StatusDot, Tag } from "@/components/ui";

interface NavbarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    onMobileMenuToggle: () => void;
    mobileMenuOpen: boolean;
}

const NAV_TABS = [
    { id: "embed", label: "Embed" },
    { id: "extract", label: "Extract" },
    { id: "records", label: "EHR Records" },
    { id: "analytics", label: "Analytics" },
];

export default function Navbar({
    activeTab,
    onTabChange,
    onMobileMenuToggle,
    mobileMenuOpen,
}: NavbarProps) {
    const [profileOpen, setProfileOpen] = useState(false);
    const [showLogout, setShowLogout] = useState(false);

    const handleLogout = () => {
        setProfileOpen(false);
        setShowLogout(true);
    };

    return (
        <>
            <nav className="glass fixed top-0 left-0 right-0 z-50 border-b border-teal-400/10 px-4 md:px-6 py-3 flex items-center justify-between">
                {/* Left: Hamburger + Logo + Tabs */}
                <div className="flex items-center gap-3">
                    {/* Hamburger */}
                    <button
                        onClick={onMobileMenuToggle}
                        className={`lg:hidden glass-light w-9 h-9 rounded-lg flex flex-col items-center justify-center gap-1.5 border border-teal-400/15 flex-shrink-0 ${mobileMenuOpen ? "ham-open" : ""}`}
                        id="hamburger"
                        aria-label="Toggle menu"
                        aria-expanded={mobileMenuOpen}
                    >
                        <span className="ham-line" />
                        <span className="ham-line" />
                        <span className="ham-line" />
                    </button>

                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <div className="relative w-8 h-8 md:w-9 md:h-9 rounded-lg glass-light flex items-center justify-center teal-glow flex-shrink-0">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M3 12h2l2-6 3 12 2-8 2 4 2-2h3"
                                    stroke="#2dd4bf"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <circle cx="19" cy="12" r="2" fill="#2dd4bf22" stroke="#22d3ee" strokeWidth="1.5" />
                            </svg>
                        </div>
                        <div>
                            <div className="font-display font-extrabold text-xs md:text-sm text-white tracking-tight leading-none">
                                SecureAudio<span className="text-teal-400">EHR</span>
                            </div>
                            <div className="font-mono text-xs text-slate-500 leading-none mt-0.5 hidden sm:block">
                                v2.4.1 · HIPAA Compliant
                            </div>
                        </div>
                    </div>

                    <div className="w-px h-6 bg-slate-700 hidden md:block ml-1" />

                    {/* Desktop Nav Tabs */}
                    <div className="hidden md:flex items-center gap-1 ml-1">
                        {NAV_TABS.map((tab) => (
                            <button
                                key={tab.id}
                                id={`nav-${tab.id}`}
                                onClick={() => onTabChange(tab.id)}
                                className={`tab-btn px-3 py-1.5 rounded-lg text-sm font-body border border-transparent transition-all duration-200 font-medium ${activeTab === tab.id
                                        ? "tab-active"
                                        : "text-slate-400 hover:text-slate-300"
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right: Status + Profile */}
                <div className="flex items-center gap-2">
                    <div className="hidden md:flex items-center gap-2 glass-light px-3 py-1.5 rounded-lg">
                        <StatusDot status="active" />
                        <span className="font-mono text-xs text-teal-400">SYSTEM SECURE</span>
                    </div>

                    {/* Profile */}
                    <div className="relative" id="profileWrapper">
                        <button
                            onClick={() => setProfileOpen((p) => !p)}
                            className="flex items-center gap-2 cursor-pointer glass-light px-2 md:px-3 py-1.5 rounded-lg hover:border-teal-400/30 transition-all border border-teal-400/12"
                            aria-label="Profile menu"
                        >
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                DR
                            </div>
                            <span className="font-body text-sm text-slate-300 hidden sm:block">Dr. Uwituze</span>
                            <ChevronDown
                                className={`w-3 h-3 text-slate-500 transition-transform hidden sm:block ${profileOpen ? "rotate-180" : ""}`}
                            />
                        </button>

                        {/* Profile Dropdown */}
                        <div
                            className={`profile-dropdown glass rounded-xl border border-teal-400/20 overflow-hidden shadow-2xl ${profileOpen ? "open" : ""}`}
                            style={{ boxShadow: "0 20px 60px rgba(2,9,22,0.8)" }}
                        >
                            <div className="px-4 py-3 border-b border-teal-400/10 bg-gradient-to-r from-teal-500/10 to-cyan-500/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-bold">
                                        DR
                                    </div>
                                    <div>
                                        <div className="text-white font-medium text-sm font-body">Dr. R. Uwituze</div>
                                        <div className="text-teal-400 font-mono text-xs">r.uwituze@chuk.rw</div>
                                    </div>
                                </div>
                                <div className="mt-2 flex gap-2">
                                    <Tag variant="teal">Chief Medical Officer</Tag>
                                    <Tag variant="emerald">Admin</Tag>
                                </div>
                            </div>
                            <div className="py-1">
                                {[
                                    { icon: <User className="w-4 h-4" />, label: "My Profile" },
                                    { icon: <Key className="w-4 h-4" />, label: "Change Password" },
                                    { icon: <Settings className="w-4 h-4" />, label: "Settings" },
                                    { icon: <BarChart2 className="w-4 h-4" />, label: "Activity Log" },
                                ].map((item) => (
                                    <button
                                        key={item.label}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-teal-400/[0.08] hover:text-teal-400 transition-colors font-body"
                                        onClick={() => setProfileOpen(false)}
                                    >
                                        {item.icon}
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                            <div className="border-t border-rose-500/20 py-1">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors font-body font-medium"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Logout Confirmation Modal */}
            {showLogout && (
                <div className="modal-overlay open">
                    <div className="glass rounded-2xl p-6 w-full max-w-sm mx-4 border border-rose-500/25">
                        <div className="text-center mb-5">
                            <div className="w-14 h-14 rounded-2xl bg-rose-500/15 flex items-center justify-center mx-auto mb-3 border border-rose-500/25">
                                <LogOut className="w-7 h-7 text-rose-400" />
                            </div>
                            <h3 className="font-display font-bold text-white text-lg">Sign Out?</h3>
                            <p className="text-slate-400 text-sm mt-1 font-body">
                                Your session will be terminated and all unsaved work will be lost.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowLogout(false);
                                    window.location.reload();
                                }}
                                className="flex-1 py-2.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-400 font-mono text-sm hover:bg-rose-500/30 transition-colors"
                            >
                                Sign Out
                            </button>
                            <button
                                onClick={() => setShowLogout(false)}
                                className="flex-1 btn-secondary py-2.5"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
