/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, NetworkFirst, StaleWhileRevalidate, ExpirationPlugin } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// Configure offline read-only caching for My Catalogues and Calendar (Phase 3)
const customRuntimeCaching = [
  // Cache /catalogues and /calendar pages via NetworkFirst strategy
  {
    matcher: ({ url }: { url: URL }) =>
      url.pathname === "/catalogues" || url.pathname === "/calendar",
    handler: new NetworkFirst({
      cacheName: "offline-pages",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 10,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        }),
      ],
    }),
  },
  // Cache /api/catalogues and /api/calendar/events responses for offline read-only viewing
  {
    matcher: ({ url }: { url: URL }) =>
      url.pathname.startsWith("/api/catalogues") ||
      url.pathname.startsWith("/api/calendar/events"),
    handler: new NetworkFirst({
      cacheName: "offline-api-cache",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 20,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        }),
      ],
    }),
  },
  ...defaultCache,
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: customRuntimeCaching,
});

serwist.addEventListeners();
