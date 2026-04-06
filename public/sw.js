const CACHE_NAME = 'genba-v3'
const PRECACHE_URLS = [
  '/genba-react/',
  '/genba-react/index.html',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  // API calls: network only (キャッシュしない)
  if (request.url.includes('river.go.jp') || request.url.includes('river-proxy') || request.url.includes('genba-sync')) {
    return
  }

  // App shell: stale-while-revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request)
      const fetched = fetch(request).then((response) => {
        if (response.ok) {
          cache.put(request, response.clone())
        }
        return response
      }).catch(() => cached)
      return cached || fetched
    })
  )
})
