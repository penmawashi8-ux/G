# ガニメデ戦記 ZERO+ — Web版

ボードゲーム「ガニメデ戦記ゼロプラス」の2人用リアルタイム対戦Webアプリです。

## 技術スタック

| レイヤー | 技術 |
|--------|------|
| フロントエンド | React 18 + Vite + TypeScript + Tailwind CSS + Framer Motion |
| バックエンド | Node.js + Express + Socket.io |
| 状態管理 | Zustand |
| フロントホスティング | Vercel |
| バックエンドホスティング | Railway |

---

## ローカル開発

```bash
cd ganymede-war
npm run install:all      # server・client 両方の依存をインストール
npm run dev              # サーバー :3001 + クライアント :5173 を同時起動
```

ブラウザで `http://localhost:5173` を開き、別タブでもう一人分を開いてテストできます。

---

## デプロイ手順

### 全体の流れ

```
Railway (バックエンド) → デプロイURL取得 → Vercel (フロントエンド) に環境変数として設定
```

---

### Step 1 — Railway にバックエンドをデプロイ

1. [railway.app](https://railway.app) でログイン・新規プロジェクト作成
2. **「Deploy from GitHub repo」** を選択し、このリポジトリを接続
3. 設定画面で **Root Directory** を `ganymede-war/server` に変更
4. Railway が自動的に `package.json` を検出し、以下を実行します:
   - Install: `npm install`
   - Start: `npm start` (= `ts-node --transpile-only src/index.ts`)
5. **「Variables」タブ** で環境変数を追加:

   | 変数名 | 値 | 説明 |
   |--------|-----|------|
   | `CLIENT_URL` | `https://your-app.vercel.app` | Vercel デプロイ後に設定 |
   | `PORT` | (不要) | Railway が自動設定 |

6. デプロイ完了後、**「Settings → Domains」** から発行されたURLをメモ
   - 例: `https://ganymede-war-production.up.railway.app`

> **ヘルスチェック**: `GET /health` → `{"status":"ok"}` で確認できます

---

### Step 2 — Vercel にフロントエンドをデプロイ

1. [vercel.com](https://vercel.com) でログイン・新規プロジェクト作成
2. **「Import Git Repository」** でこのリポジトリを接続
3. 設定画面で以下を入力:

   | 項目 | 値 |
   |------|-----|
   | **Root Directory** | `ganymede-war/client` |
   | **Framework Preset** | Vite (自動検出) |
   | **Build Command** | `npm run build` |
   | **Output Directory** | `dist` |

4. **「Environment Variables」** で追加:

   | 変数名 | 値 |
   |--------|-----|
   | `VITE_SERVER_URL` | `https://ganymede-war-production.up.railway.app` (Step 1 でメモしたURL) |

5. **「Deploy」** をクリック

> Vercel のプレビュー URL（`*-git-branch-xxx.vercel.app`）からもアクセスする場合は、RailwayのCLIENT_URLにカンマ区切りで追加してください。

---

### Step 3 — Railway の CLIENT_URL を更新

Vercel のデプロイが完了したら、Railway の `CLIENT_URL` に実際の Vercel URL を設定し、Railway を再デプロイします。

```
CLIENT_URL=https://ganymede-war.vercel.app
```

---

## 環境変数まとめ

### サーバー (Railway)

| 変数名 | 必須 | 説明 | 例 |
|--------|------|------|----|
| `CLIENT_URL` | ✅ | CORS を許可するフロントURL（カンマ区切りで複数可） | `https://your-app.vercel.app` |
| `PORT` | — | Railway が自動設定するため不要 | `3001` |

`server/.env.example` を参照してください。

### クライアント (Vercel)

| 変数名 | 必須 | 説明 | 例 |
|--------|------|------|----|
| `VITE_SERVER_URL` | ✅ | Railway バックエンドの URL | `https://your-app.up.railway.app` |

`client/.env.example` を参照してください。

---

## 設定ファイル一覧

```
ganymede-war/
├── client/
│   ├── vercel.json          # Vercel ビルド設定
│   └── .env.example         # クライアント環境変数のサンプル
└── server/
    ├── railway.toml         # Railway デプロイ設定
    └── .env.example         # サーバー環境変数のサンプル
```

---

## カードデータの更新

`server/src/cardData.ts` と `client/src/data/cards.ts` の対応する箇所を同時に更新してください。

未確認カード（実物カード確認後に名前を更新）:

| ID | 場所 | 現在の名前 |
|----|------|-----------|
| `rh_unknown_6` | 右手6枚目 | （右手6・要確認） |
| `rh_unknown_7` | 右手7枚目 | （右手7・要確認） |
| `bp_unknown_7` | 背中7枚目 | （背中7・要確認） |

---

## ディレクトリ構成

```
ganymede-war/
├── shared/types.ts          # 共通型定義
├── server/src/
│   ├── index.ts             # Express + Socket.io
│   ├── gameEngine.ts        # ゲームロジック（純粋関数）
│   ├── gameRoom.ts          # ルーム管理
│   └── cardData.ts          # カードデータ（メック・パーツ）
└── client/src/
    ├── App.tsx
    ├── data/cards.ts        # カードデータ（サーバーと同内容）
    ├── store/gameStore.ts   # Zustand 状態管理
    ├── hooks/useSocket.ts   # Socket.io 接続
    └── components/
        ├── ui/              # Lobby, Timer, GameLog, GameOver
        ├── draft/           # DraftBoard, PartCardUI
        ├── mech/            # MechCard, MechAssembly, MechStatus, MechSVG
        └── battle/          # BattleField, DiceRoller, InitiativeCardUI
```

## ゲームの流れ

1. **ロビー** — ルームを作成してコードを相手に共有、または相手のコードで参加
2. **ドラフト** — 長機・僚機・パーツをターン制で選択（長機→僚機→パーツ×4ラウンド）
3. **アセンブリ** — 60秒以内にパーツを2台のメックに装備。HP / AIM / SP が 1 以上になる組み合わせのみ有効。SP が奇数のメックはイニシアチブカードの方向を選択
4. **バトル** — イニシアチブカードを引いて攻撃プレイヤーを決定 → 防御メック選択 → サイコロ（AIM 以下でヒット）→ リロール（パーツによる）→ ダメージ適用 → 魂の継承
5. **勝利** — 相手の全メックを破壊したら勝利
