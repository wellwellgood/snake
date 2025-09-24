// src/App.jsx
import React, { useCallback, useMemo, useState, useEffect, useRef } from "react";
import SnakeGame from "./publice/snakeGame.jsx";
import { addScore, loadScores, clearScores } from "./publice/scoreStorage.jsx";
import Scoreboard from "./publice/scoreBoard.jsx";

// ms → mm:ss.ms
const fmtMs = (ms) => {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const h = Math.floor((ms % 1000) / 10);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(h).padStart(2, "0")}`;
};

export default function App() {
  const boardRef = useRef(null);
  const [name, setName] = useState(() => localStorage.getItem("snake_name") || "PLAYER");
  const [records, setRecords] = useState(() => loadScores());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("snake_name", name);
  }, [name]);

  const onGameOver = useCallback((rec) => {
    console.log('GAME OVER REC', rec);
    // rec: { score, durationMs, when } from SnakeGame
    const withName = { ...rec, name: name.toUpperCase().slice(0, 12) || "PLAYER" };
    const top = addScore(withName);
    setRecords(top);
    setOpen(true); // 게임 끝나면 자동으로 보드 열기
  }, [name]);

  useEffect(() => {
    if (open) {
      boardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [open]);

  const onClear = useCallback(() => {
    clearScores();
    setRecords([]);
  }, []);

  const best = useMemo(() => (records[0]?.score ?? 0), [records]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 16 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", width: "min(640px,94vw)" }}>
        <b style={{ fontSize: 16 }}>Snake with Scoreboard</b>
        <button
          onClick={() => setOpen((v) => !v)}
          style={{ marginLeft: "auto", padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", fontSize: 13, cursor: "pointer" }}
        >
          {open ? "Hide Board" : "Show Board"}
        </button>
      </div>
      <div style={{ position: "relative", width: "min(640px,94vw)" }}>
        <SnakeGame onGameOver={onGameOver} />

        {/* 오버레이: 게임 위에 absolute로 표시 */}
        {open && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.5)",
              zIndex: 10
            }}
            onClick={() => setOpen(false)} // 배경 클릭 닫기
          >
            <div
              style={{
                width: "min(620px,94vw)",
                maxHeight: "90%",
                overflow: "auto",
                background: "#fff",
                borderRadius: 12,
                padding: 16,
                boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
              }}
              onClick={(e) => e.stopPropagation()} // 내부 클릭 전파 방지
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <b>Scoreboard</b>
                <button onClick={() => setOpen(false)} style={{ padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", cursor: "pointer" }}>Close</button>
              </div>
              <Scoreboard
                open={true}              // 오버레이 안에서 강제 표시
                records={records}
                name={name}
                onNameChange={setName}
                onClear={onClear}
                fmtMs={fmtMs}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
