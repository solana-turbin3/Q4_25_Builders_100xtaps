'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useGame } from '@/contexts/GameContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { useSessionManager } from '@/hooks/useSessionManager';
import { calculateOdds } from '@/lib/utils';
import {
  GRID_TIME_SIZE,
  GRID_PRICE_SIZE,
  BET_AMOUNT,
  VERTICAL_GRIDS,
  HORIZONTAL_GRIDS,
} from '@/lib/constants';
import { Bet } from '@/lib/types';



export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const startTimeRef = useRef(Date.now());

  const { connected } = useWallet();
  const { isSessionActive } = useSessionManager();

  const {
    balance,
    currentPrice,
    currentTime,
    priceHistory,
    activeBets,
    collisions,
    vanishingBets,
    setBalance,
    addBet,
  } = useGame();

  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, panX: 0, panY: 0 });
  const [zoom, setZoom] = useState(1);

  const getMinPrice = useCallback(() => {
    return (
      Math.floor(
        (currentPrice - VERTICAL_GRIDS * GRID_PRICE_SIZE) / GRID_PRICE_SIZE
      ) * GRID_PRICE_SIZE
    );
  }, [currentPrice]);

  const getMaxPrice = useCallback(() => {
    return (
      Math.ceil(
        (currentPrice + VERTICAL_GRIDS * GRID_PRICE_SIZE) / GRID_PRICE_SIZE
      ) * GRID_PRICE_SIZE
    );
  }, [currentPrice]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    if (width < 100 || height < 100) return;

    // Clear with dark background
    ctx.fillStyle = '#1a0a2e';
    ctx.fillRect(0, 0, width, height);

    // Apply zoom and pan transformations
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    const baseWidth = width / zoom;
    const baseHeight = height / zoom;
    const baseX = -pan.x / zoom;
    const baseY = -pan.y / zoom;

    const chartWidth = baseWidth * 0.3;
    const gridWidth = baseWidth - chartWidth;
    const padding = { top: 40, bottom: 60, left: 10, right: 10 };
    const drawHeight = baseHeight - padding.top - padding.bottom;

    const chartEndTime = currentTime;
    const chartStartTime = currentTime - 30;
    const gridStartTime = currentTime;
    const gridEndTime = currentTime + HORIZONTAL_GRIDS * GRID_TIME_SIZE;

    const MIN_PRICE = getMinPrice();
    const MAX_PRICE = getMaxPrice();
    const PRICE_RANGE = MAX_PRICE - MIN_PRICE;

    const timeToX = (time: number) => {
      if (time <= chartEndTime) {
        const ratio = (time - chartStartTime) / (chartEndTime - chartStartTime);
        return padding.left + ratio * (chartWidth - padding.left);
      } else {
        const ratio = (time - gridStartTime) / (gridEndTime - gridStartTime);
        return chartWidth + ratio * gridWidth;
      }
    };

    const priceToY = (price: number) => {
      const ratio = (price - MIN_PRICE) / PRICE_RANGE;
      return baseHeight - padding.bottom - ratio * drawHeight;
    };

    // Draw grid background
    ctx.fillStyle = 'rgba(30, 15, 50, 0.3)';
    ctx.fillRect(chartWidth, padding.top, gridWidth, drawHeight);

    // Draw horizontal price lines
    const priceStep = GRID_PRICE_SIZE;
    for (let p = MIN_PRICE; p <= MAX_PRICE; p += priceStep) {
      const y = priceToY(p);

      ctx.strokeStyle = 'rgba(100, 50, 150, 0.2)';
      ctx.lineWidth = 1 / zoom;
      ctx.beginPath();
      ctx.moveTo(baseX, y);
      ctx.lineTo(baseX + baseWidth, y);
      ctx.stroke();

      ctx.fillStyle = 'rgba(200, 150, 255, 0.6)';
      ctx.font = `${11 / zoom}px monospace`;
      ctx.textAlign = 'right';
      ctx.fillText(p.toFixed(2), baseX + baseWidth - 5 / zoom, y - 3 / zoom);
    }

    // Draw vertical time lines
    const visibleTimeStart =
      Math.floor(gridStartTime / GRID_TIME_SIZE) * GRID_TIME_SIZE;
    const visibleTimeEnd = Math.min(
      gridEndTime,
      currentTime + HORIZONTAL_GRIDS * GRID_TIME_SIZE
    );

    const realStartTime = new Date(startTimeRef.current);

    let timeLineCount = 0;
    for (let t = visibleTimeStart; t <= visibleTimeEnd; t += GRID_TIME_SIZE) {
      const x = timeToX(t);
      if (x >= chartWidth) {
        ctx.strokeStyle = 'rgba(100, 50, 150, 0.2)';
        ctx.lineWidth = 1 / zoom;
        ctx.beginPath();
        ctx.moveTo(x, padding.top);
        ctx.lineTo(x, baseHeight - padding.bottom);
        ctx.stroke();

        const skipFactor = zoom > 1.5 ? 1 : zoom > 1 ? 2 : 3;
        if (timeLineCount % skipFactor === 0) {
          const futureTime = new Date(realStartTime.getTime() + t * 1000);
          const hours = futureTime.getHours().toString().padStart(2, '0');
          const minutes = futureTime.getMinutes().toString().padStart(2, '0');
          const seconds = futureTime.getSeconds().toString().padStart(2, '0');

          ctx.fillStyle = 'rgba(200, 150, 255, 0.6)';
          ctx.font = `${10 / zoom}px monospace`;
          ctx.textAlign = 'center';
          ctx.fillText(
            `${hours}:${minutes}:${seconds}`,
            x,
            baseHeight - padding.bottom + 15 / zoom
          );
        }
        timeLineCount++;
      }
    }

    // Draw grids
    for (let t = visibleTimeStart; t < visibleTimeEnd; t += GRID_TIME_SIZE) {
      for (
        let p = MIN_PRICE;
        p <= MAX_PRICE - GRID_PRICE_SIZE;
        p += GRID_PRICE_SIZE
      ) {
        const x = timeToX(t + GRID_TIME_SIZE / 2);
        if (x < chartWidth) continue;

        const y1 = priceToY(p);
        const y2 = priceToY(p + GRID_PRICE_SIZE);
        const centerY = (y1 + y2) / 2;
        const gridHeight = y1 - y2;

        const nextX = timeToX(t + GRID_TIME_SIZE);
        const gridWidth = nextX - timeToX(t);

        const gridId = `${t}-${p.toFixed(2)}`;
        const bet = activeBets.find((b) => b.id === gridId);
        const isVanishing = vanishingBets.find((v) => v.id === gridId);

        let alpha = 1;
        if (isVanishing) {
          alpha = 1 - (Date.now() - (isVanishing as any).timestamp) / 2000;
        }

        let gradient;
        if (bet) {
          if (bet.status === 'won') {
            gradient = ctx.createLinearGradient(
              x - gridWidth / 2,
              centerY - gridHeight / 2,
              x + gridWidth / 2,
              centerY + gridHeight / 2
            );
            gradient.addColorStop(0, `rgba(34, 197, 94, ${0.8 * alpha})`);
            gradient.addColorStop(1, `rgba(22, 163, 74, ${0.9 * alpha})`);
          } else if (bet.status === 'lost') {
            gradient = ctx.createLinearGradient(
              x - gridWidth / 2,
              centerY - gridHeight / 2,
              x + gridWidth / 2,
              centerY + gridHeight / 2
            );
            gradient.addColorStop(0, `rgba(150, 50, 50, ${0.3 * alpha})`);
            gradient.addColorStop(1, `rgba(100, 30, 30, ${0.4 * alpha})`);
          } else {
            gradient = ctx.createLinearGradient(
              x - gridWidth / 2,
              centerY - gridHeight / 2,
              x + gridWidth / 2,
              centerY + gridHeight / 2
            );
            gradient.addColorStop(0, 'rgba(250, 220, 0, 0.9)');
            gradient.addColorStop(1, 'rgba(255, 200, 0, 1)');
          }
        } else {
          const timeDist = Math.abs(t - currentTime);
          const priceDist = Math.abs(p + GRID_PRICE_SIZE / 2 - currentPrice);
          const distance = Math.sqrt(
            timeDist * timeDist + priceDist * priceDist * 100
          );
          const hue = 280 - Math.min(80, distance * 2);
          const saturation = 50 + Math.min(30, distance);
          gradient = ctx.createRadialGradient(
            x,
            centerY,
            0,
            x,
            centerY,
            Math.max(gridWidth, gridHeight)
          );
          gradient.addColorStop(0, `hsla(${hue}, ${saturation}%, 40%, 0.4)`);
          gradient.addColorStop(1, `hsla(${hue}, ${saturation}%, 25%, 0.3)`);
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(
          x - gridWidth / 2 + 2 / zoom,
          y2 + 2 / zoom,
          gridWidth - 4 / zoom,
          gridHeight - 4 / zoom
        );

        ctx.strokeStyle = bet
          ? 'rgba(255, 255, 255, 0.6)'
          : 'rgba(150, 100, 200, 0.3)';
        ctx.lineWidth = (bet ? 2 : 1) / zoom;
        ctx.strokeRect(
          x - gridWidth / 2 + 2 / zoom,
          y2 + 2 / zoom,
          gridWidth - 4 / zoom,
          gridHeight - 4 / zoom
        );

        if (gridHeight > 20 / zoom) {
          const midPrice = p + GRID_PRICE_SIZE / 2;
          const odds = bet
            ? bet.odds
            : calculateOdds(t, midPrice, currentTime, currentPrice);

          ctx.fillStyle =
            bet?.status === 'pending'
              ? 'rgba(0, 0, 0, 0.9)'
              : 'rgba(255, 255, 255, 0.9)';
          ctx.font = `bold ${12 / zoom}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${odds.toFixed(2)}x`, x, centerY);

          if (bet?.status === 'pending') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.font = `${9 / zoom}px sans-serif`;
            ctx.fillText('$10', x, centerY + 12 / zoom);
          }
        }
      }
    }

    // Draw price chart
    if (priceHistory.length > 1) {
      ctx.strokeStyle = '#ff006e';
      ctx.lineWidth = 2.5 / zoom;
      ctx.shadowColor = '#ff006e';
      ctx.shadowBlur = 8 / zoom;
      ctx.beginPath();

      let started = false;
      priceHistory.forEach((point) => {
        if (point.time >= chartStartTime && point.time <= chartEndTime) {
          const x = timeToX(point.time);
          const y = priceToY(point.price);

          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      });
      ctx.stroke();
      ctx.shadowBlur = 0;

      const currentX = timeToX(currentTime);
      const currentY = priceToY(currentPrice);

      ctx.fillStyle = '#ff006e';
      ctx.beginPath();
      ctx.arc(currentX, currentY, 6 / zoom, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 0, 110, 0.4)';
      ctx.lineWidth = 2 / zoom;
      ctx.beginPath();
      ctx.arc(currentX, currentY, 12 / zoom, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw current time line
    const nowX = timeToX(currentTime);
    ctx.strokeStyle = 'rgba(255, 0, 110, 0.5)';
    ctx.lineWidth = 2 / zoom;
    ctx.setLineDash([5 / zoom, 5 / zoom]);
    ctx.beginPath();
    ctx.moveTo(nowX, padding.top);
    ctx.lineTo(nowX, baseHeight - padding.bottom);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw current price line
    const currentY = priceToY(currentPrice);
    ctx.strokeStyle = 'rgba(255, 0, 110, 0.3)';
    ctx.lineWidth = 1.5 / zoom;
    ctx.setLineDash([3 / zoom, 3 / zoom]);
    ctx.beginPath();
    ctx.moveTo(chartWidth, currentY);
    ctx.lineTo(baseX + baseWidth, currentY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw collision effects
    collisions.forEach((col) => {
      const x = timeToX(col.x);
      const y = priceToY(col.y);
      const age = Date.now() - col.timestamp;
      const progress = age / 2000;

      if (col.won) {
        const alpha = 1 - progress;
        const radius = (20 + progress * 60) / zoom;

        ctx.strokeStyle = `rgba(34, 197, 94, ${alpha})`;
        ctx.lineWidth = 6 / zoom;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = `rgba(34, 197, 94, ${alpha * 0.6})`;
        ctx.lineWidth = 4 / zoom;
        ctx.beginPath();
        ctx.arc(x, y, radius * 1.3, 0, Math.PI * 2);
        ctx.stroke();

        if (progress < 0.7) {
          ctx.fillStyle = `rgba(255, 255, 255, ${1 - progress / 0.7})`;
          ctx.font = `bold ${16 / zoom}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(`+$${col.payout.toFixed(2)}`, x, y - radius - 10 / zoom);
        }
      }
    });

    ctx.restore();
  }, [
    currentTime,
    currentPrice,
    priceHistory,
    activeBets,
    pan,
    zoom,
    collisions,
    vanishingBets,
    getMinPrice,
    getMaxPrice,
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    const animate = () => {
      drawCanvas();
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', updateSize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [drawCanvas]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) return;

    // Check if wallet is connected and session is active
    if (!connected) {
      alert('Please connect your wallet first!');
      return;
    }

    if (!isSessionActive()) {
      alert('Please enable trading first!');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const x = (clickX - pan.x) / zoom;
    const y = (clickY - pan.y) / zoom;

    const baseWidth = rect.width / zoom;
    const baseHeight = rect.height / zoom;
    const chartWidth = baseWidth * 0.3;

    if (x < chartWidth) return;

    const padding = { top: 40, bottom: 60 };
    const drawHeight = baseHeight - padding.top - padding.bottom;

    const gridStartTime = currentTime;
    const gridEndTime = currentTime + HORIZONTAL_GRIDS * GRID_TIME_SIZE;
    const gridWidth = baseWidth - chartWidth;

    const MIN_PRICE = getMinPrice();
    const MAX_PRICE = getMaxPrice();
    const PRICE_RANGE = MAX_PRICE - MIN_PRICE;

    const timeRatio = (x - chartWidth) / gridWidth;
    const clickTime = gridStartTime + timeRatio * (gridEndTime - gridStartTime);

    const priceRatio = (baseHeight - padding.bottom - y) / drawHeight;
    const clickPrice = MIN_PRICE + priceRatio * PRICE_RANGE;

    const gridTimeBase =
      Math.floor(clickTime / GRID_TIME_SIZE) * GRID_TIME_SIZE;
    const gridPriceBase =
      Math.floor(clickPrice / GRID_PRICE_SIZE) * GRID_PRICE_SIZE;

    if (
      gridTimeBase < currentTime ||
      gridTimeBase >= currentTime + HORIZONTAL_GRIDS * GRID_TIME_SIZE
    ) {
      return;
    }

    if (gridPriceBase < getMinPrice() || gridPriceBase >= getMaxPrice()) {
      return;
    }

    const gridId = `${gridTimeBase}-${gridPriceBase.toFixed(2)}`;

    if (activeBets.find((b) => b.id === gridId)) {
      return;
    }

    if (gridTimeBase <= currentTime + 2) {
      return;
    }

    const startPrice = gridPriceBase;
    const endPrice = gridPriceBase + GRID_PRICE_SIZE;
    const startTime = gridTimeBase;
    const endTime = gridTimeBase + GRID_TIME_SIZE;
    const midPrice = (startPrice + endPrice) / 2;

    const odds = calculateOdds(startTime, midPrice, currentTime, currentPrice);
    const payout = BET_AMOUNT * odds - BET_AMOUNT;

    if (balance < BET_AMOUNT) {
      alert('Insufficient balance!');
      return;
    }

    setBalance((prev) => prev - BET_AMOUNT);

    

    addBet({
      id: gridId,
      startPrice,
      endPrice,
      startTime,
      endTime,
      midPrice,
      odds,
      payout,
      status: 'pending',
      checked: false,
    });
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (e.ctrlKey || e.metaKey) {
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.5, Math.min(5, zoom * delta));

      const zoomRatio = newZoom / zoom;
      const newPanX = mouseX - (mouseX - pan.x) * zoomRatio;
      const newPanY = mouseY - (mouseY - pan.y) * zoomRatio;

      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    } else {
      const newPanX = pan.x - e.deltaX;
      const newPanY = pan.y - e.deltaY;

      const baseWidth = rect.width / zoom;
      const chartWidth = baseWidth * 0.3;
      const gridWidth = baseWidth - chartWidth;

      const maxPanX = 0;
      const minPanX = -(gridWidth * zoom - gridWidth);

      const maxPanY = 0;
      const minPanY = 0;

      setPan({
        x: Math.max(minPanX, Math.min(maxPanX, newPanX)),
        y: Math.max(minPanY, Math.min(maxPanY, newPanY)),
      });
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;

    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const baseWidth = rect.width / zoom;
    const chartWidth = baseWidth * 0.3;
    const gridWidth = baseWidth - chartWidth;

    const newPanX = dragStart.panX + dx;
    const maxPanX = 0;
    const minPanX = -(gridWidth * zoom - gridWidth);

    setPan({
      x: Math.max(minPanX, Math.min(maxPanX, newPanX)),
      y: 0,
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="flex-1 relative overflow-hidden">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
      />

      <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-black/60 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs sm:text-sm">
        <div className="text-gray-400">Zoom: {(zoom * 100).toFixed(0)}%</div>
        <div className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">
          Ctrl+Scroll to zoom
        </div>
      </div>

      
    </div>
  );
};