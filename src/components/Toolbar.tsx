import type { Difficulty } from "../sudoku/generator";

interface ToolbarProps {
  difficulty: Difficulty;
  elapsedMs: number;
  mistakes: number;
  isPaused: boolean;
  hasStarted: boolean;
  isNoteMode: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onNewGame: (difficulty: Difficulty) => void;
  onTogglePause: () => void;
  onToggleNoteMode: () => void;
  onHint: () => void;
  onClear: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onAutoComplete: () => void;
  onResetPuzzle: () => void;
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

interface ActionButtonProps {
  icon: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}

function ActionButton({ icon, label, onClick, disabled, active }: ActionButtonProps) {
  return (
    <button
      type="button"
      className={`action-btn ${active ? "action-btn--active" : ""}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
    >
      <span className="action-btn__icon" aria-hidden="true">
        {icon}
      </span>
      <span className="action-btn__label">{label}</span>
    </button>
  );
}

export function Toolbar({
  difficulty,
  elapsedMs,
  mistakes,
  isPaused,
  hasStarted,
  isNoteMode,
  canUndo,
  canRedo,
  onNewGame,
  onTogglePause,
  onToggleNoteMode,
  onHint,
  onClear,
  onUndo,
  onRedo,
  onAutoComplete,
  onResetPuzzle,
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
          <span className="stat__value stat__value--mono">
            {isPaused || !hasStarted ? "‑‑:‑‑" : formatTime(elapsedMs)}
          </span>
        </div>
        <div className="stat">
          <span className="stat__label">MISTAKES</span>
          <span className="stat__value stat__value--mono">{mistakes}</span>
        </div>
        <div className="toolbar__actions">
          <button
            type="button"
            className="icon-btn"
            onClick={onTogglePause}
            aria-label="pause"
            disabled={!hasStarted}
          >
            {isPaused ? "再開" : "一時停止"}
          </button>
        </div>
      </div>

      <div className="action-grid">
        <ActionButton icon="↶" label="元に戻す" onClick={onUndo} disabled={!canUndo} />
        <ActionButton icon="↷" label="やり直す" onClick={onRedo} disabled={!canRedo} />
        <ActionButton icon="⌫" label="消す" onClick={onClear} />
        <ActionButton icon="✎" label="メモ" onClick={onToggleNoteMode} active={isNoteMode} />
        <ActionButton icon="💡" label="ヒント" onClick={onHint} />
        <ActionButton icon="↺" label="最初から" onClick={onResetPuzzle} />
        <ActionButton icon="⚡" label="自動で仕上げ" onClick={onAutoComplete} />
      </div>
    </div>
  );
}
