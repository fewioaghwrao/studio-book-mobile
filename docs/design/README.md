# Studio Book Mobile — 設計資料

本資料は **Studio Book Mobile（React Native / Expo）** のモバイルクライアント設計を、2026-11-17時点のソースコードおよびローカル検証ログから整理したものです。

> **文書の位置付け**：実装を根拠に作成した「実装準拠」の設計書です。既存の Web / ASP.NET Core バックエンド内部の実装、DB 定義、AI のプロンプト、Stripe Webhook の詳細はこの資料の検証範囲外です。API 入出力はモバイル側の呼び出しコードと型定義を根拠にしています。

| 文書 | 内容 | 主な参照ソース |
|---|---|---|
| [要件定義書](requirements-definition.md) | 目的、対象ユーザー、機能要件、非機能要件、対象外 | `app/`, `README.md` |
| [基本設計書](basic-design.md) | システム構成、画面遷移、主要ユースケース、責務分界 | `app/`, `src/lib/` |
| [詳細設計書](detail-design.md) | ロール判定、APIクライアント、予約、決済、AI、カレンダー、レビュー | `src/lib/`, `src/components/` |
| [API連携設計書](api-integration.md) | リクエスト、主要レスポンス、認証要否、失敗時の挙動 | `src/lib/api.ts`, `src/types.ts` |
| [テスト設計書](test-design.md) | 58テストの内訳、確認項目、CI、対象外 | `tests/`, `.github/workflows/ci.yml` |

## 画面キャプチャ

[画面一覧](../screenshots.md) | [スタジオ検索](../images/メイン画面1.png) | [予約確認](../images/スタジオ予約確認3.png) | [予約履歴](../images/予約履歴.png)

## 設計上の重要な前提

- アプリ内でログインできるのは **`GeneralUser` のみ**。`Host` / `Admin` を兼ねるユーザーも拒否する
- **一般ユーザーから予約取消は行わない**。ホスト・管理者側の機能であり、モバイル側は取消済みを閲覧する
- 予約日時・料金・空き状況は**サーバーに再確認**する。カレンダーの空き表示だけで確定しない
- Stripe Checkout は外部ブラウザで表示し、**ブラウザから戻ったことを決済成功と扱わない**
- 既存 ASP.NET Core API を Web 版と共通利用する。AI キーや Stripe 秘密鍵をアプリに配置しない
- iOS は Expo Go で画面確認済み。Android 実機・E2E・実決済は文書化時点で未確認／対象外

## 更新ルール

画面や API を変更した場合、該当する設計書と `tests/` の変更を合わせて確認してください。CI の実行結果は GitHub Actions の実行履歴が正とし、設計書内のローカル実行結果と混同しません。
