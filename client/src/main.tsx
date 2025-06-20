import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// Import i18n configuration
import "./i18n";

// Add CSS variable for gradient backgrounds
// Main app background - purple gradient
document.documentElement.style.setProperty(
  "--gradient-primary",
  "linear-gradient(135deg, #7e22ce 0%, #4f46e5 100%)"
);

// Trivia Showdown - pink to purple gradient
document.documentElement.style.setProperty(
  "--gradient-card-1",
  "linear-gradient(135deg, #ff6bbd 0%, #a855f7 100%)"
);

// How Well Do You Know Each Other - peach to pink gradient
document.documentElement.style.setProperty(
  "--gradient-card-2",
  "linear-gradient(135deg, #ff9b7b 0%, #ff6bbd 100%)"
);

// Relationship Remix - blue gradient
document.documentElement.style.setProperty(
  "--gradient-card-3",
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)"
);

// Morning Routines - peach to yellow gradient
document.documentElement.style.setProperty(
  "--gradient-card-4",
  "linear-gradient(135deg, #ff9b7b 0%, #ffc48c 100%)"
);

// App background - matches screenshot
document.documentElement.style.setProperty(
  "--app-background",
  "#6d28d9"  // Purple/violet color
);

createRoot(document.getElementById("root")!).render(<App />);
