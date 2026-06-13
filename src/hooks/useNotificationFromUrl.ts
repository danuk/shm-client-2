import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { notifications } from '@mantine/notifications'

export function useNotificationFromUrl() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const title = params.get('_nt')
    const body = params.get('_nb')
    if (!title && !body) return

    notifications.show({
      title: title || undefined,
      message: body || '',
      color: 'blue',
      autoClose: 6000,
    })

    params.delete('_nt')
    params.delete('_nb')
    const newSearch = params.toString()
    navigate(location.pathname + (newSearch ? '?' + newSearch : ''), { replace: true })
  }, [])
}
