import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getDatabase, ref, set, get, onValue, runTransaction,
  onDisconnect, serverTimestamp, remove
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import { firebaseConfig } from './firebase-config.js';

// ---------- 質問データ（20問） ----------
const QUESTIONS = [
  { id: 1, section: 'intro', text: 'あなた自身は歯間ブラシを使っていますか？',
    options: { A: '毎日使っている', B: '時々使う', C: '使っていない', D: '持っていない' } },
  { id: 2, section: 'intro', text: '糖尿病の入院患者さんの口の中を、最後に観察したのはいつですか？',
    options: { A: '今週中に観察した', B: '今月中に観察した', C: 'それ以前', D: '観察したことがない' } },
  { id: 3, section: 'intro', text: '入院患者さんに歯科受診を勧めたことがありますか？',
    options: { A: '頻繁にある', B: '時々ある', C: 'ほとんどない', D: '一度もない' } },
  { id: 4, section: 'intro', text: '歯周病と糖尿病の関係について、自分の知識は十分だと思いますか？',
    options: { A: '十分だと思う', B: '基本的なことは知っている', C: 'あまり知らない', D: 'ほとんど知らない' } },

  { id: 5, section: 'ch1', text: '歯周病は糖尿病の第何の合併症と呼ばれている？',
    options: { A: '第4の合併症', B: '第5の合併症', C: '第6の合併症', D: '第7の合併症' } },
  { id: 6, section: 'ch1', text: '糖尿病患者の歯周炎の有病率は、一般人口のおよそ何倍？',
    options: { A: 'ほぼ同じ', B: '1.5倍', C: '2〜3倍', D: '5倍以上' } },
  { id: 7, section: 'ch1', text: '喫煙は歯周炎の重症度を何倍に増加させると指摘されている？',
    options: { A: '2倍', B: '5倍', C: '10倍', D: '20倍' } },
  { id: 8, section: 'ch1', text: '歯周基本治療により、HbA1cはおおよそどの程度改善すると報告されている？',
    options: { A: '0.1〜0.2%', B: '0.5〜0.7%', C: '1.0〜1.5%', D: '2.0%以上' } },
  { id: 9, section: 'ch1', text: '歯周治療でHbA1cが改善しても「歯周病治療が糖尿病を治す」と断言できない理由は？',
    options: {
      A: '研究の数が少ないから',
      B: '歯磨きを頑張る人は他の健康行動もしているかもしれないから（交絡因子）',
      C: 'HbA1cの下がり幅が小さいから',
      D: '海外の研究だから'
    } },

  { id: 10, section: 'ch2', text: '「歯肉炎」と「歯周炎」の違いは？',
    options: {
      A: '歯肉炎は子ども、歯周炎は大人の病気',
      B: '歯肉炎は歯肉のみの炎症、歯周炎は骨の吸収も伴う',
      C: '違いは重症度の程度だけ',
      D: '同じ病気の別の呼び方'
    } },
  { id: 11, section: 'ch2', text: '歯垢（プラーク）の正体は？',
    options: {
      A: '食べ物のカス',
      B: '口の中の細菌の塊',
      C: '唾液の成分が固まったもの',
      D: '歯のエナメル質がはがれたもの'
    } },
  { id: 12, section: 'ch2', text: 'プラークはどのくらいの時間で「悪さをする量」になる？',
    options: { A: '約1時間', B: '約6時間', C: '約24時間', D: '約72時間' } },
  { id: 13, section: 'ch2', text: '歯周炎のグレードC（最も急速に進行）に分類される目安となるHbA1cは？',
    options: { A: '5.5%以上', B: '6.0%以上', C: '7.0%以上', D: '8.5%以上' } },
  { id: 14, section: 'ch2', text: '歯肉炎はおおよそ何歳頃から始まることがある？',
    options: { A: '10代から', B: '20代から', C: '40代から', D: '60代以降' } },

  { id: 15, section: 'ch3', text: 'プラークを除去する上で、最も効果的な方法は？',
    options: {
      A: '飲むタイプの含嗽剤（抗菌剤）',
      B: 'ポピドンヨード等の消毒薬',
      C: 'お茶のカテキン',
      D: '歯ブラシによる機械的除去'
    } },
  { id: 16, section: 'ch3', text: '歯科で定期的に歯石を取っていれば、歯周病は予防できますか？',
    options: {
      A: 'はい、歯石除去だけで十分',
      B: 'いいえ、歯石は化石のようなもので、日々のセルフケア（歯磨き）が根幹',
      C: '半年に1回の歯石除去があれば他は不要',
      D: '人によって異なる'
    } },
  { id: 17, section: 'ch3', text: '歯間ブラシの正しい使い方の意識は？',
    options: {
      A: '食べカスを取り除くために使う',
      B: '隣り合った歯の側面を磨くために使う',
      C: '歯肉をマッサージするために使う',
      D: '口臭予防のために使う'
    } },
  { id: 18, section: 'ch3', text: '歯ブラシの毛先が直接届かない場所のプラークはどうなる？',
    options: {
      A: '唾液で自然に洗い流される',
      B: '毛先が当たらない場所のプラークは落ちない',
      C: '含嗽剤で補える',
      D: 'フッ素で防げる'
    } },
  { id: 19, section: 'ch3', text: '虫歯予防と歯周病予防の、効果的な歯磨きの戦略は？',
    options: {
      A: '同じ戦略で両方防げる',
      B: '戦略が異なる（虫歯：フッ化物 / 歯周病：プラークの物理的除去）',
      C: '歯ブラシの選び方だけが違う',
      D: '予防は歯科医院でしかできない'
    } },

  { id: 20, section: 'end', text: '今日の講義を聞いて、明日からやってみようと思うことは？',
    options: {
      A: '自分自身が歯間ブラシを使ってみる',
      B: '担当患者の口腔内を観察する',
      C: '患者さんに歯科受診を勧める',
      D: '家族・同僚にも歯周病と糖尿病の関係を伝える'
    } }
];

const SECTIONS = {
  intro: { title: '冒頭：今の自分を知る', desc: 'まず、自分の普段を振り返ってみてください。' },
  ch1:   { title: '第1章　歯周病と糖尿病の関係', desc: '' },
  ch2:   { title: '第2章　歯周病とは・病態分類', desc: '' },
  ch3:   { title: '第3章　口腔ケアの実際', desc: '' },
  end:   { title: 'まとめ', desc: '最後に一つだけ。' }
};

// ---------- URL パラメータ・状態 ----------
const urlParams = new URLSearchParams(window.location.search);
const isTest = urlParams.get('test') === '1';
const DB_PREFIX = isTest ? 'test' : 'production';

const SESSION_KEY = 'dmDental_sessionId';
let sessionId = localStorage.getItem(SESSION_KEY);
if (!sessionId) {
  sessionId = 's_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  localStorage.setItem(SESSION_KEY, sessionId);
}

const ANSWERS_KEY = isTest ? 'dmDental_answers_test' : 'dmDental_answers';
const RESET_TOKEN_KEY = ANSWERS_KEY + '_resetToken';
let userAnswers = JSON.parse(localStorage.getItem(ANSWERS_KEY) || '{}');

// ---------- Firebase 初期化 ----------
const errEl = document.getElementById('error');

if (!firebaseConfig || !firebaseConfig.apiKey || firebaseConfig.apiKey === 'YOUR_API_KEY_HERE') {
  errEl.style.display = 'block';
  errEl.innerHTML = '<strong>Firebase設定が未完了です。</strong><br>firebase-config.js を編集して、Firebaseコンソールから取得した設定値を貼り付けてください。';
  throw new Error('Firebase config is not set.');
}

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ---------- プレゼンス（何人が接続中か） ----------
const presenceRef = ref(db, `${DB_PREFIX}/presence/${sessionId}`);
onDisconnect(presenceRef).remove();
set(presenceRef, { online: true, ts: serverTimestamp() });

setInterval(() => {
  set(presenceRef, { online: true, ts: serverTimestamp() });
}, 30000);

window.addEventListener('pagehide', () => {
  remove(presenceRef).catch(() => {});
});

// ---------- レンダリング ----------
function renderQuiz() {
  const container = document.getElementById('quiz-container');
  container.innerHTML = '';

  if (isTest) {
    const banner = document.createElement('div');
    banner.className = 'test-banner';
    banner.textContent = '⚠ テストモード（?test=1） — 本番データには影響しません';
    container.appendChild(banner);
  }

  ['intro', 'ch1', 'ch2', 'ch3', 'end'].forEach(sec => {
    const sectionEl = document.createElement('section');
    sectionEl.className = 'quiz-section';
    sectionEl.id = sec;

    const h2 = document.createElement('h2');
    h2.textContent = SECTIONS[sec].title;
    sectionEl.appendChild(h2);

    if (SECTIONS[sec].desc) {
      const d = document.createElement('p');
      d.className = 'section-desc';
      d.textContent = SECTIONS[sec].desc;
      sectionEl.appendChild(d);
    }

    QUESTIONS.filter(q => q.section === sec).forEach(q => {
      sectionEl.appendChild(renderQuestion(q));
    });

    container.appendChild(sectionEl);
  });
}

function renderQuestion(q) {
  const wrap = document.createElement('div');
  wrap.className = 'question';
  wrap.id = `q${q.id}`;

  const title = document.createElement('h3');
  title.innerHTML = `<span class="qnum">Q${q.id}.</span> ${escapeHtml(q.text)}`;
  wrap.appendChild(title);

  const opts = document.createElement('div');
  opts.className = 'options';

  ['A', 'B', 'C', 'D'].forEach(letter => {
    const btn = document.createElement('div');
    btn.className = 'option';
    btn.id = `q${q.id}-opt-${letter}`;
    btn.dataset.qid = q.id;
    btn.dataset.letter = letter;
    btn.setAttribute('role', 'button');
    btn.setAttribute('tabindex', '0');

    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.id = `q${q.id}-${letter}-bar`;
    btn.appendChild(bar);

    const content = document.createElement('div');
    content.className = 'content';
    content.innerHTML = `
      <span class="opt-label"><strong>${letter}.</strong> ${escapeHtml(q.options[letter])}</span>
      <span class="opt-count" id="q${q.id}-${letter}-label">—</span>
    `;
    btn.appendChild(content);

    btn.addEventListener('click', () => handleAnswer(q.id, letter));
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleAnswer(q.id, letter);
      }
    });

    opts.appendChild(btn);

    if (userAnswers[q.id] === letter) {
      btn.classList.add('selected');
    }
  });

  wrap.appendChild(opts);
  return wrap;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}

// ---------- 回答処理 ----------
async function handleAnswer(qId, newLetter) {
  const prevLetter = userAnswers[qId];
  if (prevLetter === newLetter) return;

  const qRef = ref(db, `${DB_PREFIX}/responses/q${qId}`);

  try {
    await runTransaction(qRef, (current) => {
      if (!current) current = { A: 0, B: 0, C: 0, D: 0 };
      if (prevLetter) {
        current[prevLetter] = Math.max(0, (current[prevLetter] || 0) - 1);
      }
      current[newLetter] = (current[newLetter] || 0) + 1;
      return current;
    });

    userAnswers[qId] = newLetter;
    localStorage.setItem(ANSWERS_KEY, JSON.stringify(userAnswers));
    updateSelectedUI(qId, newLetter);
  } catch (err) {
    console.error('回答の送信に失敗:', err);
    alert('回答の送信に失敗しました。通信状況を確認してください。');
  }
}

function updateSelectedUI(qId, selectedLetter) {
  ['A', 'B', 'C', 'D'].forEach(letter => {
    const el = document.getElementById(`q${qId}-opt-${letter}`);
    if (!el) return;
    el.classList.toggle('selected', letter === selectedLetter);
  });
}

function clearAllSelections() {
  document.querySelectorAll('.option.selected').forEach(el => el.classList.remove('selected'));
}

// ---------- 集計の購読 ----------
function subscribeResults() {
  const r = ref(db, `${DB_PREFIX}/responses`);
  onValue(r, (snapshot) => {
    const data = snapshot.val() || {};
    QUESTIONS.forEach(q => {
      const counts = data[`q${q.id}`] || { A: 0, B: 0, C: 0, D: 0 };
      updateChart(q.id, counts);
    });
  });
}

function updateChart(qId, counts) {
  const total = (counts.A || 0) + (counts.B || 0) + (counts.C || 0) + (counts.D || 0);
  ['A', 'B', 'C', 'D'].forEach(letter => {
    const count = counts[letter] || 0;
    const pct = total > 0 ? Math.round(count / total * 100) : 0;
    const bar = document.getElementById(`q${qId}-${letter}-bar`);
    const label = document.getElementById(`q${qId}-${letter}-label`);
    if (bar) bar.style.width = pct + '%';
    if (label) label.textContent = total > 0 ? `${count}人 (${pct}%)` : '—';
  });
}

// ---------- プレゼンス購読 ----------
function subscribePresence() {
  const p = ref(db, `${DB_PREFIX}/presence`);
  onValue(p, (snapshot) => {
    const data = snapshot.val() || {};
    const count = Object.keys(data).length;
    const counter = document.getElementById('onlineCounter');
    counter.textContent = `現在 ${count} 人が参加中` + (isTest ? '（テストモード）' : '');
  });
}

// ---------- リセット検知（管理ページからのリセットに追従） ----------
function subscribeResetToken() {
  const rt = ref(db, `${DB_PREFIX}/resetToken`);
  onValue(rt, (snap) => {
    const server = snap.val();
    if (!server) return;
    const local = localStorage.getItem(RESET_TOKEN_KEY);
    if (local !== String(server)) {
      userAnswers = {};
      localStorage.setItem(ANSWERS_KEY, JSON.stringify({}));
      localStorage.setItem(RESET_TOKEN_KEY, String(server));
      clearAllSelections();
    }
  });
}

// ---------- 起動 ----------
renderQuiz();
subscribeResults();
subscribePresence();
subscribeResetToken();
