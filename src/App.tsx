import { useEffect, useRef, useState } from "react";
import { Board } from "./components/Board";
import { NumberPad } from "./components/NumberPad";
import { Toolbar } from "./components/Toolbar";
import { useSudoku } from "./hooks/useSudoku";
import "./App.css";

function formatTime(ms: number): string {
  const m = Math.floor(ms / 60000)
    .toString()
    .padStart(2, "0");
  const s = Math.floor((ms % 60000) / 1000)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export default function App() {
  const {
    state,
    startNewGame,
    resetPuzzle,
    startTimer,
    selectCell,
    inputNumber,
    clearCell,
    toggleNoteMode,
    togglePause,
    requestHint,
    autoComplete,
    undo,
    redo,
    canUndo,
    canRedo,
    hintIndex,
    hintRevealed,
  } = useSudoku();

  // 盤面のサイズはCSSのaspect-ratio任せにせず、実際に使える余白をJSで測って
  // 正方形のpx値を直接指定する（ブラウザ・画面サイズによる崩れを防ぐため）
  const boardWrapRef = useRef<HTMLDivElement>(null);
  const [boardSize, setBoardSize] = useState(320);

  useEffect(() => {
    const el = boardWrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const size = Math.floor(Math.min(width, height));
        if (size > 0) setBoardSize(size);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key >= "1" && e.key <= "9") {
        inputNumber(Number(e.key));
      } else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") {
        clearCell();
      } else if (e.key === "n" || e.key === "N") {
        toggleNoteMode();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [inputNumber, clearCell, toggleNoteMode]);

  const showStartOrPauseOverlay = !state.isComplete && (!state.hasStarted || state.isPaused);

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__mark" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="app__title-block">
          <p className="app__eyebrow">FIG. 81 — LOGIC GRID</p>
          <h1 className="app__title">Blueprint Sudoku</h1>
        </div>
      </header>

      <main className="app__main">
        <Toolbar
          difficulty={state.difficulty}
          elapsedMs={state.elapsedMs}
          mistakes={state.mistakes}
          isPaused={state.isPaused}
          hasStarted={state.hasStarted}
          isNoteMode={state.isNoteMode}
          canUndo={canUndo}
          canRedo={canRedo}
          onNewGame={startNewGame}
          onTogglePause={togglePause}
          onToggleNoteMode={toggleNoteMode}
          onHint={requestHint}
          onClear={clearCell}
          onUndo={undo}
          onRedo={redo}
          onAutoComplete={autoComplete}
          onResetPuzzle={resetPuzzle}
        />

        <div className="app__board-wrap" ref={boardWrapRef}>
          {showStartOrPauseOverlay && (
            <div className="pause-overlay">
              <button
                type="button"
                className="chip chip--active"
                onClick={state.hasStarted ? togglePause : startTimer}
              >
                {state.hasStarted ? "再開する" : "スタート"}
              </button>
            </div>
          )}

          {state.isComplete && (
            <div className="complete-overlay" role="status">
              <p className="complete-overlay__title">COMPLETE — 完成！</p>
              <p className="complete-overlay__meta">
                {formatTime(state.elapsedMs)} ・ mistakes {state.mistakes}
              </p>
              <button
                type="button"
                className="chip chip--active"
                onClick={() => startNewGame(state.difficulty)}
              >
                次の問題へ
              </button>
            </div>
          )}

          <Board
            cells={state.cells}
            solution={state.solution}
            selectedIndex={state.selectedIndex}
            hintIndex={hintIndex}
            hintRevealed={hintRevealed}
            onSelect={selectCell}
            style={{ width: boardSize, height: boardSize }}
          />
        </div>

        <NumberPad onInput={inputNumber} />
      </main>
    </div>
  );
}
