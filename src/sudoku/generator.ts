import type { Grid } from "./solver";
import { cloneGrid, countSolutions, generateSolvedGrid } from "./solver";

export type Difficulty = "easy" | "medium" | "hard";

// 難易度ごとの目標空きマス数（多いほど難しい）
const TARGET_BLANKS: Record<Difficulty, number> = {
  easy: 36, // 45ヒント
  medium: 46, // 35ヒント
  hard: 54, // 27ヒント
};

export interface Puzzle {
  puzzle: Grid; // 0=空マス
  solution: Grid;
  difficulty: Difficulty;
  clues: number;
}

/**
 * 難易度に応じた数独の問題を1つ生成する。
 * 1. ランダムな完成盤を作る
 * 2. マスをランダムな順にひとつずつ空け、解が一意でなくなる直前まで削る
 */
export function generatePuzzle(difficulty: Difficulty, rng: () => number = Math.random): Puzzle {
  const solution = generateSolvedGrid(rng);
  const puzzle = cloneGrid(solution);

  const order = Array.from({ length: 81 }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  const targetBlanks = TARGET_BLANKS[difficulty];
  let blanks = 0;

  for (const index of order) {
    if (blanks >= targetBlanks) break;
    const backup = puzzle[index];
    puzzle[index] = 0;
    // 2件以上解があれば一意でない → 元に戻す
    if (countSolutions(puzzle, 2) !== 1) {
      puzzle[index] = backup;
      continue;
    }
    blanks++;
  }

  return {
    puzzle,
    solution,
    difficulty,
    clues: 81 - blanks,
  };
}
