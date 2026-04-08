import { useState, useCallback, useEffect, useRef } from 'react'

export function useNotifications(feed, discordEvents) {
  const [notifications, setNotifications] = useState([])
  const [permission, setPermission] = useState('default')
  const lastFeedLen = useRef(0)
  const lastDiscordLen = useRef(0)

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(setPermission)
      }
    }
  }, [])

  const pushNotification = useCallback((type, title, body) => {
    const id = Date.now() + Math.random()
    setNotifications(prev => [{ id, type, title, body, time: Date.now(), read: false }, ...prev].slice(0, 100))

    // Desktop notification
    if (permission === 'granted') {
      try {
        const n = new Notification(title, { body, silent: false, tag: type })
        setTimeout(() => n.close(), 5000)
      } catch {}
    }

    // Sound
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = type === 'alert' ? 880 : type === 'snipe' ? 660 : 520
      gain.gain.value = 0.08
      osc.start()
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
      osc.stop(ctx.currentTime + 0.3)
    } catch {}
  }, [permission])

  // Watch feed for alerts, snipes, etc.
  useEffect(() => {
    if (!feed?.length || feed.length <= lastFeedLen.current) {
      lastFeedLen.current = feed?.length || 0
      return
    }
    const newItems = feed.slice(0, feed.length - lastFeedLen.current)
    lastFeedLen.current = feed.length

    for (const item of newItems) {
      if (item.type === 'alert') {
        pushNotification('alert', 'Keyword Alert', `"${item.data?.keyword}" matched in #${item.data?.message?.channel || 'unknown'}`)
      }
      if (item.type === 'snipe') {
        pushNotification('snipe', 'Message Deleted', `${item.data?.author || 'Someone'} deleted a message`)
      }
      if (item.type === 'spy') {
        pushNotification('spy', 'Spy Log', `${item.data?.author || 'User'}: ${(item.data?.content || '').slice(0, 60)}`)
      }
      if (item.type === 'tracker') {
        pushNotification('tracker', 'User Activity', item.data?.event || 'Status change')
      }
    }
  }, [feed])

  // Watch discord events for DMs
  useEffect(() => {
    if (!discordEvents?.length || discordEvents.length <= lastDiscordLen.current) {
      lastDiscordLen.current = discordEvents?.length || 0
      return
    }
    const newItems = discordEvents.slice(0, discordEvents.length - lastDiscordLen.current)
    lastDiscordLen.current = discordEvents.length

    for (const item of newItems) {
      if (item.type === 'discord-message' && item.data?.message?.author?.bot === false) {
        // Only notify for DMs (channel type check would need more data)
        // Just notify for all new messages from others for now
      }
    }
  }, [discordEvents])

  const clearNotification = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  return { notifications, unreadCount, clearNotification, clearAll, pushNotification }
}
