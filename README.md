# Blueprint Sudoku

製図（ブループリント）をモチーフにした、オフライン対応の数独 PWA。
Vite + React + TypeScript。外部データ・API不要で、盤面はすべて端末内でその場生成します。

## 自分のリポジトリへの入れ方（Progress Checker v3 と同じ並び）

`Progress-Checker-v3/artifacts/manga-tracker` と同様に、`artifacts/sudoku-app` として置く想定です。

```powershell
# 1. このフォルダを配置
#    Progress-Checker-v3\artifacts\sudoku-app に、このzipの中身を丸ごとコピー

# 2. 依存関係をインストール（このプロジェクトは npm 前提で作成しています）
cd ~\Desktop\Progress-Checker-v3\artifacts\sudoku-app
npm install

# もし pnpm に統一したい場合
pnpm import   # package-lock.json から pnpm-lock.yaml を生成
rm package-lock.json
pnpm install

# 3. 起動
npm run dev
# または pnpm dev
```

## できること

- 難易度3段階（易・中・難）で、その場でランダムな数独を生成
- 一意解チェック済み（解が1つに定まる問題だけを出題）
- タイマー、ミス数カウント、メモ（候補数字）モード、ヒント
- 進行状況を `localStorage` に自動保存（リロードしても続きから）
- PWA対応：`manifest.webmanifest` と Service Worker（`vite-plugin-pwa`）でオフライン動作・ホーム画面追加に対応
- キーボード操作対応（1-9で入力、Backspace/Deleteで消去、Nでメモモード切替）

## 数独ロジックについて

`src/sudoku/` にロジックを分離しています。

- `solver.ts`: バックトラッキング＋MRV（最小残り値）ヒューリスティックによるソルバー。`countSolutions(grid, 2)` で「解が2つ以上あるか」を高速判定できるようにしてあります。
- `generator.ts`: (1)完全に埋まった正解盤面をランダム生成 → (2)マスをランダム順に間引きつつ、都度 `countSolutions` で一意性を確認、という流れで問題を作ります。難易度は空きマス数（`TARGET_BLANKS`）で調整しています。

difficultyの閾値や見た目の配色は `src/App.css` / `src/sudoku/generator.ts` で調整できます。

## デプロイ（Vercel）

Progress Checker v3 と同じVercelプロジェクト運用であれば、`artifacts/sudoku-app` をルートディレクトリに指定した別プロジェクトとしてVercelに追加し、`npm run build` の出力 `dist/` を配信する設定にしてください。

## 今後の拡張候補

- Supabaseに繋いで、難易度別の統計や複数端末間の進捗同期を追加する
- 問題の共有（URLに盤面をエンコードして友達に送る）
- ダークモード（design tokenは `src/index.css` の `:root` にまとまっているので変更しやすい構成にしています）
