import { useCallback, useEffect, useRef, useState } from "react";
import { generatePuzzle } from "../sudoku/generator";
import type { Difficulty } from "../sudoku/generator";
import { findNextMove } from "../sudoku/hint";
import type { CellState, GameState } from "../sudoku/types";

const STORAGE_KEY = "blueprint-sudoku:save-v1";

interface Snapshot {
  cells: CellState[];
  mistakes: number;
  isComplete: boolean;
}

function snapshotOf(s: GameState): Snapshot {
  return { cells: s.cells, mistakes: s.mistakes, isComplete: s.isComplete };
}

function buildCells(puzzle: number[]): CellState[] {
  return puzzle.map((v) => ({
    value: v,
    isGiven: v !== 0,
    notes: new Set<number>(),
  }));
}

function newGame(difficulty: Difficulty): GameState {
  const { puzzle, solution } = generatePuzzle(difficulty);
  return {
    cells: buildCells(puzzle),
    solution,
    difficulty,
    selectedIndex: null,
    isNoteMode: false,
    startedAt: Date.now(),
    elapsedMs: 0,
    isPaused: false,
    hasStarted: false,
    isComplete: false,
    mistakes: 0,
  };
}

interface SavedShape {
  values: number[];
  givens: boolean[];
  notes: number[][];
  solution: number[];
  difficulty: Difficulty;
  elapsedMs: number;
  mistakes: number;
  isComplete: boolean;
}

function serialize(state: GameState): SavedShape {
  return {
    values: state.cells.map((c) => c.value),
    givens: state.cells.map((c) => c.isGiven),
    notes: state.cells.map((c) => Array.from(c.notes)),
    solution: state.solution,
    difficulty: state.difficulty,
    elapsedMs: state.elapsedMs,
    mistakes: state.mistakes,
    isComplete: state.isComplete,
  };
}

function deserialize(raw: SavedShape): GameState {
  return {
    cells: raw.values.map((v, i) => ({
      value: v,
      isGiven: raw.givens[i],
      notes: new Set(raw.notes[i]),
    })),
    solution: raw.solution,
    difficulty: raw.difficulty,
    selectedIndex: null,
    isNoteMode: false,
    startedAt: Date.now(),
    elapsedMs: raw.elapsedMs,
    isPaused: false,
    // 保存データは「以前に一度スタート済み」のゲームなので、
    // 再読み込み時にスタート画面を出さずそのまま再開する
    hasStarted: true,
    isComplete: raw.isComplete,
    mistakes: raw.mistakes,
  };
}

function loadSaved(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return deserialize(JSON.parse(raw) as SavedShape);
  } catch {
    return null;
  }
}

export function useSudoku() {
  const [state, setState] = useState<GameState>(() => loadSaved() ?? newGame("easy"));
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [future, setFuture] = useState<Snapshot[]>([]);
  // ヒントで示した「次の一手」マスと、数字を明かしたかどうか
  const [hintIndex, setHintIndex] = useState<number | null>(null);
  const [hintRevealed, setHintRevealed] = useState(false);
  const tickRef = useRef<number | null>(null);

  const clearHint = useCallback(() => {
    setHintIndex(null);
    setHintRevealed(false);
  }, []);

  // 経過時間タイマー：スタート前・一時停止中・完成後は動かさない
  useEffect(() => {
    if (!state.hasStarted || state.isPaused || state.isComplete) return;
    tickRef.current = window.setInterval(() => {
      setState((s) => ({ ...s, elapsedMs: s.elapsedMs + 1000 }));
    }, 1000);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [state.isPaused, state.isComplete, state.hasStarted]);

  // 自動保存
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serialize(state)));
    } catch {
      /* 保存失敗は致命的でないので無視 */
    }
  }, [state]);

  const startNewGame = useCallback((difficulty: Difficulty) => {
    setState(newGame(difficulty));
    setHistory([]);
    setFuture([]);
    clearHint();
  }, [clearHint]);

  // 同じ問題を最初からやり直す（時間・ミス数も0から）
  const resetPuzzle = useCallback(() => {
    setState((s) => ({
      ...s,
      cells: s.cells.map((c) => (c.isGiven ? c : { value: 0, isGiven: false, notes: new Set<number>() })),
      selectedIndex: null,
      isNoteMode: false,
      startedAt: Date.now(),
      elapsedMs: 0,
      isPaused: false,
      hasStarted: false,
      isComplete: false,
      mistakes: 0,
    }));
    setHistory([]);
    setFuture([]);
    clearHint();
  }, [clearHint]);

  // 「スタート」ボタン：タイマーを動かし始める
  const startTimer = useCallback(() => {
    setState((s) => (s.hasStarted ? s : { ...s, hasStarted: true }));
  }, []);

  const selectCell = useCallback(
    (index: number) => {
      if (index !== hintIndex) clearHint();
      setState((s) => ({ ...s, selectedIndex: index }));
    },
    [hintIndex, clearHint]
  );

  const inputNumber = useCallback(
    (num: number) => {
      clearHint();
      setState((s) => {
        if (s.selectedIndex === null || s.isComplete || !s.hasStarted || s.isPaused) return s;
        const idx = s.selectedIndex;
        const cell = s.cells[idx];
        if (cell.isGiven) return s;

        setHistory((h) => [...h, snapshotOf(s)]);
        setFuture([]);

        const cells = s.cells.slice();

        if (s.isNoteMode) {
          const notes = new Set(cell.notes);
          if (notes.has(num)) notes.delete(num);
          else notes.add(num);
          cells[idx] = { ...cell, notes };
          return { ...s, cells };
        }

        const isCorrect = s.solution[idx] === num;
        const mistakes = s.mistakes + (isCorrect || num === 0 ? 0 : 1);
        cells[idx] = { ...cell, value: num, notes: new Set() };

        const isComplete = cells.every((c, i) => c.value === s.solution[i]);

        return { ...s, cells, mistakes, isComplete };
      });
    },
    [clearHint]
  );

  const clearCell = useCallback(() => {
    clearHint();
    setState((s) => {
      if (s.selectedIndex === null || s.isComplete || !s.hasStarted || s.isPaused) return s;
      const cell = s.cells[s.selectedIndex];
      if (cell.isGiven) return s;

      setHistory((h) => [...h, snapshotOf(s)]);
      setFuture([]);

      const cells = s.cells.slice();
      cells[s.selectedIndex] = { ...cell, value: 0, notes: new Set() };
      return { ...s, cells };
    });
  }, [clearHint]);

  const toggleNoteMode = useCallback(() => {
    setState((s) => ({ ...s, isNoteMode: !s.isNoteMode }));
  }, []);

  const togglePause = useCallback(() => {
    setState((s) => (s.hasStarted ? { ...s, isPaused: !s.isPaused } : s));
  }, []);

  // ヒント：1回目は「次の一手」マスを光らせるだけ、2回目でその数字を明かす
  const requestHint = useCallback(() => {
    if (state.isComplete || !state.hasStarted || state.isPaused) return;

    if (hintIndex !== null && state.cells[hintIndex].value === 0 && !hintRevealed) {
      setHintRevealed(true);
      return;
    }

    const idx = findNextMove(state.cells);
    if (idx === null) return;
    setHintIndex(idx);
    setHintRevealed(false);
    setState((s) => ({ ...s, selectedIndex: idx }));
  }, [state, hintIndex, hintRevealed]);

  // 残りのマスを解答で自動的に埋めて仕上げる（イージーなどでサクッと終わらせたい時用）
  const autoComplete = useCallback(() => {
    clearHint();
    setState((s) => {
      if (s.isComplete || !s.hasStarted) return s;

      setHistory((h) => [...h, snapshotOf(s)]);
      setFuture([]);

      const cells = s.cells.map((c, i) =>
        c.isGiven ? c : { value: s.solution[i], isGiven: false, notes: new Set<number>() }
      );
      return { ...s, cells, isComplete: true, selectedIndex: null };
    });
  }, [clearHint]);

  const undo = useCallback(() => {
    if (history.length === 0) return;
    clearHint();
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setFuture((f) => [...f, snapshotOf(state)]);
    setState((s) => ({
      ...s,
      cells: prev.cells,
      mistakes: prev.mistakes,
      isComplete: prev.isComplete,
      selectedIndex: null,
    }));
  }, [history, state, clearHint]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    clearHint();
    const next = future[future.length - 1];
    setFuture((f) => f.slice(0, -1));
    setHistory((h) => [...h, snapshotOf(state)]);
    setState((s) => ({
      ...s,
      cells: next.cells,
      mistakes: next.mistakes,
      isComplete: next.isComplete,
      selectedIndex: null,
    }));
  }, [future, state, clearHint]);

  return {
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
    canUndo: history.length > 0,
    canRedo: future.length > 0,
    hintIndex,
    hintRevealed,
  };
}
