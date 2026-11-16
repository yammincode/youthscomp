// 共用：載入設定、頁首頁尾
let _cfg;
export async function loadConfig() {
  if (!_cfg) {
    const res = await fetch("/api/config");
    _cfg = await res.json();
  }
  return _cfg;
}
export const fmt = (n) => "NT$ " + Number(n).toLocaleString("en-US");
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const STATUS = { pending: "待繳費", reported: "待確認", paid: "已繳費", cancelled: "已取消" };

export function renderChrome(active) {
  const links = [
    ["index.html", "賽事資訊"],
    ["lookup.html", "報名名單"],
    ["results.html", "成績"],
  ];
  const header = document.createElement("header");
  header.className = "site";
  header.innerHTML = `<div class="wrap">
    <a class="logo" href="index.html">🧗 <span>青少年</span>攀岩系列賽</a>
    <nav>${links.map(([h, t]) => `<a href="${h}" class="${active === h ? "active" : ""} ${h !== "index.html" ? "show-sm" : ""}">${t}</a>`).join("")}
    <a href="register.html" class="cta">我要報名</a></nav></div>`;
  document.body.prepend(header);
  const footer = document.createElement("footer");
  footer.className = "site";
  footer.innerHTML = `<div class="wrap">© 青少年攀岩系列賽　｜　如有問題請聯絡主辦單位</div>`;
  document.body.append(footer);
}

// 場次分頁：回傳目前選的 id，切換時呼叫 onChange
export function renderTabs(el, items, current, onChange) {
  el.innerHTML = items.map(([id, label]) => `<button type="button" class="tab ${id === current ? "on" : ""}" data-id="${id}">${esc(label)}</button>`).join("");
  el.onclick = (e) => {
    const b = e.target.closest(".tab");
    if (!b) return;
    el.querySelectorAll(".tab").forEach((t) => t.classList.toggle("on", t === b));
    onChange(b.dataset.id);
  };
}
