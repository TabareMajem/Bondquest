import React from "react";
import BottomNavigation from "./BottomNavigation";
import ResponsiveContainer from "./ResponsiveContainer";

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
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-purple-900 via-purple-800 to-fuchsia-900">
      {/* Header */}
      {!hideHeader && (
        <header className="sticky top-0 z-40 w-full bg-gradient-to-r from-purple-900/95 via-purple-800/95 to-fuchsia-900/95 backdrop-blur-md text-white shadow-lg">
          <div className="flex items-center justify-between w-full mx-auto max-w-7xl px-4 py-3 md:px-6 md:py-4">
            {pageTitle && (
              <h1 className="text-lg md:text-xl font-bold">{pageTitle}</h1>
            )}
            {headerContent}
          </div>
        </header>
      )}
      
      {/* Main Content */}
      <main className="flex-1">
        <ResponsiveContainer maxWidth={maxWidth} className={className}>
          {children}
        </ResponsiveContainer>
      </main>
      
      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} />
    </div>
  );
}