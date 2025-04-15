import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add CSS variable for gradient backgrounds
document.documentElement.style.setProperty(
  "--gradient-primary",
  "linear-gradient(135deg, #7e22ce 0%, #4f46e5 100%)"
);

document.documentElement.style.setProperty(
  "--gradient-card-1",
  "linear-gradient(135deg, #ff6bbd 0%, #a855f7 100%)"
);

document.documentElement.style.setProperty(
  "--gradient-card-2",
  "linear-gradient(135deg, #ff9b7b 0%, #ff6bbd 100%)"
);

document.documentElement.style.setProperty(
  "--gradient-card-3",
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)"
);

document.documentElement.style.setProperty(
  "--gradient-card-4",
  "linear-gradient(135deg, #ff9b7b 0%, #ffc48c 100%)"
);

createRoot(document.getElementById("root")!).render(<App />);
