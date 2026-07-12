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
function boxIndexOf(i: number) {
  const r = rowOf(i);
  const c = colOf(i);
  return Math.floor(r / BOX) * BOX + Math.floor(c / BOX);
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
// 難易度判定用: 人間向けロジック
// Naked/Hidden Single・Naked/Hidden Pair・Pointing/Claiming（ブロック内消去）・X-Wing
// までの「バックトラッキングなしで説明できる」テクニックだけで解けるかを判定する。
// これで解けない盤面は、フォーシングチェーンのような上級者向けの試行連鎖が必須の
// 難問と判断し、生成時に弾く（易しくする）対象にする。
// ─────────────────────────────────────────────

const ROWS: number[][] = Array.from({ length: SIZE }, (_, r) =>
  Array.from({ length: SIZE }, (_, c) => r * SIZE + c)
);
const COLS: number[][] = Array.from({ length: SIZE }, (_, c) =>
  Array.from({ length: SIZE }, (_, r) => r * SIZE + c)
);
const BOXES: number[][] = Array.from({ length: SIZE }, (_, b) => {
  const br = Math.floor(b / BOX) * BOX;
  const bc = (b % BOX) * BOX;
  const cells: number[] = [];
  for (let rr = br; rr < br + BOX; rr++) {
    for (let cc = bc; cc < bc + BOX; cc++) {
      cells.push(rr * SIZE + cc);
    }
  }
  return cells;
});
const UNITS: number[][] = [...ROWS, ...COLS, ...BOXES];

function computeCandidates(g: Grid): (Set<number> | null)[] {
  const cand: (Set<number> | null)[] = new Array(81).fill(null);
  for (let i = 0; i < 81; i++) {
    if (g[i] !== 0) continue;
    const s = new Set<number>();
    for (let v = 1; v <= 9; v++) {
      if (isSafe(g, i, v)) s.add(v);
    }
    cand[i] = s;
  }
  return cand;
}

function setsEqual(a: Set<number>, b: Set<number>): boolean {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

/**
 * Naked/Hidden Single・Naked/Hidden Pair・Pointing/Claiming・X-Wing
 * だけを使って、盤面を最後まで解けるかどうかを判定する。
 *
 * バックトラッキング（仮置き・試行錯誤、フォーシングチェーン等）は一切行わない。
 * 一意解チェック(countSolutions)と違って全探索をしないため、比較的軽い処理。
 */
export function isHumanSolvable(grid: Grid): boolean {
  const g = cloneGrid(grid);
  let cand = computeCandidates(g);

  let guard = 0;
  while (true) {
    guard++;
    if (guard > 500) return false; // 安全装置（通常ここには到達しない）

    // 矛盾チェック
    for (let i = 0; i < 81; i++) {
      if (g[i] === 0 && cand[i]!.size === 0) return false;
    }

    // Naked Single
    let placed = false;
    for (let i = 0; i < 81; i++) {
      if (g[i] === 0 && cand[i]!.size === 1) {
        g[i] = [...cand[i]!][0];
        placed = true;
      }
    }
    if (placed) {
      cand = computeCandidates(g);
      continue;
    }

    // Hidden Single
    for (const unit of UNITS) {
      for (let v = 1; v <= 9; v++) {
        const spots = unit.filter((i) => g[i] === 0 && cand[i]!.has(v));
        if (spots.length === 1) {
          g[spots[0]] = v;
          placed = true;
        }
      }
    }
    if (placed) {
      cand = computeCandidates(g);
      continue;
    }

    // ここから先は「配置」はせず、候補を絞るだけのテクニック
    let eliminated = false;

    // Naked Pair
    for (const unit of UNITS) {
      const empties = unit.filter((i) => g[i] === 0);
      for (let a = 0; a < empties.length; a++) {
        for (let b = a + 1; b < empties.length; b++) {
          const ia = empties[a];
          const ib = empties[b];
          const ca = cand[ia]!;
          const cb = cand[ib]!;
          if (ca.size === 2 && setsEqual(ca, cb)) {
            for (const i of empties) {
              if (i === ia || i === ib) continue;
              for (const v of ca) {
                if (cand[i]!.delete(v)) eliminated = true;
              }
            }
          }
        }
      }
    }

    // Hidden Pair
    for (const unit of UNITS) {
      const empties = unit.filter((i) => g[i] === 0);
      for (let d1 = 1; d1 <= 9; d1++) {
        for (let d2 = d1 + 1; d2 <= 9; d2++) {
          const cells1 = empties.filter((i) => cand[i]!.has(d1));
          const cells2 = empties.filter((i) => cand[i]!.has(d2));
          if (
            cells1.length === 2 &&
            cells2.length === 2 &&
            cells1[0] === cells2[0] &&
            cells1[1] === cells2[1]
          ) {
            for (const i of cells1) {
              const before = cand[i]!.size;
              cand[i] = new Set([d1, d2]);
              if (cand[i]!.size < before) eliminated = true;
            }
          }
        }
      }
    }

    // Pointing（箱内 → 行/列への絞り込み）
    for (const box of BOXES) {
      for (let v = 1; v <= 9; v++) {
        const spots = box.filter((i) => g[i] === 0 && cand[i]!.has(v));
        if (spots.length >= 2) {
          const rows = new Set(spots.map(rowOf));
          const cols = new Set(spots.map(colOf));
          if (rows.size === 1) {
            const r = [...rows][0];
            for (const i of ROWS[r]) {
              if (!box.includes(i) && g[i] === 0 && cand[i]!.delete(v)) eliminated = true;
            }
          }
          if (cols.size === 1) {
            const c = [...cols][0];
            for (const i of COLS[c]) {
              if (!box.includes(i) && g[i] === 0 && cand[i]!.delete(v)) eliminated = true;
            }
          }
        }
      }
    }

    // Claiming（行/列 → 箱への絞り込み）
    for (const line of [...ROWS, ...COLS]) {
      for (let v = 1; v <= 9; v++) {
        const spots = line.filter((i) => g[i] === 0 && cand[i]!.has(v));
        if (spots.length >= 2) {
          const boxIds = new Set(spots.map(boxIndexOf));
          if (boxIds.size === 1) {
            const boxCells = BOXES[[...boxIds][0]];
            for (const i of boxCells) {
              if (!line.includes(i) && g[i] === 0 && cand[i]!.delete(v)) eliminated = true;
            }
          }
        }
      }
    }

    // X-Wing（行→列、列→行の両方向）
    for (let v = 1; v <= 9; v++) {
      const rowSpots = new Map<number, number[]>();
      for (let r = 0; r < 9; r++) {
        const cols = ROWS[r].filter((i) => g[i] === 0 && cand[i]!.has(v)).map(colOf);
        if (cols.length === 2) rowSpots.set(r, cols);
      }
      const rowKeys = [...rowSpots.keys()];
      for (let a = 0; a < rowKeys.length; a++) {
        for (let b = a + 1; b < rowKeys.length; b++) {
          const [c1, c2] = rowSpots.get(rowKeys[a])!;
          const other = rowSpots.get(rowKeys[b])!;
          if (other[0] === c1 && other[1] === c2) {
            for (let r = 0; r < 9; r++) {
              if (r === rowKeys[a] || r === rowKeys[b]) continue;
              for (const c of [c1, c2]) {
                const i = r * SIZE + c;
                if (g[i] === 0 && cand[i]!.delete(v)) eliminated = true;
              }
            }
          }
        }
      }

      const colSpots = new Map<number, number[]>();
      for (let c = 0; c < 9; c++) {
        const rows = COLS[c].filter((i) => g[i] === 0 && cand[i]!.has(v)).map(rowOf);
        if (rows.length === 2) colSpots.set(c, rows);
      }
      const colKeys = [...colSpots.keys()];
      for (let a = 0; a < colKeys.length; a++) {
        for (let b = a + 1; b < colKeys.length; b++) {
          const [r1, r2] = colSpots.get(colKeys[a])!;
          const other = colSpots.get(colKeys[b])!;
          if (other[0] === r1 && other[1] === r2) {
            for (let c = 0; c < 9; c++) {
              if (c === colKeys[a] || c === colKeys[b]) continue;
              for (const r of [r1, r2]) {
                const i = r * SIZE + c;
                if (g[i] === 0 && cand[i]!.delete(v)) eliminated = true;
              }
            }
          }
        }
      }
    }

    if (eliminated) continue; // 候補が減ったので、また Single が無いか見直す

    break; // これ以上は確定的には進められない
  }

  return g.every((v) => v !== 0);
}
