import React, { useState } from "react";
import SnakeGame from "./publice/snakeGame.jsx";
import Scoreboard from "./publice/scoreBoard.jsx";
import { loadScores, addScore, clearScores } from "./publice/scoreStorage.jsx";

export default function App() {
  const [name, setName] = useState(localStorage.getItem("snake_name") || "PLAYER");
  const [records, setRecords] = useState(loadScores());
  const [open, setOpen] = useState(true); // 보드 항상 노출하려면 true 유지

  const fmtMs = (ms) => {
    const s = Math.floor(ms/1000), m = Math.floor(s/60), ss = s%60;
    return `${m}:${String(ss).padStart(2,"0")}`;
  };

  const handleGameOver = ({ score, durationMs, when }) => {
    const rec = { name: (name||"PLAYER").toUpperCase(), score, durationMs, when };
    const next = addScore(rec);
    setRecords(next);
  };

  const handleNameChange = (v) => {
    setName(v);
    localStorage.setItem("snake_name", v);
  };

  return (
    <div style={{ padding:16, display:"flex", flexDirection:"column", alignItems:"center" }}>
      <SnakeGame onGameOver={handleGameOver} />
      <Scoreboard
        open={open}
        records={records}
        name={name}
        onNameChange={handleNameChange}
        onClear={() => { clearScores(); setRecords([]); }}
        fmtMs={fmtMs}
      />
    </div>
  );
}