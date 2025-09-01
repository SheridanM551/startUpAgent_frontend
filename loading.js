const BASE_URL = "https://startupagentbackend-production.up.railway.app";
// const BASE_URL = "http://localhost:8000";
const RAG_API_URL = `${BASE_URL}/rag`;
const HEALTH_URL = `${BASE_URL}/health`;
const redirectUrl = `result.html`
// === UI 元件 ===
const loadingBox = document.getElementById("loadingBox");
const errorBox = document.getElementById("errorBox");
const resultBox = document.getElementById("resultBox");
const retryBtn = document.getElementById("retryBtn");
const backBtn = document.getElementById("backBtn");
const elapsedLbl = document.getElementById("elapsed");
const statusLbl = document.getElementById("status");
const apiBaseLbl = document.getElementById("apiBase");
const flowBox = document.getElementById("flowBox");

apiBaseLbl.textContent = BASE_URL;

let timerId;
let startAt;
let healthTimerId;

// === RAG 狀態定義：需與後端 enum 數值一致 ===
const RagStatus = {
    IDLE: 0,
    RETRIEVING_STATISTIC_DATA: 1,
    GENERATING_STATISTIC_REPORT: 2,
    GENERATING_NEWS_QUERY: 3,
    RETRIEVING_NEWS_DATA: 4,
    GENERATING_NEWS_REPORT: 5,
};

// // new flow:
// class RagStatus(Enum):
//     IDLE = 0
//     RETRIEVING_STATISTIC_DATA = 1
//     GENERATING_NEWS_QUERY = 2
//     RETRIEVING_NEWS_DATA = 3
//     GENERATING_NEWS_BULLETS = 4
//     GENERATING_REPORT = 5

// 依序對應流程步驟（縱向向下）
const STEPS = [
    { code: RagStatus.RETRIEVING_STATISTIC_DATA,    title: "Retrieving Statistic Data"},
    { code: RagStatus.GENERATING_STATISTIC_REPORT,  title: "Generating News Query"},
    { code: RagStatus.GENERATING_NEWS_QUERY,        title: "Retrieving News Data"},
    { code: RagStatus.RETRIEVING_NEWS_DATA,         title: "Generating News Bullets"},
    { code: RagStatus.GENERATING_NEWS_REPORT,       title: "Generating Report"},
];

// 將數字狀態轉成可讀文字（含 IDLE 與超界防護）
function statusToText(code) {
    switch (code) {
        case RagStatus.IDLE: return "Idle";
        case RagStatus.RETRIEVING_STATISTIC_DATA:   return "Retrieving Statistic Data";
        case RagStatus.GENERATING_STATISTIC_REPORT: return "Generating News Query";
        case RagStatus.GENERATING_NEWS_QUERY:       return "Retrieving News Data";
        case RagStatus.RETRIEVING_NEWS_DATA:        return "Generating News Bullets";
        case RagStatus.GENERATING_NEWS_REPORT:      return "Generating Report";
        default: return `Unknown(${code})`;
    }
}

// === UI: Status ===
function setStatus(text, ok = false) {
    statusLbl.textContent = text;
    statusLbl.className = ok ? "ok" : "";
}

// === Elapsed Timer ===
function startTimer() {
    startAt = performance.now();
    timerId = setInterval(() => {
        const s = (performance.now() - startAt) / 1000;
        elapsedLbl.textContent = `Elapsed Time: ${s.toFixed(1)}s`;
    }, 100);
}
function stopTimer() {
    clearInterval(timerId);
}

// === Call API（保留原本 POST /rag 流程） ===
async function callApi(payload, { timeoutMs = 60000 } = {}) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(RAG_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal
    }).finally(() => clearTimeout(id));

    if (!res.ok) {
        const errText = await res.text().catch(() => "");
        const msg = `HTTP ${res.status}` + (errText ? `: ${errText}` : "");
        throw new Error(msg);
    }
    return res.json();
}

// === Flow：渲染與更新 ===
function renderFlow() {
    flowBox.innerHTML = "";
    STEPS.forEach((s, i) => {
        const item = document.createElement("div");
        item.className = "step";
        item.dataset.code = String(s.code);

        const dotwrap = document.createElement("div");
        dotwrap.className = "dotwrap";
        const dot = document.createElement("div");
        dot.className = "dot";
        const line = document.createElement("div");
        line.className = "line";
        dotwrap.appendChild(dot);
        dotwrap.appendChild(line);

        const label = document.createElement("div");
        label.className = "label";
        const t = document.createElement("div");
        t.className = "title";
        t.textContent = s.title;
        // const d = document.createElement("div");
        // d.className = "desc";
        // d.textContent = s.desc;
        label.appendChild(t);
        // label.appendChild(d);

        item.appendChild(dotwrap);
        item.appendChild(label);
        flowBox.appendChild(item);
    });
}

function updateFlowByStatus(statusCode) {
    // 將 <= 當前狀態的步驟標記為 done，下一個為 active，其餘 pending
    const list = Array.from(flowBox.querySelectorAll(".step"));
    const idx = STEPS.findIndex(s => s.code === statusCode);

    list.forEach((node, i) => {
        node.classList.remove("done", "active");
        if (idx === -1) {
            // 未知狀態：全部 pending
            return;
        }
        if (i < idx) {
            node.classList.add("done");
        } else if (i === idx) {
            node.classList.add("active");
        }
    });

    // 若狀態超過最後一步（例如後端回傳完成值），全部 done
    const maxIdx = STEPS.length - 1;
    if (idx > maxIdx) {
        list.forEach(node => node.classList.add("done"));
    }
}

// === Health Polling ===
async function fetchHealth() {
    try {
        const res = await fetch(HEALTH_URL, { method: "GET", cache: "no-store" });
        if (!res.ok) return;
        const obj = await res.json();
        // 期待格式：{ "status": number }
        const code = Number(obj?.status);
        if (Number.isFinite(code)) {
            setStatus(statusToText(code));
            updateFlowByStatus(code);
        }
    } catch {
        // 軟性忽略，避免頻繁 error 影響 UI
    }
}

function startHealthPolling() {
    stopHealthPolling();
    // 先渲染一次，再開始輪詢
    renderFlow();
    fetchHealth();
    healthTimerId = setInterval(fetchHealth, 2000); 
}
function stopHealthPolling() {
    if (healthTimerId) {
        clearInterval(healthTimerId);
        healthTimerId = null;
    }
}

// === 主流程 ===
async function loadResult() {
    const raw = sessionStorage.getItem("surveyPayload");
    if (!raw) {
        errorBox.style.display = "block";
        errorBox.textContent = "Cannot find previous page survey data (sessionStorage: surveyPayload). Please go back and try again.";
        loadingBox.style.display = "none";
        retryBtn.style.display = "inline-block";
        setStatus("Data Missing");
        return;
    }

    const payload = JSON.parse(raw);

    // Reset UI
    errorBox.style.display = "none";
    resultBox.style.display = "none";
    loadingBox.style.display = "grid";
    retryBtn.style.display = "none";
    setStatus("Sending...");
    renderFlow();
    startTimer();
    startHealthPolling();

    try {
        const data = await callApi(payload, { timeoutMs: 90000 });
        stopTimer();
        stopHealthPolling();
        setStatus("Success", true);
        // 全部標記完成
        updateFlowByStatus(Infinity);

        loadingBox.style.display = "none";
        resultBox.style.display = "block";
        resultBox.textContent = JSON.stringify(data, null, 2);

        sessionStorage.setItem("surveyResult", JSON.stringify(data));

        // redirect
        window.location.href = redirectUrl;
    } catch (err) {
        stopTimer();
        stopHealthPolling();
        setStatus("Failed");
        loadingBox.style.display = "none";
        errorBox.style.display = "block";
        retryBtn.style.display = "inline-block";
        errorBox.textContent = `Failed to retrieve results: ${err.message}`;
    }
}

// 事件：重試/返回
retryBtn.addEventListener("click", loadResult);
backBtn.addEventListener("click", () => {
    window.history.length > 1 ? window.history.back() : (window.location.href = "/");
});

// 啟動
window.addEventListener("DOMContentLoaded", loadResult);
