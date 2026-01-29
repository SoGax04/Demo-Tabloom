# Tabloom - Bookmark Management System

PostgreSQLでブックマーク情報を管理し、JSONエクスポート機能と閲覧Webサイトを提供するシステム。

## 技術スタック

- **バックエンドAPI**: Node.js + Express + TypeScript
- **フロントエンド**: React + TypeScript + Vite
- **データベース**: PostgreSQL 16
- **ORM**: Prisma
- **認証**: JWT (管理APIのみ)
- **コンテナ**: Docker + docker-compose

## セットアップ

### 1. 環境変数の設定

```bash
cp .env.example .env
# .env ファイルを編集してJWT_SECRETなどを変更
```

### 2. Docker Compose で起動

```bash
docker compose up --build
```

### 3. データベースの初期化

初回起動時、APIコンテナ内でマイグレーションとシードを実行：

```bash
docker compose exec api npx prisma migrate deploy
docker compose exec api npm run db:seed
```

## アクセス

- **Web UI**: http://localhost:5173
- **API**: http://localhost:3000
- **API Health Check**: http://localhost:3000/api/health

## API エンドポイント

### 公開エンドポイント

| Method | Endpoint | 説明 |
|--------|----------|------|
| GET | `/api/export/json` | ブックマークのJSONエクスポート |
| GET | `/api/health` | ヘルスチェック |

### 認証エンドポイント

| Method | Endpoint | 説明 |
|--------|----------|------|
| POST | `/api/auth/login` | ログイン |
| POST | `/api/auth/register` | 管理者登録（初回のみ） |

### ブックマーク（要認証）

| Method | Endpoint | 説明 |
|--------|----------|------|
| GET | `/api/bookmarks` | 一覧取得 |
| POST | `/api/bookmarks` | 登録 |
| GET | `/api/bookmarks/:id` | 詳細取得 |
| PUT | `/api/bookmarks/:id` | 更新 |
| DELETE | `/api/bookmarks/:id` | 削除 |

### フォルダ（要認証）

| Method | Endpoint | 説明 |
|--------|----------|------|
| GET | `/api/folders` | 一覧取得 |
| POST | `/api/folders` | 作成 |
| PUT | `/api/folders/:id` | 更新 |
| DELETE | `/api/folders/:id` | 削除 |

### タグ（要認証）

| Method | Endpoint | 説明 |
|--------|----------|------|
| GET | `/api/tags` | 一覧取得 |
| POST | `/api/tags` | 作成 |
| PUT | `/api/tags/:id` | 更新 |
| DELETE | `/api/tags/:id` | 削除 |

### エクスポート

| Method | Endpoint | 説明 |
|--------|----------|------|
| GET | `/api/export/json` | 公開: 最新JSONを取得 |
| POST | `/api/export/trigger` | 要認証: エクスポート実行 |
| GET | `/api/export/jobs` | 要認証: エクスポート履歴 |

## 使い方

### ログイン

シードデータで作成される管理者アカウント：
- Email: `admin@tabloom.local`
- Password: `admin123`

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@tabloom.local", "password": "admin123"}'
```

### ブックマークの作成

```bash
curl -X POST http://localhost:3000/api/bookmarks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"url": "https://example.com", "title": "Example Site"}'
```

### JSONエクスポートの取得（公開）

```bash
curl http://localhost:3000/api/export/json
```

## 開発

### APIの開発

```bash
cd api
npm install
npm run dev
```

### Webの開発

```bash
cd web
npm install
npm run dev
```

### Prismaコマンド

```bash
# マイグレーション作成
docker compose exec api npx prisma migrate dev --name your_migration_name

# スキーマ変更の適用
docker compose exec api npx prisma db push

# Prisma Studio起動
docker compose exec api npx prisma studio
```

## ディレクトリ構成

```
tabloom/
├── docker-compose.yml
├── api/                          # 管理API + JSONエクスポート
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   ├── schema.prisma         # DBスキーマ
│   │   └── seed.ts               # シードデータ
│   └── src/
│       ├── index.ts              # エントリポイント
│       ├── routes/
│       │   ├── auth.ts           # 認証
│       │   ├── bookmarks.ts      # ブックマークCRUD
│       │   ├── folders.ts        # フォルダCRUD
│       │   ├── tags.ts           # タグCRUD
│       │   └── export.ts         # JSONエクスポート
│       ├── middleware/
│       │   └── auth.ts           # JWT認証ミドルウェア
│       ├── services/
│       │   └── export.ts         # エクスポートロジック
│       └── utils/
│           └── validation.ts     # バリデーション
├── web/                          # 閲覧Webサイト
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── App.css
│       ├── components/
│       │   ├── BookmarkList.tsx
│       │   ├── FolderTree.tsx
│       │   ├── SearchBar.tsx
│       │   └── TagFilter.tsx
│       ├── hooks/
│       │   └── useBookmarks.ts
│       └── types/
│           └── bookmark.ts
└── nginx/
    └── nginx.conf
```
