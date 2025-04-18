import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import BottomNavigation from "./BottomNavigation";
import ResponsiveContainer from "./ResponsiveContainer";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface PageLayoutProps {
  children: React.ReactNode;
  activeTab: "home" | "play" | "compete" | "insights" | "ai" | "profile" | "admin" | "rewards" | "bond" | "none";
  pageTitle?: string;
  headerContent?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  hideHeader?: boolean;
  className?: string;
}

/**
 * A consistent page layout component that includes the bottom navigation
 * and a responsive container for the content.
 * 
 * @param children - The page content
 * @param activeTab - The active tab for the bottom navigation
 * @param pageTitle - Optional page title to display in the header
 * @param headerContent - Optional custom content to display in the header
 * @param maxWidth - Maximum width of the content container
 * @param hideHeader - Whether to hide the header
 * @param className - Additional classes for the content container
 */
export default function PageLayout({ 
  children, 
  activeTab,
  pageTitle,
  headerContent,
  maxWidth = "lg",
  hideHeader = false,
  className = ""
}: PageLayoutProps) {
  // Use media query hook to detect desktop vs mobile
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  
  // Force a re-check on component mount
  useEffect(() => {
    const checkForDesktop = () => {
      // Directly access the matchMedia API for a one-time check
      const isLargeScreen = window.matchMedia('(min-width: 1024px)').matches;
      console.log('Screen size check - Desktop:', isLargeScreen, 'window.innerWidth:', window.innerWidth);
    };
    
    // Check immediately and after a small delay
    checkForDesktop();
    
    // Check again after 1 second to ensure window dimensions are properly measured
    const timerId = setTimeout(checkForDesktop, 1000);
    
    return () => clearTimeout(timerId);
  }, []);
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-purple-900 via-purple-800 to-fuchsia-900">
      {/* Header */}
      {!hideHeader && (
        <header className="sticky top-0 z-40 w-full bg-gradient-to-r from-purple-900/95 via-purple-800/95 to-fuchsia-900/95 backdrop-blur-md text-white shadow-lg">
          <div className="flex items-center justify-between w-full mx-auto max-w-7xl px-4 py-3 md:px-6 md:py-4 lg:px-8 lg:py-5">
            {pageTitle && (
              <h1 className="text-lg md:text-xl lg:text-2xl font-bold">{pageTitle}</h1>
            )}
            <div className="flex items-center gap-4">
              {headerContent}
            </div>
          </div>
        </header>
      )}
      
      {/* Desktop sidebar for large screens (hidden on mobile) */}
      <div className="flex flex-1">
        {activeTab !== "none" && isDesktop && (
          <div className={`${isDesktop ? 'flex' : 'hidden'} w-64 xl:w-72 h-screen bg-gradient-to-b from-purple-900/90 to-purple-800/90 backdrop-blur-md shadow-xl border-r border-purple-700/30 flex-col fixed left-0 top-0 pt-20 px-4`}>
            <div className="flex flex-col space-y-6 py-8">
              <div className="flex items-center space-x-3 mb-8">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-white font-semibold text-xl">BondQuest</h2>
                  <p className="text-purple-200 text-xs">Strengthen your relationship</p>
                </div>
              </div>
              
              <NavItem title="Home" icon="home" isActive={activeTab === "home"} href="/home" />
              <NavItem title="Quizzes" icon="play" isActive={activeTab === "play"} href="/quizzes" />
              <NavItem title="Compete" icon="compete" isActive={activeTab === "compete"} href="/competitions" />
              <NavItem title="Insights" icon="insights" isActive={activeTab === "insights"} href="/insights" />
              <NavItem title="Bond" icon="bond" isActive={activeTab === "bond"} href="/bond-assessment" />
              <NavItem title="AI Assistant" icon="ai" isActive={activeTab === "ai"} href="/ai-assistant" />
              <NavItem title="Rewards" icon="rewards" isActive={activeTab === "rewards"} href="/rewards" />
              <NavItem title="Profile" icon="profile" isActive={activeTab === "profile"} href="/profile" />
              {activeTab === "admin" && (
                <NavItem title="Admin" icon="admin" isActive={true} href="/admin" />
              )}
            </div>
          </div>
        )}
        
        {/* Main Content */}
        <main className={`flex-1 ${activeTab !== "none" ? "lg:pl-64 xl:pl-72" : ""}`}>
          <ResponsiveContainer maxWidth={maxWidth} className={className}>
            {children}
          </ResponsiveContainer>
        </main>
      </div>
      
      {/* Bottom Navigation (only on mobile) */}
      {!isDesktop && (
        <div className="block">
          <BottomNavigation activeTab={activeTab} />
        </div>
      )}
    </div>
  );
}

// Desktop Navigation Item Component
function NavItem({ title, icon, isActive, href }: { title: string; icon: string; isActive: boolean; href: string }) {
  const [, navigate] = useLocation();
  
  const getIconComponent = () => {
    switch (icon) {
      case "home":
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
      case "play":
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      case "compete":
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
      case "insights":
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
      case "bond":
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
      case "ai":
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
      case "rewards":
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>;
      case "profile":
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
      case "admin":
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
      default:
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    }
  };
  
  return (
    <div 
      className={`flex items-center p-3 cursor-pointer rounded-lg transition-all ${isActive ? 'bg-gradient-to-r from-purple-600/70 to-fuchsia-600/70 text-white' : 'text-purple-200 hover:bg-purple-800/50'}`}
      onClick={() => navigate(href)}
    >
      <div className="mr-3">
        {getIconComponent()}
      </div>
      <span>{title}</span>
      {isActive && (
        <div className="ml-auto w-1.5 h-6 bg-gradient-to-b from-pink-400 to-purple-400 rounded-full" />
      )}
    </div>
  );
}