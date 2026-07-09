import type { Difficulty } from "./generator";

export interface CellState {
  value: number; // 0 = 空
  isGiven: boolean; // 最初から埋まっているヒントか
  notes: Set<number>; // メモ機能（候補数字）
}

export interface GameState {
  cells: CellState[]; // length 81
  solution: number[]; // length 81
  difficulty: Difficulty;
  selectedIndex: number | null;
  isNoteMode: boolean;
  startedAt: number; // epoch ms
  elapsedMs: number; // 一時停止/再開を考慮した積算時間
  isPaused: boolean;
  hasStarted: boolean; // スタートボタンを押してタイマーが動き出したか
  isComplete: boolean;
  mistakes: number;
}
