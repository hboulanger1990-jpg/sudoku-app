import type { Grid } from "./solver";
import { cloneGrid, countSolutions, generateSolvedGrid, isHumanSolvable } from "./solver";

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
 * 3. Naked Single / Hidden Single だけで最後まで解けるか確認し、
 *    解けない（＝フォーシングチェーン級の難問になっている）場合は
 *    直近に空けたマスから順に埋め戻して、無理のない難易度まで調整する
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
  // 実際に空けたマスを、空けた順番のまま記録しておく
  // （難易度が高すぎた場合、直近に空けたマスから埋め戻すために使う）
  const removedIndices: number[] = [];

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
    removedIndices.push(index);
  }

  // 難易度チェック：Naked Single / Hidden Singleだけで最後まで解けるか確認する。
  // 解けない場合は、直近に空けたマスから順に埋め戻して易しくする。
  // isHumanSolvableはバックトラッキングをしないので、この調整自体は軽い処理。
  while (!isHumanSolvable(puzzle) && removedIndices.length > 0) {
    const restoreIndex = removedIndices.pop()!;
    puzzle[restoreIndex] = solution[restoreIndex];
    blanks--;
  }

  return {
    puzzle,
    solution,
    difficulty,
    clues: 81 - blanks,
  };
}
