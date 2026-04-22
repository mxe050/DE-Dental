import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getDatabase, ref, remove, set, get } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import { firebaseConfig, ADMIN_PASSWORD } from './firebase-config.js';

const loginEl = document.getElementById('login');
const panelEl = document.getElementById('panel');
const pwInput = document.getElementById('pw');
const loginBtn = document.getElementById('loginBtn');
const loginErr = document.getElementById('loginErr');
const resetMsg = document.getElementById('resetMsg');

// Firebase 設定チェック
if (!firebaseConfig || !firebaseConfig.apiKey || firebaseConfig.apiKey === 'YOUR_API_KEY_HERE') {
  loginErr.textContent = 'Firebase設定が未完了です。firebase-config.js を編集してください。';
  loginBtn.disabled = true;
}

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ---------- ログイン ----------
loginBtn.addEventListener('click', () => {
  if (pwInput.value === ADMIN_PASSWORD) {
    loginEl.style.display = 'none';
    panelEl.style.display = 'block';
    refreshStats();
  } else {
    loginErr.textContent = '暗証番号が違います。';
  }
});

pwInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') loginBtn.click();
});

// ---------- リセット ----------
async function resetPath(prefix, label) {
  if (!confirm(`${label}のデータを全削除します。よろしいですか？`)) return;
  resetMsg.textContent = 'リセット中…';

  try {
    // 回答とプレゼンスを削除
    await Promise.all([
      remove(ref(db, `${prefix}/responses`)),
      remove(ref(db, `${prefix}/presence`))
    ]);
    // リセットトークンを更新（参加者の端末にも反映させるため）
    const token = Date.now().toString();
    await set(ref(db, `${prefix}/resetToken`), token);

    resetMsg.textContent = `✓ ${label} をリセットしました（${new Date().toLocaleTimeString()}）`;
    refreshStats();
  } catch (err) {
    resetMsg.textContent = `エラー: ${err.message}`;
  }
}

document.getElementById('resetProd').addEventListener('click', () => {
  resetPath('production', '本番データ');
});

document.getElementById('resetTest').addEventListener('click', () => {
  resetPath('test', 'テストデータ');
});

// ---------- 統計 ----------
async function refreshStats() {
  try {
    const [prodResp, prodPres, testResp, testPres] = await Promise.all([
      get(ref(db, 'production/responses')),
      get(ref(db, 'production/presence')),
      get(ref(db, 'test/responses')),
      get(ref(db, 'test/presence'))
    ]);

    const countChildren = (snap) => snap.val() ? Object.keys(snap.val()).length : 0;
    const sumVotes = (snap) => {
      const v = snap.val();
      if (!v) return 0;
      let total = 0;
      Object.values(v).forEach(q => {
        ['A','B','C','D'].forEach(k => { total += (q[k] || 0); });
      });
      return total;
    };

    document.getElementById('prodStats').textContent =
      `回答件数 ${sumVotes(prodResp)} / 質問数 ${countChildren(prodResp)} / 現在の接続 ${countChildren(prodPres)} 人`;
    document.getElementById('testStats').textContent =
      `回答件数 ${sumVotes(testResp)} / 質問数 ${countChildren(testResp)} / 現在の接続 ${countChildren(testPres)} 人`;
  } catch (err) {
    document.getElementById('prodStats').textContent = `取得エラー: ${err.message}`;
  }
}

document.getElementById('refreshBtn').addEventListener('click', refreshStats);
