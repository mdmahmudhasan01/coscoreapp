import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";


if (typeof window !== "undefined") {
  const reloadOnChunkError = (message?: string) => {
    if (!message) return;
    const isChunkError =
      message.includes("Failed to fetch dynamically imported module") ||
      message.includes("error loading dynamically imported module") ||
      message.includes("Importing a module script failed") ||
      message.includes("ERR_ABORTED");

    if (isChunkError) {
      const key = "last_chunk_reload";
      const now = Date.now();
      const lastReload = Number(sessionStorage.getItem(key) || 0);

      // Reload page once to pull the fresh index & assets, throttling to prevent infinite loops (max once per 10s)
      if (now - lastReload > 10000) {
        sessionStorage.setItem(key, String(now));
        window.location.reload();
      }
    }
  };

  window.addEventListener("vite:preloadError", () => {
    reloadOnChunkError("Failed to fetch dynamically imported module");
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const message = reason instanceof Error ? reason.message : String(reason);
    reloadOnChunkError(message);
  });

  window.addEventListener("error", (event) => {
    reloadOnChunkError(event.message);
  });
}

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};


