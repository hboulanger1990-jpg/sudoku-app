interface NumberPadProps {
  onInput: (num: number) => void;
  onClear: () => void;
  remainingCounts: number[]; // index 1-9 -> 残り個数
}

export function NumberPad({ onInput, onClear, remainingCounts }: NumberPadProps) {
  return (
    <div className="numpad">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
        const remaining = remainingCounts[n] ?? 9;
        return (
          <button
            key={n}
            type="button"
            className="numpad__key"
            disabled={remaining <= 0}
            onClick={() => onInput(n)}
          >
            <span className="numpad__digit">{n}</span>
            <span className="numpad__remaining">{remaining > 0 ? remaining : ""}</span>
          </button>
        );
      })}
      <button type="button" className="numpad__key numpad__key--erase" onClick={onClear}>
        <span className="numpad__digit">⌫</span>
      </button>
    </div>
  );
}
