import { useEffect, useRef, useState, useCallback } from 'react';
import type { WsMessage } from '../types/battle';

interface UseBattleSocketOptions {
  battleId: string;
  playerId: string;
  onMessage: (msg: WsMessage) => void;
  reconnect?: boolean;
}

interface UseBattleSocketResult {
  connected: boolean;
  send: (msg: unknown) => void;
}

export function useBattleSocket({
  battleId,
  playerId,
  onMessage,
  reconnect = true,
}: UseBattleSocketOptions): UseBattleSocketResult {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldReconnectRef = useRef(reconnect);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    shouldReconnectRef.current = reconnect;
  }, [reconnect]);

  const connect = useCallback(() => {
    const url = `ws://${window.location.host}/ws/${battleId}/${playerId}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      reconnectCountRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as WsMessage;
        onMessageRef.current(msg);
      } catch {
        console.error('Failed to parse WebSocket message:', event.data);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      wsRef.current = null;

      if (shouldReconnectRef.current && reconnectCountRef.current < 5) {
        reconnectCountRef.current += 1;
        reconnectTimerRef.current = setTimeout(() => {
          connect();
        }, 1000);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      ws.close();
    };
  }, [battleId, playerId]);

  useEffect(() => {
    connect();

    return () => {
      shouldReconnectRef.current = false;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const send = useCallback((msg: unknown) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    } else {
      console.warn('WebSocket is not connected — message dropped:', msg);
    }
  }, []);

  return { connected, send };
}
