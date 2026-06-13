import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type PWAWindow = Window & { __pwaInstallPrompt?: BeforeInstallPromptEvent }

function detectIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // iPadOS 13+ reports as MacIntel but has touch
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

export function usePWAInstall() {
  const isPWA = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches
    || !!(window.navigator as Navigator & { standalone?: boolean }).standalone
  )

  const isIOS = detectIOS()

  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(
    () => (window as PWAWindow).__pwaInstallPrompt ?? null
  )

  useEffect(() => {
    if (isPWA) return
    // Pick up event that fired before React mounted
    if ((window as PWAWindow).__pwaInstallPrompt) {
      setPromptEvent((window as PWAWindow).__pwaInstallPrompt!)
    }
    const handler = (e: Event) => {
      setPromptEvent(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [isPWA])

  const install = async (): Promise<boolean> => {
    if (!promptEvent) return false
    await promptEvent.prompt()
    const { outcome } = await promptEvent.userChoice
    if (outcome === 'accepted') {
      setPromptEvent(null)
      delete (window as PWAWindow).__pwaInstallPrompt
    }
    return outcome === 'accepted'
  }

  return {
    canInstall: !!promptEvent && !isPWA,
    isIOSInstall: isIOS && !isPWA,
    install,
  }
}
