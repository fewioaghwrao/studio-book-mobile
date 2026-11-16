# テスト設計書 — Studio Book Mobile

- 更新日：2026-11-17
- テスト方針：**E2Eテストを実施しない**。ロジック単体・モックAPIユースケース・型チェック・手動確認を分離する。

## 1. テスト構成

| 分類 | 実行方法 | 実施範囲 |
|---|---|---|
| ロジック単体テスト | `npm test` (`node --test`) | JSモジュールのバリデーションや状態判定 |
| モックによるユースケーステスト | `npm test` | 認証フロー、JWT、API通信、予約確認、Checkout URL検証 |
| 型チェック | `npm run typecheck` | TypeScript/TSX（`tsc --noEmit`） |
| Expo依存関係確認 | `npx expo install --check` | Expo SDKとパッケージの整合性 |
| CI | GitHub Actions | `npm ci` → `npm test` → `npm run typecheck` |
| 手動実機確認 | iPhone Expo Go | 画面表示・操作の目視確認（自動テスト外） |
| **E2E** | **実施しない** | 実APIを使った一連の業務操作・実決済等は対象外 |

## 2. 58件の内訳

| テストファイル | 件数 | 主な検証対象 |
|---|---:|---|
| `access-policy.test.mjs` | 2 | 一般会員と管理権限の区別 |
| `ai-search.test.mjs` | 6 | AI日時ラベル、予約確認への引継ぎ、空きなし拒否、人数条件 |
| `api-request.test.mjs` | 8 | JWT Bearer、401/403、公開API、204・非JSON・不正URL |
| `auth-flow.test.mjs` | 11 | ログイン・保存・復元・拒否ロール・ログアウト・通信障害 |
| `booking-confirm.test.mjs` | 8 | 予約確認送信、日時チェック、ロール、409/403・通信失敗 |
| `booking.test.mjs` | 6 | ローカル日時、過去時刻、重複判定、予約ステータス |
| `calendar.test.mjs` | 7 | 30分枠、優先順位、終日休館、営業時間と日付移動 |
| `review.test.mjs` | 3 | レビュー本文・スコア、`canReview`、星表示 |
| `stripe-checkout.test.mjs` | 7 | Checkout許可URL、不正ホスト拒否、ブラウザ起動、成功誤認防止 |
| **合計** | **58** | |

## 3. 領域別重要確認事項

### 3.1 認証・API

- `GeneralUser`のみログイン、管理ロール兼任は拒否
- JWTなしでは認証必須APIへ送信しない
- ログイン不完全・不適切ロール時のJWT削除
- 401時は削除、403時は維持
- ネットワークエラー時に不適切にJWTを消さない
- `Authorization` ヘッダーが呼び出し元で偽装されても保存JWTを採用

### 3.2 予約確認

- Room ID、開始／終了日時の形式・大小関係
- `GeneralUser`のときだけ確認APIを呼び出す
- サーバーの空き状況・料金を端末で再計算しない
- 409/403/通信失敗時に予約確定扱いしない
- 通常予約およびAI検索から引き継ぐ日時の検証

### 3.3 Stripe Checkout

- `checkout.stripe.com`のHTTPS URLのみ基本許可
- HTTP、偽サブドメイン、userinfo付きURL、未知ホストを拒否
- 設定した独自ホストは完全一致のみ許可
- ブラウザ起動の失敗を伝播する
- ブラウザから戻っただけで決済成功と判定しない

### 3.4 カレンダー・レビュー・AI検索

- 営業時間/休館/予約済みの色分け論理、終日終了日の排他
- AI日時の正規化と可用性フラグ確認
- レビュー投稿権限は`canReview`を尊重し、投稿文のルールを検証

## 4. CI設計

- `.github/workflows/ci.yml`：`main`へのPush、`main`宛Pull Request、手動実行。
- 実行ランナー：`ubuntu-latest`、Node.js 22、npm依存キャッシュ。
- `npm ci --no-audit --no-fund` → `npm test` → `npm run typecheck` のどれかが失敗すればジョブは失敗。
- **依存関係の不整合があれば`npm ci`の段階で停止**するため、`package.json`と`package-lock.json`の整合性を維持する。
- CIはE2E・Expo実機ビルド・Stripe実決済テストを実施しない。

## 5. 実行結果と留意点

| 項目 | 2026-11-17の利用者ローカルログ |
|---|---|
| `npm test` | 58件成功、失敗0件 |
| `npm run typecheck` | エラー出力なし |
| `npx expo install --check` | `Dependencies are up to date` |
| Node.js | v20.18.1。Expo CLIはv22.13以降への更新を要求 |
| GitHub Actions | 本資料では最終成功状態を確認していない |

> **注意**：これらは提示されたローカルログの記録です。CIの成功やAndroid動作、実API連携の動作を保証するものではありません。

## 6. 自動テストの対象外・残課題

- React Native画面を直接レンダリングするコンポーネントテスト
- 実バックエンド接続、他人の予約に対する認可拒否、Stripe Webhookの結合検証
- 予約・決済・レビューの実環境を使った一連のE2E操作
- Android実機・エミュレーター、iOS独立アプリビルド
- `expo-web-browser`の実機動作、オフライン時UI、日付・タイムゾーン境界の実環境確認

今回はE2Eを増やすのではなく、要所のモックテスト、型チェック、必要な手動目視を継続する。
