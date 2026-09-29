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

  const page = pages.find(p => p.type === "page");
  if (!page) {
    console.error("No page found");
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
    height: 1200,
    deviceScaleFactor: 1,
    mobile: false
  });

  console.log("Navigating to http://localhost:3000");
  await send("Page.navigate", { url: "http://localhost:3000" });
  await new Promise(r => setTimeout(r, 3500));

  // Scroll to #portfolio-intelligence
  await send("Runtime.evaluate", {
    expression: `
      (() => {
        const el = document.getElementById("portfolio-intelligence");
        if (el) {
          el.scrollIntoView({ behavior: "instant", block: "start" });
        }
      })()
    `
  });

  await new Promise(r => setTimeout(r, 1500));

  const shotTop = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("/home/michaelfernandes/.gemini/antigravity-ide/brain/7aeaaa94-aee7-4dca-bc62-5b8bf9ac3f48/portfolio_intelligence_top_shot.png", Buffer.from(shotTop.data, "base64"));
  console.log("Captured portfolio_intelligence_top_shot.png");

  // Scroll down 750px to view workflow stages & DNA
  await send("Runtime.evaluate", {
    expression: `
      (() => {
        window.scrollBy(0, 750);
      })()
    `
  });

  await new Promise(r => setTimeout(r, 1200));

  const shotBottom = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("/home/michaelfernandes/.gemini/antigravity-ide/brain/7aeaaa94-aee7-4dca-bc62-5b8bf9ac3f48/portfolio_intelligence_stages_shot.png", Buffer.from(shotBottom.data, "base64"));
  console.log("Captured portfolio_intelligence_stages_shot.png");

  ws.close();
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
