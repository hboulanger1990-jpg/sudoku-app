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
