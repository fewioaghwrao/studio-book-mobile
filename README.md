# Studio Book Mobile — React Native / Expo

**Studio Book（施設・時間枠予約管理）一般会員向け iOS / Android アプリ**の実装です。添付の Next.js フロントエンドの API 契約に合わせて新規作成しています。ブラウザ画面を WebView で包んだものではなく、React Native のネイティブ画面です。

## 対応状況

| 画面・機能 | 対応 | 接続先 |
| --- | --- | --- |
| スタジオ検索（キーワード・エリア・上限料金・ソート・ページング） | 実装 | `GET /api/rooms` |
| AI自然文スタジオ検索（結果、解釈条件、おすすめ理由、日時別空き状況） | 実装 | `POST /api/ai/room-search`（Web版と共通） |
| スタジオ詳細（画像・営業時間・日表示カレンダー・レビューとホスト返信） | 実装 | `GET /api/rooms/{id}` |
| 日表示カレンダー（営業時間・休館・予約済みを色分け、前日・翌日・週内選択・今日へ） | 実装 | 既存詳細API `calendarEvents`, `businessHours` を利用 |
| レビュー閲覧（点数・本文・ホスト返信・ホストのお知らせ） | 実装 | `GET /api/rooms/{id}` |
| レビュー投稿（利用済み予約から、1〜5点、1000文字、投稿可否確認） | 実装 | `GET /api/rooms/{id}/reviews/new`, `POST /api/rooms/{id}/reviews` |
| AIレビュー文補助 | 実装 | `POST /api/ai/review-assist` |
| 空き時間の目安表示、日時選択 | 実装 | 既存詳細API `calendarEvents` を利用 |
| 予約可否・料金の最終確認 | 実装 | `POST /api/reservations/confirm` |
| Stripe Checkout 画面へ遷移 | 実装 | 上記APIの `checkoutUrl` を外部ブラウザで開く |
| ログイン / JWT Bearer（一般会員のみ） | 実装 | `POST /api/auth/login`, `GET /api/auth/me`。`GeneralUser` のみログイン許可。パスワード表示・非表示切替つき |
| 会員情報の閲覧と変更 | 実装 | `GET /api/auth/me`, `PUT /api/auth/me` |
| 予約履歴・決済状況・キャンセル済み表示 | 実装 | `GET /api/reservations` |
| 予約の取消操作 | 対象外 | 取消はホスト・管理者側で実施。一般会員向けアプリは閲覧のみ |
| 新規会員登録・パスワード再設定 | 未実装 | 今回対象外（既存Web版で提供） |
| ホスト・管理者画面 | 未実装 | 一般会員向けアプリのため対象外 |

> **予約取消の仕様**: 一般会員はこのアプリから予約を取り消せません。取消操作はホスト・管理者側の機能とし、モバイル版では取消後の「キャンセル済み」ステータスを閲覧するだけです。取消APIや設定項目も設けません。
>
> **モバイル版のログイン制限**: ログインAPIの応答で受け取ったJWTを使って `GET /api/auth/me` でロールを確かめ、`GeneralUser` のみ許可します。`Host`、`Admin`、ロール不明のアカウントは端末からトークンを削除し、ログイン失敗を表示します。以前保存した管理者等のトークンも起動時の認証復元で削除します。**これはモバイルUI側の制限であり、API全体の認可制限を代替しません**。

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

## AI検索（今回追加）

- 通常検索トップの **「✦ AIでスタジオを探す」** から `/rooms/ai-search` に遷移します。
- Web版と同じ `POST /api/ai/room-search` に `{ "query": "自然文の検索内容" }` を送信します。AI APIキーはモバイルアプリに保存しません。公開API側でAIを実行する設計です。
- 最大200文字、入力例、AIが解釈した条件（用途・雰囲気・エリア・予算・人数・日時・時間帯・キーワード）、推薦理由、各スタジオの空き状況を表示します。
- 429（検索回数制限）は利用者向けメッセージを表示します。認証は既存Web版に合わせて **検索段階では不要** です（API側の公開設定は動作確認が必要です）。
- `requestedSlot` が存在し、対象スタジオの `availability.isAvailable === true` の場合に限り「この日時で予約確認へ」を表示。AIの日時はオフセットなしのJST壁時計文字列として扱い、端末タイムゾーンによる時刻変化を防ぎます。
- 予約確認画面では引き継いだ日時をそのまま既存 `POST /api/reservations/confirm` で再判定します。予約には一般ユーザーのログインが必要です。AI検索結果だけで空き室を確約しません。
- 既存の「一般ユーザー向け予約取消は行わない」仕様に変更はありません。


## カレンダー・レビュー（Web版と同じAPIを利用）

### ① スタジオ詳細カレンダー

- **表示場所**：スタジオ詳細画面の「空き状況カレンダー」。Web版のモバイル幅の `timeGridDay` と同じく、**1日単位**で表示。
- 前日・翌日・今日へ戻る・週内の日付タップで移動できます。30分単位の時刻行で、`open`（営業時間：緑）、`closure`（休館：灰）、`reservation`（予約済み：赤）を表示します。
- Web版の `businessHours`、`calendarEvents` を利用し、営業時間・予定の前後1時間を表示。予定の種別はレスポンスの `type` に従い、個人情報を含み得るイベントの `title` は表示しません。
- **重要**：`open` は営業中を示す背景イベントであり、予約の衝突として扱いません。これに合わせて `bookingLogic.js` の重複判定も修正しました。`reservation` と `closure` のみ予約ブロックの対象です。
- カレンダーは参考表示です。開いている時間でも予約が可能とは限らず、予約確定前の `POST /api/reservations/confirm` が必須です。
- Web版のFullCalendarはReact DOM向けなので移植せず、React NativeのView/Pressableでスマホ向け日表示を実装しました。**データ・色分け・操作目的を共通化**し、ライブラリそのものは共通にしていません。

### ② レビュー閲覧・投稿・AIレビュー文補助

- **公開レビュー**：スタジオ詳細に平均点・件数、スコア、本文、投稿者、日時、ホスト返信を表示。APIが公開する `hiddenHostReplies` はホストのお知らせとして、原文レビューを出さず返信だけ表示します。
- **投稿導線**：予約履歴の `isUsed === true` の予約に「レビューを書く」を表示。`/rooms/[id]/reviews/new?reservationId=...` へ進みます。
- **閲覧・投稿条件**：モバイル版は `GeneralUser` のみログイン可能。`GET /api/rooms/{id}/reviews/new?page=1&pageSize=10&reservationId=N` で `canReview` / `alreadyReviewed` を取得し、**サーバーが `canReview` を返した場合だけ**投稿フォームを表示します。投稿可否は端末内の状態だけで決定しません。
- **投稿**：星1〜5、必須コメント最大1000文字。`POST /api/rooms/{id}/reviews` に `{ reservationId, score, content }` を送信。投稿中の二重送信を抑止し、投稿完了後は投稿済み状態を再取得します。
- **AI整文**：下書きのある場合に `POST /api/ai/review-assist` へ `{content, score, roomName}` を送信。返却された `assistedContent` を編集欄に反映。内容を確認・修正してから投稿します。API鍵はアプリ内に保持しません。
- レビュー投稿画面のレビュー一覧はWeb版と同様に10件単位のページングです。
- 一般会員の予約取消機能は追加していません。**取消はホスト・管理者側で行う従来仕様のまま**です。

### 確認してほしい操作（iOS Expo Go）

1. スタジオ詳細を開く → カレンダーで前日・翌日・日付選択と3色の表示を確認。
2. 営業時間の `open` と、予約済み／休館の `reservation` / `closure` を見比べる。
3. 予約画面で営業時間 `open` が「重複あり」と判定されなくなったことを確認。予約可否はAPIで再確認する。
4. 一般会員でログインし、**利用済み**の予約履歴から「レビューを書く」を開く。
5. `canReview=true` の会員だけ星評価・入力フォームが出ること、AI整文結果を編集できること、投稿後に投稿済み表示になることを確認。
6. Web版のスタジオ詳細でレビュー・ホスト返信が同じ内容で表示されることを確認。

開発環境では `npm test`（カレンダー・レビュー含む）と `npm run typecheck` の実行を推奨します。ここでの検証はロジックテストとTypeScript/TSX構文チェックで、Expo Go実機・API接続テストではありません。

## 予約取消に関する仕様（一般会員は操作不可）

- **一般会員向けモバイル版には「予約取消」ボタン・API呼び出しを実装しません。**
- 予約の取り消しは、既存システムのホスト・管理者側で行う設計です。
- 一般会員は「予約履歴」で予約・決済・キャンセル済みの**状態を確認**できます。
- キャンセル操作のための `.env` 設定も不要です。バックエンド側の権限制御は別途維持してください。

## ログイン画面とトップ画面

- ログイン画面は一般会員（`GeneralUser`）専用です。パスワード入力欄の「表示／非表示」で、入力文字のマスクを切り替えられます。
- 検索トップの「ぴったりの空間を、」「スマホで予約。」は、文字列 `\n` の表示ではなく、実際に2行に改行します。

## 日時と決済に関する注意

- 既存Web版の入力と合わせ、`2026-11-14T10:00:00` のように**タイムゾーンオフセット無しのローカル日時**を送信します。バックエンドがJST基準かどうかを統合テストで要確認です。実機を異なるタイムゾーンで使う場合は仕様の統一が必要です。
- 予約イベントは空き状況の**参考表示**です。ダブルブッキング防止はサーバーの `POST /api/reservations/confirm` および決済完了確定のトランザクションで保証してください。
- 同エンドポイントがStripe Checkout URLを返します。クライアントは `checkout.stripe.com` のHTTPS URLだけを既定で開きます。独自Checkoutドメイン利用時は `EXPO_PUBLIC_CHECKOUT_ALLOWED_HOSTS` を明示してください。
- 外部ブラウザで決済しただけではクライアントは決済済みと断定せず、履歴を再取得して状態を確かめます。StripeのWebhook処理・成功/失敗リダイレクトは既存バックエンドで要確認です。
- React NativeはWebの `localStorage` を使えないため、トークンは `expo-secure-store` で保管しています。アクセストークンの有効期限切れは再ログインが必要です。

## ディレクトリ

```text
app/
  (tabs)/index.tsx              検索・結果一覧／AI検索への入口
  rooms/ai-search.tsx            AI自然文検索画面・推薦結果・日時別空き状況
  (tabs)/reservations.tsx       予約履歴／状況の閲覧（取消操作なし）
  (tabs)/account.tsx            会員情報
  rooms/[id]/index.tsx          スタジオ詳細／カレンダー／公開レビュー
  rooms/[id]/reviews/new.tsx    レビュー投稿・AI文章補助・レビュー一覧
  rooms/[id]/book.tsx           ネイティブ日時入力
  rooms/[id]/confirm.tsx        予約確認／Stripe Checkout
  login.tsx                     ログイン
  profile-edit.tsx              会員情報編集
src/
  lib/api.ts                    API・SecureStore・URL検証
  lib/auth.tsx                  認証状態
  lib/bookingLogic.js           予約日時検証ロジック
  lib/aiSearchLogic.js          AI検索日時・予約遷移の検証ロジック
  lib/calendarLogic.js          日表示カレンダー判定
  lib/reviewLogic.js            レビュー入力検証
  components/RoomCalendar.tsx   カレンダーUI
  components/RoomReviews.tsx    レビュー閲覧UI
  components/                   共通UI・日付選択・写真
assets/                          添付資料のスタジオ写真
```

## テスト

```bash
npm test            # Node標準テストランナーによる日時・重なり・ステータスのテスト
npm run typecheck   # TypeScriptの静的チェック（npm install後）
```

**作成環境の制限**: 依存パッケージをインストールしたiOS/Android実機での今回のUI修正の動作確認は未実施です。`npm test` はWindowsでも動くよう `node --test` に修正しました。

**未実施項目**: iOS/Android実機UI確認、実稼働APIとの統合テスト、Stripeテスト決済、アクセシビリティ総合テスト、ストア配布作業。既存フロントのコード・画面構成を参照して実装していますが、バックエンドソースは添付されていないため、本番API動作保証はありません。

## 今回の更新（一般会員専用ログイン）

- `src/lib/accessPolicy.js`: `GeneralUser`のみ許可。ホスト・管理者の複合ロールも拒否
- `src/lib/auth.tsx`: ログイン成功直後と保存済みトークン復元時に本人のロールをチェック。対象外ならSecureStoreのJWTを破棄
- `app/login.tsx`: 一般会員専用の案内を表示
- `tests/access-policy.test.mjs`: ロール許可・拒否のテストを追加

ログイン画面を変更するだけではなく、認証処理で判定しています。ASP.NET Core APIのロール別認可は従来どおり維持してください。

## 今回の更新（予約取消の除外、入力UI・見出し調整）

- `app/(tabs)/reservations.tsx`: 予約取消操作・API未設定の警告を除去し、ホスト・管理者が取り消す仕様を明記。キャンセル済みのステータス表示は残しています。
- `src/lib/api.ts` と `.env.example`: 一般会員による取消用API・環境変数を削除。
- `src/components/UI.tsx` と `app/login.tsx`: パスワードの表示／非表示切替を追加。
- `app/(tabs)/index.tsx`: トップ見出しの `\n` が文字として表示されないよう改行を修正。
- `package.json`: WindowsのPowerShellでもテストを実行できるよう `node --test` に修正。

## 今回の更新（AIスタジオ検索画面）

- `app/rooms/ai-search.tsx`: Web版と共通APIの自然文AI検索画面を追加（入力例、検索結果、解釈条件、推薦理由、空き状況）。
- `app/(tabs)/index.tsx`, `app/_layout.tsx`: AI検索への入口と画面ルートを追加。
- `src/lib/api.ts`, `src/types.ts`: AI検索API呼び出しとWeb版のレスポンス型を追加。
- `src/lib/aiSearchLogic.js`, `tests/ai-search.test.mjs`: 日時をJST壁時計文字列のまま引き継ぐロジックとテストを追加。

### 起動・確認

```powershell
npm test
npm run typecheck
npx expo start --clear
```

1. 「探す」タブから「✦ AIでスタジオを探す」を選択。
2. 入力例を選択し検索。Web版同様にAPIの検索結果・推薦理由・解釈条件を確認。
3. 日時を含む自然文で検索し、空き状況に「予約可能」が出るスタジオだけ「この日時で予約確認へ」を確認。
4. ログイン後、予約確認画面で空き状況と金額を再判定。決済連携の実機試験は別途実施。

**検証範囲**: 予約日時・AI予約遷移のロジックはNodeテストで確認可能です。iOS/Androidの実機AI API通信、検索回数制限の応答、Stripe連携は環境ごとの統合テストが必要です。
