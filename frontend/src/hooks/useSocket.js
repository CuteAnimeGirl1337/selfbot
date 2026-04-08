import { useState, useEffect, useRef, useCallback } from 'react'

export function useSocket() {
  const [state, setState] = useState(null)
  const [logs, setLogs] = useState([])
  const [snipes, setSnipes] = useState([])
  const [editSnipes, setEditSnipes] = useState([])
  const [spyLog, setSpyLog] = useState([])
  const [feed, setFeed] = useState([])
  const [discordEvents, setDiscordEvents] = useState([])
  const [lastCmd, setLastCmd] = useState(null)
  const [connected, setConnected] = useState(false)
  const wsRef = useRef(null)

  useEffect(() => {
    let ws
    let timer

    function connect() {
      const proto = location.protocol === 'https:' ? 'wss' : 'ws'
      ws = new WebSocket(`${proto}://${location.host}`)
      wsRef.current = ws

      ws.onopen = () => setConnected(true)

      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data)
        if (msg.type === 'init' || msg.type === 'stats') {
          setState(msg.data)
        }
        if (msg.type === 'log') {
          setLogs(prev => [msg.data, ...prev].slice(0, 300))
        }
        if (msg.type === 'snipe') {
          setSnipes(prev => [msg.data, ...prev].slice(0, 150))
        }
        if (msg.type === 'editsnipe') {
          setEditSnipes(prev => [msg.data, ...prev].slice(0, 150))
        }
        if (msg.type === 'spy') {
          setSpyLog(prev => [msg.data, ...prev].slice(0, 200))
        }
        if (msg.type === 'command') {
          setLastCmd({ name: msg.data.name, at: Date.now() })
          setFeed(prev => [{ type: 'cmd', ...msg.data }, ...prev].slice(0, 200))
        }
        if (msg.type === 'response') {
          setFeed(prev => [{ type: 'res', ...msg.data }, ...prev].slice(0, 200))
        }
        if (msg.type === 'discord-message' || msg.type === 'discord-delete' || msg.type === 'discord-edit') {
          setDiscordEvents(prev => [msg, ...prev].slice(0, 100))
        }
      }

      ws.onclose = () => {
        setConnected(false)
        timer = setTimeout(connect, 3000)
      }
      ws.onerror = () => ws.close()
    }

    connect()
    return () => { clearTimeout(timer); ws?.close() }
  }, [])

  const api = useCallback(async (path, body) => {
    const opts = body
      ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      : {}
    const res = await fetch(path, opts)
    return res.json()
  }, [])

  const fetchSnipes = useCallback(async () => {
    const [s, e] = await Promise.all([
      fetch('/api/snipes').then(r => r.json()),
      fetch('/api/editsnipes').then(r => r.json()),
    ])
    setSnipes(s)
    setEditSnipes(e)
  }, [])

  const fetchLogs = useCallback(async () => {
    const l = await fetch('/api/logs').then(r => r.json())
    setLogs(l)
  }, [])

  return { state, logs, snipes, editSnipes, spyLog, feed, discordEvents, lastCmd, connected, api, fetchSnipes, fetchLogs }
}
