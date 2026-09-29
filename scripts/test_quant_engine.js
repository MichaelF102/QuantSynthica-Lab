const http = require("http");
const fs = require("fs");

async function run() {
  const pages = await new Promise((resolve, reject) => {
    http.get("http://127.0.0.1:9222/json", (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => resolve(JSON.parse(data)));
    }).on("error", reject);
  });

  const page = pages.find(p => p.type === "page" && p.url.includes("localhost:3000"));
  if (!page) {
    console.error("No localhost page found");
    process.exit(1);
  }

  const ws = new WebSocket(page.webSocketDebuggerUrl);

  let id = 1;
  const callbacks = new Map();

  function send(method, params = {}) {
    return new Promise((resolve) => {
      const msgId = id++;
      callbacks.set(msgId, resolve);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  ws.onmessage = (event) => {
    const res = JSON.parse(event.data);
    if (res.id && callbacks.has(res.id)) {
      const cb = callbacks.get(res.id);
      callbacks.delete(res.id);
      cb(res.result);
    }
  };

  await new Promise(r => ws.onopen = r);
  console.log("Connected to Chrome via CDP");

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1520,
    height: 1100,
    deviceScaleFactor: 1,
    mobile: false
  });

  // Navigate to #strategy-backtest
  await send("Runtime.evaluate", {
    expression: `
      (() => {
        window.location.hash = "strategy-backtest";
        const el = document.getElementById("strategy-backtest");
        if (el) el.scrollIntoView({ behavior: "instant", block: "start" });
      })()
    `
  });

  await new Promise(r => setTimeout(r, 2000));

  // Shot 1: Hero area with Headline, Capability Cards, and 3D Quant Engine
  const shotHero = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(
    "/home/michaelfernandes/.gemini/antigravity-ide/brain/7aeaaa94-aee7-4dca-bc62-5b8bf9ac3f48/quant_engine_hero.png",
    Buffer.from(shotHero.data, "base64")
  );
  console.log("Captured quant_engine_hero.png");

  // Scroll down 550px to view StageDetailPanels and ResearchConnection
  await send("Runtime.evaluate", {
    expression: `
      (() => {
        window.scrollBy(0, 550);
      })()
    `
  });

  await new Promise(r => setTimeout(r, 1200));

  // Shot 2: 3 Cards & Research Connection
  const shotPanels = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(
    "/home/michaelfernandes/.gemini/antigravity-ide/brain/7aeaaa94-aee7-4dca-bc62-5b8bf9ac3f48/quant_engine_panels.png",
    Buffer.from(shotPanels.data, "base64")
  );
  console.log("Captured quant_engine_panels.png");

  ws.close();
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
