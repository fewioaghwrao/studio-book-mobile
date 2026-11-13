# Studio Book Mobile — React Native / Expo

**Studio Book（施設・時間枠予約管理）一般会員向け iOS / Android アプリ**の実装です。添付の Next.js フロントエンドの API 契約に合わせて新規作成しています。ブラウザ画面を WebView で包んだものではなく、React Native のネイティブ画面です。

## 対応状況

| 画面・機能 | 対応 | 接続先 |
| --- | --- | --- |
| スタジオ検索（キーワード・エリア・上限料金・ソート・ページング） | 実装 | `GET /api/rooms` |
| スタジオ詳細（画像・営業時間・予約イベント） | 実装 | `GET /api/rooms/{id}` |
| 空き時間の目安表示、日時選択 | 実装 | 既存詳細API `calendarEvents` を利用 |
| 予約可否・料金の最終確認 | 実装 | `POST /api/reservations/confirm` |
| Stripe Checkout 画面へ遷移 | 実装 | 上記APIの `checkoutUrl` を外部ブラウザで開く |
| ログイン / JWT Bearer | 実装 | `POST /api/auth/login`, `GET /api/auth/me` |
| 会員情報の閲覧と変更 | 実装 | `GET /api/auth/me`, `PUT /api/auth/me` |
| 予約履歴・決済状況・キャンセル済み表示 | 実装 | `GET /api/reservations` |
| 予約の**取消操作** | **バックエンドAPIの仕様確認が必要** | `.env` で明示的に有効化（未設定では操作できません） |
| 新規会員登録・パスワード再設定 | 未実装 | 今回対象外（既存Web版で提供） |
| ホスト・管理者画面 | 未実装 | 一般会員向けアプリのため対象外 |

> **重要**: Next.js の `reservations/page.tsx` にはキャンセル済みの表示がありますが、実際に取り消すボタンやAPI呼び出しはありません。URL・HTTPメソッドを推測して本番に送信しない設計にしています。

## 起動（Windows / macOS）

Node.js 22.13以上と Expo の開発環境が必要です。Androidエミュレーターは Android Studio、iOS シミュレーターは macOS + Xcode が必要です。iPhone実機は Expo Go / development build からの確認が可能ですが、利用するExpo SDKと端末側のExpo Go対応バージョンを一致させてください。

```bash
cd studio-book-mobile
npm install
cp .env.example .env
# Windows PowerShellでは: Copy-Item .env.example .env
# .env の EXPO_PUBLIC_API_BASE_URL を実際のAPIのHTTPS URLに変更
npx expo install --fix
npm run start
```

ExpoでQRコードを読み込むか、`a`（Android）/ `i`（macOSのiOS Simulator）で起動します。依存パッケージの更新後は `npm run typecheck` と `npm test` を実行してください。

- APIベースURL例：`https://your-heroku-api.example.com`。
- iOS / Android 実機では `localhost` は**端末自身**です。PC上で動かすAPIに接続したい場合、同一Wi-FiのPCのIPやHTTPSトンネルを利用してください。
- HTTPS証明書はOSに信頼される有効な証明書が必要です。Visual Studioのローカル開発証明書を実機が自動的に信頼するわけではありません。
- `.env` はコミット対象外です。`EXPO_PUBLIC_*` はアプリに埋め込まれる**公開設定値**なので、APIの秘密鍵・Stripe秘密鍵等は入れないでください。
- `ios.bundleIdentifier` / `android.package` は配布前に独自IDへ変更してください。

## キャンセル操作を有効にする条件

バックエンド側のキャンセル契約（エンドポイント、メソッド、認可、返金ルール、利用後の扱い）を確認してから `.env` に設定してください。

```env
# 以下はあくまで契約設定方法の例であり、既存APIが存在すると確認したURLではありません。
EXPO_PUBLIC_CANCEL_API_PATH=/api/reservations/{id}/cancel
EXPO_PUBLIC_CANCEL_API_METHOD=POST
```

設定時には一般会員の予約履歴で「キャンセル」ボタンが有効になります。確定前に確認ダイアログを表示し、API成功後に履歴を再取得します。**取消権限・締切・返金の最終判定は必ずバックエンド側で実装してください。**

## 日時と決済に関する注意

- 既存Web版の入力と合わせ、`2026-11-14T10:00:00` のように**タイムゾーンオフセット無しのローカル日時**を送信します。バックエンドがJST基準かどうかを統合テストで要確認です。実機を異なるタイムゾーンで使う場合は仕様の統一が必要です。
- 予約イベントは空き状況の**参考表示**です。ダブルブッキング防止はサーバーの `POST /api/reservations/confirm` および決済完了確定のトランザクションで保証してください。
- 同エンドポイントがStripe Checkout URLを返します。クライアントは `checkout.stripe.com` のHTTPS URLだけを既定で開きます。独自Checkoutドメイン利用時は `EXPO_PUBLIC_CHECKOUT_ALLOWED_HOSTS` を明示してください。
- 外部ブラウザで決済しただけではクライアントは決済済みと断定せず、履歴を再取得して状態を確かめます。StripeのWebhook処理・成功/失敗リダイレクトは既存バックエンドで要確認です。
- React NativeはWebの `localStorage` を使えないため、トークンは `expo-secure-store` で保管しています。アクセストークンの有効期限切れは再ログインが必要です。

## ディレクトリ

```text
app/
  (tabs)/index.tsx              検索・結果一覧
  (tabs)/reservations.tsx       予約履歴／任意のキャンセル操作
  (tabs)/account.tsx            会員情報
  rooms/[id]/index.tsx          スタジオ詳細／予約イベント
  rooms/[id]/book.tsx           ネイティブ日時入力
  rooms/[id]/confirm.tsx        予約確認／Stripe Checkout
  login.tsx                     ログイン
  profile-edit.tsx              会員情報編集
src/
  lib/api.ts                    API・SecureStore・URL検証
  lib/auth.tsx                  認証状態
  lib/bookingLogic.js           予約日時検証ロジック
  components/                   共通UI・日付選択・写真
assets/                          添付資料のスタジオ写真
```

## テスト

```bash
npm test            # Node標準テストランナーによる日時・重なり・ステータスのテスト
npm run typecheck   # TypeScriptの静的チェック（npm install後）
```

**作成環境の制限**: npmレジストリへの接続に失敗したため、ここでは `npm install` / `npm run typecheck` / Expo実機起動は実行できていません。TypeScript/TSX構文チェックは実施済み、JavaScriptロジックテスト4件は通過済みです。

**未実施項目**: iOS/Android実機UI確認、実稼働APIとの統合テスト、Stripeテスト決済、キャンセルAPI実装/確認、アクセシビリティ総合テスト、ストア配布作業。既存フロントのコード・画面構成を参照して実装していますが、バックエンドソースは添付されていないため、本番API動作保証はありません。
