import React, { useCallback, useEffect, useRef, useState } from "react";

// Drop-in React component. No deps. Canvas-based. Keyboard + swipe.
// Works in CRA, Vite, Next (use client). Export default below.

const cellSize = 22; // px per cell
const COLS = 22;
const ROWS = 22;
const TICK_MS_DEFAULT = 120; // lower = faster

function randCell(max) {
  return Math.floor(Math.random() * max);
}

function same(a, b) {
  return a.x === b.x && a.y === b.y;
}

function randomFood(snake) {
  while (true) {
    const f = { x: randCell(COLS), y: randCell(ROWS) };
    if (!snake.some((s) => same(s, f))) return f;
  }
}

// function clampDir([dx, dy]) {
  // normalize to -1,0,1
  // return [Math.sign(dx), Math.sign(dy)];
// }

export default function SnakeGame() {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const lastTickRef = useRef(0);
  const dprRef = useRef(Math.min(2, window.devicePixelRatio || 1));
  const scrollYRef = useRef(0);

  const [running, setRunning] = useState(true);
  const [tickMs, setTickMs] = useState(TICK_MS_DEFAULT);
  const [dir, setDir] = useState({ x: 1, y: 0 }); // start right
  const [snake, setSnake] = useState(() => {
    const mid = Math.floor(COLS / 2);
    return [
      { x: mid - 1, y: mid },
      { x: mid, y: mid },
      { x: mid + 1, y: mid },
    ];
  });
  const [food, setFood] = useState(() => randomFood([]));
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem("snake_best") || 0));
  const [gameOver, setGameOver] = useState(false);

  const [size, setSize] = useState(() => {
    const S = Math.floor(Math.min(window.innerWidth, window.innerHeight) * 0.9);
    const cell = Math.max(12, Math.floor(S / COLS)); // 너무 작아지는 것 방지
    return { cell, w: COLS * cell, h: ROWS * cell };
  });

  useEffect(() => {
    function fit() {
      const S = Math.floor(Math.min(window.innerWidth, window.innerHeight) * 0.9);
      const cell = Math.max(12, Math.floor(S / COLS));
      setSize({ cell, w: COLS * cell, h: ROWS * cell });
    }
    fit();
    window.addEventListener("resize", fit);
    window.addEventListener("orientationchange", fit);
    return () => {
      window.removeEventListener("resize", fit);
      window.removeEventListener("orientationchange", fit);
    };
  }, []);

  scrollYRef.current = window.scrollY || 0;
    const b = document.body;
    b.style.position = "fixed";
    b.style.top = `-${scrollYRef.current}px`;
    b.style.left = "0";
    b.style.right = "0";
    b.style.width = "100%";
    b.style.overflow = "hidden";
    useEffect(() => {
      // lock
      scrollYRef.current = window.scrollY || 0;
      const b = document.body;
      b.style.position = "fixed";
      b.style.top = `-${scrollYRef.current}px`;
      b.style.left = "0";
      b.style.right = "0";
      b.style.width = "100%";
      b.style.overflow = "hidden";
  
      return () => {
        // unlock
        const y = scrollYRef.current;
        const b = document.body;
        b.style.position = "";
        b.style.top = "";
        b.style.left = "";
        b.style.right = "";
        b.style.width = "";
        b.style.overflow = "";
        window.scrollTo(0, y);
      };
    }, []);

  const cellSize = size.cell;
  const width = size.w;
  const height = size.h;

  const reset = useCallback(() => {
    const mid = Math.floor(COLS / 2);
    setSnake([
      { x: mid - 1, y: mid },
      { x: mid, y: mid },
      { x: mid + 1, y: mid },
    ]);
    setDir({ x: 1, y: 0 });
    setFood(randomFood([]));
    setScore(0);
    setTickMs(TICK_MS_DEFAULT);
    setGameOver(false);
    setRunning(true);
  }, []);

  // Input: keyboard
  useEffect(() => {
    function onKey(e) {
      const k = e.key.toLowerCase();
      if (k === " " || k === "enter") {
        if (gameOver) reset();
        else setRunning((r) => !r);
        return;
      }
      if (!running) return;
      if (k === "arrowup" || k === "w") return setDir((d) => (d.y === 1 ? d : { x: 0, y: -1 }));
      if (k === "arrowdown" || k === "s") return setDir((d) => (d.y === -1 ? d : { x: 0, y: 1 }));
      if (k === "arrowleft" || k === "a") return setDir((d) => (d.x === 1 ? d : { x: -1, y: 0 }));
      if (k === "arrowright" || k === "d") return setDir((d) => (d.x === -1 ? d : { x: 1, y: 0 }));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [running, reset, gameOver]);

  // Input: swipe
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    let sx = 0, sy = 0;
    function start(ev) {
      const t = ev.touches?.[0];
      if (!t) return;
      sx = t.clientX; sy = t.clientY;
    }
    function move(ev) {
      if (!running) return;
      const t = ev.touches?.[0];
      if (!t) return;
      const dx = t.clientX - sx;
      const dy = t.clientY - sy;
      if (Math.abs(dx) + Math.abs(dy) < 18) return; // dead zone
      if (Math.abs(dx) > Math.abs(dy)) {
        setDir((d) => (dx > 0 ? (d.x === -1 ? d : { x: 1, y: 0 }) : (d.x === 1 ? d : { x: -1, y: 0 })));
      } else {
        setDir((d) => (dy > 0 ? (d.y === -1 ? d : { x: 0, y: 1 }) : (d.y === 1 ? d : { x: 0, y: -1 })));
      }
      sx = t.clientX; sy = t.clientY;
    }
    el.addEventListener("touchstart", start, { passive: true });
    el.addEventListener("touchmove", move, { passive: true });
    return () => {
      el.removeEventListener("touchstart", start);
      el.removeEventListener("touchmove", move);
    };
  }, [running]);

  // Game tick
  const step = useCallback(() => {
    setSnake((prev) => {
      const head = prev[prev.length - 1];
      const nx = head.x + dir.x;
      const ny = head.y + dir.y;

      // wall or self collision => game over
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS || prev.some((p) => p.x === nx && p.y === ny)) {
        setGameOver(true);
        setRunning(false);
        setBest((b) => {
          const nb = Math.max(b, score);
          localStorage.setItem("snake_best", String(nb));
          return nb;
        });
        return prev;
      }

      const next = [...prev, { x: nx, y: ny }];

      if (nx === food.x && ny === food.y) {
        // grow
        setScore((s) => s + 1);
        setFood(randomFood(next));
        // subtle speed up every 4 points
        setTickMs((ms) => ( ( (score + 1) % 4 === 0 && ms > 60) ? ms - 6 : ms));
        return next;
      }

      // move
      next.shift();
      return next;
    });
  }, [dir, food, score]);

  // RAF loop throttled to tickMs
  const loop = useCallback((t) => {
    if (!running || gameOver) return;
    if (t - lastTickRef.current >= tickMs) {
      lastTickRef.current = t;
      step();
    }
    rafRef.current = requestAnimationFrame(loop);
  }, [tickMs, running, gameOver, step]);

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [loop]);

  // Pause on tab hidden
  useEffect(() => {
    function vis() {
      if (document.hidden) setRunning(false);
    }
    document.addEventListener("visibilitychange", vis);
    return () => document.removeEventListener("visibilitychange", vis);
  }, []);

  // Draw
  useEffect(() => {
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");
    if (!ctx) return;

    const dpr = dprRef.current;
    if (c.width !== width * dpr || c.height !== height * dpr) {
      c.width = width * dpr;
      c.height = height * dpr;
      c.style.width = `${width}px`;
      c.style.height = `${height}px`;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // background
    ctx.fillStyle = "#0b1020";
    ctx.fillRect(0, 0, width, height);

    // grid glow
    ctx.strokeStyle = "#101a3a";
    ctx.lineWidth = 1;
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cellSize + 0.5, 0);
      ctx.lineTo(x * cellSize + 0.5, height);
      ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cellSize + 0.5);
      ctx.lineTo(width, y * cellSize + 0.5);
      ctx.stroke();
    }

    // snake
    for (let i = 0; i < snake.length; i++) {
      const s = snake[i];
      const isHead = i === snake.length - 1;
      ctx.fillStyle = isHead ? "#7dd3fc" : "#38bdf8"; // head lighter
      const pad = isHead ? 2 : 3;
      ctx.fillRect(s.x * cellSize + pad, s.y * cellSize + pad, cellSize - pad * 2, cellSize - pad * 2);
    }

    // food
    ctx.fillStyle = "#f87171";
    const r = Math.floor(cellSize / 2) - 4;
    const cx = food.x * cellSize + cellSize / 2;
    const cy = food.y * cellSize + cellSize / 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }, [snake, food, cellSize, width, height]);

  return (
    <div className="w-full min-h-[100dvh] flex flex-col items-center justify-center gap-3 p-4 select-none">
      <h1 className="text-xl font-semibold tracking-tight">Snake</h1>
      <div className="flex items-center gap-3 text-sm">
        <span>Score: <b>{score}</b></span>
        <span>Best: <b>{best}</b></span>
        <span>Speed: <b>{Math.round(1000 / tickMs)} fps</b></span>
      </div>

      <div className="relative" style={{ boxShadow: "0 10px 30px rgba(0,0,0,0.35)", borderRadius: 12 }}>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="bg-[#0b1020] rounded-2xl touch-none"
          style={{ imageRendering: "pixelated" }}
        />

        {/* Overlay UI */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {!running && !gameOver && (
            <div className="pointer-events-auto bg-black/50 text-white px-4 py-2 rounded-lg text-sm">Paused</div>
          )}
          {gameOver && (
            <div className="pointer-events-auto bg-black/60 text-white px-4 py-3 rounded-lg text-center">
              <div className="text-base font-semibold mb-1">Game Over</div>
              <div className="text-xs opacity-80 mb-2">Press Enter to restart</div>
              <button
                className="pointer-events-auto bg-white text-black rounded-md px-3 py-1 text-sm"
                onClick={reset}
              >Restart</button>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button className="px-3 py-1 rounded-md text-sm border" onClick={() => setRunning((r) => !r)}>
          {running ? "Pause" : "Resume"}
        </button>
        <button className="px-3 py-1 rounded-md text-sm border" onClick={reset}>Reset</button>
        <button className="px-3 py-1 rounded-md text-sm border" onClick={() => setTickMs((ms) => Math.max(60, ms - 10))}>Faster</button>
        <button className="px-3 py-1 rounded-md text-sm border" onClick={() => setTickMs((ms) => Math.min(300, ms + 10))}>Slower</button>
      </div>

      {/* <p className="text-xs opacity-70">Controls: Arrow/WASD, Enter=restart, Space=pause. Swipe on mobile.</p> */}
    </div>
  );
}
