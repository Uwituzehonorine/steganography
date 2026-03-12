"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import MobileDrawer from "@/components/MobileDrawer";
import EmbedTab from "@/components/tabs/EmbedTab";
import ExtractTab from "@/components/tabs/ExtractTab";
import RecordsTab from "@/components/tabs/RecordsTab";
import AnalyticsTab from "@/components/tabs/AnalyticsTab";

type Tab = "embed" | "extract" | "records" | "analytics";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>("embed");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu when tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab as Tab);
    setMobileMenuOpen(false);
  };

  // Close mobile menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const drawer = document.getElementById("mobileDrawer");
      const hamburger = document.getElementById("hamburger");
      if (
        drawer && hamburger &&
        !drawer.contains(e.target as Node) &&
        !hamburger.contains(e.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <>
      <Navbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onMobileMenuToggle={() => setMobileMenuOpen((o) => !o)}
        mobileMenuOpen={mobileMenuOpen}
      />

      <MobileDrawer
        open={mobileMenuOpen}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      <div className="flex pt-16 min-h-screen">
        <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />

        <main className="flex-1 lg:ml-56 p-4 md:p-6 space-y-6">
          {activeTab === "embed" && <EmbedTab />}
          {activeTab === "extract" && <ExtractTab />}
          {activeTab === "records" && <RecordsTab />}
          {activeTab === "analytics" && <AnalyticsTab />}
        </main>
      </div>
    </>
  );
}
