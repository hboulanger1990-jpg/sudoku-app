import type { CellState } from "./types";

function buildUnits(): number[][] {
  const units: number[][] = [];
  for (let r = 0; r < 9; r++) {
    units.push(Array.from({ length: 9 }, (_, c) => r * 9 + c));
  }
  for (let c = 0; c < 9; c++) {
    units.push(Array.from({ length: 9 }, (_, r) => r * 9 + c));
  }
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const box: number[] = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          box.push((br * 3 + r) * 9 + (bc * 3 + c));
        }
      }
      units.push(box);
    }
  }
  return units;
}

const UNITS = buildUnits();

function candidatesFor(cells: CellState[], index: number): number[] {
  const row = Math.floor(index / 9);
  const col = index % 9;
  const box = Math.floor(row / 3) * 3 + Math.floor(col / 3);
  const used = new Set<number>();
  for (let j = 0; j < 81; j++) {
    if (cells[j].value === 0) continue;
    const r = Math.floor(j / 9);
    const c = j % 9;
    const b = Math.floor(r / 3) * 3 + Math.floor(c / 3);
    if (r === row || c === col || b === box) used.add(cells[j].value);
  }
  const result: number[] = [];
  for (let n = 1; n <= 9; n++) if (!used.has(n)) result.push(n);
  return result;
}

/**
 * 「次の一手」となるマスのインデックスを1つ探す。
 * 1. 候補が1つしかないマス（ネイキッドシングル）
 * 2. ある数字が、行・列・箱のいずれかで1マスにしか入れない（ヒドゥンシングル）
 * 3. 上記が見つからなければ、現時点で候補数が一番少ない空きマスにフォールバック
 *
 * 実際に埋める数字は呼び出し側で solution[idx] を使う
 * （一意解パズルなので、どの経路で見つけたマスでも正解は必ず一致する）
 */
export function findNextMove(cells: CellState[]): number | null {
  const emptyIndices: number[] = [];
  for (let i = 0; i < cells.length; i++) if (cells[i].value === 0) emptyIndices.push(i);
  if (emptyIndices.length === 0) return null;

  const candidateMap = new Map<number, number[]>();
  for (const i of emptyIndices) candidateMap.set(i, candidatesFor(cells, i));

  // 1. ネイキッドシングル
  for (const i of emptyIndices) {
    if ((candidateMap.get(i) ?? []).length === 1) return i;
  }

  // 2. ヒドゥンシングル
  for (const unit of UNITS) {
    for (let n = 1; n <= 9; n++) {
      const cellsForDigit = unit.filter(
        (i) => cells[i].value === 0 && (candidateMap.get(i) ?? []).includes(n)
      );
      if (cellsForDigit.length === 1) return cellsForDigit[0];
    }
  }

  // 3. フォールバック：候補数が一番少ないマス
  let best: number | null = null;
  let bestCount = 10;
  for (const i of emptyIndices) {
    const count = (candidateMap.get(i) ?? []).length;
    if (count > 0 && count < bestCount) {
      best = i;
      bestCount = count;
    }
  }
  return best ?? emptyIndices[0];
}
