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
  const maxWidthClass = {
    sm: "max-w-sm", // 640px
    md: "max-w-md", // 768px
    lg: "max-w-lg", // 1024px
    xl: "max-w-xl", // 1280px
    "2xl": "max-w-2xl", // 1536px
    full: "max-w-full", // 100%
  }[maxWidth];
  
  // Generate padding classes if withPadding is true
  const paddingClasses = withPadding 
    ? "px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-6" 
    : "";
  
  // Generate safer margin class for the bottom navigation
  const safeBottomMargin = "mb-20 pb-4"; // Provide spacing for the bottom navigation
  
  return (
    <div className={`w-full mx-auto ${maxWidthClass} ${paddingClasses} ${safeBottomMargin} ${className}`}>
      {children}
    </div>
  );
}