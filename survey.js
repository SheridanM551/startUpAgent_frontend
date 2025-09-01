// === 可依需求調整的設定 ===
const PAGE_SIZE = 3; // 每頁題數
const redirectUrl = "loading.html";

// 題目：直接寫死於程式碼
// Put these two arrays BEFORE QUESTIONS
const Industry_Group_Entire = [
  'Artificial Intelligence','Hardware','Data','Resource','Software','IT','Sustainability','Health Care','Science',
  'Financial','Transportation','Food','Media','Goverment','Community','Sales','Gaming','Energy','Sports','Internet',
  'Real Estate','Clothing','Travel','Invest','Manufacturing','Education','Administrative Services','Services','Other',
  'Consumer Goods','Shopping','Electronics','Biotechnology','Unknown','Events','Privacy'
];

const Current_Country = [
  'United States','France','United Kingdom','Sweden','Germany','Israel','Ireland','Spain','Italy','Canada','Hong Kong',
  'India','China','South Korea','Netherlands','Nigeria','Finland','South Africa','Mexico','Poland','Singapore','Belgium',
  'Saint Kitts and Nevis','Switzerland','Unknown','Portugal','Australia','Norway','Egypt','Cayman Islands','Denmark',
  'Czechia','Austria','Brazil','Chile','Isle of Man','Kenya','Türkiye','Luxembourg','Taiwan','New Zealand'
];

// Replace your existing QUESTIONS with this:
const QUESTIONS = [
  { id: 'Industry_Group', type: 'radio', required: true, title: 'Industry Group', options: Industry_Group_Entire },
  { id: 'country', type: 'radio', required: true, title: 'Current Country', options: Current_Country },
  { id: 'current_employees', type: 'number', required: true, title: 'Current Employees' },
  { id: 'total_funding', type: 'number', required: true, title: 'Total Funding (USD)' },
  { id: 'founded', type: 'number', required: true, title: 'Founded (Year)' },
  { id: 'current_objectives', type: 'text', required: true, title: 'Current Objectives (separate with semicolons)', placeholder: 'e.g., expand into tier-2 cities; integrate AI recommendations' },
  { id: 'strengths', type: 'text', required: true, title: 'Strengths', placeholder: 'e.g., large local user base; mobile-first adoption' },
  { id: 'weaknesses', type: 'text', required: true, title: 'Weaknesses', placeholder: 'e.g., low margins; seasonal demand swings' },
  { id: 'description', type: 'text', required: true, title: 'Description', placeholder: 'e.g., Briefly describe your company\'s mission and vision.' }
];


// === 狀態 ===
const state = {
    page: 0,
    answers: /** @type {Record<string, any>} */ ({}),
};

// === DOM ===
const pageRoot = document.getElementById('pageRoot');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const submitBtn = document.getElementById('submitBtn');
const steps = document.getElementById('steps');
const progressBar = document.getElementById('progressBar');
const answeredCountEl = document.getElementById('answeredCount');
const totalCountEl = document.getElementById('totalCount');
const progressPercentEl = document.getElementById('progressPercent');

totalCountEl.textContent = String(QUESTIONS.length);

function init() {
    renderSteps();
    renderPage();
    updateProgress();

    prevBtn.addEventListener('click', () => {
    if (state.page > 0) { state.page--; renderPage(); updatePager(); }
    });
    nextBtn.addEventListener('click', () => {
    if (validatePage(state.page)) { state.page++; renderPage(); updatePager(); }
    else shake(nextBtn);
    });
    submitBtn.addEventListener('click', handleSubmit);

    updatePager();
}

function renderSteps() {
    steps.innerHTML = '';
    const pageCount = Math.ceil(QUESTIONS.length / PAGE_SIZE);
    for (let i = 0; i < pageCount; i++) {
    const d = document.createElement('div');
    d.className = 'dot' + (i === state.page ? ' active' : '');
    steps.appendChild(d);
    }
}

function renderPage() {
    pageRoot.innerHTML = '';
    const start = state.page * PAGE_SIZE;
    const slice = QUESTIONS.slice(start, start + PAGE_SIZE);

    slice.forEach((q, idx) => {
    const card = document.createElement('div');
    card.className = 'card';

    const qIdx = document.createElement('div');
    qIdx.className = 'q-index';
    qIdx.textContent = `Question ${start + idx + 1}`;

    const qTitle = document.createElement('div');
    qTitle.className = 'q-title';
    qTitle.innerHTML = `${q.title}${q.required ? '<span class="q-required">＊Required</span>' : ''}`;

    card.appendChild(qIdx);
    card.appendChild(qTitle);

    if (q.type === 'radio' || q.type === 'checkbox') {
        const wrap = document.createElement('div');
        wrap.className = 'options';
        const name = q.id;

        q.options.forEach(opt => {
        const label = document.createElement('label');
        label.className = 'option';

        const input = document.createElement('input');
        input.type = q.type === 'radio' ? 'radio' : 'checkbox';
        input.name = name;
        input.value = opt;

        // 初始狀態回填
        if (q.type === 'radio' && state.answers[q.id] === opt) input.checked = true;
        if (q.type === 'checkbox' && Array.isArray(state.answers[q.id]) && state.answers[q.id].includes(opt)) input.checked = true;

        input.addEventListener('change', () => {
            if (q.type === 'radio') {
            state.answers[q.id] = opt;
            } else {
            const all = Array.from(document.querySelectorAll(`input[name="${name}"]`)).filter(i => i.checked).map(i => i.value);
            state.answers[q.id] = all;
            }
            updateProgress();
            updatePager();
        });

        const span = document.createElement('span');
        span.textContent = opt;

        label.appendChild(input);
        label.appendChild(span);
        wrap.appendChild(label);
        });
        card.appendChild(wrap);
    }

    if (q.type === 'number') {
      const inp = document.createElement('input');
      inp.type = 'number';
      inp.className = 'text-input';

      // 基本限制
      if (q.id === 'current_employees' || q.id === 'total_funding') inp.min = 0;
      if (q.id === 'founded') { inp.min = 1900; inp.max = new Date().getFullYear(); }

      if (state.answers[q.id] !== undefined && state.answers[q.id] !== null) {
        inp.value = state.answers[q.id];
      }

      inp.addEventListener('input', () => {
        const v = inp.value.trim();
        state.answers[q.id] = v === '' ? null : Number(v);
        updateProgress();
        updatePager();
      });

      card.appendChild(inp);
    } else if (q.type === 'text') {
      // 這是你原本的文字區塊（可保留、只把 placeholder 換成英文）
      const ta = document.createElement('textarea');
      ta.className = 'textarea';
      ta.placeholder = q.placeholder || 'Please type here…';
      ta.value = state.answers[q.id] || '';
      ta.addEventListener('input', () => {
        state.answers[q.id] = ta.value.trim();
        updateProgress();
        updatePager();
      });
      card.appendChild(ta);
    }

    pageRoot.appendChild(card);
    });

    renderSteps();
}

function countAnswered() {
    let n = 0;
    for (const q of QUESTIONS) {
      const ans = state.answers[q.id];
      if (q.type === 'text' && typeof ans === 'string' && ans.length > 0) n++;
      if (q.type === 'radio' && typeof ans === 'string' && ans) n++;
      if (q.type === 'checkbox' && Array.isArray(ans) && ans.length > 0) n++;
      if (q.type === 'number' && Number.isFinite(ans)) n++;
    }
    return n;
}

function updateProgress() {
    const answered = countAnswered();
    const total = QUESTIONS.length;
    const pct = Math.round((answered / total) * 100);
    answeredCountEl.textContent = String(answered);
    progressBar.style.width = pct + '%';
    progressPercentEl.textContent = pct + '%';
}

function validatePage(pageIdx) {
    const start = pageIdx * PAGE_SIZE;
    const slice = QUESTIONS.slice(start, start + PAGE_SIZE);
    for (const q of slice) {
      if (!q.required) continue;
      const ans = state.answers[q.id];
      if (q.type === 'text' && !(typeof ans === 'string' && ans.length > 0)) return false;
      if (q.type === 'radio' && !(typeof ans === 'string' && ans)) return false;
      if (q.type === 'checkbox' && !(Array.isArray(ans) && ans.length > 0)) return false;
      if (q.type === 'number' && !Number.isFinite(ans)) return false;
    }
    return true;
}

function updatePager() {
    const pageCount = Math.ceil(QUESTIONS.length / PAGE_SIZE);
    prevBtn.disabled = state.page === 0;
    const last = state.page === pageCount - 1;
    nextBtn.style.display = last ? 'none' : 'inline-flex';
    submitBtn.style.display = last ? 'inline-flex' : 'none';
    nextBtn.disabled = !validatePage(state.page);
    submitBtn.disabled = !validatePage(state.page);
}


function buildPayload() {
    return {
    submittedAt: new Date().toISOString(),
    answers: { ...state.answers },
    };
}

function renderResult(payload) {
    document.querySelector('.header .subtitle').textContent = '感謝填寫！已完成 100%';
    progressBar.style.width = '100%';
    progressPercentEl.textContent = '100%';
    answeredCountEl.textContent = String(QUESTIONS.length);

    pageRoot.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'card result';

    const h = document.createElement('div');
    h.className = 'q-title';
    h.textContent = '填答摘要（可在此改為自訂感謝頁或自動導向）';
    card.appendChild(h);

    const pre = document.createElement('pre');
    pre.textContent = JSON.stringify(payload, null, 2);
    card.appendChild(pre);

    pageRoot.appendChild(card);

    // 隱藏按鈕
    document.querySelector('.pager').style.display = 'none';
}

function shake(el) {
    const x = [0, -2, 2, -2, 2, 0];
    let i = 0;
    const id = setInterval(() => {
    el.style.transform = `translateX(${x[i]}px)`;
    if (++i >= x.length) { clearInterval(id); el.style.transform = ''; }
    }, 24);
}

// main

function handleSubmit() {
  if (!validatePage(state.page)) { shake(submitBtn); return; }
  const payload = state.answers;

  // 將 payload 暫存到 sessionStorage，再導頁
  sessionStorage.setItem("surveyPayload", JSON.stringify(payload));
  // 你的結果頁路徑（依部署調整）
  window.location.href = redirectUrl;
}



// 啟動
window.addEventListener('DOMContentLoaded', init);