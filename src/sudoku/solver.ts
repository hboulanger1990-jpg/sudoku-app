// 81マスの数独盤面を表す型。0は空マス。
export type Grid = number[]; // length 81, values 0-9

const SIZE = 9;
const BOX = 3;

export function cloneGrid(grid: Grid): Grid {
  return grid.slice();
}

function rowOf(i: number) {
  return Math.floor(i / SIZE);
}
function colOf(i: number) {
  return i % SIZE;
}

/** i番目のマスにvalueを置いて良いか（行・列・箱で重複しないか） */
export function isSafe(grid: Grid, i: number, value: number): boolean {
  const r = rowOf(i);
  const c = colOf(i);
  const br = Math.floor(r / BOX) * BOX;
  const bc = Math.floor(c / BOX) * BOX;

  for (let k = 0; k < SIZE; k++) {
    if (grid[r * SIZE + k] === value) return false; // 同じ行
    if (grid[k * SIZE + c] === value) return false; // 同じ列
  }
  for (let rr = br; rr < br + BOX; rr++) {
    for (let cc = bc; cc < bc + BOX; cc++) {
      if (grid[rr * SIZE + cc] === value) return false; // 同じ3x3箱
    }
  }
  return true;
}

function findEmptyMRV(grid: Grid): { index: number; candidates: number[] } | null {
  // MRV (最小残り値) ヒューリスティック: 候補数が最も少ないマスを選ぶことで探索を高速化
  let best = -1;
  let bestCandidates: number[] = [];
  for (let i = 0; i < 81; i++) {
    if (grid[i] !== 0) continue;
    const candidates: number[] = [];
    for (let v = 1; v <= 9; v++) {
      if (isSafe(grid, i, v)) candidates.push(v);
    }
    if (best === -1 || candidates.length < bestCandidates.length) {
      best = i;
      bestCandidates = candidates;
      if (candidates.length === 0) return { index: i, candidates: [] }; // 即座に行き止まり確定
      if (candidates.length === 1) break; // これ以上良い選択はない
    }
  }
  if (best === -1) return null; // 空きマスなし = 解けた
  return { index: best, candidates: bestCandidates };
}

/**
 * 解の個数を limit 件まで数える。
 * 一意性チェックでは limit=2 を渡し、2件見つかった時点で打ち切ることで高速化する。
 */
export function countSolutions(grid: Grid, limit = 2): number {
  let count = 0;

  function backtrack(g: Grid): boolean {
    const spot = findEmptyMRV(g);
    if (spot === null) {
      count++;
      return count >= limit; // limitに達したら探索を打ち切る合図
    }
    const { index, candidates } = spot;
    for (const v of candidates) {
      g[index] = v;
      const stop = backtrack(g);
      g[index] = 0;
      if (stop) return true;
    }
    return false;
  }

  backtrack(cloneGrid(grid));
  return count;
}

/** ランダムに完全に埋まった正解盤面を1つ生成する */
export function generateSolvedGrid(rng: () => number = Math.random): Grid {
  const grid: Grid = new Array(81).fill(0);

  function shuffle<T>(arr: T[]): T[] {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function backtrack(g: Grid): boolean {
    const spot = findEmptyMRV(g);
    if (spot === null) return true;
    const { index, candidates } = spot;
    const order = shuffle(candidates);
    for (const v of order) {
      g[index] = v;
      if (backtrack(g)) return true;
      g[index] = 0;
    }
    return false;
  }

  backtrack(grid);
  return grid;
}

export function solveGrid(grid: Grid): Grid | null {
  const g = cloneGrid(grid);
  function backtrack(gg: Grid): boolean {
    const spot = findEmptyMRV(gg);
    if (spot === null) return true;
    const { index, candidates } = spot;
    for (const v of candidates) {
      gg[index] = v;
      if (backtrack(gg)) return true;
      gg[index] = 0;
    }
    return false;
  }
  return backtrack(g) ? g : null;
}

// ─────────────────────────────────────────────
// 難易度判定用: 人間向けロジック（Naked Single / Hidden Single）
// ─────────────────────────────────────────────

/** 全27ユニット（行9・列9・箱9）を、マスのインデックス配列として持っておく */
const UNITS: number[][] = buildUnits();

function buildUnits(): number[][] {
  const units: number[][] = [];
  for (let r = 0; r < SIZE; r++) {
    units.push(Array.from({ length: SIZE }, (_, c) => r * SIZE + c));
  }
  for (let c = 0; c < SIZE; c++) {
    units.push(Array.from({ length: SIZE }, (_, r) => r * SIZE + c));
  }
  for (let br = 0; br < SIZE; br += BOX) {
    for (let bc = 0; bc < SIZE; bc += BOX) {
      const box: number[] = [];
      for (let rr = br; rr < br + BOX; rr++) {
        for (let cc = bc; cc < bc + BOX; cc++) {
          box.push(rr * SIZE + cc);
        }
      }
      units.push(box);
    }
  }
  return units;
}

function candidatesAt(grid: Grid, i: number): number[] {
  const candidates: number[] = [];
  for (let v = 1; v <= 9; v++) {
    if (isSafe(grid, i, v)) candidates.push(v);
  }
  return candidates;
}

/**
 * 「Naked Single」（そのマス自身の候補が1つだけ）と
 * 「Hidden Single」（そのユニット内でその数字が入れる場所がそこしかない）
 * だけを使って、盤面を最後まで解けるかどうかを判定する。
 *
 * バックトラッキング（仮置き・試行錯誤）は一切行わない、確定的な推論のみ。
 * これで最後まで解けない盤面は、フォーシングチェーンのような上級テクニックが
 * ないと解けない＝人間にはかなり難しい問題と判断できる。
 *
 * 一意解チェック(countSolutions)と違って全探索をしないため、非常に軽い処理。
 */
export function isHumanSolvable(grid: Grid): boolean {
  const g = cloneGrid(grid);

  while (true) {
    let progressed = false;

    // Naked Single
    for (let i = 0; i < 81; i++) {
      if (g[i] !== 0) continue;
      const candidates = candidatesAt(g, i);
      if (candidates.length === 0) return false; // 矛盾（本来起こらないはずだが念のため）
      if (candidates.length === 1) {
        g[i] = candidates[0];
        progressed = true;
      }
    }
    if (progressed) continue;

    // Hidden Single
    for (const unit of UNITS) {
      for (let v = 1; v <= 9; v++) {
        let spot = -1;
        let count = 0;
        for (const i of unit) {
          if (g[i] === 0 && isSafe(g, i, v)) {
            count++;
            spot = i;
            if (count > 1) break;
          }
        }
        if (count === 1) {
          g[spot] = v;
          progressed = true;
        }
      }
    }
    if (progressed) continue;

    break; // これ以上、確定的には進められない
  }

  return g.every((v) => v !== 0);
}
