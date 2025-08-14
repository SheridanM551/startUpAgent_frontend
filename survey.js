// === 可依需求調整的設定 ===
const PAGE_SIZE = 3; // 每頁題數
const redirectUrl = "index.html";

// 題目：直接寫死於程式碼
/** type: 'radio' | 'checkbox' | 'text' */
const QUESTIONS = [
  {
    id: 'category_list',
    type: 'checkbox',
    required: true,
    title: 'Category list 📋 — Please indicate which industry category or categories your company\'s product falls under.',
    options: [
      'Media & Entertainment',
      'Social & Communication',
      'Travel & Tourism',
      'Design & Creative',
      'Gaming',
      'Health & Wellness',
      'Finance & Business',
      'E-Commerce & Retail',
      'Real Estate',
      'Marketing & Advertising',
      'Enterprise Solutions',
      'Technology',
      'Artificial Intelligence',
      'Data & Analytics',
      'Security',
      'Startups & Innovation',
      'Mobility & Transportation',
      'Energy & Environment',
      'Education',
      'Lifestyle & Local',
      'Others'
    ]
  },
  {
    id: 'market',
    type: 'radio',
    required: true,
    title: 'Target Market 🔎 — Please indicate the target market(s) your company is addressing.',
    options: [
      'Software',
      'IoT/Hardware',
      'Biotech/Health',
      'Mobile',
      'E-Commerce',
      'Ad/Marketing',
      'Media/News',
      'Finance',
      'Entertainment',
      'Education',
      'Analytics',
      'Travel',
      'Security',
      'Transportation',
      'Real Estate',
      'Food/Agricultural',
      'Legal/Government',
      'Energy'
    ]
  },
  {
    id: 'funding_total_usd',
    type: 'text', // 模板以 textarea 呈現，如需數字驗證可再加上自訂檢核
    required: true,
    title: 'Initial Funding Available (USD) 💰 — Please enter the amount of initial funding currently available for your project.',
    placeholder: 'e.g., 50000'
  },
  {
    id: 'country',
    type: 'text',
    required: true,
    title: 'Target Country 🌍 — Please specify the country or countries your product is primarily targeting (official names only).',
    placeholder: 'e.g., United States; Japan'
  },
  {
    id: 'region',
    type: 'text',
    required: true,
    title: 'Target Region 🗺️ — Please specify the region(s) your product is targeting, including Region / State or Metropolitan Area (Official names only).',
    placeholder: 'e.g., California; Kanto'
  },
  {
    id: 'city',
    type: 'text',
    required: true,
    title: 'City 🏙️ — Please specify the city or cities your product is targeting. (Official names only)',
    placeholder: 'e.g., San Francisco; Tokyo'
  },
  {
    id: 'funding_rounds',
    type: 'radio',
    required: true,
    title: 'Funding Rounds 💵 — Please specify the funding round(s) your company has completed or is currently in.',
    options: ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C']
  },
  {
    id: 'funding_method',
    type: 'checkbox',
    required: true,
    title: 'Funding Method 💰 — Please select the funding method(s) your company has already received or is currently pursuing. (Multiple selections allowed)',
    options: [
      'Seed',
      'Venture',
      'Equity_crowdfunding',
      'Convertible_note',
      'Debt_financing',
      'Angel',
      'Grant',
      'Private_equity',
      'Post_ipo_equity',
      'Post_ipo_debt',
      'Undisclosed'
    ]
  },
  {
    id: 'brief_description',
    type: 'text',
    required: true,
    title: 'Brief Description 🚀 — Please briefly describe your company\'s key characteristics, current development stage, challenges faced, and future goals. (≈300 words)',
    placeholder: 'Describe your product, traction, challenges, and goals…'
  }
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

    if (q.type === 'text') {
        const ta = document.createElement('textarea');
        ta.className = 'textarea';
        ta.placeholder = q.placeholder || '請輸入…';
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

function handleSubmit() {
    if (!validatePage(state.page)) { shake(submitBtn); return; }
    const payload = buildPayload();
    if (redirectUrl) {
    // 送出前可在此進行 fetch/post
    // fetch('YOUR_ENDPOINT', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    //   .catch(console.error)
    //   .finally(() => window.location.href = redirectUrl);
    window.location.href = redirectUrl;
    return;
    }
    renderResult(payload);
}

function buildPayload() {
    return {
    submittedAt: new Date().toISOString(),
    answers: { ...state.answers },
    meta: { totalQuestions: QUESTIONS.length, pageSize: PAGE_SIZE }
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

// 啟動
window.addEventListener('DOMContentLoaded', init);