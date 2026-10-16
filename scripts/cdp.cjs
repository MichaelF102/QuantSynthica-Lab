// Minimal CDP driver using Node's built-in WebSocket.
const { spawn } = require("child_process");
const http = require("http");
const get = (u) => new Promise((res, rej) => http.get(u, (r) => { let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => res(JSON.parse(d))); }).on("error", rej));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function launch(url) {
  const chrome = spawn("google-chrome", ["--headless=new", "--no-sandbox", "--disable-gpu", "--remote-debugging-port=9333", "--window-size=1600,1200", "--user-data-dir=/tmp/claude-1000/cdp-profile-" + Date.now(), url], { stdio: "ignore" });
  let tabs;
  for (let i = 0; i < 40; i++) { try { tabs = await get("http://127.0.0.1:9333/json"); if (tabs.find((t) => t.type === "page")) break; } catch {} await sleep(250); }
  const page = tabs.find((t) => t.type === "page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0; const pending = new Map();
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expr) => { const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || "eval error"); return r.result.result.value; };
  const waitFor = async (expr, ms = 30000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { if (await ev(expr)) return true; } catch {} await sleep(300); } return false; };
  return { ev, waitFor, send, sleep, close: () => { try { ws.close(); } catch {} chrome.kill("SIGKILL"); } };
}
module.exports = { launch };
