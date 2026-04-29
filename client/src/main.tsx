import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

// Auto-reload when the dev server reconnects after a restart.
// This fixes the recurring "preview goes blank after code changes" issue
// that occurs when the Vite HMR WebSocket drops during a server restart
// and the canvas iframe doesn't recover on its own.
if (import.meta.hot) {
  let wasDisconnected = false;
  import.meta.hot.on("vite:ws:disconnect", () => {
    wasDisconnected = true;
  });
  import.meta.hot.on("vite:ws:connect", () => {
    if (wasDisconnected) {
      wasDisconnected = false;
      window.location.reload();
    }
  });
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

createRoot(document.getElementById("root")!).render(<App />);
