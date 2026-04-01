# 現場ログ管理アプリ

土木・測量現場での観測データ（水位・流速・断面積）を記録・管理する Web アプリです。

## 概要

現場作業員が観測した水文データを入力すると、流量（流速 × 断面積）を自動計算して記録します。
過去データとの比較・グラフ表示・CSV エクスポートにも対応しており、現場レポート作成の効率化を想定して設計しました。

## 使用技術

| 技術 | 用途 |
|---|---|
| React 19 | UI コンポーネント |
| TypeScript | 型安全な開発 |
| Vite 8 | ビルドツール |
| Chart.js | 観測データのグラフ表示 |
| Vitest | ユニットテスト（34 テスト） |
| Cloudflare Workers | CORS プロキシ（水位 API 用） |
| GitHub Pages | ホスティング |
| PWA (Service Worker) | オフライン対応 |
| localStorage | データ永続化（バックエンドなし） |

## 主な機能

- **データ入力** — 現場名・日付・開始/終了時間・水位・流速・断面積を入力。流量は自動計算
- **水位自動取得** — 現場名と日付から国交省 river.go.jp の公開データを参照し水位を取得（Cloudflare Worker 経由で CORS 対応）
- **時間平均水位** — 開始/終了時間を入力すれば、その時間帯の開始・終了・平均水位を自動取得
- **現場計算アシスト** — 検定係数・補正値・音数を入力し、測線距離・水深・秒数から点流速→区分断面積→流量を自動計算
- **器深自動算出** — 水深入力で器深を自動計算（水深 ≥ 0.5m: 2割/8割、<0.5m: 6割）。水深は 0.05 刻みに丸めて算出
- **V/H/P 自動判定** — 入力パターンから観測点の種別（実測/水深のみ/橋脚）を自動判定
- **一覧・検索** — 現場名・日付範囲でリアルタイムフィルタリング
- **編集・削除** — モーダルで編集、インライン確認 UI で誤削除を防止
- **比較機能** — 2 件のデータを選択して差分（水位・流速・流量の差）を表示
- **統計情報** — 件数・平均水位・平均流速・平均流量を自動集計
- **グラフ表示** — 全データの観測値推移を折れ線グラフで可視化
- **CSV エクスポート** — 全データを CSV ファイルでダウンロード
- **PWA 対応** — Service Worker によるオフラインキャッシュ。スマホのホーム画面に追加可能

## セキュリティ対策

- **CSP (Content-Security-Policy)** — 許可するスクリプト・接続先を制限
- **localStorage ランタイム検証** — 不正データ混入時に安全にフォールバック
- **API エラーサニタイズ** — 外部 API の生エラーをユーザーに表示しない
- **ErrorBoundary** — 予期しないクラッシュ時に再読み込み画面を表示
- **Cloudflare Worker** — オリジン制限・パス制限・メソッド制限を実装

## 公開リンク

- GitHub: https://github.com/yg-2525/genba-react
- Demo: https://yg-2525.github.io/genba-react/

## 工夫した点

### コンポーネント設計
`App.tsx` を状態管理に集中させ、各 UI を独立したコンポーネントに分割しました。

```
src/
├── App.tsx                  # 状態管理・ルーティング
├── contexts/
│   └── ToastContext.tsx      # トースト通知（Context API）
├── utils/
│   ├── waterLevel.ts        # 水位取得（river.go.jp API）
│   ├── observation.ts       # 観測計算ロジック
│   ├── date.ts              # 日付ユーティリティ
│   └── calcFlow.ts          # 流量計算
└── components/
    ├── InputForm.tsx         # データ入力フォーム
    ├── ObservationCalculator.tsx  # 現場計算アシスト
    ├── TimeSelect.tsx        # 10分刻み時間選択
    ├── ResponsiveDateInput.tsx   # 日付入力
    ├── SearchFilter.tsx      # 検索・フィルター
    ├── StatsPanel.tsx        # 統計情報
    ├── DataList.tsx          # データ一覧
    ├── ChartView.tsx         # グラフ
    ├── EditModal.tsx         # 編集モーダル
    ├── CompareModal.tsx      # 比較モーダル
    └── ErrorBoundary.tsx     # エラーバウンダリ
```

### UX の改善
- ブラウザの `alert` / `confirm` を廃止し、**トースト通知**（右下にアニメーション表示）と**インライン削除確認 UI** に置き換え
- フローティングラベル + 入力済みで非表示にするクリーンな UI
- フィルタリングは `useMemo` によるリアルタイム反映
- モバイルでは PC 版と同じレイアウトを縮小表示

### テスト
Vitest + React Testing Library で 34 テストを実装。入力フォーム・データ一覧・統計パネル・比較モーダル・観測計算・フィルターをカバー。

```bash
npm test -- --run   # テスト実行
```

## 起動方法

```bash
npm install
npm run dev
```

ブラウザで `http://localhost:5173` を開いてください。

## デプロイ

```bash
npm run deploy      # GitHub Pages にデプロイ
```
