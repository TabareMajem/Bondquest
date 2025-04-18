import React from "react";

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  withPadding?: boolean;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

/**
 * A responsive container component that can be used to wrap content 
 * and maintain consistent spacing and max-width across the app.
 * 
 * @param children - The content to display inside the container
 * @param className - Additional classes to apply to the container
 * @param withPadding - Whether to add default padding to the container
 * @param maxWidth - Maximum width of the container (sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px, full: 100%)
 */
export default function ResponsiveContainer({ 
  children, 
  className = "", 
  withPadding = true,
  maxWidth = "lg"
}: ResponsiveContainerProps) {
  
  // Generate max-width class based on the maxWidth prop
  // For desktop, containers should be wider but centered
  const maxWidthClass = {
    sm: "max-w-sm md:max-w-md lg:max-w-lg", // Small container growing with screens
    md: "max-w-sm md:max-w-md lg:max-w-2xl xl:max-w-3xl", // Medium container growing more
    lg: "max-w-sm md:max-w-md lg:max-w-3xl xl:max-w-5xl", // Large container for most pages
    xl: "max-w-sm md:max-w-md lg:max-w-4xl xl:max-w-6xl", // Extra large container
    "2xl": "max-w-sm md:max-w-md lg:max-w-5xl xl:max-w-7xl", // Largest container
    full: "w-full", // 100% on all screens
  }[maxWidth];
  
  // Generate padding classes if withPadding is true
  // More padding on larger screens
  const paddingClasses = withPadding 
    ? "px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-6 xl:px-10 xl:py-8" 
    : "";
  
  // Generate safer margin class for the bottom navigation
  // Bottom margin only applied on mobile/tablet, desktop gets less bottom margin
  const safeBottomMargin = "mb-20 pb-4 lg:mb-10"; // Provide spacing for the bottom navigation
  
  return (
    <div className={`w-full mx-auto ${maxWidthClass} ${paddingClasses} ${safeBottomMargin} ${className}`}>
      {children}
    </div>
  );
}