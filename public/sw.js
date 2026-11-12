/**
 * Scout System — Service Worker
 * Copyright (c) 2026 Scout System. All rights reserved.
 *
 * 規則（跟 docs/46-pwa-install-and-update 定案）：
 *  - install：快取核心檔；只有「首次安裝」(navigator 無 active SW) 先 skipWaiting()，
 *    更新留在 waiting，等用戶喺 banner 撳「立即更新」先接手（唔准背景偷換版）。
 *  - message：收到 { type: 'SKIP_WAITING' } 先 skipWaiting()。
 *  - activate：清舊版快取 + clients.claim()。
 *  - 導覽請求：network-first，離線時回退快取（／已快取的頁面照用）。
 *  - 靜態資源：stale-while-revalidate（Vite 帶 hash 的檔案可以長期快取）。
 */

const CACHE_NAME = 'scout-system-v1.1.0';

const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)),
  );
  // 首次安裝先立即接手；更新留待用戶確認（見 UP1）
  if (!self.registration.active) {
    self.skipWaiting();
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // 導覽請求：network-first，離線回退快取
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          const cached =
            (await caches.match(request)) || (await caches.match('/index.html'));
          return cached || Response.error();
        }),
    );
    return;
  }

  // 靜態資源：stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached || Response.error());
      return cached || network;
    }),
  );
});
