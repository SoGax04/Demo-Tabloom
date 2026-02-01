***

### １．システム概要
Tabloom は、ブックマークを PostgreSQL で管理し、API から JSON エクスポートを提供する管理・閲覧システムです。  
管理 API でブックマーク/フォルダ/タグを CRUD し、エクスポート JSON を生成します。  
閲覧 Web は JSON を取得して、検索・フォルダ/タグでの絞り込みを行い、新規タブで開く操作を提供します。

### ２．技術スタック
- Web: React 18 / Vite / TypeScript
- API: Node.js 20 / Express / Prisma / Zod / JWT
- DB: PostgreSQL 16
- 実行環境: Docker / docker compose
- 付属設定: Nginx リバースプロキシ設定（`nginx/nginx.conf`）

### ３．セットアップ
1) 環境変数（任意）
```
cp .env.example .env
```
2) 起動
```
docker compose up -d --build
```
3) DB 初期化（初回のみ）
```
docker compose exec api npm run db:push
docker compose exec api npm run db:seed
```
※ マイグレーション運用する場合は `npm run db:migrate` を使用してください。

### ４．アクセス
- Web: http://localhost:5173
- API: http://localhost:3000
- Export JSON: http://localhost:3000/api/export/json
- Health: http://localhost:3000/api/health

### ５．使い方
- 初期シードで `admin@tabloom.local` / `admin123` が作成されます。`POST /api/auth/login` で JWT を取得し、`Authorization: Bearer <token>` を付与して各 API を利用します。
- `POST /api/auth/register` は「管理者が未作成のときのみ」利用できます。
- ブックマーク管理は `POST /api/bookmarks` / `PUT /api/bookmarks/:id` / `DELETE /api/bookmarks/:id` を使用します（フォルダ・タグは `/api/folders` / `/api/tags`）。
- エクスポートは `POST /api/export/trigger`、即時取得は `GET /api/export/json?fresh=true` を使用します。
- 閲覧 Web では検索/フォルダ/タグで絞り込み、一覧からブックマークを新規タブで開けます。

### ６．ディレクトリ構成
```
.
├── api/                # 管理 API（Express + Prisma）
│   ├── src/            # ルーティング/認証/バリデーション
│   ├── prisma/         # スキーマ/シード
│   └── exports/        # エクスポート JSON の保存先
├── web/                # 閲覧 Web（React + Vite）
│   └── src/
├── nginx/              # リバースプロキシ設定
├── scripts/            # DB 初期化補助スクリプト
├── docker-compose.yml
├── .env.example
└── document.txt        # 要件定義（ドラフト）
```

***
