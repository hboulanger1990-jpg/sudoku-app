import type { CellState } from "../sudoku/types";
import { Cell } from "./Cell";

interface BoardProps {
  cells: CellState[];
  solution: number[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

function rowOf(i: number) {
  return Math.floor(i / 9);
}
function colOf(i: number) {
  return i % 9;
}
function boxOf(i: number) {
  return Math.floor(rowOf(i) / 3) * 3 + Math.floor(colOf(i) / 3);
}

export function Board({ cells, solution, selectedIndex, onSelect }: BoardProps) {
  const selectedValue = selectedIndex !== null ? cells[selectedIndex].value : 0;

  return (
    <div className="board" role="grid" aria-label="Sudoku board">
      {cells.map((cell, i) => {
        const isSelected = i === selectedIndex;
        const isPeer =
          selectedIndex !== null &&
          !isSelected &&
          (rowOf(i) === rowOf(selectedIndex) ||
            colOf(i) === colOf(selectedIndex) ||
            boxOf(i) === boxOf(selectedIndex));
        const isSameValue = selectedValue !== 0 && !isSelected && cell.value === selectedValue;
        const isWrong = !cell.isGiven && cell.value !== 0 && cell.value !== solution[i];
        return (
          <Cell
            key={i}
            index={i}
            cell={cell}
            isSelected={isSelected}
            isPeer={isPeer}
            isSameValue={isSameValue}
            isWrong={isWrong}
            onSelect={onSelect}
          />
        );
      })}
    </div>
  );
}
