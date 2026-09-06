import { useCallback, useEffect, useRef } from 'react';
import { market, type Candle } from '@/lib/marketEngine';
import { cn } from '@/lib/utils';
import { pad2 } from './data';

const MINT = '#34d399';
const RED = '#f87171';
const CYAN = '#22d3ee';
const GRID = 'rgba(26, 37, 64, 0.55)';
const TEXT3 = '#6b7280';

const TF_MINUTES: Record<string, number> = { '1m': 1, '5m': 5, '15m': 15, '1H': 60, '1D': 1440 };

function timeLabel(tf: string, candlesBack: number): string {
  const mins = (TF_MINUTES[tf] ?? 1) * candlesBack;
  const d = new Date(Date.now() - mins * 60_000);
  if (tf === '1D') return `${d.getMonth() + 1}/${d.getDate()}`;
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/**
 * Full terminal chart for /demo: mint/red candles or line mode, hairline grid,
 * right price axis + bottom time axis, dashed cyan last-price line with pulsing
 * tag, VWAP overlay, 48px volume strip, crosshair + OHLCV tooltip, wheel zoom,
 * drag pan. Plays back left→right on load, then mutates live via the engine.
 */
export default function TerminalChart({
  symbol,
  timeframe,
  chartType,
  reduced,
  className,
}: {
  symbol: string;
  timeframe: string;
  chartType: 'candles' | 'line';
  reduced: boolean;
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const candlesRef = useRef<Candle[]>([]);
  const viewRef = useRef({ count: 60, end: 59 }); // visible window: [end-count+1 .. end]
  const playRef = useRef(1);
  const transRef = useRef(1); // symbol/tf switch cross-fade progress
  const pulseRef = useRef(0);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ startX: number; startEnd: number } | null>(null);
  const rafRef = useRef(0);
  const sizeRef = useRef({ w: 0, h: 0 });
  const chartTypeRef = useRef(chartType);

  const tfRef = useRef(timeframe);
  useEffect(() => { chartTypeRef.current = chartType; tfRef.current = timeframe; }, [chartType, timeframe]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const dpr = window.devicePixelRatio || 1;
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    if (w < 40 || h < 40) return;
    sizeRef.current = { w, h };
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const all = candlesRef.current;
    if (all.length === 0) return;

    const axisW = 56;
    const timeAxisH = 18;
    const volH = 48;
    const chartH = h - volH - timeAxisH - 4;
    const plotW = w - axisW;

    // visible window
    const view = viewRef.current;
    view.count = Math.max(12, Math.min(all.length, view.count));
    view.end = Math.max(view.count - 1, Math.min(all.length - 1, view.end));
    const startIdx = Math.max(0, view.end - view.count + 1);
    const candles = all.slice(startIdx, view.end + 1);
    const n = candles.length;
    const visible = Math.max(1, Math.ceil(n * playRef.current));

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

    // gridlines + right price axis
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= 4; i++) {
      const v = lo + ((hi - lo) / 4) * i;
      const y = yOf(v);
      ctx.strokeStyle = GRID;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(plotW, y);
      ctx.stroke();
      ctx.fillStyle = TEXT3;
      ctx.fillText(v.toFixed(2), plotW + 8, y);
    }

    // bottom time axis
    ctx.strokeStyle = GRID;
    ctx.beginPath();
    ctx.moveTo(0, h - timeAxisH);
    ctx.lineTo(plotW, h - timeAxisH);
    ctx.stroke();
    const slot = plotW / n;
    const labelEvery = Math.max(1, Math.round(n / 6));
    ctx.textAlign = 'center';
    ctx.fillStyle = TEXT3;
    for (let i = 0; i < n; i += labelEvery) {
      const back = all.length - 1 - (startIdx + i);
      ctx.fillText(timeLabel(tfRef.current, back), i * slot + slot / 2, h - timeAxisH / 2);
    }
    ctx.textAlign = 'left';

    // volume strip separator
    ctx.strokeStyle = GRID;
    ctx.beginPath();
    ctx.moveTo(0, chartH + 2);
    ctx.lineTo(plotW, chartH + 2);
    ctx.stroke();

    // transition squash / cross-fade on symbol or timeframe switch
    const tp = transRef.current;
    ctx.save();
    if (tp < 1) {
      ctx.globalAlpha = 0.25 + 0.75 * tp;
      const squash = 0.94 + 0.06 * tp;
      ctx.translate(0, (chartH * (1 - squash)) / 2);
      ctx.scale(1, squash);
    }

    const bw = Math.max(2, Math.min(11, slot * 0.55));

    if (chartTypeRef.current === 'line') {
      // close polyline + soft area fill
      ctx.beginPath();
      for (let i = 0; i < Math.min(visible, n); i++) {
        const x = i * slot + slot / 2;
        const y = yOf(candles[i].c);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = CYAN;
      ctx.lineWidth = 1.5;
      ctx.lineJoin = 'round';
      ctx.stroke();
      const lastVis = Math.min(visible, n) - 1;
      ctx.lineTo(lastVis * slot + slot / 2, chartH);
      ctx.lineTo(slot / 2, chartH);
      ctx.closePath();
      ctx.fillStyle = 'rgba(34,211,238,0.06)';
      ctx.fill();
    } else {
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
        ctx.fillRect(x - bw / 2, Math.min(yo, yc), bw, Math.max(1, Math.abs(yc - yo)));
      }
    }
    ctx.restore();

    // VWAP overlay (subtle cyan) — cumulative over the full series
    if (playRef.current >= 1) {
      let cumPV = 0;
      let cumV = 0;
      const vw: number[] = [];
      for (const c of all) {
        const tpv = ((c.h + c.l + c.c) / 3) * c.v;
        cumPV += tpv;
        cumV += c.v;
        vw.push(cumPV / (cumV || 1));
      }
      ctx.strokeStyle = 'rgba(34,211,238,0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const x = i * slot + slot / 2;
        const y = yOf(vw[startIdx + i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // volume bars (drawn un-squashed)
    for (let i = 0; i < Math.min(visible, n); i++) {
      const c = candles[i];
      const x = i * slot + slot / 2;
      const up = c.c >= c.o;
      const vh = maxV > 0 ? (c.v / maxV) * (volH - 6) : 0;
      ctx.fillStyle = up ? 'rgba(52,211,153,0.28)' : 'rgba(248,113,113,0.28)';
      ctx.fillRect(x - bw / 2, chartH + 4 + (volH - 6 - vh), bw, vh);
    }

    // dashed cyan last-price line + pulsing tag
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
      const pulse = reduced ? 0.9 : 0.7 + 0.3 * Math.sin(pulseRef.current / 300);
      const tagW = axisW - 8;
      ctx.fillStyle = `rgba(34,211,238,${0.9 * pulse})`;
      ctx.fillRect(plotW + 2, y - 9, tagW, 18);
      ctx.fillStyle = '#050810';
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.fillText(last.c.toFixed(2), plotW + 8, y);
    }

    // crosshair + OHLCV tooltip
    const m = mouseRef.current;
    if (m && m.x < plotW && m.y < chartH && playRef.current >= 1) {
      ctx.strokeStyle = 'rgba(156,163,175,0.55)';
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
        `V ${c.v.toLocaleString('en-US')}`,
      ];
      const tw = 84;
      const th = 72;
      const tx = Math.min(Math.max(m.x + 12, 4), plotW - tw - 4);
      const ty = Math.min(Math.max(m.y - th - 12, 4), chartH - th - 4);
      ctx.fillStyle = 'rgba(17,26,43,0.96)';
      ctx.strokeStyle = '#1a2540';
      ctx.fillRect(tx, ty, tw, th);
      ctx.strokeRect(tx, ty, tw, th);
      ctx.fillStyle = c.c >= c.o ? MINT : RED;
      ctx.font = '11px "JetBrains Mono", monospace';
      lines.forEach((ln, i) => ctx.fillText(ln, tx + 8, ty + 13 + i * 13));
    }
  }, [reduced]);

  // data subscription + playback + pulse loop + resize
  useEffect(() => {
    const all = market.getCandles(symbol, timeframe);
    candlesRef.current = all.slice();
    viewRef.current = { count: all.length, end: all.length - 1 };
    playRef.current = reduced ? 1 : 0;
    transRef.current = reduced ? 1 : 0;
    const playStart = performance.now();

    const unsub = market.subscribeCandles(symbol, timeframe, () => {
      const prevLen = candlesRef.current.length;
      const wasPinned = viewRef.current.end >= prevLen - 1;
      const next = market.getCandles(symbol, timeframe).slice();
      candlesRef.current = next;
      if (wasPinned) viewRef.current.end = next.length - 1;
      else viewRef.current.end += next.length - prevLen;
      if (playRef.current >= 1) draw();
    });

    const loop = (t: number) => {
      pulseRef.current = t;
      if (playRef.current < 1) {
        playRef.current = Math.min(1, (t - playStart) / 1200);
        draw();
      } else if (transRef.current < 1) {
        transRef.current = Math.min(1, (t - playStart) / 300);
        draw();
      } else if (!reduced) {
        draw(); // keep the last-price tag pulsing
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    if (reduced) {
      draw();
    } else {
      rafRef.current = requestAnimationFrame(loop);
    }

    const wrap = wrapRef.current;
    const ro = new ResizeObserver(() => draw());
    if (wrap) ro.observe(wrap);
    return () => {
      unsub();
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [symbol, timeframe, draw, reduced]);

  // wheel zoom (non-passive so the page doesn't scroll) — clamps candle density
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const all = candlesRef.current;
      const view = viewRef.current;
      const factor = e.deltaY > 0 ? 1.18 : 1 / 1.18;
      view.count = Math.max(12, Math.min(all.length, Math.round(view.count * factor)));
      view.end = Math.max(view.count - 1, Math.min(all.length - 1, view.end));
      draw();
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [draw]);

  const localPos = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onMouseDown = (e: React.MouseEvent) => {
    dragRef.current = { startX: e.clientX, startEnd: viewRef.current.end };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    mouseRef.current = localPos(e);
    const drag = dragRef.current;
    if (drag) {
      const all = candlesRef.current;
      const { w } = sizeRef.current;
      const plotW = w - 56;
      const slot = plotW / Math.max(1, viewRef.current.count);
      const shift = Math.round((e.clientX - drag.startX) / Math.max(1, slot));
      if (shift !== 0) {
        viewRef.current.end = Math.max(
          viewRef.current.count - 1,
          Math.min(all.length - 1, drag.startEnd - shift),
        );
        draw();
      }
    }
    if (reduced) draw();
  };
  const endDrag = () => {
    dragRef.current = null;
  };

  return (
    <div ref={wrapRef} className={cn('relative min-h-[420px] w-full', className)}>
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'crosshair', display: 'block' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={() => {
          mouseRef.current = null;
          endDrag();
          if (reduced) draw();
        }}
      />
    </div>
  );
}
