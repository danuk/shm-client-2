import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { config } from '../config'

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const buf = new ArrayBuffer(raw.length)
  const view = new Uint8Array(buf)
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i)
  return view
}

export function usePushNotifications() {
  const isEnabled = config.WEB_PUSH_ENABLE === 'true' && !!config.VAPID_PUBLIC_KEY
  const isSupported = isEnabled
    && typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window

  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupported) return
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setIsSubscribed(!!sub)
      })
    })
  }, [isSupported])

  // Авто-запрос при первом запуске как PWA
  useEffect(() => {
    if (!isSupported || isSubscribed || isLoading) return
    const isPWA = window.matchMedia('(display-mode: standalone)').matches
      || !!(window.navigator as Navigator & { standalone?: boolean }).standalone
    if (!isPWA) return
    if (localStorage.getItem('pwa_push_prompted')) return

    localStorage.setItem('pwa_push_prompted', '1')
    // Небольшая задержка чтобы приложение успело загрузиться
    const t = setTimeout(() => { subscribe() }, 2000)
    return () => clearTimeout(t)
  }, [isSupported, isSubscribed, isLoading])

  const subscribe = async (): Promise<boolean> => {
    if (!isSupported) return false
    setIsLoading(true)
    setError(null)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setError('Разрешение на уведомления отклонено')
        return false
      }
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(config.VAPID_PUBLIC_KEY!),
      })
      const subJson = sub.toJSON() as {
        endpoint: string
        keys?: { p256dh: string; auth: string }
      }
      await api.post('/template/subscribe', {
        endpoint: subJson.endpoint,
        keys: subJson.keys,
        ua: navigator.userAgent.substring(0, 150),
        lang: navigator.language || 'ru',
      })
      setIsSubscribed(true)
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка подписки')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const unsubscribe = async (): Promise<boolean> => {
    if (!isSupported) return false
    setIsLoading(true)
    setError(null)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        const subJson = sub.toJSON()
        await sub.unsubscribe()
        await api.post('/template/unsubscribe', { endpoint: subJson.endpoint })
        setIsSubscribed(false)
      }
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка отписки')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return { isEnabled, isSupported, isSubscribed, isLoading, error, subscribe, unsubscribe }
}
