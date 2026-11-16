# API連携設計書 — Studio Book Mobile

- 更新日：2026-11-17
- ソース基準：`src/lib/api.ts`, `src/lib/apiRequestCore.js`, `src/lib/bookingConfirm.js`, `app/**/*.tsx`, `src/types.ts`
- **注意**：ここで示すのはモバイルクライアントが実際に要求・利用しているインターフェースです。バックエンドの全APIを網羅するものではありません。

## 1. 接続・認証の共通仕様

| 項目 | 仕様 |
|---|---|
| ベースURL | `EXPO_PUBLIC_API_BASE_URL`（公開HTTPS URL） |
| リクエスト形式 | REST/JSON。JSON本文送信時は`Content-Type: application/json` |
| 認証 | `auth=true` の呼び出しに `Authorization: Bearer <JWT>` を付与 |
| トークン保管 | `expo-secure-store` のキー `studio-book.jwt` |
| 401 | 保管トークン削除、APIエラーを返却 |
| 403 | トークン保持、APIエラーを返却 |
| 204 | レスポンス本文なし（`undefined`） |
| HTTP以外の通信失敗 | 呼び出し元でメッセージ表示 |

`EXPO_PUBLIC_WEB_BASE_URL` は、Web版画像などへのリンク構成用。`EXPO_PUBLIC_CHECKOUT_ALLOWED_HOSTS` はStripe Checkout独自ドメインの許可ホスト指定（通常省略）。`EXPO_PUBLIC_*` は公開値であり秘密情報を格納しない。

## 2. 利用エンドポイント一覧

| 用途 | メソッド・パス | モバイルでの認証 | 参照コード |
|---|---|---|---|
| スタジオ一覧 | `GET /api/rooms?...` | 不要 | `(tabs)/index.tsx` |
| スタジオ詳細 | `GET /api/rooms/{id}` | 不要 | `rooms/[id]/index.tsx`, `book.tsx` |
| AI検索 | `POST /api/ai/room-search` | 不要 | `api.ts`, `rooms/ai-search.tsx` |
| ログイン | `POST /api/auth/login` | 不要 | `api.ts`, `authFlows.js` |
| 本人情報取得 | `GET /api/auth/me` | 必要 | `api.ts`, `authFlows.js` |
| 本人情報更新 | `PUT /api/auth/me` | 必要 | `api.ts`, `profile-edit.tsx` |
| 予約確認 | `POST /api/reservations/confirm` | 必要 | `bookingConfirm.js` |
| 予約履歴 | `GET /api/reservations?page=...` | 必要 | `(tabs)/reservations.tsx` |
| レビュー投稿画面用情報 | `GET /api/rooms/{id}/reviews/new?...` | 必要 | `rooms/[id]/reviews/new.tsx` |
| レビュー投稿 | `POST /api/rooms/{id}/reviews` | 必要 | `rooms/[id]/reviews/new.tsx` |
| AIレビュー文補助 | `POST /api/ai/review-assist` | 必要 | `rooms/[id]/reviews/new.tsx` |

**予約取消APIは呼び出さない**。モバイル一般会員に取消機能はない。

## 3. 主要リクエスト・応答

### 3.1 ログイン

```http
POST /api/auth/login
Content-Type: application/json

{"email":"user@example.com","password":"********"}
```

応答のうちクライアントが使用するフィールド：`token`（JWT）。保存後に`GET /api/auth/me`を呼び、`isAuthenticated`と`user.roles`を確認する。ロールは一般会員のみ許可。

### 3.2 通常検索

```http
GET /api/rooms?page=1&pageSize=10&order=createdAtDesc&keyword=...&area=...&price=...
```

検索条件は入力されたものだけ追加。応答は`items`、`page`、`pageSize`、`totalPages`、`totalCount`。一覧の各項目は`id`, `name`, `address`, `price`, `averageScore`, `reviewCount`, `imageName`等を使用。

### 3.3 AI検索

```http
POST /api/ai/room-search
Content-Type: application/json

{"query":"新宿周辺で撮影向けのスタジオ"}
```

応答：`interpretedConditions`, `rooms[]`, `requestedSlot?`, `notices?`, `relaxed?`。候補の`availability.isAvailable===true`かつ日時妥当の場合のみ日時を予約確認へ引き継ぐ。429は利用回数制限として案内。

### 3.4 予約確認

```http
POST /api/reservations/confirm
Authorization: Bearer <JWT>
Content-Type: application/json

{"roomId":1,"startAt":"2026-11-20T15:00:00","endAt":"2026-11-20T17:00:00"}
```

応答の表示対象：`roomName`, `hours`, `items[]`, `subtotal`, `taxRatePercent`, `tax`, `platformFeeRatePercent`, `platformFee`, `amount`, `checkoutUrl`。クライアントは再計算しない。`checkoutUrl` を許可URL検査後に外部ブラウザで開く。`sessionId`などの値が定義されていても秘密鍵とみなしてクライアントから勝手に決済処理を行わない。

### 3.5 予約履歴

```http
GET /api/reservations?page=1&pageSize=10
Authorization: Bearer <JWT>
```

応答：`items`, `page`, `totalPages` 等。各予約は`reservationId`, `roomId`, `startAt`, `endAt`, `amount`, `status`, `isUsed` を使用。モバイルではステータス確認のみで取消しない。

### 3.6 レビュー投稿・AI補助

```http
GET /api/rooms/{roomId}/reviews/new?page=1&pageSize=10&reservationId={reservationId}
Authorization: Bearer <JWT>
```

応答には`canReview`, `alreadyReviewed`, `reviews`、ページ情報が含まれる。投稿例：

```http
POST /api/rooms/{roomId}/reviews
Authorization: Bearer <JWT>
Content-Type: application/json

{"reservationId":42,"score":5,"content":"利用しやすいスタジオでした。"}
```

AIレビュー補助は `POST /api/ai/review-assist` に `{"content":"...","score":5,"roomName":"..."}` を送信し、`assistedContent`を受領する。補助結果は自動投稿しない。

## 4. 例外・セキュリティ

- 無効なベースURL／`/api/`以外のパスは送信前に拒否。
- JWT未保存で認証要API呼び出しの場合はネットワーク送信せず401エラー。
- サーバー401では保存トークン削除、403では削除しない。
- 409（予約重複等）は成功に変換しない。
- Stripe Checkoutの遷移先はHTTPS・ホスト許可リストで検証する。
- クライアントはCORSによるアクセス制限に依存しない。API側の本人認可が必須。

## 5. バックエンドとの仕様確認が必要な項目

実際のエラーJSON形式、API側のロールと予約所有者認可、料金内訳の計算根拠、タイムゾーンの契約、決済Webhookの状態遷移、レビュー投稿権限はバックエンドのコードと照合して確定させること。
