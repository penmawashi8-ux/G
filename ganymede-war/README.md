# ガニメデ戦記 ZERO+ — Web版

ボードゲーム「ガニメデ戦記ゼロプラス」の2人用リアルタイム対戦Webアプリです。

## 技術スタック

| レイヤー | 技術 |
|--------|------|
| フロントエンド | React 18 + Vite + TypeScript |
| スタイリング | Tailwind CSS |
| アニメーション | Framer Motion |
| リアルタイム通信 | Socket.io |
| バックエンド | Node.js + Express + Socket.io |
| 状態管理 | Zustand |

## セットアップ

```bash
cd ganymede-war
npm run install:all
npm run dev          # サーバー(:3001) + クライアント(:5173) を同時起動
```

## ゲームの流れ

1. **ロビー** — ルームを作成してコードを相手に共有、または相手のコードで参加
2. **ドラフト** — 長機・僚機・パーツをターン制で選択
3. **アセンブリ** — 60秒以内にパーツをメックに装備（HP/AIM/SPが0以下になる組み合わせは禁止）
4. **バトル** — イニシアチブカードを引いてターン進行。SP数のサイコロを振り、AIM以下でヒット
5. **勝利判定** — 相手の全メックを破壊したら勝利

## カードデータの更新

`server/src/cardData.ts` と `client/src/data/cards.ts` の同一箇所を更新してください。

未確認カード（実物確認後に名前を更新）:
- `rh_unknown_6` / `rh_unknown_7` — 右手6・7枚目
- `bp_unknown_7` — 背中7枚目

## ディレクトリ構成

```
ganymede-war/
├── shared/types.ts          # 共通型定義
├── server/src/
│   ├── index.ts             # Express + Socket.io
│   ├── gameEngine.ts        # ゲームロジック（純粋関数）
│   ├── gameRoom.ts          # ルーム管理
│   └── cardData.ts          # カードデータ
└── client/src/
    ├── App.tsx
    ├── data/cards.ts        # カードデータ（サーバーと同期）
    ├── store/gameStore.ts   # Zustand状態管理
    ├── hooks/useSocket.ts
    └── components/
        ├── ui/              # Lobby, Timer, GameLog, GameOver
        ├── draft/           # DraftBoard, PartCardUI
        ├── mech/            # MechCard, MechAssembly, MechStatus, MechSVG
        └── battle/          # BattleField, DiceRoller, InitiativeCardUI
```
