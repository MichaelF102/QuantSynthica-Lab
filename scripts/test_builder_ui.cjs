// End-to-end check of the Strategy Lab. Usage: BASE=http://localhost:3000 node scripts/test_builder_ui.cjs
const { launch } = require("./cdp.cjs");
const BASE = process.env.BASE || "http://localhost:3000";
let pass = 0, fail = 0;
const ok = (c, name, extra = "") => { (c ? pass++ : fail++); console.log(`${c ? "PASS" : "FAIL"}  ${name}${!c && extra ? "  -> " + extra : ""}`); };
let closer = () => {};
(async () => {
  const b = await launch(`${BASE}/strategies`); closer = b.close;
  await b.send("Emulation.setDeviceMetricsOverride", { width: 1700, height: 1100, deviceScaleFactor: 1, mobile: false });
  const $ = (e) => b.ev(e);
  const body = () => $(`document.body.innerText`);
  const click = (label, scope = "document") => $(`(()=>{const els=[...${scope}.querySelectorAll('button,a,[role=button]')];const el=els.find(e=>${typeof label === "string" ? `e.innerText.trim()===${JSON.stringify(label)}||e.getAttribute('aria-label')===${JSON.stringify(label)}` : `${label}.test(e.innerText.trim())||${label}.test(e.getAttribute('aria-label')||'')`});if(!el)return false;el.click();return true})()`);
  const setVal = (sel, val, proto = "HTMLInputElement") => $(`(()=>{const i=document.querySelector(${JSON.stringify(sel)});if(!i)return false;const set=Object.getOwnPropertyDescriptor(${proto}.prototype,'value').set;set.call(i,${JSON.stringify(val)});i.dispatchEvent(new Event(${proto === "HTMLSelectElement" ? "'change'" : "'input'"},{bubbles:true}));return true})()`);
  const key = (k, ctrl) => $(`window.dispatchEvent(new KeyboardEvent('keydown',{key:${JSON.stringify(k)},ctrlKey:${!!ctrl},bubbles:true}))`);
  const bad = (t) => /NaN|undefined|Infinity|\[object/.test(t);

  // ---- navigation: Lab button lives on Strategies, not in the navbar ----
  ok(await b.waitFor(`document.body.innerText.includes('Strategy Library')`, 90000), "strategies page loads");
  ok(!(await $(`[...document.querySelectorAll('header a')].some(a=>/Strategy Lab|^Lab$/.test(a.innerText.trim()))`)), "navbar no longer has the Strategy Lab button");
  ok(await $(`!![...document.querySelectorAll('main a, div a')].find(a=>a.innerText.includes('Strategy Lab')&&a.getAttribute('href')==='/strategies/builder')`), "Strategies page has the Strategy Lab button");
  await click(/^Strategy Lab/);
  ok(await b.waitFor(`location.pathname==='/strategies/builder'&&document.body.innerText.includes('Model identity')`, 60000), "Lab button opens the builder");
  await b.sleep(1500);
  ok(b.errors.length === 0, "builder loads with no console errors / hydration warnings", b.errors.join(" | ").slice(0, 300));
  ok(!bad(await body()), "no NaN/undefined on load");

  // ---- section nav ----
  for (const [label, id] of [["Risk management", "risk"], ["Entry conditions", "entry"], ["Identity & thesis", "identity"]]) {
    await click(new RegExp("^" + label.replace(/[&]/g, "\\$&")), "document.querySelector('nav[aria-label=\"Strategy sections\"]')"); await b.sleep(1800);
    const top = await $(`Math.round(document.getElementById('section-${id}').getBoundingClientRect().top)`);
    const cur = await $(`document.querySelector('nav[aria-label="Strategy sections"] [aria-current]')?.innerText`);
    ok(top >= 0 && top < 700 && cur.includes(label), `jump nav -> ${label}`, `top=${top} cur=${cur}`);
  }

  // ---- identity ----
  const NAME = "ZZ Lab Test " + Date.now().toString(36);
  await setVal('input[placeholder^="e.g. EMA"]', NAME);
  await b.sleep(300);
  let t = await body();
  ok(t.includes(NAME) && /Unsaved changes/i.test(t), "name edit updates header + unsaved badge");

  // ---- universe: market + benchmark + currency ----
  await click(/India/, "document.getElementById('section-universe')"); await b.sleep(300);
  await $(`[...document.querySelectorAll('#section-universe button')].find(e=>e.innerText.startsWith('RELIANCE'))?.click()`); await b.sleep(500);
  t = await $(`document.getElementById('section-universe').innerText`);
  ok(/Selected\s*RELIANCE/.test(t) && t.includes("₹ INR") && t.includes("^NSEI"), "pick RELIANCE -> India, INR, ^NSEI", t.slice(0, 200));
  ok((await $(`document.getElementById('section-execution').innerText`)).includes("₹"), "execution capital label switches to ₹");
  await click(/United States/, "document.getElementById('section-universe')"); await b.sleep(300);
  await $(`[...document.querySelectorAll('#section-universe button')].find(e=>e.innerText.startsWith('AAPL'))?.click()`); await b.sleep(500);
  t = await $(`document.getElementById('section-universe').innerText`);
  ok(/Selected\s*AAPL/.test(t) && t.includes("$ USD") && /SPY/.test(t), "pick AAPL -> US, USD, SPY", t.slice(0, 200));
  const capUs = await $(`document.querySelector('#section-execution input[type=number]').value`);
  ok(capUs === "100000", "capital swaps back to the US default", capUs);
  // search: an Indian stock outside the hardcoded list
  await setVal('#builder-stock-search', "DIXON"); await b.sleep(1500);
  const sr = await $(`[...document.querySelectorAll('#section-universe .cursor-pointer.px-3')].map(e=>e.innerText.replace(/\\n/g,' ').slice(0,60))`);
  console.log("      search results:", JSON.stringify(sr).slice(0, 200));
  if (sr.length) {
    await $(`document.querySelector('#section-universe .cursor-pointer.px-3').click()`); await b.sleep(700);
    t = await $(`document.getElementById('section-universe').innerText`);
    ok(/Selected\s*DIXON/.test(t) && t.includes("₹ INR"), "searching an unlisted Indian stock selects it as India/INR", t.slice(0, 160));
  } else ok(false, "stock search returns results");
  await click(/United States/, "document.getElementById('section-universe')"); await b.sleep(200); await $(`[...document.querySelectorAll('#section-universe button')].find(e=>e.innerText.startsWith('AAPL'))?.click()`); await b.sleep(400);

  // browse modal
  ok(await click(/Browse the full universe/), "browse universe button exists"); await b.sleep(1200);
  ok(await $(`!!document.querySelector('[role=dialog]')`), "universe modal opens");
  ok((await $(`document.querySelectorAll('[role=dialog] tbody tr').length`)) > 0, "universe modal lists securities");
  await key("Escape"); await b.sleep(300);
  ok(!(await $(`!!document.querySelector('[role=dialog]')`)), "universe modal closes on Escape");

  // ---- indicators ----
  const nInd = () => $(`document.querySelectorAll('#section-indicators input[type=number]').length`);
  const rowCount = () => $(`[...document.querySelectorAll('#section-indicators button[aria-label^="Remove "]')].length`);
  const r0 = await rowCount();
  await setVal('select[aria-label="Add indicator"]', "SMA", "HTMLSelectElement"); await b.sleep(400);
  ok((await rowCount()) === r0 + 1, "add indicator", `${r0}->${await rowCount()}`);
  await setVal('select[aria-label="Add indicator"]', "SMA", "HTMLSelectElement"); await b.sleep(300);
  const ids = await $(`[...document.querySelectorAll('#section-indicators .font-mono.text-slate-400')].map(e=>e.innerText)`);
  ok(new Set(ids).size === ids.length, "indicator ids are unique", ids.join(","));
  await setVal('#section-indicators input[type=number]', "13"); await b.sleep(200);
  ok((await $(`document.querySelector('#section-indicators input[type=number]').value`)) === "13", "indicator param editable");
  await setVal('#section-indicators input[type=number]', "0"); await b.sleep(300);
  ok(/must be a positive number/.test(await body()), "zero period triggers validation");
  await setVal('#section-indicators input[type=number]', "12"); await b.sleep(200);

  // ---- rules ----
  const entryRows = () => $(`document.querySelectorAll('#section-entry button[aria-label="Remove rule"]').length`);
  const e0 = await entryRows();
  await click(/Add entry rule/); await b.sleep(300);
  ok((await entryRows()) === e0 + 1, "add entry rule");
  await setVal('#section-entry select[aria-label="Operator"]', "CROSS_ABOVE", "HTMLSelectElement"); await b.sleep(200);
  ok((await $(`document.getElementById('section-entry').innerText`)).includes("crosses above"), "operator change reflected in the readable rule");
  const lastRule = `[...document.querySelectorAll('#section-entry .space-y-2.rounded-xl')].pop()`;
  await $(`${lastRule}.querySelector('button[title^="Compare with a number"]').click()`); await b.sleep(300);
  ok(await $(`!!${lastRule}.querySelector('input[aria-label=Threshold]')`), "switch rule to a numeric value");
  await $(`${lastRule}.querySelector('button[title^="Compare with an indicator"]').click()`); await b.sleep(300);
  ok(await $(`!!${lastRule}.querySelector('select[aria-label="Right operand"]')`), "switch rule back to an indicator");
  // remove an indicator that a rule uses -> flagged
  const usedId = await $(`document.querySelector('#section-entry select[aria-label="Left operand"]').value`);
  await $(`(()=>{const b=document.querySelector('#section-indicators button[aria-label="Remove ${"fast_ema"}"]');b&&b.click()})()`); await b.sleep(400);
  t = await body();
  ok(/is not a price or an indicator/.test(t), "removing an indicator used by a rule is flagged");
  await click("Presets"); await b.sleep(300);
  ok(await $(`!!document.querySelector('[role=dialog]')`), "presets modal opens");
  await key("Escape"); await b.sleep(250);
  ok(!(await $(`!!document.querySelector('[role=dialog]')`)), "presets modal closes on Escape");
  // reset via template
  await click("Presets"); await b.sleep(300);
  await $(`[...document.querySelectorAll('[role=dialog] button')].find(e=>/Dual Moving Average/.test(e.innerText))?.click()`); await b.sleep(500);
  t = await body();
  ok(/Dual Moving Average Crossover \(Custom\)/.test(t), "applying a template loads it");
  ok((await $(`document.getElementById('section-universe').innerText`)).includes("AAPL"), "template keeps the selected stock");
  await setVal('input[placeholder^="e.g. EMA"]', NAME); await b.sleep(200);

  // ---- risk & window validation ----
  await setVal('#section-risk input[placeholder="e.g. 2"]', ""); await b.sleep(250);
  ok(/No stop loss/.test(await body()), "empty stop loss is a warning, not a blocker");
  await setVal('#section-risk input[placeholder="e.g. 2"]', "2");
  await setVal('#section-risk input[max="100"]', "150"); await b.sleep(250);
  ok(/Position size must be between/.test(await body()), "position size > 100% is an error");
  await setVal('#section-risk input[max="100"]', "20");
  await setVal('#section-execution input[type=date]', "2030-01-01"); await b.sleep(250);
  ok(/start date must be before/.test(await body()), "invalid window start is an error");
  await click("2Y"); await b.sleep(250);
  ok(!/start date must be before|cannot be in the future/.test(await body()), "2Y quick window fixes the window");
  ok(/Ready to test and backtest/.test(await body()), "strategy valid again");

  // ---- empty entry blocks running ----
  const savedEntry = await entryRows();
  for (let i = 0; i < savedEntry; i++) await $(`document.querySelector('#section-entry button[aria-label="Remove rule"]').click()`);
  await b.sleep(300);
  ok(/Add at least one entry rule/.test(await body()), "no entry rules -> issue listed");
  await click("Run full backtest"); await b.sleep(600);
  ok(location_ok(await $(`location.pathname`)), "Run is blocked while invalid", await $(`location.pathname`));
  function location_ok(p) { return p === "/strategies/builder"; }
  await click(/Add entry rule/); await b.sleep(200);
  // make rule valid: close > sma
  ok(/Ready to test and backtest|issue/.test(await body()), "rule re-added");

  // ---- save ----
  await key("s", true); await b.sleep(1500);
  t = await body();
  ok(/Strategy saved/i.test(t) && /saved/i.test(t) && !/Unsaved changes/i.test(t), "Ctrl+S saves and clears the unsaved badge", t.slice(0, 400).split("\n").join(" "));
  const listed = await $(`fetch('http://localhost:8000/strategies').then(r=>r.json()).then(l=>l.some(s=>s.name===${JSON.stringify(NAME)})).catch(()=>false)`);
  ok(listed, "saved strategy is persisted by the backend");

  // ---- Test on stock ----
  await click("Test on stock"); await b.sleep(700);
  ok(await $(`document.body.innerText.includes('Test Strategy on Custom Stock')`), "Test on stock opens the quick-test modal");
  await click("Cancel"); await b.sleep(300);

  // ---- run backtest end-to-end ----
  ok(b.errors.length === 0, "no console errors during the session", b.errors.join(" | ").slice(0, 300));
  await click("Run full backtest");
  ok(await b.waitFor(`/^\\/backtests\\/bt_/.test(location.pathname)`, 120000), "Run backtest saves, launches and opens the result", await $(`location.pathname`));
  if (/^\/backtests\/bt_/.test(await $(`location.pathname`))) {
    await b.waitFor(`document.body.innerText.includes('Completed')||document.body.innerText.includes('COMPLETED')`, 30000);
    t = await body();
    ok(t.includes(NAME.replace(/ /g, " ")) || t.includes("ZZ Lab Test"), "result page shows the strategy that was built");
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  b.close(); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); closer(); process.exit(2); });
