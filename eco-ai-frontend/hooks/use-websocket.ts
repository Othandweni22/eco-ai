"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import type { WebSocketMessage } from "@/types"

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws/notifications"

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void
  autoReconnect?: boolean
  reconnectInterval?: number
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { onMessage, autoReconnect = true, reconnectInterval = 5000 } = options
  const [isConnected, setIsConnected]   = useState(false)
  const [lastMessage, setLastMessage]   = useState<WebSocketMessage | null>(null)
  const wsRef                           = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef             = useRef<NodeJS.Timeout | null>(null)
  const unmountedRef                    = useRef(false)
  const authFailedRef                   = useRef(false)  // stop reconnect on 1008

  const connect = useCallback(() => {
    if (unmountedRef.current) return
    if (authFailedRef.current) return   // don't reconnect after auth rejection

    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null
    if (!token) return

    if (wsRef.current && wsRef.current.readyState < 2) return

    try {
      const ws = new WebSocket(`${WS_URL}?token=${token}`)
      wsRef.current = ws

      ws.onopen = () => {
        if (unmountedRef.current) { ws.close(); return }
        authFailedRef.current = false
        setIsConnected(true)
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = null
        }
      }

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          setLastMessage(message)
          onMessage?.(message)
        } catch { /* ignore malformed */ }
      }

      ws.onclose = (event) => {
        if (unmountedRef.current) return
        setIsConnected(false)

        // Code 1008 = policy violation / auth failure — don't reconnect
        if (event.code === 1008) {
          authFailedRef.current = true
          return
        }

        if (autoReconnect) {
          reconnectTimeoutRef.current = setTimeout(connect, reconnectInterval)
        }
      }

      ws.onerror = () => {
        // Suppress — onclose handles reconnect
      }
    } catch {
      // Ignore constructor errors
    }
  }, [onMessage, autoReconnect, reconnectInterval])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  useEffect(() => {
    unmountedRef.current  = false
    authFailedRef.current = false
    connect()
    return () => {
      unmountedRef.current = true
      disconnect()
    }
  }, [connect, disconnect])

  return { isConnected, lastMessage, connect, disconnect }
}
