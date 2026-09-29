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
    height: 1100,
    deviceScaleFactor: 1,
    mobile: false
  });

  console.log("Navigating to http://localhost:3000...");
  await send("Page.navigate", { url: "http://localhost:3000" });
  await new Promise(r => setTimeout(r, 4000));

  // Scroll to #workflow
  await send("Runtime.evaluate", {
    expression: `
      (() => {
        const el = document.getElementById("workflow");
        if (el) {
          el.scrollIntoView({ behavior: "instant", block: "start" });
        }
      })()
    `
  });

  await new Promise(r => setTimeout(r, 1000));

  // Shot 1: Initial stage 0 (DATA)
  const shotData = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(
    "/home/michaelfernandes/.gemini/antigravity-ide/brain/7aeaaa94-aee7-4dca-bc62-5b8bf9ac3f48/workflow_stage_data.png",
    Buffer.from(shotData.data, "base64")
  );
  console.log("Captured workflow_stage_data.png");

  // Click on stage 2 (STRATEGY) via tab
  await send("Runtime.evaluate", {
    expression: `
      (() => {
        const tab = document.getElementById("workflow-tab-2");
        if (tab) tab.click();
      })()
    `
  });

  await new Promise(r => setTimeout(r, 800));

  // Shot 2: Stage 2 (STRATEGY)
  const shotStrategy = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(
    "/home/michaelfernandes/.gemini/antigravity-ide/brain/7aeaaa94-aee7-4dca-bc62-5b8bf9ac3f48/workflow_stage_strategy.png",
    Buffer.from(shotStrategy.data, "base64")
  );
  console.log("Captured workflow_stage_strategy.png");

  // Click on stage 4 (RISK) via bottom preview button
  await send("Runtime.evaluate", {
    expression: `
      (() => {
        const buttons = Array.from(document.querySelectorAll("#workflow button"));
        const riskBtn = buttons.find(b => b.textContent && b.textContent.includes("05 RISK"));
        if (riskBtn) riskBtn.click();
      })()
    `
  });

  await new Promise(r => setTimeout(r, 800));

  // Shot 3: Stage 4 (RISK)
  const shotRisk = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(
    "/home/michaelfernandes/.gemini/antigravity-ide/brain/7aeaaa94-aee7-4dca-bc62-5b8bf9ac3f48/workflow_stage_risk.png",
    Buffer.from(shotRisk.data, "base64")
  );
  console.log("Captured workflow_stage_risk.png");

  ws.close();
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
