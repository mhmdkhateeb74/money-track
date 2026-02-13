function setMsg(el, text, type) {
  el.textContent = text || "";
  el.className = "msg" + (type ? " " + type : "");
}

function saveSession(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

function getToken() {
  return localStorage.getItem("token") || "";
}

document.getElementById("goDash").addEventListener("click", (e) => {
  if (!getToken()) {
    e.preventDefault();
    alert("Please login first.");
  }
});

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const loginMsg = document.getElementById("loginMsg");
  setMsg(loginMsg, "Signing in...", "");

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) return setMsg(loginMsg, data.message || "Login failed", "err");

    saveSession(data.token, data.user);
    setMsg(loginMsg, "Logged in ✓ Redirecting...", "ok");
    setTimeout(() => (window.location.href = "/dashboard.html"), 400);
  } catch (err) {
    setMsg(loginMsg, "Network error", "err");
  }
});

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const registerMsg = document.getElementById("registerMsg");
  setMsg(registerMsg, "Creating account...", "");

  const name = document.getElementById("regName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value;
  const monthlyLimitRaw = document.getElementById("regLimit").value.trim();

  const monthlyLimit = monthlyLimitRaw === "" ? undefined : Number(monthlyLimitRaw);

  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, monthlyLimit })
    });

    const data = await res.json();
    if (!res.ok) return setMsg(registerMsg, data.message || "Register failed", "err");

    setMsg(registerMsg, "Account created ✓ Now login on the left.", "ok");
    registerForm.reset();
  } catch (err) {
    setMsg(registerMsg, "Network error", "err");
  }
});
