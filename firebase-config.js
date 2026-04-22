// ============================================================
// Firebase 設定ファイル
//
// 手順:
// 1) https://console.firebase.google.com でプロジェクトを作成
// 2) 「Realtime Database」を作成 (ロケーションはどこでも可、
//    セキュリティルールは「テストモード」を選択)
// 3) プロジェクト概要画面で「</>」(Webアプリ追加) をクリック
// 4) 表示された firebaseConfig をコピーして、下記にそのまま置き換え
// 5) ADMIN_PASSWORD を好きな文字列・数字に変更
//
// 詳しくは README.md を参照してください。
// ============================================================

export const firebaseConfig = {
  apiKey: "AIzaSyBwZLHnJULsTLRRMefzRHFa9sfbd0Pgg4E",
  authDomain: "dmdental-quiz.firebaseapp.com",
  databaseURL: "https://dmdental-quiz-default-rtdb.firebaseio.com",
  projectId: "dmdental-quiz",
  storageBucket: "dmdental-quiz.firebasestorage.app",
  messagingSenderId: "796909745003",
  appId: "1:796909745003:web:f86515115736b530bc122e"
};

// 管理ページ (admin.html) に入るための暗証番号
// 好きな文字列・数字に変更してください
export const ADMIN_PASSWORD = "yuasa2026";
