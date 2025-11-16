'use client';

import { useEffect, useRef, useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { WEBSOCKET_URL } from '@/lib/constants';

export const usePriceWebSocket = () => {
  const { setCurrentPrice, setCurrentTime, addPricePoint } = useGame();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const mountedRef = useRef(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Prevent multiple connections
    if (mountedRef.current) return;
    mountedRef.current = true;

    const connect = () => {
      // Close existing connection before creating new one
      if (wsRef.current?.readyState === WebSocket.OPEN || 
          wsRef.current?.readyState === WebSocket.CONNECTING) {
        return;
      }

      try {
        const ws = new WebSocket(WEBSOCKET_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('WebSocket connected');
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);

            if (message.type === 'price_update' && message.source === 'chainlink') {
              const { price, timestamp } = message.data;
              const timeInSeconds = timestamp / 1000;

              setCurrentTime(timeInSeconds);
              setCurrentPrice(price);
              addPricePoint(timeInSeconds, price);
            }
          } catch (error) {
            console.error('Error parsing message:', error);
          }
        };

        ws.onerror = () => {
          setIsConnected(false);
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected');
          setIsConnected(false);
          wsRef.current = null;
          
          // Only reconnect if component is still mounted
          if (mountedRef.current) {
            reconnectTimeoutRef.current = setTimeout(connect, 3000);
          }
        };
      } catch (error) {
        console.error('WebSocket connection error:', error);
        setIsConnected(false);
      }
    };

    connect();

    return () => {
      mountedRef.current = false;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (wsRef.current) {
        wsRef.current.onclose = null; // Prevent reconnection
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []); // Empty dependency array - only run once

  return { isConnected };
};