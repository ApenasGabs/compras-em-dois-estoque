import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { SessionBootstrap } from "./components/SessionBootstrap";
import "./index.css";
import App from "./App.tsx";

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("SW registration failed:", error);
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SessionBootstrap />
      <App />
    </BrowserRouter>
  </StrictMode>,
);
