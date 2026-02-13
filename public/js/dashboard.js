function money(n) {
  if (typeof n !== "number") return "—";
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "ILS" }).format(n);
}

function setMsg(el, text, type) {
  el.textContent = text || "";
  el.className = "msg" + (type ? " " + type : "");
}

function getToken() {
  return localStorage.getItem("token") || "";
}

function getUser() {
  try { return JSON.parse(localStorage.getItem("user") || "null"); }
  catch { return null; }
}

function requireAuth() {
  const token = getToken();
  if (!token) {
    window.location.href = "/";
    return false;
  }
  return true;
}

function authHeaders() {
  return { "Content-Type": "application/json", "Authorization": "Bearer " + getToken() };
}

function formatDateISO(d) {
  const x = new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

let dailyChart, categoryChart;

function fillMonthYearSelectors() {
  const monthSelect = document.getElementById("monthSelect");
  const yearSelect = document.getElementById("yearSelect");

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const months = [
    "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"
  ];

  monthSelect.innerHTML = "";
  months.forEach((m, idx) => {
    const opt = document.createElement("option");
    opt.value = String(idx + 1);
    opt.textContent = m;
    if (idx + 1 === currentMonth) opt.selected = true;
    monthSelect.appendChild(opt);
  });

  yearSelect.innerHTML = "";
  for (let y = currentYear - 3; y <= currentYear + 1; y++) {
    const opt = document.createElement("option");
    opt.value = String(y);
    opt.textContent = String(y);
    if (y === currentYear) opt.selected = true;
    yearSelect.appendChild(opt);
  }
}

async function loadMe() {
  const userLine = document.getElementById("userLine");
  try {
    const res = await fetch("/api/user/me", { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed");
    localStorage.setItem("user", JSON.stringify(data.user));
    userLine.textContent = `${data.user.name} • ${data.user.email}`;
    document.getElementById("limitInput").value = data.user.monthlyLimit || 0;
  } catch {
    const u = getUser();
    userLine.textContent = u ? `${u.name} • ${u.email}` : "—";
  }
}

function renderAlert(alert) {
  const el = document.getElementById("limitAlert");
  if (alert && alert.overLimit) {
    el.style.display = "block";
    el.textContent = `⚠️ Limit exceeded: ${money(alert.total)} / ${money(alert.limit)}`;
  } else {
    el.style.display = "none";
    el.textContent = "";
  }
}

async function loadStats() {
  const month = Number(document.getElementById("monthSelect").value);
  const year = Number(document.getElementById("yearSelect").value);

  const totalEl = document.getElementById("monthlyTotal");
  const metaEl = document.getElementById("monthlyMeta");
  const topEl = document.getElementById("topCategory");
  const avgEl = document.getElementById("avgExpense");

  totalEl.textContent = "…";
  metaEl.textContent = "Loading…";

  const res = await fetch(`/api/stats/monthly?year=${year}&month=${month}`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) {
    totalEl.textContent = "—";
    metaEl.textContent = data.message || "Failed to load stats";
    return;
  }

  totalEl.textContent = money(data.total);
  metaEl.textContent = `Records: ${data.byCategory.reduce((a,c)=>a+c.count,0)} • Month: ${data.month}/${data.year}`;
  topEl.textContent = data.topCategory ? data.topCategory : "—";
  avgEl.textContent = money(data.average);

  renderAlert(data.alert);

  // Daily chart
  const labels = data.daily.map(x => x._id);
  const values = data.daily.map(x => x.total);

  const ctx1 = document.getElementById("dailyChart");
  if (dailyChart) dailyChart.destroy();
  dailyChart = new Chart(ctx1, {
    type: "line",
    data: {
      labels,
      datasets: [{ label: "Daily total", data: values, tension: 0.25 }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: true } },
      scales: {
        x: { ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 8 } }
      }
    }
  });

  // Category chart
  const cLabels = data.byCategory.map(x => x._id);
  const cValues = data.byCategory.map(x => x.total);

  const ctx2 = document.getElementById("categoryChart");
  if (categoryChart) categoryChart.destroy();
  categoryChart = new Chart(ctx2, {
    type: "doughnut",
    data: {
      labels: cLabels,
      datasets: [{ label: "By category", data: cValues }]
    },
    options: { responsive: true, plugins: { legend: { position: "bottom" } } }
  });
}

function expenseRow(exp) {
  const tr = document.createElement("tr");

  const tdDate = document.createElement("td");
  tdDate.textContent = formatDateISO(exp.date);

  const tdCat = document.createElement("td");
  tdCat.textContent = exp.category;

  const tdAmount = document.createElement("td");
  tdAmount.textContent = money(exp.amount);

  const tdNote = document.createElement("td");
  tdNote.textContent = exp.note || "";

  const tdActions = document.createElement("td");
  const delBtn = document.createElement("button");
  delBtn.className = "smallBtn";
  delBtn.textContent = "Delete";
  delBtn.addEventListener("click", async () => {
    if (!confirm("Delete this expense?")) return;
    await fetch(`/api/expenses/${exp._id}`, { method: "DELETE", headers: authHeaders() });
    await refresh();
  });

  tdActions.appendChild(delBtn);

  tr.appendChild(tdDate);
  tr.appendChild(tdCat);
  tr.appendChild(tdAmount);
  tr.appendChild(tdNote);
  tr.appendChild(tdActions);

  return tr;
}

async function loadExpenses() {
  const month = Number(document.getElementById("monthSelect").value);
  const year = Number(document.getElementById("yearSelect").value);

  const filterCategory = document.getElementById("filterCategory").value.trim();

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0); // last day
  const from = formatDateISO(start);
  const to = formatDateISO(end);

  let url = `/api/expenses?from=${from}&to=${to}`;
  if (filterCategory) url += `&category=${encodeURIComponent(filterCategory)}`;

  const res = await fetch(url, { headers: authHeaders() });
  const data = await res.json();

  const tbody = document.getElementById("expensesTbody");
  tbody.innerHTML = "";

  if (!res.ok) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 5;
    td.textContent = data.message || "Failed to load";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  if (!data.expenses.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 5;
    td.textContent = "No expenses yet for this month.";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  data.expenses.forEach(exp => tbody.appendChild(expenseRow(exp)));
}

async function addExpense(e) {
  e.preventDefault();

  const msg = document.getElementById("expenseMsg");
  setMsg(msg, "Adding...", "");

  const amount = Number(document.getElementById("amount").value);
  const category = document.getElementById("category").value.trim();
  const date = document.getElementById("date").value;
  const note = document.getElementById("note").value.trim();

  try {
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ amount, category, date, note })
    });
    const data = await res.json();
    if (!res.ok) return setMsg(msg, data.message || "Failed", "err");

    setMsg(msg, "Added ✓", "ok");
    document.getElementById("expenseForm").reset();

    // keep date as today by default
    document.getElementById("date").value = formatDateISO(new Date());

    if (data.alert && data.alert.overLimit) {
      renderAlert(data.alert);
    }

    await refresh();
  } catch {
    setMsg(msg, "Network error", "err");
  }
}

async function saveLimit() {
  const msg = document.getElementById("limitMsg");
  setMsg(msg, "Saving...", "");
  const monthlyLimit = Number(document.getElementById("limitInput").value);

  try {
    const res = await fetch("/api/user/limit", {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ monthlyLimit })
    });
    const data = await res.json();
    if (!res.ok) return setMsg(msg, data.message || "Failed", "err");
    localStorage.setItem("user", JSON.stringify(data.user));
    setMsg(msg, "Saved ✓", "ok");
    await loadStats();
  } catch {
    setMsg(msg, "Network error", "err");
  }
}

async function refresh() {
  await Promise.all([loadStats(), loadExpenses()]);
}

(function init(){
  if (!requireAuth()) return;

  fillMonthYearSelectors();

  document.getElementById("date").value = formatDateISO(new Date());

  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  });

  document.getElementById("expenseForm").addEventListener("submit", addExpense);

  document.getElementById("saveLimitBtn").addEventListener("click", saveLimit);

  document.getElementById("applyFilterBtn").addEventListener("click", refresh);
  document.getElementById("clearFilterBtn").addEventListener("click", () => {
    document.getElementById("filterCategory").value = "";
    refresh();
  });

  document.getElementById("monthSelect").addEventListener("change", refresh);
  document.getElementById("yearSelect").addEventListener("change", refresh);

  loadMe().then(refresh);
})();
