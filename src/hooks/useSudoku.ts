import { useCallback, useEffect, useRef, useState } from "react";
import { generatePuzzle } from "../sudoku/generator";
import type { Difficulty } from "../sudoku/generator";
import type { CellState, GameState } from "../sudoku/types";

const STORAGE_KEY = "blueprint-sudoku:save-v1";

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
  const tickRef = useRef<number | null>(null);

  // 経過時間タイマー
  useEffect(() => {
    if (state.isPaused || state.isComplete) return;
    tickRef.current = window.setInterval(() => {
      setState((s) => ({ ...s, elapsedMs: s.elapsedMs + 1000 }));
    }, 1000);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [state.isPaused, state.isComplete]);

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
  }, []);

  const selectCell = useCallback((index: number) => {
    setState((s) => ({ ...s, selectedIndex: index }));
  }, []);

  const inputNumber = useCallback((num: number) => {
    setState((s) => {
      if (s.selectedIndex === null || s.isComplete) return s;
      const idx = s.selectedIndex;
      const cell = s.cells[idx];
      if (cell.isGiven) return s;

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
  }, []);

  const clearCell = useCallback(() => {
    setState((s) => {
      if (s.selectedIndex === null) return s;
      const cell = s.cells[s.selectedIndex];
      if (cell.isGiven) return s;
      const cells = s.cells.slice();
      cells[s.selectedIndex] = { ...cell, value: 0, notes: new Set() };
      return { ...s, cells };
    });
  }, []);

  const toggleNoteMode = useCallback(() => {
    setState((s) => ({ ...s, isNoteMode: !s.isNoteMode }));
  }, []);

  const togglePause = useCallback(() => {
    setState((s) => ({ ...s, isPaused: !s.isPaused }));
  }, []);

  const requestHint = useCallback(() => {
    setState((s) => {
      if (s.selectedIndex === null || s.isComplete) return s;
      const idx = s.selectedIndex;
      if (s.cells[idx].isGiven) return s;
      const cells = s.cells.slice();
      cells[idx] = { value: s.solution[idx], isGiven: false, notes: new Set() };
      const isComplete = cells.every((c, i) => c.value === s.solution[i]);
      return { ...s, cells, isComplete };
    });
  }, []);

  return {
    state,
    startNewGame,
    selectCell,
    inputNumber,
    clearCell,
    toggleNoteMode,
    togglePause,
    requestHint,
  };
}
