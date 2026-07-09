import type { CellState } from "../sudoku/types";

interface CellProps {
  index: number;
  cell: CellState;
  isSelected: boolean;
  isPeer: boolean; // 同じ行・列・箱
  isSameValue: boolean; // 選択中セルと同じ数字
  isWrong: boolean;
  isHint: boolean; // 「次の一手」として光らせるマスか
  hintValue?: number; // ヒントを2回押して明かした数字（未確定のプレビュー表示）
  onSelect: (index: number) => void;
}

const NOTE_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export function Cell({
  index,
  cell,
  isSelected,
  isPeer,
  isSameValue,
  isWrong,
  isHint,
  hintValue,
  onSelect,
}: CellProps) {
  const row = Math.floor(index / 9);
  const col = index % 9;

  const classNames = ["cell"];
  if (isSelected) classNames.push("cell--selected");
  else if (isSameValue) classNames.push("cell--same-value");
  else if (isPeer) classNames.push("cell--peer");
  if (cell.isGiven) classNames.push("cell--given");
  if (isWrong) classNames.push("cell--wrong");
  if (isHint) classNames.push("cell--hint");
  if (col % 3 === 0) classNames.push("cell--box-left");
  if (row % 3 === 0) classNames.push("cell--box-top");
  if (col === 8) classNames.push("cell--edge-right");
  if (row === 8) classNames.push("cell--edge-bottom");

  return (
    <button
      type="button"
      className={classNames.join(" ")}
      onClick={() => onSelect(index)}
      aria-label={`row ${row + 1} column ${col + 1}${cell.value ? `, value ${cell.value}` : ", empty"}`}
    >
      {cell.value !== 0 ? (
        <span className="cell__value">{cell.value}</span>
      ) : hintValue !== undefined ? (
        <span className="cell__value cell__value--ghost">{hintValue}</span>
      ) : cell.notes.size > 0 ? (
        <span className="cell__notes">
          {NOTE_ORDER.map((n) => (
            <span key={n} className="cell__note">
              {cell.notes.has(n) ? n : ""}
            </span>
          ))}
        </span>
      ) : null}
    </button>
  );
}
