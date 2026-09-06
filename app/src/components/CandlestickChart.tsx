import { useCallback, useEffect, useRef } from 'react';
import { market, type Candle } from '@/lib/marketEngine';
import { usePrefersReducedMotion } from '@/hooks/useInView';
import { cn } from '@/lib/utils';

const MINT = '#34d399';
const RED = '#f87171';
const CYAN = '#22d3ee';
const GRID = 'rgba(26, 37, 64, 0.55)';
const TEXT3 = '#6b7280';

/**
 * Hand-rolled canvas candlestick chart: mint/red candles, hairline gridlines,
 * dashed cyan last-price line + pulsing price tag, crosshair + OHLC tooltip
 * on hover, 24px volume strip. Plays back left→right on mount, then updates live.
 */
export default function CandlestickChart({
  symbol,
  timeframe = '1m',
  height = 340,
  className,
}: {
  symbol: string;
  timeframe?: string;
  height?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const playRef = useRef(1); // playback progress 0..1
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const pulseRef = useRef(0);
  const candlesRef = useRef<Candle[]>([]);
  const rafRef = useRef(0);
  const reduced = usePrefersReducedMotion();

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const dpr = window.devicePixelRatio || 1;
    const w = wrap.clientWidth;
    const h = height;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const candles = candlesRef.current;
    if (candles.length === 0) return;

    const axisW = 54;
    const volH = 24;
    const chartH = h - volH - 8;
    const plotW = w - axisW;

    let lo = Infinity;
    let hi = -Infinity;
    let maxV = 0;
    for (const c of candles) {
      lo = Math.min(lo, c.l);
      hi = Math.max(hi, c.h);
      maxV = Math.max(maxV, c.v);
    }
    const pad = (hi - lo) * 0.08 || 1;
    lo -= pad;
    hi += pad;
    const yOf = (v: number) => chartH - ((v - lo) / (hi - lo)) * chartH;

    // gridlines + right axis labels
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const rows = 4;
    for (let i = 0; i <= rows; i++) {
      const v = lo + ((hi - lo) / rows) * i;
      const y = yOf(v);
      ctx.strokeStyle = GRID;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(plotW, y);
      ctx.stroke();
      ctx.fillStyle = TEXT3;
      ctx.fillText(v.toFixed(2), plotW + 6, y);
    }

    const n = candles.length;
    const slot = plotW / n;
    const bw = Math.max(2, Math.min(10, slot * 0.55));
    const visible = Math.ceil(n * playRef.current);

    for (let i = 0; i < Math.min(visible, n); i++) {
      const c = candles[i];
      const x = i * slot + slot / 2;
      const up = c.c >= c.o;
      const col = up ? MINT : RED;
      ctx.strokeStyle = col;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, yOf(c.h));
      ctx.lineTo(x, yOf(c.l));
      ctx.stroke();
      ctx.fillStyle = up ? 'rgba(52,211,153,0.9)' : 'rgba(248,113,113,0.9)';
      const yo = yOf(c.o);
      const yc = yOf(c.c);
      const top = Math.min(yo, yc);
      const hh = Math.max(1, Math.abs(yc - yo));
      if (up) {
        ctx.fillRect(x - bw / 2, top, bw, hh);
      } else {
        ctx.fillRect(x - bw / 2, top, bw, hh);
      }
      // volume bar
      const vh = (c.v / maxV) * volH;
      ctx.fillStyle = up ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)';
      ctx.fillRect(x - bw / 2, h - vh, bw, vh);
    }

    // last price dashed line + pulsing tag
    const last = candles[n - 1];
    if (playRef.current >= 1) {
      const y = yOf(last.c);
      ctx.strokeStyle = CYAN;
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(plotW, y);
      ctx.stroke();
      ctx.setLineDash([]);
      const pulse = 0.7 + 0.3 * Math.sin(pulseRef.current / 300);
      const tagW = axisW - 6;
      ctx.fillStyle = `rgba(34,211,238,${0.15 * pulse})`;
      ctx.fillRect(plotW + 2, y - 9, tagW, 18);
      ctx.fillStyle = CYAN;
      ctx.fillRect(plotW + 2, y - 9, 2, 18);
      ctx.fillStyle = '#050810';
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.fillText(last.c.toFixed(2), plotW + 8, y);
      // solid tag text on cyan chip
      ctx.fillStyle = `rgba(34,211,238,${0.9 * pulse})`;
      ctx.fillRect(plotW + 2, y - 9, tagW, 18);
      ctx.fillStyle = '#050810';
      ctx.fillText(last.c.toFixed(2), plotW + 8, y);
    }

    // crosshair + OHLC tooltip
    const m = mouseRef.current;
    if (m && m.x < plotW && playRef.current >= 1) {
      ctx.strokeStyle = 'rgba(156,163,175,0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(m.x, 0);
      ctx.lineTo(m.x, chartH);
      ctx.moveTo(0, m.y);
      ctx.lineTo(plotW, m.y);
      ctx.stroke();
      ctx.setLineDash([]);
      const idx = Math.min(n - 1, Math.max(0, Math.floor(m.x / slot)));
      const c = candles[idx];
      const lines = [
        `O ${c.o.toFixed(2)}`,
        `H ${c.h.toFixed(2)}`,
        `L ${c.l.toFixed(2)}`,
        `C ${c.c.toFixed(2)}`,
      ];
      const tw = 76;
      const th = 58;
      const tx = Math.min(Math.max(m.x + 10, 4), plotW - tw - 4);
      const ty = Math.min(Math.max(m.y - th - 10, 4), chartH - th - 4);
      ctx.fillStyle = 'rgba(12,18,32,0.95)';
      ctx.strokeStyle = '#1a2540';
      ctx.fillRect(tx, ty, tw, th);
      ctx.strokeRect(tx, ty, tw, th);
      ctx.fillStyle = c.c >= c.o ? MINT : RED;
      ctx.font = '10px "JetBrains Mono", monospace';
      lines.forEach((ln, i) => ctx.fillText(ln, tx + 8, ty + 12 + i * 13));
    }
  }, [height]);

  // data subscription + playback + pulse loop
  useEffect(() => {
    candlesRef.current = market.getCandles(symbol, timeframe).slice();
    playRef.current = reduced ? 1 : 0;
    const playStart = performance.now();

    const unsub = market.subscribeCandles(symbol, timeframe, () => {
      candlesRef.current = market.getCandles(symbol, timeframe).slice();
      if (playRef.current >= 1) draw();
    });

    const loop = (t: number) => {
      pulseRef.current = t;
      if (playRef.current < 1) {
        playRef.current = Math.min(1, (t - playStart) / 1400);
        draw();
      } else if (!reduced) {
        draw(); // keep last-price tag pulsing
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    if (reduced) {
      draw();
    } else {
      rafRef.current = requestAnimationFrame(loop);
    }
    const onResize = () => draw();
    window.addEventListener('resize', onResize);
    return () => {
      unsub();
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
    };
  }, [symbol, timeframe, draw, reduced]);

  const onMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    if (reduced) draw();
  };

  return (
    <div ref={wrapRef} className={cn('relative w-full', className)} style={{ height }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', cursor: 'crosshair', display: 'block' }}
        onMouseMove={onMove}
        onMouseLeave={() => {
          mouseRef.current = null;
          if (reduced) draw();
        }}
      />
    </div>
  );
}
