import type { Difficulty } from "../sudoku/generator";

interface ToolbarProps {
  difficulty: Difficulty;
  elapsedMs: number;
  mistakes: number;
  isPaused: boolean;
  isNoteMode: boolean;
  onNewGame: (difficulty: Difficulty) => void;
  onTogglePause: () => void;
  onToggleNoteMode: () => void;
  onHint: () => void;
}

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "易 — EASY",
  medium: "中 — MEDIUM",
  hard: "難 — HARD",
};

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function Toolbar({
  difficulty,
  elapsedMs,
  mistakes,
  isPaused,
  isNoteMode,
  onNewGame,
  onTogglePause,
  onToggleNoteMode,
  onHint,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <div className="toolbar__row toolbar__row--difficulty">
        {(Object.keys(DIFFICULTY_LABEL) as Difficulty[]).map((d) => (
          <button
            key={d}
            type="button"
            className={`chip ${d === difficulty ? "chip--active" : ""}`}
            onClick={() => onNewGame(d)}
          >
            {DIFFICULTY_LABEL[d]}
          </button>
        ))}
      </div>

      <div className="toolbar__row toolbar__row--status">
        <div className="stat">
          <span className="stat__label">TIME</span>
          <span className="stat__value stat__value--mono">{isPaused ? "‑‑:‑‑" : formatTime(elapsedMs)}</span>
        </div>
        <div className="stat">
          <span className="stat__label">MISTAKES</span>
          <span className="stat__value stat__value--mono">{mistakes}</span>
        </div>
        <div className="toolbar__actions">
          <button type="button" className="icon-btn" onClick={onTogglePause} aria-label="pause">
            {isPaused ? "再開" : "一時停止"}
          </button>
          <button
            type="button"
            className={`icon-btn ${isNoteMode ? "icon-btn--active" : ""}`}
            onClick={onToggleNoteMode}
            aria-label="note mode"
          >
            メモ
          </button>
          <button type="button" className="icon-btn" onClick={onHint} aria-label="hint">
            ヒント
          </button>
        </div>
      </div>
    </div>
  );
}
