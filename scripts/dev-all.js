#!/usr/bin/env node
/**
 * `npm run dev:all` — starts the FastAPI backend (npm run backend) and the Next.js dev server (npm run dev)
 * together, prefixes their output, and shuts both down on Ctrl+C or if either one exits.
 */
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const isWin = process.platform === "win32";
const npm = isWin ? "npm.cmd" : "npm";

if (!fs.existsSync(path.join(root, ".venv", isWin ? "Scripts" : "bin"))) {
  console.error("\x1b[31m[dev:all] Python virtualenv not found at .venv.\x1b[0m Create it first:\n  python3 -m venv .venv && .venv/bin/pip install -r backend/requirements.txt");
  process.exit(1);
}

// Optional overrides: WEB_PORT=3100 API_PORT=8100 npm run dev:all (also set NEXT_PUBLIC_API_URL if the API port changes).
const webPort = process.env.WEB_PORT || "3000";
const apiPort = process.env.API_PORT || "8000";
const services = [
  { name: "api", script: "backend", args: ["--port", apiPort], color: "\x1b[36m" },
  { name: "web", script: "dev", args: ["--port", webPort], color: "\x1b[35m" },
];

const children = [];
let shuttingDown = false;

function shutdown(code) {
  if (shuttingDown) return;
  shuttingDown = true;
  children.forEach((c) => { try { isWin ? spawn("taskkill", ["/pid", String(c.pid), "/T", "/F"]) : process.kill(-c.pid, "SIGTERM"); } catch { /* already gone */ } });
  setTimeout(() => process.exit(code), 500);
}

for (const svc of services) {
  const child = spawn(npm, ["run", svc.script, "--", ...svc.args], { cwd: root, env: { ...process.env, FORCE_COLOR: "1" }, detached: !isWin, stdio: ["ignore", "pipe", "pipe"] });
  children.push(child);
  const tag = `${svc.color}[${svc.name}]\x1b[0m `;
  const pipe = (stream, out) => {
    let buf = "";
    stream.on("data", (d) => {
      buf += d.toString();
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      lines.forEach((l) => out.write(`${tag}${l}\n`));
    });
  };
  pipe(child.stdout, process.stdout);
  pipe(child.stderr, process.stderr);
  child.on("exit", (code, signal) => {
    if (shuttingDown) return;
    console.error(`${tag}exited (${signal ?? code}); stopping the other service`);
    shutdown(code ?? 1);
  });
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
console.log(`\x1b[1m[dev:all]\x1b[0m starting api (http://localhost:${apiPort}) and web (http://localhost:${webPort}). Ctrl+C stops both.`);
