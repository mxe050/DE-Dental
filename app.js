import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getDatabase, ref, set, get, onValue, runTransaction,
  onDisconnect, serverTimestamp, remove
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import { firebaseConfig } from './firebase-config.js';

// ---------- 質問データ（20問） ----------
// answer: 'A'|'B'|'C'|'D'|null  (nullは自己振り返り質問＝正解なし)
// references: [{ title, citation, url }]
const QUESTIONS = [
  // ========== 冒頭 ==========
  { id: 1, section: 'intro', text: 'あなた自身は歯間ブラシを使っていますか？',
    options: { A: '毎日使っている', B: '時々使う', C: '使っていない', D: '持っていない' },
    answer: null,
    explanation: 'この質問に「正解」はありませんが、推奨は毎日1回以上の使用です。歯ブラシの毛先は歯の平面にしか届かず、歯と歯の間（＝歯周炎が最も起こりやすい部位）のプラークは歯間ブラシかデンタルフロスでしか除去できません。看護師自身が使っていて初めて、患者さんに説得力をもって指導できます。',
    references: [
      { title: 'Sälzer S et al. 歯間清掃用具による歯肉炎管理のメタレビュー (2015)',
        citation: 'J Clin Periodontol. 2015;42 Suppl 16:S92-105.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/25581718/' },
      { title: 'Chapple IL et al. 歯肉炎の管理：歯周炎の一次予防 (2015)',
        citation: 'J Clin Periodontol. 2015;42 Suppl 16:S71-6.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/25639826/' }
    ]
  },
  { id: 2, section: 'intro', text: '糖尿病の入院患者さんの口の中を、最後に観察したのはいつですか？',
    options: { A: '今週中に観察した', B: '今月中に観察した', C: 'それ以前', D: '観察したことがない' },
    answer: null,
    explanation: 'この質問に「正解」はありませんが、糖尿病患者の口腔内観察は、入院時および日々のケア時の基本項目です。口腔状態の悪化は血糖コントロールに直接影響します。OHAT (Oral Health Assessment Tool) など標準化されたアセスメントツールを用いれば、看護師でも簡便・再現性高く評価できます。ただし、OHATは、歯周病の診断のためのツールではありません。',
    references: [
      { title: 'Chalmers JM et al. OHAT (Oral Health Assessment Tool) の妥当性・信頼性 (2005)',
        citation: 'Aust Dent J. 2005;50(3):191-9.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/16238218/' }
    ]
  },
  { id: 3, section: 'intro', text: '入院患者さんに歯科受診を勧めたことがありますか？',
    options: { A: '頻繁にある', B: '時々ある', C: 'ほとんどない', D: '一度もない' },
    answer: null,
    explanation: 'この質問に「正解」はありませんが、糖尿病患者の歯科受診を促すことは、看護師の重要な役割の一つです。医科と歯科の連携は血糖コントロール改善・合併症予防の両面で推奨されており、日本歯周病学会のガイドラインでも明確に位置づけられています。',
    references: [
      { title: '日本歯周病学会「糖尿病患者に対する歯周治療のガイドライン 2014 改訂版」',
        citation: '日本歯周病学会（公式PDF）',
        url: 'https://www.perio.jp/publication/upload_file/guideline_diabetes.pdf' }
    ]
  },
  { id: 4, section: 'intro', text: '歯周病と糖尿病の関係について、自分の知識は十分だと思いますか？',
    options: { A: '十分だと思う', B: '基本的なことは知っている', C: 'あまり知らない', D: 'ほとんど知らない' },
    answer: null,
    explanation: 'この質問は自己評価のため「正解」はありません。講義終了後にもう一度振り返ってみてください。歯周病と糖尿病は双方向性の関係があり、知識のアップデートが継続的に必要な領域です。',
    references: [
      { title: 'Preshaw PM et al. 歯周炎と糖尿病：双方向の関係 (2012)',
        citation: 'Diabetologia. 2012;55(1):21-31.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/22057194/' }
    ]
  },

  // ========== 第1章 ==========
  { id: 5, section: 'ch1', text: '歯周病は糖尿病の第何の合併症と呼ばれている？',
    options: { A: '第4の合併症', B: '第5の合併症', C: '第6の合併症', D: '第7の合併症' },
    answer: 'C',
    explanation: '1993年にLöeが発表した論文「Periodontal disease. The sixth complication of diabetes mellitus」により、歯周病は糖尿病の「第6の合併症」として位置づけられました。既存の5大合併症（網膜症・腎症・神経障害・大血管症・創傷治癒遅延）に続くものとして、以来、糖尿病診療における口腔ケアの重要性が強調されています。',
    references: [
      { title: 'Löe H. 歯周病：糖尿病の第6の合併症 (1993)',
        citation: 'Diabetes Care. 1993;16(1):329-34.',
        url: 'https://diabetesjournals.org/care/article-abstract/16/1/329/20741/Periodontal-Disease-The-sixth-complication-of?redirectedFrom=fulltext' }
    ]
  },
  { id: 6, section: 'ch1', text: '糖尿病患者の歯周炎の有病率は、一般人口のおよそ何倍？',
    options: { A: 'ほぼ同じ', B: '1.5倍', C: '2〜3倍', D: '5倍以上' },
    answer: 'C',
    explanation: '糖尿病患者における歯周炎の発症リスクは、非糖尿病者の約2〜3倍と複数の疫学研究で報告されています。血糖コントロール不良の患者ではさらにリスクが高まり、両疾患は「双方向性 (two-way relationship)」の関係にあることが確立されています。',
    references: [
      { title: 'Preshaw PM et al. 歯周炎と糖尿病：双方向の関係 (2012)',
        citation: 'Diabetologia. 2012;55(1):21-31.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/22057194/' },
      { title: 'Chapple IL, Genco R et al. 糖尿病と歯周病：EFP/AAP共同ワークショップ コンセンサスレポート (2013)',
        citation: 'J Clin Periodontol. 2013;40 Suppl 14:S106-12.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/23627325/' }
    ]
  },
  { id: 7, section: 'ch1', text: '喫煙は歯周炎の重症度を何倍に増加させると指摘されている？',
    options: { A: '2倍', B: '5倍', C: '10倍', D: '20倍' },
    answer: 'C',
    explanation: '喫煙は歯周炎の最も強い修飾因子の一つで、重度の喫煙者では歯周炎の重症度が非喫煙者の約10倍に達すると報告されています。喫煙者は歯周治療への反応も悪く、再発も多いことが知られています。2017年の新分類（ステージ・グレード分類）でも、喫煙は歯周炎の「グレード」を悪化させる因子として明記されています。',
    references: [
      { title: 'Tomar SL, Asma S. 米国における喫煙起因性歯周炎：NHANES III (2000)',
        citation: 'J Periodontol. 2000;71(5):743-51.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/10872955/' },
      { title: 'Papapanou PN et al. 歯周炎：2017年世界ワークショップ コンセンサスレポート (2018)',
        citation: 'J Clin Periodontol. 2018;45 Suppl 20:S162-S170.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/29926490/' }
    ]
  },
  { id: 8, section: 'ch1', text: '歯周基本治療により、HbA1cはおおよそどの程度改善すると報告されている？',
    options: { A: '0.1〜0.2%', B: '0.5〜0.7%', C: '1.0〜1.5%', D: '2.0%以上' },
    answer: 'B',
    explanation: '2型糖尿病患者に対する歯周基本治療（スケーリング・ルートプレーニング）により、HbA1cが約0.4〜0.7%改善することが複数のシステマティックレビュー・メタ解析で報告されています。2022年のCochraneレビュー (Simpson TC et al.) でも、歯周治療が血糖コントロール改善に寄与することが支持されています。これは糖尿病治療薬1剤分に相当する効果規模です。',
    references: [
      { title: 'Simpson TC et al. 糖尿病における血糖コントロールのための歯周炎治療 (Cochrane 2022)',
        citation: 'Cochrane Database Syst Rev. 2022;4(4):CD004714.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/35420698/' },
      { title: 'Teeuw WJ, Gerdes VE, Loos BG. 歯周治療が糖尿病患者の血糖コントロールに及ぼす効果：メタ解析 (2010)',
        citation: 'Diabetes Care. 2010;33(2):421-7.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/20103557/' }
    ]
  },
  { id: 9, section: 'ch1', text: '歯周治療でHbA1cが改善しても「歯周病治療が糖尿病を治す」と断言できない理由は？',
    options: {
      A: '研究の数が少ないから',
      B: '歯磨きを頑張る人は他の健康行動もしているかもしれないから（交絡因子）',
      C: 'HbA1cの下がり幅が小さいから',
      D: '海外の研究だから'
    },
    answer: 'B',
    explanation: '歯周病治療に真剣に取り組む患者さんは、同時に食事・運動・服薬アドヒアランスなど他の健康行動も改善している可能性があります。これを「交絡因子 (confounding factors)」と呼び、観察研究・介入研究で結果を解釈する際の根本的な注意点です。因果関係を断定するには、厳密な条件を揃えた大規模ランダム化比較試験が必要です。',
    references: []
  },

  // ========== 第2章 ==========
  { id: 10, section: 'ch2', text: '「歯肉炎」と「歯周炎」の違いは？',
    options: {
      A: '歯肉炎は子ども、歯周炎は大人の病気',
      B: '歯肉炎は歯肉のみの炎症、歯周炎は骨の吸収も伴う',
      C: '違いは重症度の程度だけ',
      D: '同じ病気の別の呼び方'
    },
    answer: 'B',
    explanation: '歯肉炎 (gingivitis) は歯肉のみに限局した可逆性の炎症で、適切なプラーク除去で治癒します。歯周炎 (periodontitis) はそこに歯槽骨吸収（不可逆性）とアタッチメントロスを伴い、進行性に歯の喪失につながります。2017年の新分類では、この区別が「疾患としての境界」として明確化されました。',
    references: [
      { title: 'Caton JG et al. 歯周病・インプラント周囲疾患の新分類：1999年分類からの主要変更点 (2018)',
        citation: 'J Clin Periodontol. 2018;45 Suppl 20:S1-S8.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/29926489/' }
    ]
  },
  { id: 11, section: 'ch2', text: '歯垢（プラーク）の正体は？',
    options: {
      A: '食べ物のカス',
      B: '口の中の細菌の塊',
      C: '唾液の成分が固まったもの',
      D: '歯のエナメル質がはがれたもの'
    },
    answer: 'B',
    explanation: 'プラークは細菌が歯面に付着・増殖して作る「バイオフィルム (biofilm)」で、食べカスではありません。1mgのプラークには10億個以上の細菌が含まれるとされ、虫歯・歯周病の直接的な原因です。「食べカスだから洗口剤でうがいすれば落ちる」という誤解は、口腔ケア指導で最初に崩すべき認識です。',
    references: [
      { title: 'Marsh PD. 歯垢のバイオフィルムとしての性質と微生物群集 (2006)',
        citation: 'BMC Oral Health. 2006;6 Suppl 1:S14.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/16934115/' }
    ]
  },
  { id: 12, section: 'ch2', text: 'プラークはどのくらいの時間で「悪さをする量」になる？',
    options: { A: '約1時間', B: '約6時間', C: '約24時間', D: '約72時間' },
    answer: 'C',
    explanation: '歯面に形成されるプラークは、約24時間でバイオフィルムとして成熟を始め、歯肉に炎症を起こす性質を持つようになります。Löeらの古典的研究「Experimental Gingivitis in Man」では、清掃中止から10〜21日で臨床的歯肉炎が発症することが示されました。このため「1日1回は徹底的にプラークを除去する」ことが推奨されます。',
    references: [
      { title: 'Löe H, Theilade E, Jensen SB. 実験的歯肉炎研究 (1965)',
        citation: 'J Periodontol. 1965;36:177-87.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/14296927/' },
      { title: 'Marsh PD. 歯垢バイオフィルム：健康と疾患への意味 (2006)',
        citation: 'BMC Oral Health. 2006;6 Suppl 1:S14.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/16934115/' }
    ]
  },
  { id: 13, section: 'ch2', text: '歯周炎のグレードC（最も急速に進行）に分類される目安となるHbA1cは？',
    options: { A: '5.5%以上', B: '6.0%以上', C: '7.0%以上', D: '8.5%以上' },
    answer: 'C',
    explanation: '2017年の新しい歯周病分類（ステージ・グレード分類）では、HbA1c 7.0%以上の糖尿病患者は歯周炎の進行速度が速い「グレードC」に分類されます。HbA1c 7.0%未満の糖尿病患者は「グレードB」、非糖尿病者は「グレードA」が目安です。血糖コントロールが歯周病の進行に直接影響することを反映した分類です。',
    references: [
      { title: 'Tonetti MS, Greenwell H, Kornman KS. 歯周炎のステージ・グレード分類：新分類とケース定義 (2018)',
        citation: 'J Clin Periodontol. 2018;45 Suppl 20:S149-S161.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/29926952/' }
    ]
  },
  { id: 14, section: 'ch2', text: '歯肉炎はおおよそ何歳頃から始まることがある？',
    options: { A: '10代から', B: '20代から', C: '40代から', D: '60代以降' },
    answer: 'A',
    explanation: '歯肉炎は思春期（10代）から始まることがあり、小児〜若年でも認められます。放置された歯肉炎の一部は、中年以降に歯周炎へと移行します。若年から適切な口腔ケア習慣を身につけることが、生涯の歯を守る基盤となります。',
    references: [
      { title: 'Albandar JM, Tinoco EM. 歯周病の世界的疫学と危険因子 (2002)',
        citation: 'Periodontol 2000. 2002;29:153-176.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/12102707/' },
      { title: 'Papapanou PN et al. 歯周炎：2017年世界ワークショップ コンセンサス (2018)',
        citation: 'J Clin Periodontol. 2018;45 Suppl 20:S162-S170.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/29926490/' }
    ]
  },

  // ========== 第3章 ==========
  { id: 15, section: 'ch3', text: 'プラークを除去する上で、最も効果的な方法は？',
    options: {
      A: '飲むタイプの含嗽剤（抗菌剤）',
      B: 'ポピドンヨード等の消毒薬',
      C: 'お茶のカテキン',
      D: '歯ブラシによる機械的除去'
    },
    answer: 'D',
    explanation: 'プラークは歯面に強固に付着したバイオフィルムで、薬液や抗菌剤だけでは十分に除去できません。歯ブラシ・歯間ブラシによる「機械的除去」が最も確実な方法です。含嗽剤はあくまで補助的な位置づけで、機械的除去の代替にはならないことが各ガイドラインで明示されています。',
    references: [
      { title: 'Chapple IL et al. 歯肉炎の管理：歯周炎の一次予防 (2015)',
        citation: 'J Clin Periodontol. 2015;42 Suppl 16:S71-6.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/25639826/' },
      { title: 'Marsh PD. 歯垢のバイオフィルムとしての性質 (2006)',
        citation: 'BMC Oral Health. 2006;6 Suppl 1:S14.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/16934115/' }
    ]
  },
  { id: 16, section: 'ch3', text: '歯科で定期的に歯石を取っていれば、歯周病は予防できますか？',
    options: {
      A: 'はい、歯石除去だけで十分',
      B: 'いいえ、歯石は化石のようなもので、日々のセルフケア（歯磨き）が根幹',
      C: '半年に1回の歯石除去があれば他は不要',
      D: '人によって異なる'
    },
    answer: 'B',
    explanation: '歯石は日々のプラークが石灰化したもので、「過去の不十分なセルフケアの記録」のような存在です。プロフェッショナルケアでの歯石除去は必要ですが、それだけで歯周病は予防できません。Axelsson・Lindheの30年長期追跡研究では、プラークコントロールを軸にした予防プログラムが歯の喪失を劇的に抑えることが示されています。',
    references: [
      { title: 'Axelsson P, Nyström B, Lindhe J. プラークコントロールプログラムの30年追跡 (2004)',
        citation: 'J Clin Periodontol. 2004;31(9):749-57.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/15312097/' },
      { title: 'Chapple IL et al. 歯肉炎の管理：歯周炎の一次予防 (2015)',
        citation: 'J Clin Periodontol. 2015;42 Suppl 16:S71-6.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/25639826/' }
    ]
  },
  { id: 17, section: 'ch3', text: '歯間ブラシの正しい使い方の意識は？',
    options: {
      A: '食べカスを取り除くために使う',
      B: '隣り合った歯の側面を磨くために使う',
      C: '歯肉をマッサージするために使う',
      D: '口臭予防のために使う'
    },
    answer: 'B',
    explanation: '歯間ブラシは「食べカスを取る道具」ではなく、「隣り合った2本の歯の側面（＝歯ブラシの毛先が届かない歯面）のプラークを磨き落とす道具」です。この意識の切り替えが最も重要です。Sälzerらのメタレビューでも、歯間清掃器具の使用が歯肉炎管理に有効であることが示されています。',
    references: [
      { title: 'Sälzer S et al. 歯間清掃用具による歯肉炎管理のメタレビュー (2015)',
        citation: 'J Clin Periodontol. 2015;42 Suppl 16:S92-105.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/25581718/' }
    ]
  },
  { id: 18, section: 'ch3', text: '歯ブラシの毛先が直接届かない場所のプラークはどうなる？',
    options: {
      A: '唾液で自然に洗い流される',
      B: '毛先が当たらない場所のプラークは落ちない',
      C: '含嗽剤で補える',
      D: 'フッ素で防げる'
    },
    answer: 'B',
    explanation: 'プラークは歯面に強固に付着したバイオフィルムのため、毛先（機械的作用）が直接当たらない限り除去できません。唾液・含嗽剤・フッ素は補助にはなっても機械的除去の代替になりません。これが「歯間ブラシ・デンタルフロスを併用しないと歯周病は予防できない」ことの科学的根拠です。',
    references: [
      { title: 'Chapple IL et al. 歯肉炎の管理：歯周炎の一次予防 (2015)',
        citation: 'J Clin Periodontol. 2015;42 Suppl 16:S71-6.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/25639826/' },
      { title: 'Sälzer S et al. 歯間清掃用具による歯肉炎管理のメタレビュー (2015)',
        citation: 'J Clin Periodontol. 2015;42 Suppl 16:S92-105.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/25581718/' }
    ]
  },
  { id: 19, section: 'ch3', text: '虫歯予防と歯周病予防の、効果的な歯磨きの戦略は？',
    options: {
      A: '同じ戦略で両方防げる',
      B: '戦略が異なる（虫歯：フッ化物 / 歯周病：プラークの物理的除去）',
      C: '歯ブラシの選び方だけが違う',
      D: '予防は歯科医院でしかできない'
    },
    answer: 'B',
    explanation: '虫歯予防の主役は「フッ化物（フッ素配合歯磨剤の歯面残留）」で、磨いた後のうがいは最小限が望ましいとされます。一方、歯周病予防の主役は「歯間部までのプラークの物理的除去」で、特に歯間ブラシ・フロスの使用が重要です。戦略が異なるため、両方を意識した口腔ケアが必要です。',
    references: [
      { title: 'Marinho VC et al. 小児・若年者の虫歯予防におけるフッ化物配合歯磨剤 (Cochrane 2003)',
        citation: 'Cochrane Database Syst Rev. 2003;(1):CD002278.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/12535435/' },
      { title: 'Chapple IL et al. 歯肉炎の管理：歯周炎の一次予防 (2015)',
        citation: 'J Clin Periodontol. 2015;42 Suppl 16:S71-6.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/25639826/' }
    ]
  },

  // ========== まとめ ==========
  { id: 20, section: 'end', text: '今日の講義を聞いて、明日からやってみようと思うことは？',
    options: {
      A: '自分自身が歯間ブラシを使ってみる',
      B: '担当患者の口腔内を観察する',
      C: '患者さんに歯科受診を勧める',
      D: '家族・同僚にも歯周病と糖尿病の関係を伝える'
    },
    answer: null,
    explanation: 'この質問には「正解」はありません。どれを選んでも正しい行動です。大切なのは、講義で得た知識を明日の業務で一つでも行動に結びつけること。小さな一歩から、患者さんのアウトカム（HbA1c・誤嚥性肺炎・QOL）が変わり始めます。',
    references: [
      { title: '日本歯周病学会「糖尿病患者に対する歯周治療のガイドライン 2014 改訂版」',
        citation: '日本歯周病学会（公式PDF）',
        url: 'https://www.perio.jp/publication/upload_file/guideline_diabetes.pdf' }
    ]
  }
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

  // ---------- 解説を見るボタン + 解説パネル ----------
  const revealBtn = document.createElement('button');
  revealBtn.type = 'button';
  revealBtn.className = 'reveal-btn';
  revealBtn.id = `q${q.id}-reveal-btn`;
  revealBtn.textContent = '💡 解説を見る';
  revealBtn.addEventListener('click', () => toggleExplanation(q.id));
  wrap.appendChild(revealBtn);

  const panel = document.createElement('div');
  panel.className = 'explanation-panel';
  panel.id = `q${q.id}-explanation`;
  panel.hidden = true;
  panel.innerHTML = buildExplanationHTML(q);
  wrap.appendChild(panel);

  return wrap;
}

function buildExplanationHTML(q) {
  let html = '';

  if (q.answer) {
    const correctText = q.options[q.answer];
    html += `<div class="answer-label"><span class="answer-badge">正解</span> <strong>${q.answer}.</strong> ${escapeHtml(correctText)}</div>`;
  } else {
    html += `<div class="answer-label answer-label--no-answer">※ この質問は自己振り返りのため「正解」はありません</div>`;
  }

  html += `<div class="explanation-text">${escapeHtml(q.explanation)}</div>`;

  if (q.references && q.references.length > 0) {
    html += '<div class="references"><strong>📖 根拠となる論文・ガイドライン</strong><ul>';
    q.references.forEach(r => {
      html += `<li><a href="${encodeURI(r.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(r.title)}</a><br><small>${escapeHtml(r.citation)}</small></li>`;
    });
    html += '</ul></div>';
  }

  return html;
}

function toggleExplanation(qId) {
  const panel = document.getElementById(`q${qId}-explanation`);
  const btn = document.getElementById(`q${qId}-reveal-btn`);
  if (!panel || !btn) return;

  if (panel.hidden) {
    panel.hidden = false;
    btn.textContent = '✕ 解説を閉じる';
    btn.classList.add('reveal-btn--open');
  } else {
    panel.hidden = true;
    btn.textContent = '💡 解説を見る';
    btn.classList.remove('reveal-btn--open');
  }
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
