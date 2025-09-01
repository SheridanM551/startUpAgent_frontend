// ===== Utilities (function names use English as requested) =====
function formatNumber(x) {
    if (x === null || x === undefined || isNaN(x)) return "-";
    const abs = Math.abs(x);
    if (abs >= 1e9) return (x / 1e9).toFixed(2).replace(/\.00$/, '') + "B";
    if (abs >= 1e6) return (x / 1e6).toFixed(2).replace(/\.00$/, '') + "M";
    if (abs >= 1e3) return (x / 1e3).toFixed(2).replace(/\.00$/, '') + "K";
    return String(x);
}
function formatPercent(p) {
    if (p === null || p === undefined || isNaN(p)) return "-";
    return (Math.round(p * 10) / 10).toFixed(1) + "%";
}
function getNested(obj, path, fallback = null) {
    try {
        return path.split('.').reduce((o, k) => (o && k in o) ? o[k] : null, obj) ?? fallback;
    } catch (e) { return fallback; }
}
function setText(el, text) { if (el) el.textContent = text ?? ""; }
function clear(el) { if (el) el.innerHTML = ""; }

// ===== Rendering: Cover =====
function renderCover(data) {
    const adjectives = getNested(data, "report.content.cover.adjectives", []);  
    const oneLiner = getNested(data, "report.content.cover.one_liner", "");
    const takeaways = getNested(data, "report.content.cover.three_takeaways", []);

    setText(document.getElementById("companyOneLiner"), oneLiner || "（尚未提供 one_liner）");

    const chips = document.getElementById("adjectives");
    clear(chips);
    (adjectives || []).forEach(adj => {
        const span = document.createElement("span");
        span.className = "chip";
        span.textContent = adj;
        chips.appendChild(span);
    });

    const box = document.getElementById("takeaways");
    clear(box);
    (takeaways || []).slice(0, 3).forEach(t => {
        const div = document.createElement("div");
        div.className = "take " + (t.direction || "par");
        div.innerHTML = "<div class='kicker'>" + (t.direction || "") + "</div><div>" + (t.text || "") + "</div>";
        box.appendChild(div);
    });
}

// ===== Rendering: Charts (pure SVG, no external libs) =====
function drawBoxPlot(svgId, stats, userLabel) {
    const svg = document.getElementById(svgId);
    if (!svg || !stats) return;
    svg.innerHTML = "";
    const w = svg.clientWidth || 600, h = 300, padL = 60, padR = 30, padT = 30, padB = 40;
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);

    // scale
    const min = stats.lower_whisker ?? stats.min ?? 0;
    const max = stats.upper_whisker ?? stats.max ?? 1;
    const q1 = stats.q1 ?? min, q3 = stats.q3 ?? max, med = stats.median ?? (q1 + q3) / 2;
    const your = stats.your_value;

    const x = (v) => padL + ((v - min) / (max - min || 1)) * (w - padL - padR);
    const yMid = (padT + (h - padB)) / 2;

    // axis
    const axis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    axis.setAttribute("x1", padL); axis.setAttribute("x2", w - padR);
    axis.setAttribute("y1", yMid); axis.setAttribute("y2", yMid);
    axis.setAttribute("stroke", "#3b455e"); axis.setAttribute("stroke-width", "2");
    svg.appendChild(axis);

    // whiskers
    const whisk1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
    whisk1.setAttribute("x1", x(min)); whisk1.setAttribute("x2", x(q1));
    whisk1.setAttribute("y1", yMid); whisk1.setAttribute("y2", yMid);
    whisk1.setAttribute("stroke", "#74829f"); whisk1.setAttribute("stroke-width", "4");
    svg.appendChild(whisk1);

    const whisk2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
    whisk2.setAttribute("x1", x(q3)); whisk2.setAttribute("x2", x(max));
    whisk2.setAttribute("y1", yMid); whisk2.setAttribute("y2", yMid);
    whisk2.setAttribute("stroke", "#74829f"); whisk2.setAttribute("stroke-width", "4");
    svg.appendChild(whisk2);

    // box
    const box = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    const boxH = 44;
    box.setAttribute("x", x(q1)); box.setAttribute("y", yMid - boxH / 2);
    box.setAttribute("width", Math.max(2, x(q3) - x(q1))); box.setAttribute("height", boxH);
    box.setAttribute("fill", "url(#gradBox)"); box.setAttribute("stroke", "#8157f1"); box.setAttribute("stroke-opacity", ".7");
    svg.appendChild(box);

    // gradient defs
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const grad = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
    grad.setAttribute("id", "gradBox"); grad.setAttribute("x1", "0"); grad.setAttribute("x2", "1"); grad.setAttribute("y1", "0"); grad.setAttribute("y2", "0");
    const s1 = document.createElementNS("http://www.w3.org/2000/svg", "stop"); s1.setAttribute("offset", "0%"); s1.setAttribute("stop-color", "#7c3aed"); s1.setAttribute("stop-opacity", ".25");
    const s2 = document.createElementNS("http://www.w3.org/2000/svg", "stop"); s2.setAttribute("offset", "100%"); s2.setAttribute("stop-color", "#06b6d4"); s2.setAttribute("stop-opacity", ".25");
    grad.appendChild(s1); grad.appendChild(s2); defs.appendChild(grad); svg.appendChild(defs);

    // median
    const medLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    medLine.setAttribute("x1", x(med)); medLine.setAttribute("x2", x(med));
    medLine.setAttribute("y1", yMid - boxH / 2); medLine.setAttribute("y2", yMid + boxH / 2);
    medLine.setAttribute("stroke", "#ffffff"); medLine.setAttribute("stroke-width", "3");
    svg.appendChild(medLine);

    // user
    if (typeof your === "number") {
        const uLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        uLine.setAttribute("x1", x(your)); uLine.setAttribute("x2", x(your));
        uLine.setAttribute("y1", yMid - 60); uLine.setAttribute("y2", yMid + 60);
        uLine.setAttribute("stroke", "#06b6d4"); uLine.setAttribute("stroke-width", "3");
        uLine.setAttribute("stroke-linecap", "round");
        svg.appendChild(uLine);

        const uDot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        uDot.setAttribute("cx", x(your)); uDot.setAttribute("cy", yMid);
        uDot.setAttribute("r", 6); uDot.setAttribute("fill", "#06b6d4");
        svg.appendChild(uDot);
    }

    // tick labels (min, q1, med, q3, max)
        // tick labels (分兩層: min/med/max 在下, q1/q3 在上)
    const ticks = [
        { v: min, l: "min " + formatNumber(min), row: "bottom" },
        { v: q1, l: "Q1 " + formatNumber(q1), row: "top" },
        { v: med, l: "Med " + formatNumber(med), row: "bottom" },
        { v: q3, l: "Q3 " + formatNumber(q3), row: "top" },
        { v: max, l: "max " + formatNumber(max), row: "bottom" }
    ];

    ticks.forEach(t => {
        const tx = document.createElementNS("http://www.w3.org/2000/svg", "text");
        tx.setAttribute("x", x(t.v));
        // 下層 (min/med/max) 與上層 (q1/q3) 分開
        tx.setAttribute("y", t.row === "bottom" ? h - 14 : h - 32);
        tx.setAttribute("text-anchor", "middle");
        tx.setAttribute("fill", "#a2acc7");
        tx.setAttribute("font-size", "12");
        tx.textContent = t.l;
        svg.appendChild(tx);
    });

}

function drawBarChart(svgId, counts, yourCat) {
    const svg = document.getElementById(svgId);
    if (!svg || !counts) return;
    svg.innerHTML = "";
    const w = svg.clientWidth || 800, h = 360, padL = 160, padR = 20, padT = 20, padB = 40, barH = 20, gap = 10;
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);

    // pick top 10
    const arr = Object.entries(counts).map(([k, v]) => ({ k, v: Number(v) || 0 }));
    arr.sort((a, b) => b.v - a.v);
    const top = arr.slice(0, 10);
    const maxV = Math.max(...top.map(d => d.v), 1);

    // dynamic height
    const needH = padT + padB + top.length * (barH + gap) + 10;
    svg.setAttribute("viewBox", `0 0 ${w} ${needH}`);

    const x = (v) => padL + (v / maxV) * (w - padL - padR);

    // bars
    top.forEach((d, i) => {
        const y = padT + i * (barH + gap);

        const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        bg.setAttribute("x", padL); bg.setAttribute("y", y);
        bg.setAttribute("width", w - padL - padR); bg.setAttribute("height", barH);
        bg.setAttribute("fill", "rgba(255,255,255,.04)"); bg.setAttribute("rx", "6");
        svg.appendChild(bg);

        const bar = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        bar.setAttribute("x", padL); bar.setAttribute("y", y);
        bar.setAttribute("width", Math.max(2, x(d.v) - padL)); bar.setAttribute("height", barH);
        const isYou = (d.k === yourCat);
        bar.setAttribute("fill", isYou ? "#06b6d4" : "#475569"); bar.setAttribute("rx", "6");
        svg.appendChild(bar);

        const name = document.createElementNS("http://www.w3.org/2000/svg", "text");
        name.setAttribute("x", padL - 8); name.setAttribute("y", y + barH / 2 + 4);
        name.setAttribute("text-anchor", "end"); name.setAttribute("fill", "#c7d2fe"); name.setAttribute("font-size", "13");
        name.textContent = d.k; svg.appendChild(name);

        const val = document.createElementNS("http://www.w3.org/2000/svg", "text");
        val.setAttribute("x", x(d.v) + 6); val.setAttribute("y", y + barH / 2 + 4);
        val.setAttribute("fill", "#9fb0d9"); val.setAttribute("font-size", "12");
        val.textContent = d.v; svg.appendChild(val);
    });

    // axis title
    const xt = document.createElementNS("http://www.w3.org/2000/svg", "text");
    xt.setAttribute("x", padL); xt.setAttribute("y", needH - 10);
    xt.setAttribute("fill", "#a2acc7"); xt.setAttribute("font-size", "12");
    xt.textContent = "Companies (top 10)";
    svg.appendChild(xt);
}

function renderCharts(data) {
    // employees
    const empStats = getNested(data, "plot.current_employees", null);
    drawBoxPlot("svgEmployees", empStats, "你的員工數");
    setText(document.getElementById("capEmployees"), getNested(data, "report.content.charts.current_employees.caption", "（尚未提供圖說）"));
    const empCalls = getNested(data, "report.content.charts.current_employees.callouts", []);
    const ul1 = document.getElementById("callEmployees"); clear(ul1);
    empCalls.forEach(c => { const li = document.createElement("li"); li.textContent = c; ul1.appendChild(li); });

    // funding
    const fundStats = getNested(data, "plot.total_funding", null);
    drawBoxPlot("svgFunding", fundStats, "你的募資");
    setText(document.getElementById("capFunding"), getNested(data, "report.content.charts.total_funding.caption", "（尚未提供圖說）"));
    const fundCalls = getNested(data, "report.content.charts.total_funding.callouts", []);
    const ul2 = document.getElementById("callFunding"); clear(ul2);
    fundCalls.forEach(c => { const li = document.createElement("li"); li.textContent = c; ul2.appendChild(li); });

    // industry distribution
    const distr = getNested(data, "plot.Industry_Group.counts", null);
    const yourCat = getNested(data, "plot.Industry_Group.your_value", null);
    drawBarChart("svgIndustry", distr, yourCat);
    setText(document.getElementById("capIndustry"), getNested(data, "report.content.charts.industry_distribution.caption", "（尚未提供圖說）"));
    const indCalls = getNested(data, "report.content.charts.industry_distribution.callouts", []);
    const ul3 = document.getElementById("callIndustry"); clear(ul3);
    indCalls.forEach(c => { const li = document.createElement("li"); li.textContent = c; ul3.appendChild(li); });
}

// ===== Rendering: Peers =====
function renderPeers(data) {
    setText(document.getElementById("peersOverview"), getNested(data, "report.content.peers.overview", ""));
    const grid = document.getElementById("peerGrid"); clear(grid);
    const peers = getNested(data, "report.content.peers.peer_snapshots", []);
    peers.slice(0, 10).forEach(p => {
        const card = document.createElement("div"); card.className = "peer";
        card.innerHTML = `<h4>${p.company || "（未命名）"}</h4><div class="muted">${p.blurb || ""}</div>`;
        grid.appendChild(card);
    });
}

// ===== Rendering: News with citations =====
function getCitationsArray(citations) {
    if (Array.isArray(citations)) return citations.map((it, i) => ({ name: it.name || `ref-${i + 1}`, url: it.url || "#" }));
    if (citations && typeof citations === 'object') {
        // preserve insertion order of object keys
        return Object.keys(citations).map((k) => ({ name: k, url: citations[k] }));
    }
    return [];
}
function renderNews(data) {
    const bullets = getNested(data, "report.content.news_bullets", []);
    const citesArr = getCitationsArray(getNested(data, "report.citations", {}));
    const list = document.getElementById("newsList"); clear(list);

    bullets.forEach((b, idx) => {
        const li = document.createElement("li");
        const cites = Array.isArray(b.citations) ? b.citations : [];
        const citeHtml = cites.length
            ? 'source: ' + cites.map(ci => {
                const c = citesArr[ci];
                const label = `[${ci}]`;
                if (!c || !c.url) return `<span class="muted">${label}</span>`;
                return `<a href="${c.url}" target="_blank" rel="noopener">${label}</a>`;
                }).join(" ")
            : "";
        li.innerHTML = `<strong>${b.point || "（未命名重點）"}</strong><br>${b.detail || ""}<div class="muted" style="margin-top:4px">${citeHtml}</div>`;
        list.appendChild(li);
    });

    // Footnotes list
    const foot = document.getElementById("footnotes"); clear(foot);
    if (citesArr.length) {
        const frag = document.createElement("div");
        frag.innerHTML = citesArr.map((c, i) => `<div> <a href="${c.url}" target="_blank" rel="noopener">${c.name || c.url}</a></div>`).join("");
        foot.appendChild(frag);
    } else {
        setText(foot, "（未提供引用來源）");
    }
}

// ===== Rendering: Recommendations =====
function renderRecommendations(data) {
    const recs = getNested(data, "report.content.recommendations", []);
    const box = document.getElementById("recoList"); clear(box);
    recs.slice(0, 3).forEach(r => {
        const card = document.createElement("div"); card.className = "panel";
        card.innerHTML = `<div class="kicker"></div><h3 style="margin:.2rem 0 .6rem; color:#a5f3fc">${r.keyword || "（未命名）"}</h3><div>${r.description || ""}</div>`;
        box.appendChild(card);
    });
}

// ===== Main Init =====
function initReport() {
    const status = document.getElementById("statusCard");
    const statusMsg = document.getElementById("statusMsg");
    try {
        const raw = sessionStorage.getItem("surveyResult");
        if (!raw) {
            status.style.display = "block";
            statusMsg.innerHTML = "尚未在 sessionStorage 設定 <code class='inline'>surveyResult</code>。請先執行 <code class='inline'>sessionStorage.setItem(\"surveyResult\", JSON.stringify(data))</code> 後重新整理，或點右上角「載入範例資料」。";
            return;
        }
        const data = JSON.parse(raw);

        // 1. 封面
        renderCover(data);

        // 2. 圖表
        renderCharts(data);

        // 3. 同儕
        renderPeers(data);

        // 4. 新聞
        renderNews(data);

        // 5. 建議
        renderRecommendations(data);

    } catch (err) {
        status.style.display = "block";
        statusMsg.textContent = "解析資料時發生錯誤：" + err?.message;
        console.error(err);
    }
}

// ===== Demo Loader (optional) =====
async function loadSample() {
    try {
        // 以目前頁面為基準解析相對路徑，避免 base URL 造成路徑問題
        const url = new URL('report_default.json', window.location.href);
        const res = await fetch(url.toString(), { cache: 'no-store' });

        if (!res.ok) {
            throw new Error(`HTTP ${res.status} ${res.statusText}（可能是路徑或 CORS 問題）`);
        }

        const data = await res.json();
        console.log(getNested(data, "plot", null));

        // 粗略檢查關鍵欄位，避免塞進壞資料
        if (!data.report || !data.report.content) {
            throw new Error('JSON 結構不含 report.content');
        }

        sessionStorage.setItem('surveyResult', JSON.stringify(data));
        console.info("Sample data loaded into sessionStorage as 'surveyResult'.");

        // 不重整頁面，直接重繪（initReport 在原檔已定義）
        if (typeof initReport === 'function') {
            initReport();
        } else {
            // 萬一函式順序在你專案裡不同，退而求其次重整
            location.reload();
        }
    } catch (err) {
        console.error('Failed to load sample:', err);

        // 在頁面上顯示錯誤
        const status = document.getElementById('statusCard');
        const statusMsg = document.getElementById('statusMsg');
        if (status && statusMsg) {
            status.style.display = 'block';
            statusMsg.innerHTML = `載入 <code class="inline">report_default.json</code> 失敗：<br><code class="inline">${err.message}</code><br>
      建議：確認檔案路徑、用本機伺服器開啟（非 file://），或在 Network 面板查看是否 404/CORS。`;
        }
    }
}

// Events
document.getElementById("btnPrint").addEventListener("click", () => window.print());
document.getElementById("btnLoadSample").addEventListener("click", loadSample);
window.addEventListener("load", initReport);
window.addEventListener("resize", () => { // keep SVG responsive on resize
    // re-draw charts on resize using stored data
    const raw = sessionStorage.getItem("surveyResult");
    if (!raw) return;
    const data = JSON.parse(raw);
    renderCharts(data);
});