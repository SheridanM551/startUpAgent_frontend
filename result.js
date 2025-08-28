// 讀取 surveyResult（若無，放預設樣例）
const raw = sessionStorage.getItem("surveyResult");
const survey = raw ? JSON.parse(raw) : {
  Industry_Group: "Health Care",
  country: "US",
  current_employees: 80,
  total_funding: 12000000,
  founded: 2018,
  current_objectives: "expand telemedicine services into rural regions; develop AI-driven diagnostics platform",
  strengths: "strong partnerships with local hospitals; scalable cloud infrastructure",
  weaknesses: "regulatory hurdles; limited brand recognition in urban markets",
};

// === mock：用你的副檔欄位，等後端接上 API 再替換 ===
const mockStatisticGrowjo = {
  quick_diagnosis: "Your company, a healthcare-focused firm with HIPAA compliance and 213 employees, lags in product iteration speed compared to AI-driven peers...",
  key_differences: [
    { dimension: "product depth", your_company: "Telemedicine platform with slow iteration cycles", top_peer: "Company 9 (Crescendo)", so_what: "Peers integrate AI for automation and insights, enabling faster feature delivery and higher growth rates." },
    { dimension: "operations", your_company: "Manual workflows and slow release cycles", top_peer: "Company 10 (Luma)", so_what: "High-growth peers leverage agile methodologies and automation to scale rapidly despite similar employee counts." },
    { dimension: "go-to-market", your_company: "Enterprise-focused, compliance-driven sales", top_peer: "Company 8 (Krea)", so_what: "AI peers use freemium models and viral loops to accelerate adoption, achieving 125%+ growth with smaller teams." }
  ],
  prioritized_actions: [
    { action: "Implement CI/CD pipelines to reduce release cycles from quarterly to biweekly", why: "Matches peer agility", effort_1_to_5: 4, impact_1_to_5: 5, priority_score: 20 },
    { action: "Launch AI-powered triage chatbot using existing NLP APIs", why: "Bridge product depth gap", effort_1_to_5: 3, impact_1_to_5: 5, priority_score: 15 },
    { action: "Partner with telehealth infrastructure providers", why: "Expand distribution", effort_1_to_5: 3, impact_1_to_5: 4, priority_score: 12 },
  ],
  ["30_60_90_plan"]: {
    day_30: ["Launch CI/CD POC", "Customer interviews for churn", "Hire compliance automation engineer"],
    day_60: ["Deploy AI triage pilot", "Finalize 1–2 partnerships", "Roll out CI/CD to 50% teams"],
    day_90: ["Full CI/CD", "Announce AI + partnerships", "Publish churn analysis"]
  },
  risks_and_mitigations: [
    { risk: "AI feature introduces compliance gaps", mitigation: "Embed compliance engineer in dev sprints" },
    { risk: "Partnerships dilute brand", mitigation: "Co-branding rules & value props" },
  ],
  metrics_to_track: [
    "Telemedicine platform adoption rate",
    "Time-to-market for new features (days)",
    "Customer churn rate"
  ],
  advanced_suggestions: [
    {
      advanced_question: "Prioritize AI feature dev over ops efficiency?",
      why_it_matters: "Resource allocation determines competitive positioning",
      how_to_answer_fast: ["Run 10% early-access A/B", "Survey WTP for AI"],
      low_cost_proxy: "Pilot signups & usage frequency",
      decision_rule: "IF >70% adopt & survey >8/10 THEN double down on AI; ELSE focus on ops",
      scenario_planning: { answer_yes: { action: "Allocate 60% eng to AI" }, answer_no: { action: "Invest in DevOps & training" } },
      priority: "Urgent"
    }
  ],
  open_questions: [
    "Build AI features in-house or via APIs?",
    "Can compliance processes scale with biweekly releases?"
  ]
};

// ====== DOM helpers ======
const qs = (s) => document.querySelector(s);

// ====== 渲染：Snapshot ======
function renderSnapshot(obj) {
  const host = qs("#snapshot");
  const item = (label, val) => `<div class="chip"><div class="muted">${label}</div><div><strong>${val}</strong></div></div>`;
  host.innerHTML = [
    item("Industry", obj.Industry_Group),
    item("Country", obj.country),
    item("Employees", obj.current_employees?.toLocaleString?.() ?? obj.current_employees),
    item("Funding (USD)", (obj.total_funding ?? 0).toLocaleString()),
    item("Founded", obj.founded),
    item("Objectives", obj.current_objectives)
  ].join("");
}

// ====== 渲染：Quick Diagnosis ======
function renderQuickDiagnosis(s) {
  qs("#quickDiagnosis").textContent = s || "—";
}

// ====== 渲染：Key Differences ======
function renderKeyDiffs(arr) {
  const tb = qs("#keyDiffs tbody");
  tb.innerHTML = (arr || []).map(r => `
    <tr>
      <td><span class="badge">${r.dimension}</span></td>
      <td>${r.your_company}</td>
      <td>${r.top_peer}</td>
      <td>${r.so_what}</td>
    </tr>
  `).join("");
}

// ====== 渲染：Actions：Bar & Effort/Impact 散點 ======
let chartBar, chartScatter;
function renderActions(actions) {
  const labels = actions.map(a => a.action);
  const dataPriority = actions.map(a => a.priority_score);
  if (chartBar) chartBar.destroy();
  chartBar = new Chart(document.getElementById('barActions'), {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Priority Score', data: dataPriority }]},
    options: { responsive: true, maintainAspectRatio: false, scales: { x:{ ticks:{ color:'#cfe5ff' } }, y:{ beginAtZero:true, ticks:{ color:'#cfe5ff' } } }, plugins:{ legend:{ labels:{ color:'#cfe5ff' }}} }
  });

  const pts = actions.map(a => ({ x: a.effort_1_to_5, y: a.impact_1_to_5, r: 6, label: a.action }));
  if (chartScatter) chartScatter.destroy();
  chartScatter = new Chart(document.getElementById('scatterEI'), {
    type: 'scatter',
    data: { datasets: [{ label:'Effort vs Impact', data: pts }]},
    options: {
      responsive:true, maintainAspectRatio:false,
      scales:{
        x:{ min:1, max:5, ticks:{ stepSize:1, color:'#cfe5ff' }, title:{ display:true, text:'Effort (1-5)', color:'#cfe5ff'} },
        y:{ min:1, max:5, ticks:{ stepSize:1, color:'#cfe5ff' }, title:{ display:true, text:'Impact (1-5)', color:'#cfe5ff'} }
      },
      plugins:{ tooltip:{ callbacks:{ label:(ctx)=>`${ctx.raw.label}  (E:${ctx.raw.x} / I:${ctx.raw.y})` }}, legend:{ labels:{ color:'#cfe5ff' }} }
    }
  });
}

// ====== 渲染：30-60-90 ======
function renderPlan(plan) {
  const host = qs("#plan");
  const col = (title, items=[]) => `
    <div class="card">
      <div class="pill"><strong>${title}</strong></div>
      <ul>${items.map(s=>`<li>${s}</li>`).join("")}</ul>
    </div>`;
  host.innerHTML = [
    col("Day 30", plan.day_30),
    col("Day 60", plan.day_60),
    col("Day 90", plan.day_90),
  ].join("");
}

// ====== 渲染：Risks & Mitigations ======
function renderRisks(list) {
  const tb = qs("#risksTbl tbody");
  tb.innerHTML = (list||[]).map(r=>`<tr><td>${r.risk}</td><td>${r.mitigation}</td></tr>`).join("");
}

// ====== 渲染：KPIs ======
function renderKPIs(kpis) {
  const host = qs("#kpis");
  host.innerHTML = (kpis||[]).map(k=>`
    <div class="card kpi"><div class="dot"></div><div><div>${k}</div><div class="muted">target: set later</div></div></div>
  `).join("");
}

// ====== 渲染：Advanced & Questions ======
function renderAdvanced(list) {
  const host = qs("#advanced");
  host.innerHTML = (list||[]).map(a=>`
    <div class="card" style="margin-bottom:12px;">
      <div><strong>${a.advanced_question}</strong> <span class="badge">${a.priority||''}</span></div>
      <div class="muted">${a.why_it_matters}</div>
      <div style="margin-top:8px;">How to answer fast:
        <ul>${(a.how_to_answer_fast||[]).map(s=>`<li>${s}</li>`).join("")}</ul>
      </div>
      <div class="muted">Proxy: ${a.low_cost_proxy}</div>
      <div class="muted">Rule: ${a.decision_rule}</div>
    </div>
  `).join("");
}
function renderQuestions(list) {
  qs("#questions").innerHTML = (list||[]).map(q=>`<li>${q}</li>`).join("");
}

// ====== 主流程 ======
function renderGrowjo(stat) {
  renderSnapshot(survey);
  renderQuickDiagnosis(stat.quick_diagnosis);
  renderKeyDiffs(stat.key_differences);
  renderActions(stat.prioritized_actions);
  renderPlan(stat["30_60_90_plan"]);
  renderRisks(stat.risks_and_mitigations);
  renderKPIs(stat.metrics_to_track);
  renderAdvanced(stat.advanced_suggestions);
  renderQuestions(stat.open_questions);
}

async function fetchStatistic(source){
  // TODO: 串後端。現在先回 mock。
  return mockStatisticGrowjo;
}

// ====== Source Switch ======
const btnGrowjo = qs("#btnGrowjo");
const btnCrunch = qs("#btnCrunchbase");
btnGrowjo.addEventListener("click", async ()=>{
  btnGrowjo.classList.add("active"); btnCrunch.classList.remove("active");
  qs("#newsBlock").style.display = "none";
  const stat = await fetchStatistic("growjo");
  renderGrowjo(stat);
});
btnCrunch.addEventListener("click", async ()=>{
  btnCrunch.classList.add("active"); btnGrowjo.classList.remove("active");
  // 先沿用 growjo 的 statistic；news 之後再接你的 Crunchbase JSON。
  const stat = await fetchStatistic("crunchbase");
  renderGrowjo(stat);
  qs("#newsBlock").style.display = "block";
});

// 首次載入
btnGrowjo.click();
