# 詳細設計書 — Studio Book Mobile

- 更新日：2026-11-17
- 基準：提供済みReact Nativeソースのモジュール・画面とテスト

## 1. ファイル／責務対応

| ファイル | 主な責務 |
|---|---|
| `app/_layout.tsx` | `AuthProvider`、画面Stack定義 |
| `app/(tabs)/_layout.tsx` | 3タブのナビゲーション |
| `app/(tabs)/index.tsx` | 条件検索、一覧・ページング |
| `app/rooms/ai-search.tsx` | AI検索、検索結果表示、予約確認への日時受け渡し |
| `app/rooms/[id]/index.tsx` | スタジオ詳細、カレンダー、レビュー一覧 |
| `app/rooms/[id]/book.tsx` | 予約日時入力、クライアント側の重複目安判定 |
| `app/rooms/[id]/confirm.tsx` | 予約確認API、料金表示、Checkout遷移 |
| `app/(tabs)/reservations.tsx` | 予約履歴、利用済み予約からレビュー投稿へ |
| `app/rooms/[id]/reviews/new.tsx` | レビュー投稿可否判定、AI整文、投稿 |
| `app/login.tsx` / `app/profile-edit.tsx` | ログイン、プロフィール変更 |
| `src/lib/api.ts` | APIホスト、JWT永続化、APIラッパー |
| `src/lib/apiRequestCore.js` | HTTPヘッダー、認証、401処理、エラー変換 |
| `src/lib/authFlows.js` | ログイン・復元・ログアウトのユースケース |
| `src/lib/bookingConfirm.js` | 予約日時・ロール検証、確認API呼び出し |
| `src/lib/checkoutLogic.js` | Checkout URL検証、外部ブラウザ呼び出し |
| `src/lib/aiSearchLogic.js` | AI指定日時の検証・表示・引き継ぎ |
| `src/lib/bookingLogic.js` | ローカル日時、重複目安判定、状態名表示 |
| `src/lib/calendarLogic.js` | 30分枠の営業・休館・予約済み区別 |
| `src/lib/reviewLogic.js` | レビュー入力・投稿可否の判定 |
| `src/components/*` | 共通UI、画像、日付、カレンダー、レビュー表示 |
| `src/types.ts` | モバイルAPIレスポンス・入力のTypeScript型 |

## 2. 認証・認可（クライアント）

`isMobileGeneralUser(roles)` の真条件：`roles` が配列で、`GeneralUser`を含み、`Host`と`Admin`をいずれも含まない。

- 初回ログイン：`POST /api/auth/login` → JWTをSecureStoreキー`studio-book.jwt`に保存 → `GET /api/auth/me` → ロール検証。
- 本人情報が不明／拒否ロール：JWTを削除しログイン失敗。
- アプリ起動：JWTの存在を確認 → 本人情報の取得 → 一般会員ならセッション復元。
- HTTP 401：JWTを削除。HTTP 403：JWTを維持しエラーを上位に返す。
- オフライン等の一時的な復元失敗：JWTは削除しない。UIは検索機能を表示できるようにする。
- ログアウト：SecureStoreからJWTを削除。

**境界**：これはUI側の制御であり、別ユーザーの予約をAPIが拒否することなど、認可強制は既存バックエンドの責務。

## 3. HTTP共通処理

`createApiRequester({baseUrl, fetchImpl, getToken, deleteToken})` に依存性を注入する。

- 認証要API：トークン未保存なら通信前に401を投げる。通信時に `Authorization: Bearer ...` を付与。
- 呼び出し元が指定した `Authorization` より保存済みトークンを優先する。
- JSON本文ありなら`Content-Type: application/json`を追加。`Accept: application/json`を指定。
- 非2xxレスポンス：JSONの`message`または`title`を優先して`ApiError(status)`へ変換。JSON以外ならHTTPコードを保持。
- 成功時204は`undefined`。その他はレスポンス本文をJSON解析。
- APIベースURLはHTTPSのみ。ただしローカル開発用のHTTP localhost / `10.0.2.2` は許可する。
- `/api/` で始まるパスのみを呼び出し対象にする。

## 4. 予約日時・予約確認

### 4.1 入力

- 利用開始・終了をネイティブ日時ピッカーで取得。
- `dateError(start,end)`：不正なDate、開始が現在以前、終了が開始以前／同時刻ならエラー。
- `overlapsEvents`：`calendarEvents`のうち `reservation` / `closure` に該当する時間帯との重複を画面上の目安として警告。`open`イベントは衝突扱いしない。
- API向け日時はオフセットなしの `YYYY-MM-DDTHH:mm:ss`（例：`2026-11-20T15:00:00`）で送る。

### 4.2 確認

- `validConfirmationParams` は正の安全な整数Room ID、存在する日付、タイムゾーン情報なしの厳密な日時、`startAt < endAt` を検証。
- 一般会員のときだけ `POST /api/reservations/confirm` を実行する。
- 予約確認レスポンスの`items`, `subtotal`, `tax`, `platformFee`, `amount`等を表示し、**クライアントで金額を再計算しない**。
- 409（重複等）、403（権限不足）、通信障害は上位へ例外伝播し、予約成功扱いにしない。

## 5. 決済導線（Stripe Checkout）

- `checkoutAllowed(url, configuredHosts)` が`https:`のみを許可。
- 基本許可ドメイン：`checkout.stripe.com`。追加ドメインは`EXPO_PUBLIC_CHECKOUT_ALLOWED_HOSTS`の**完全一致ホスト名**。
- 偽サブドメイン、userinfo付きURL、HTTP/不正スキームを拒否。
- `openCheckoutUrl` はチェック済URLのみ`expo-web-browser`へ渡す。
- ブラウザ終了の戻り値は決済状態として**使用しない**。予約履歴をAPIから再取得して確認する。
- 秘密鍵の保持やStripe Webhookの受信はモバイルの責務外。

## 6. AI検索

- 入力文字数：200文字以内、空文字拒否。
- API：`POST /api/ai/room-search`。`query`文字列を送信。
- 解釈条件、推薦理由、候補、指定日時`requestedSlot`、空き状況を表示。
- `getAiReservationParams` は、候補の `availability.isAvailable===true`、正のRoom ID、妥当な日時範囲を満たすときのみ予約確認画面パラメータを生成。
- AIに由来する日時は端末タイムゾーン変換によるずれを防ぐため、日時文字列として検証・整形する。
- HTTP 429を利用回数制限として表示。AIの検索結果は予約の確定情報ではない。

## 7. カレンダー

- `RoomDetail.businessHours`, `calendarEvents` から30分単位の`calendarSlotRows`を生成。
- 状態は`open`（営業時間）、`closure`（休館）、`reservation`（予約済み）、`outside`（時間外）。
- イベントが重複するときの優先順位は **予約済み > 休館 > 営業時間**。
- 終日イベントの終了日は含めない（`[開始日,終了日)`）。
- 曜日値は月曜日1～日曜日7。表示時間範囲は営業時間・予定の前後原則1時間、データ不足時8:00～22:00。
- `RoomCalendar` は日表示・週内日付選択・前日/翌日/今日の移動を提供。
- 表示される「営業時間」は予約可能を保証しない。確定判断は予約確認APIで行う。

## 8. レビュー

- 詳細表示：`RoomDetail.reviews`, `hiddenHostReplies` に基づき公開レビューとホスト返信を表示。
- 投稿：予約履歴における`isUsed`の予約から投稿画面へ進む。
- `GET /api/rooms/{id}/reviews/new` の`canReview`と`alreadyReviewed`を尊重し、サーバー側の判定を優先する。
- `score`は1～5、レビュー本文は入力チェック・最大1000文字UI制限。
- `POST /api/ai/review-assist` は文章の補助であり、自動投稿しない。
- `POST /api/rooms/{id}/reviews` 完了後は画面状態を投稿済みに変更し、一覧再取得を行う。

## 9. 表示状態・例外

- 画面単位で`loading`, `error`, API結果をReact stateで保持。
- 検索・予約履歴はページ単位の再読み込みに対応。
- 通信失敗はエラー通知を表示し、勝手に成功・予約確定・決済完了にしない。
- UIの簡易入力判定と、サーバー側の最終判定を区別する。

## 10. 現時点の制限

バックエンドのDB構造や実際の認可ポリシー、Stripe Webhook、AIサービス内部、Android実機動作、E2Eテストは本設計書では検証していない。
