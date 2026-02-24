import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from '@/components/theme-provider';
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <ThemeProvider defaultTheme="light" storageKey="remiseria-theme">
      <App />
    </ThemeProvider>
  </HelmetProvider>
);
