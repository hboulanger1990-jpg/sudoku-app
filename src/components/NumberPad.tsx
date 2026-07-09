interface NumberPadProps {
  onInput: (num: number) => void;
}

export function NumberPad({ onInput }: NumberPadProps) {
  return (
    <div className="numpad">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
        <button key={n} type="button" className="numpad__key" onClick={() => onInput(n)}>
          {n}
        </button>
      ))}
    </div>
  );
}
