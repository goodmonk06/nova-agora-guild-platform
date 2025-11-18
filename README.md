# Nova Agora - 支援者限定ギルドプラットフォーム

## コンセプト

Nova Agoraは、クリエイターと支援者をつなぐ次世代のコミュニティプラットフォームです。クラウドファンディングプロジェクト単位で「ギルド」を作成し、支援者限定の深いコミュニケーションとエンゲージメントを実現します。

### 主な特徴

1. **ギルド型コミュニティ**
   - プロジェクト/クリエイター単位でギルドを作成
   - 支援者IDまたは招待リンクで参加
   - ロール制御（Admin, Elder, Member）

2. **チャンネル & スレッド**
   - Discord風のチャンネル構造
   - トピック別のスレッド管理
   - ピン留め・ロック機能

3. **クエストシステム**
   - メンバーに課題（Quest）を出す
   - 成果物の提出とレビュー
   - ポイント報酬でエンゲージメント促進

4. **AIキュレーション**
   - 週次ハイライトの自動生成
   - 長文スレッドの要約機能
   - クエストアイデアの生成

5. **BPES戦略の実装**
   - **Scarcity (希少性)**: 限定メンバーシップ、特別なロールバッジ
   - **Curiosity (好奇心)**: AIハイライト、新しいクエスト
   - **Loss Aversion (損失回避)**: ポイントランキング、期間限定クエスト
   - **Social Proof (社会的証明)**: メンバー数表示、アクティビティフィード

## 技術スタック

- **フロントエンド**: Next.js 15 (App Router), React, Tailwind CSS
- **バックエンド**: tRPC, Prisma ORM
- **データベース**: PostgreSQL
- **認証**: NextAuth.js (Email + Discord)
- **キャッシュ/通知**: Redis (optional)
- **AI**: OpenAI GPT-4o-mini

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example`をコピーして`.env`を作成:

```bash
cp .env.example .env
```

必要な環境変数:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/nova_agora"

# NextAuth
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Discord OAuth (optional)
DISCORD_CLIENT_ID=""
DISCORD_CLIENT_SECRET=""

# Email Provider (optional)
EMAIL_SERVER_HOST=""
EMAIL_SERVER_PORT=""
EMAIL_SERVER_USER=""
EMAIL_SERVER_PASSWORD=""
EMAIL_FROM=""

# OpenAI
OPENAI_API_KEY="your-openai-key"

# Redis (optional)
REDIS_URL="redis://localhost:6379"
```

### 3. データベースのセットアップ

```bash
# Prisma migrations
npm run db:push

# または
npx prisma migrate dev
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 でアクセス可能になります。

## プロジェクト構造

```
nova-agora-guild-platform/
├── prisma/
│   └── schema.prisma          # データベーススキーマ
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (authenticated)/   # 認証が必要なページ
│   │   │   ├── dashboard/     # ダッシュボード
│   │   │   └── g/[guildSlug]/ # ギルドページ
│   │   ├── api/               # API Routes
│   │   ├── globals.css        # グローバルスタイル
│   │   └── page.tsx           # トップページ
│   ├── server/
│   │   ├── api/
│   │   │   ├── routers/       # tRPC routers
│   │   │   ├── root.ts        # メインルーター
│   │   │   └── trpc.ts        # tRPC setup
│   │   ├── services/
│   │   │   └── openai.ts      # AI service
│   │   ├── auth.ts            # NextAuth設定
│   │   ├── db.ts              # Prisma client
│   │   └── redis.ts           # Redis client
│   ├── trpc/
│   │   ├── react.tsx          # クライアント用tRPC
│   │   └── server.ts          # サーバー用tRPC
│   ├── lib/
│   │   └── utils.ts           # ユーティリティ関数
│   └── env.js                 # 環境変数バリデーション
├── package.json
└── tsconfig.json
```

## データモデル

### コアエンティティ

- **User**: ユーザー
- **Guild**: ギルド（プロジェクト単位）
- **Membership**: ギルドメンバーシップ（ロール付き）
- **Channel**: チャンネル
- **Thread**: スレッド
- **Post**: 投稿
- **Quest**: クエスト（課題）
- **QuestSubmission**: クエスト提出物
- **Reaction**: リアクション

## BPES戦略の実装箇所

### 1. Scarcity (希少性)

- **招待制ギルド**: `inviteCode`による限定参加
- **ロールバッジ**: Admin/Elder/Memberの階層制
- **ポイントシステム**: 上位ランカーの可視化
- **実装箇所**:
  - `prisma/schema.prisma`: Membership model
  - `src/server/api/routers/guild.ts`: joinByInvite
  - UI: ダッシュボードでロールバッジ表示

### 2. Curiosity (好奇心)

- **AIハイライト**: 週次で自動生成される「今週のハイライト」
- **クエストシステム**: 新しい課題が定期的に登場
- **スレッド要約**: 長文を読まずに概要を把握
- **実装箇所**:
  - `src/server/services/openai.ts`: generateWeeklyHighlights, summarizeThread
  - `src/server/api/routers/post.ts`: generateWeeklyHighlights mutation
  - UI: フィードでAI生成投稿を特別表示

### 3. Loss Aversion (損失回避)

- **デッドライン**: クエストの期限設定
- **ポイントランキング**: 他のメンバーに遅れを取る恐怖
- **期間限定バッジ**: 特定期間の活動に対する報酬
- **実装箇所**:
  - `prisma/schema.prisma`: Quest.deadline
  - `src/server/api/routers/quest.ts`: deadline validation
  - UI: 右サイドバーで期限が近いクエストを強調表示

### 4. Social Proof (社会的証明)

- **メンバー数表示**: ギルドの活発さを可視化
- **リアクション**: 他のメンバーの反応を表示
- **アクティビティフィード**: 誰が何をしているかを可視化
- **トップコントリビューター**: ポイント上位者を表示
- **実装箇所**:
  - UI: ダッシュボードでメンバー数表示
  - `src/server/api/routers/reaction.ts`: リアクション集計
  - UI: 右サイドバーでメンバーリスト＆ポイント表示

## 主な機能

### 認証

- Email認証（マジックリンク）
- Discord OAuth
- セッション管理

### ギルド管理

- ギルド作成・編集
- 招待コード生成
- メンバー管理（ロール変更、ポイント付与）

### コンテンツ

- タイムライン投稿
- チャンネル内スレッド
- 投稿へのリアクション
- ピン留め・ロック機能

### クエストシステム

- クエスト作成・編集
- 提出物のレビュー
- ポイント報酬の自動付与

### AI機能

- 週次ハイライト生成
- スレッド要約
- クエストアイデア生成（TODO）

## 今後の拡張案

1. **通知システム**: Redis Pub/Sub + WebSocket
2. **ファイルアップロード**: S3統合
3. **リアルタイムチャット**: WebSocket/Server-Sent Events
4. **支援者ID連携**: Campfire/Makuake API統合
5. **バッジ＆実績システム**: ゲーミフィケーション強化
6. **モバイルアプリ**: React Native
7. **アナリティクス**: メンバーエンゲージメント分析

## ライセンス

MIT

## コントリビューション

プルリクエストを歓迎します！大きな変更の場合は、まずissueを開いて議論してください。
