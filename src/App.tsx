import { useEffect } from "react";
import { Board } from "./components/Board";
import { NumberPad } from "./components/NumberPad";
import { Toolbar } from "./components/Toolbar";
import { useSudoku } from "./hooks/useSudoku";
import "./App.css";

function computeRemaining(cells: { value: number }[]): number[] {
  const counts = new Array(10).fill(9);
  for (const c of cells) {
    if (c.value !== 0) counts[c.value]--;
  }
  return counts;
}

export default function App() {
  const {
    state,
    startNewGame,
    selectCell,
    inputNumber,
    clearCell,
    toggleNoteMode,
    togglePause,
    requestHint,
  } = useSudoku();

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

  const remaining = computeRemaining(state.cells);

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
          isNoteMode={state.isNoteMode}
          onNewGame={startNewGame}
          onTogglePause={togglePause}
          onToggleNoteMode={toggleNoteMode}
          onHint={requestHint}
        />

        <div className="app__board-wrap">
          {state.isPaused && !state.isComplete && (
            <div className="pause-overlay">
              <button type="button" className="chip chip--active" onClick={togglePause}>
                再開する
              </button>
            </div>
          )}
          <Board
            cells={state.cells}
            solution={state.solution}
            selectedIndex={state.selectedIndex}
            onSelect={selectCell}
          />
        </div>

        <NumberPad onInput={inputNumber} onClear={clearCell} remainingCounts={remaining} />

        {state.isComplete && (
          <div className="complete-banner" role="status">
            <p className="complete-banner__title">COMPLETE — 完成</p>
            <p className="complete-banner__meta">
              {Math.floor(state.elapsedMs / 60000)
                .toString()
                .padStart(2, "0")}
              :
              {Math.floor((state.elapsedMs % 60000) / 1000)
                .toString()
                .padStart(2, "0")}{" "}
              ・ mistakes {state.mistakes}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
