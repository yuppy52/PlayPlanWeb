# PlayPlan - 仲間との遊びを管理するチャットアプリ

PlayPlanは、友達や仲間と遊びの予定を立てて管理するためのWebアプリケーションです。LINEのようなチャット機能に加えて、遊びの詳細情報（日時、場所、費用など）を構造化して管理できます。

## 主な機能

- ✅ ユーザー認証（メール・パスワード）
- ✅ グループ作成・招待リンクでの参加
- ✅ 遊びの予定作成・管理
- ✅ 遊びごとの専用チャット（リアルタイム）
- ✅ 参加/不参加の表明
- ✅ 持ち物リストの共有・担当者割り当て
- 📋 いつめんテンプレート機能（今後実装予定）

## 技術スタック

- **フロントエンド**: React 18 + TypeScript + Vite
- **スタイリング**: Tailwind CSS
- **ルーティング**: React Router
- **バックエンド**: Supabase
  - Authentication（認証）
  - PostgreSQL Database
  - Realtime（リアルタイムチャット）
  - Row Level Security

## セットアップ手順

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd PlayPlanWeb
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com/)にアクセスして新規プロジェクトを作成
2. プロジェクトの設定から以下の情報を取得：
   - Project URL
   - Anon Public Key

### 4. 環境変数の設定

`.env.example`をコピーして`.env`を作成：

```bash
cp .env.example .env
```

`.env`ファイルを編集して、Supabaseの情報を設定：

```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 5. データベーススキーマの適用

Supabaseダッシュボードで以下の手順を実行：

1. 左サイドバーから「SQL Editor」を選択
2. 「New query」をクリック
3. `supabase_schema.sql`ファイルの内容をコピー＆ペースト
4. 「Run」ボタンをクリックして実行

これにより、以下のテーブルとRLSポリシーが作成されます：
- profiles（プロフィール）
- groups（グループ）
- group_members（グループメンバー）
- activities（遊び）
- activity_participants（遊びの参加者）
- items（持ち物）
- member_templates（いつめんテンプレート）
- template_members（テンプレートメンバー）
- messages（チャットメッセージ）

### 6. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:5173 にアクセス

## ビルド

本番環境用にビルドする場合：

```bash
npm run build
```

ビルド結果は`dist`フォルダに出力されます。

## プレビュー

ビルドした結果をローカルでプレビュー：

```bash
npm run preview
```

## プロジェクト構成

```
src/
├── components/     # UIコンポーネント
├── contexts/       # React Context（認証など）
├── hooks/          # カスタムフック
├── lib/            # ユーティリティとSupabaseクライアント
├── pages/          # ページコンポーネント
│   ├── Auth.tsx              # ログイン・新規登録
│   ├── Home.tsx              # ホーム（グループ一覧）
│   ├── CreateGroup.tsx       # グループ作成・参加
│   ├── GroupDetail.tsx       # グループ詳細（遊び一覧）
│   ├── CreateActivity.tsx    # 遊び作成
│   └── ActivityDetail.tsx    # 遊び詳細（チャット）
└── types/          # TypeScript型定義
```

## 使い方

1. **新規登録**: メールアドレスとパスワードで登録
2. **グループ作成**: ホーム画面から「新規作成」で仲間のグループを作成
3. **招待**: 作成したグループの招待コードを友達に共有
4. **遊びを作成**: グループ内で遊びの予定を作成
5. **チャット**: 遊びの詳細画面でリアルタイムチャット
6. **参加表明**: 参加/不参加を表明
7. **持ち物管理**: 持ち物を追加して担当者を割り当て

## 今後の実装予定

- [ ] いつめんテンプレート機能
- [ ] プロフィール編集
- [ ] グループメンバー管理
- [ ] 画像アップロード機能
- [ ] 通知機能
- [ ] モバイルアプリ（PWA）

## ライセンス

MIT
