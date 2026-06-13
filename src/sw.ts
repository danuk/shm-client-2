/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('push', (event) => {
  if (!event.data) return

  let data: { title?: string; body?: string; icon?: string; badge?: string; url?: string; tag?: string } = {}
  try {
    data = event.data.json()
  } catch {
    data = { body: event.data.text() }
  }

  const { title = 'Уведомление', body = '', icon, badge, url = '/', tag } = data

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: icon || './icon-192.png',
      badge: badge || './icon-512.png',
      tag: tag || 'shm',
      data: { url, title, body },
    }).then(() => {
    }).catch(() => {
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const notifData = event.notification.data as { url?: string; title?: string; body?: string }
  const path = notifData?.url || '/'
  const target = new URL(path, self.location.origin)
  if (notifData?.title) target.searchParams.set('_nt', notifData.title)
  if (notifData?.body) target.searchParams.set('_nb', notifData.body)

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const client of clientList) {
        if ('focus' in client) {
          const w = await (client as WindowClient).focus()
          return w.navigate(target.href)
        }
      }
      return self.clients.openWindow(target.href)
    })()
  )
})
