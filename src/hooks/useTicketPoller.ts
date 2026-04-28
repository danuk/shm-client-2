import { useEffect, useRef } from 'react';
import { ticketApi } from '../api/client';
import { useStore } from '../store/useStore';

const POLL_INTERVAL = 155000;

export function useTicketPoller(enabled: boolean) {
  const setHasNewTicketMessages = useStore((s) => s.setHasNewTicketMessages);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const check = async () => {
      try {
        const response = await ticketApi.list({ status: 'waiting', limit: 1 });
        const data = response.data?.data;
        setHasNewTicketMessages(Array.isArray(data) && data.length > 0);
      } catch {
        // ignore polling errors silently
      }
    };

    check();
    timerRef.current = setInterval(check, POLL_INTERVAL);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [enabled, setHasNewTicketMessages]);
}
