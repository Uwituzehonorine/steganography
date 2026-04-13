"use client";

import { useState } from "react";
import { ChevronDown, Menu, Shield, User, Settings, Activity, LogOut } from "lucide-react";

interface NavbarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    onMobileMenuToggle: () => void;
    mobileMenuOpen: boolean;
}

const NAV_TABS = [
    { id: "embed", label: "Embed" },
    { id: "extract", label: "Extract" },
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
            <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between fixed top-0 left-0 right-0 z-50">
                {/* Left: Logo + Tabs */}
                <div className="flex items-center gap-8">
                    {/* Mobile Menu Button */}
                    <button
                        onClick={onMobileMenuToggle}
                        className="lg:hidden p-2 -m-2 text-slate-600 hover:text-slate-900"
                        id="hamburger"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-900">
                                <span className="text-blue-600">Audio</span> Tool
                            </h1>
                            <p className="text-xs text-slate-500 font-mono">Secure Public Speaking in English</p>
                        </div>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center border-b">
                        {NAV_TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange(tab.id)}
                                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right: Status + Profile */}
                <div className="flex items-center gap-4">
                    {/* Status Indicator */}
                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <span className="text-xs font-mono text-emerald-700">SECURE</span>
                    </div>

                    {/* Profile Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setProfileOpen(!profileOpen)}
                            className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg transition-colors"
                        >
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-semibold">RU</span>
                            </div>
                            <div className="hidden sm:block text-left">
                                <div className="text-sm font-medium text-slate-900">User</div>
                                <div className="text-xs text-slate-500">Active Session</div>
                            </div>
                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Profile Dropdown Menu */}
                        {profileOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                                <div className="px-4 py-3 border-b border-slate-200">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                                            <span className="text-white font-semibold">RU</span>
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-slate-900">User</div>
                                            <div className="text-xs text-slate-500">user@example.com</div>
                                        </div>
                                    </div>
                                    <div className="mt-2 flex gap-1">
                                        <span className="badge badge-primary">Active User</span>
                                    </div>
                                </div>

                                <div className="py-1">
                                    <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                                        <User className="w-4 h-4" />
                                        Profile Settings
                                    </button>
                                    <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                                        <Settings className="w-4 h-4" />
                                        Preferences
                                    </button>
                                    <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                                        <Activity className="w-4 h-4" />
                                        Activity Log
                                    </button>
                                </div>

                                <div className="border-t border-slate-200 py-1">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Logout Confirmation Modal */}
            {showLogout && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-sm">
                        <div className="text-center mb-5">
                            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <LogOut className="w-7 h-7 text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900">Sign Out?</h3>
                            <p className="text-slate-600 text-sm mt-1">
                                Your session will be terminated.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowLogout(false);
                                    window.location.reload();
                                }}
                                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Sign Out
                            </button>
                            <button
                                onClick={() => setShowLogout(false)}
                                className="flex-1 btn-secondary"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Click outside to close dropdown */}
            {profileOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileOpen(false)}
                />
            )}
        </>
    );
}
