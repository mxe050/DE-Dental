# 歯周病と糖尿病 アンケート Webアプリ

看護師向け講義「糖尿病と歯科」で使う、スマホ参加型のリアルタイム集計アプリです。
20問のアンケートに回答すると、その場で全員の集計結果が棒グラフで表示されます。

- **index.html** … 参加者（看護師）向けアンケート画面
- **admin.html** … 管理者（先生）向けページ（暗証番号で保護／ワンクリックでデータリセット）
- **?test=1** を付けたURLで開くと **テスト用DB** に切り替わり、本番データに影響しません

---

## セットアップ手順（初回のみ）

### ステップ1 — Firebase プロジェクトを作る

1. <https://console.firebase.google.com> にGoogleアカウントでログイン
2. 「プロジェクトを追加」→ プロジェクト名を自由に（例：`dental-quiz`）
3. Googleアナリティクスは **「有効にしない」** でOK
4. プロジェクトが作成されたら、左メニューの **「構築」→「Realtime Database」** を開く
5. **「データベースを作成」** → ロケーションは **「米国」** のまま → **「テストモードで開始」** を選択
6. データベースURL（`https://xxxxx-default-rtdb.firebaseio.com` の形）が表示されれば成功

> ⚠ **テストモードは30日間の期限付き** です（期限が来ると誰も書き込めなくなる）。
> 講義の前日に設定するか、期限が来たら下記「⑤ 期限延長の方法」を参照して延長してください。

### ステップ2 — Webアプリを登録して設定値を取得

1. Firebaseコンソールのプロジェクト概要画面に戻る
2. **「</>」（Webアプリ追加）** アイコンをクリック
3. アプリのニックネーム：`dental-quiz`（任意）
4. 「Firebase Hostingも設定する」は **チェックしない**
5. 「アプリを登録」を押すと、以下のような `firebaseConfig` が表示される

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy....................",
  authDomain: "dental-quiz-xxxxx.firebaseapp.com",
  databaseURL: "https://dental-quiz-xxxxx-default-rtdb.firebaseio.com",
  projectId: "dental-quiz-xxxxx",
  storageBucket: "dental-quiz-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

この値をコピーしておきます。

### ステップ3 — `firebase-config.js` を編集する

リポジトリ内の `firebase-config.js` を開き、2箇所を書き換えます：

```javascript
// ① firebaseConfig の中身を手順2でコピーした値に丸ごと置き換え
export const firebaseConfig = {
  apiKey: "AIzaSy....................",  // 実際の値
  ...
};

// ② 管理ページの暗証番号を好きな文字列に変更
export const ADMIN_PASSWORD = "自分で決めた暗証番号";
```

編集後、GitHubにプッシュ（コミット）します。

### ステップ4 — GitHub Pages を有効化する

1. GitHubのリポジトリ（`https://github.com/mxe050/DE-Dental`）を開く
2. **「Settings」タブ** → 左メニューの **「Pages」** を選択
3. **「Source」** で **「Deploy from a branch」** を選択
4. **「Branch」** で **`main`** → **`/ (root)`** を選択 → **「Save」**
5. 数分待つと `https://mxe050.github.io/DE-Dental/` でアクセスできるようになる

### ステップ5 — 動作確認

- **参加者ページ**：`https://mxe050.github.io/DE-Dental/`
- **管理ページ**：`https://mxe050.github.io/DE-Dental/admin.html`
- **テストモード**：`https://mxe050.github.io/DE-Dental/?test=1`

自分のスマホと PC の両方で参加者ページを開き、異なる回答を選んで、リアルタイムに集計が反映されることを確認してください。

---

## 当日の運用

### 事前準備（前日までに）
1. **管理ページ**にログインして「本番データをリセット」を押し、データを初期化
2. 参加者ページのURL（本番URL）をQRコード化してスライドに貼る
   - QRコード作成は <https://qr.quel.jp/> 等の無料サイトでOK
3. 必要に応じて `?test=1` 版で何度でもリハーサル

### 当日
1. 講義開始前、QRコードをスクリーンに表示
2. 「スマホで読み取ってください。好きなタイミングで回答してくださいね」と声かけ
3. 講義中、気になるタイミングで先生ご自身のスマホからURLを開き、集計結果を確認
4. 講義の締めくくりに、参加者へ「最後のまとめの質問にも答えてくださいね」と促す

### 参加者がやり直したくなったら
- 同じURLを開き直して別の選択肢をタップするだけで、回答が上書きされます

---

## 管理ページの使い方

1. `https://mxe050.github.io/DE-Dental/admin.html` にアクセス
2. `firebase-config.js` で設定した暗証番号を入力 → ログイン
3. **「本番データをリセット」** または **「テストデータをリセット」** を押す
4. 確認ダイアログで OK を押すと即座にデータが消去されます
   - 参加者のスマホ画面の選択状態も自動的にクリアされます

回数制限はありません。何度でもリセットできます。

---

## Firebase のセキュリティルール（期限延長の方法）

### 期限切れで書き込めなくなったとき
デフォルトの「テストモード」は30日で期限切れになり、その日以降はエラーが出て回答が保存されません。

解決策は2つあります：

### 方法A（推奨・簡単）— 期限なしの公開ルールに変更
1. Firebaseコンソール → **「Realtime Database」** → **「ルール」タブ**
2. 以下のルールに書き換えて **「公開」** をクリック

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

これで **期限なし・無期限に使える** ようになります。

> ⚠ セキュリティ注意：このルールは「誰でも読み書き可能」です。
> 講義など短期間・内輪の用途ならOKですが、長期間放置する場合は方法Bへ。

### 方法B（より安全）— 限定的な公開ルール
より安全にするには、書き込み先のパスを限定します：

```json
{
  "rules": {
    "production": {
      "responses": { ".read": true, ".write": true },
      "presence":  { ".read": true, ".write": true },
      "resetToken":{ ".read": true, ".write": true }
    },
    "test": {
      "responses": { ".read": true, ".write": true },
      "presence":  { ".read": true, ".write": true },
      "resetToken":{ ".read": true, ".write": true }
    }
  }
}
```

### 期限を再度延長したいだけの場合（テストモード継続）
1. Firebaseコンソール → 「Realtime Database」 → 「ルール」タブ
2. 既存のルール内の日付（`timestamp < ...` の部分）を未来の日付に変更 → 公開
3. もしくは方法A/Bに切り替えれば以後は期限切れを気にする必要がありません

---

## 無料枠について

Firebase Realtime Database の Spark プラン（無料）の枠：
- 同時接続 **100人** まで
- ストレージ **1GB**
- 月間ダウンロード **10GB**

この用途（100人規模、1回30分の講義、テキストのみ）では
実質使い切れないレベルの余裕があります。
年に数回使うだけなら無料枠で十分です。

---

## トラブルシューティング

| 症状 | 原因と対処 |
|---|---|
| ページを開くと「Firebase設定が未完了です」 | `firebase-config.js` の編集を忘れている、または値が古い |
| 回答しても集計に反映されない | ルールの期限切れ。「Realtime Database」→「ルール」を方法Aに変更 |
| 「参加中」の人数が多すぎる | ブラウザを強制終了した端末が残存。管理ページでリセットすれば正常化 |
| 管理ページに入れない | 暗証番号を確認。わからなくなったら `firebase-config.js` を修正して再デプロイ |
| iPhoneで画面が崩れる | キャッシュクリアして再読込（Safari：設定→Safari→履歴とWebサイトデータ） |

---

## ファイル構成

```
DE-Dental/
├── index.html           参加者画面
├── admin.html           管理者画面
├── app.js               参加者画面のロジック
├── admin.js             管理者画面のロジック
├── firebase-config.js   Firebase設定（ここを編集）
├── style.css            スタイル
└── README.md            このファイル
```

---

## 質問データのカスタマイズ

来年以降、質問を変えたい場合は `app.js` の先頭にある `QUESTIONS` 配列を編集してください。
20問より増減させても動作します（HTMLの変更は不要）。

---

制作：湯浅 秀道 (Hidemichi Yuasa) / Claude Code
