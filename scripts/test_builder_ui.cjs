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
  ok((await $(`document.getElementById('builder-stock-search').value`))==="RELIANCE" && t.includes("₹ INR") && t.includes("^NSEI"), "pick RELIANCE -> India, INR, ^NSEI", t.slice(0, 200));
  ok((await $(`document.getElementById('section-execution').innerText`)).includes("₹"), "execution capital label switches to ₹");
  await click(/United States/, "document.getElementById('section-universe')"); await b.sleep(300);
  await $(`[...document.querySelectorAll('#section-universe button')].find(e=>e.innerText.startsWith('AAPL'))?.click()`); await b.sleep(500);
  t = await $(`document.getElementById('section-universe').innerText`);
  ok((await $(`document.getElementById('builder-stock-search').value`))==="AAPL" && t.includes("$ USD") && /SPY/.test(t), "pick AAPL -> US, USD, SPY", t.slice(0, 200));
  const capUs = await $(`document.querySelector('#section-execution input[type=number]').value`);
  ok(capUs === "100000", "capital swaps back to the US default", capUs);
  // search: an Indian stock outside the hardcoded list
  await setVal('#builder-stock-search', "DIXON"); await b.sleep(1500);
  const sr = await $(`[...document.querySelectorAll('#section-universe .cursor-pointer.px-3')].map(e=>e.innerText.replace(/\\n/g,' ').slice(0,60))`);
  console.log("      search results:", JSON.stringify(sr).slice(0, 200));
  if (sr.length) {
    await $(`document.querySelector('#section-universe .cursor-pointer.px-3').click()`); await b.sleep(700);
    t = await $(`document.getElementById('section-universe').innerText`);
    ok((await $(`document.getElementById('builder-stock-search').value`))==="DIXON" && t.includes("₹ INR"), "searching an unlisted Indian stock selects it as India/INR", t.slice(0, 160));
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
  ok(await $(`!!${lastRule}.querySelector('input[aria-label="Right operand"]')`), "switch rule back to an indicator");
  // remove an indicator that a rule uses -> flagged
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
  await click(/^Run backtest/); await b.sleep(600);
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
  await click(/^Run backtest/);
  ok(await b.waitFor(`/^\\/backtests\\/bt_/.test(location.pathname)`, 120000), "Run backtest saves, launches and opens the result", await $(`location.pathname`));
  if (/^\/backtests\/bt_/.test(await $(`location.pathname`))) {
    await b.waitFor(`document.body.innerText.includes('Completed')||document.body.innerText.includes('COMPLETED')`, 30000);
    t = await body();
    ok(t.includes(NAME.replace(/ /g, " ")) || t.includes("ZZ Lab Test"), "result page shows the strategy that was built");
  }

  // the run above left us on the result page; come back to a fresh builder
  await b.send("Page.navigate", { url: BASE + "/strategies/builder" });
  await b.waitFor(`!!document.querySelector('input[placeholder="e.g. EMA Momentum Alpha"]')`, 30000); await b.sleep(1500);
  // ---- phase A: nav status, undo/redo, import/export, breadcrumb ----
  ok(await $(`!!document.querySelector('nav[aria-label=Breadcrumb]')&&document.querySelector('nav[aria-label=Breadcrumb]').innerText.includes('Strategy Lab')`), "breadcrumb shows Strategies / Strategy Lab");
  await setVal('input[placeholder="e.g. EMA Momentum Alpha"]', ""); await b.sleep(300);
  ok(await $(`!![...document.querySelectorAll('nav[aria-label="Strategy sections"] button')].find(x=>x.innerText.includes('Identity')&&x.querySelector('[aria-label$="issues to fix"],[aria-label$="issue to fix"]'))`), "empty name marks the Identity section with an issue badge");
  ok(await $(`!![...document.querySelectorAll('nav[aria-label="Strategy sections"] button')].find(x=>x.innerText.includes('Universe')&&x.querySelector('[aria-label="No issues"]'))`), "a healthy section shows a check mark");
  await setVal('input[placeholder="e.g. EMA Momentum Alpha"]', "Undo Probe"); await b.sleep(900);
  await setVal('input[placeholder="e.g. EMA Momentum Alpha"]', "Undo Probe Two"); await b.sleep(900);
  await click("Undo"); await b.sleep(300);
  ok((await $(`document.querySelector('input[placeholder="e.g. EMA Momentum Alpha"]').value`)) === "Undo Probe", "Undo restores the previous name");
  await click("Redo"); await b.sleep(300);
  ok((await $(`document.querySelector('input[placeholder="e.g. EMA Momentum Alpha"]').value`)) === "Undo Probe Two", "Redo re-applies it");
  const imp = JSON.stringify({ format: "quantsynthica.strategy/1", strategy: { name: "Imported Probe", asset: "AAPL", timeframe: "1D", indicators: [], entry_rules: [], exit_rules: [], risk: { position_size_pct: 10, max_positions: 3 }, execution: { initial_capital: 100000 } } });
  await $(`(()=>{const i=document.querySelector('input[type=file]');const dt=new DataTransfer();dt.items.add(new File([${JSON.stringify(imp)}],'probe.json',{type:'application/json'}));i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}))})()`); await b.sleep(600);
  ok((await $(`document.querySelector('input[placeholder="e.g. EMA Momentum Alpha"]').value`)) === "Imported Probe", "Import loads a strategy from a JSON file");
  await $(`(()=>{const i=document.querySelector('input[type=file]');const dt=new DataTransfer();dt.items.add(new File(['not json'],'bad.json'));i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}))})()`); await b.sleep(400);
  ok(/not valid JSON/i.test(await $(`document.body.innerText`)), "importing a bad file shows an error");
  ok(await $(`[...document.querySelectorAll('button')].some(x=>x.innerText.trim()==='Export')`), "Export button present");

  // ---- phase B: live preview ----
  await click("Presets"); await b.sleep(300);
  await click(/Dual Moving Average/, "document.querySelector('[role=dialog]')"); await b.sleep(400);
  await $(`(()=>{const el=document.querySelector('[data-testid=live-preview]');el&&el.scrollIntoView()})()`);
  ok(await b.waitFor(`(()=>{const p=document.querySelector('[data-testid=live-preview]');return !!p&&/return/i.test(p.innerText)&&/trades/i.test(p.innerText)})()`, 30000), "live preview shows return / trades for a valid strategy");
  const marks = await $(`document.querySelectorAll('[data-testid=live-preview] svg path[fill="#10b981"]').length`);
  ok(marks > 0, "price chart draws entry markers", String(marks));
  const t1 = await $(`document.querySelector('[data-testid=live-preview]').innerText`);
  await setVal('input[placeholder="e.g. EMA Momentum Alpha"]', "Preview Probe");
  await $(`(()=>{const i=[...document.querySelectorAll('#section-indicators input[type=number]')][0];const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;set.call(i,'5');i.dispatchEvent(new Event('input',{bubbles:true}))})()`); await b.sleep(2500);
  const t2 = await $(`document.querySelector('[data-testid=live-preview]').innerText`);
  ok(t1 !== t2, "preview updates when an indicator parameter changes");
  await $(`(()=>{const nm=document.querySelector('input[placeholder="e.g. EMA Momentum Alpha"]');const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;set.call(nm,'');nm.dispatchEvent(new Event('input',{bubbles:true}))})()`); await b.sleep(600);
  ok(/Fix \d+ issue/.test(await $(`document.querySelector('[data-testid=live-preview]').innerText`)), "preview asks to fix issues when the strategy is invalid");

  // ---- phase C: rule editor ----
  await click("Presets"); await b.sleep(300);
  await click(/Dual Moving Average/, "document.querySelector('[role=dialog]')"); await b.sleep(500);
  ok(/In plain English:.*Buy at the next bar's open when/.test(await $(`document.getElementById('section-entry').innerText`)), "entry section has a plain-English readback");
  ok(/simple moving average/.test(await $(`document.querySelector('[data-testid=entry-readback]').innerText`)), "readback spells out the indicator in words");
  await $(`document.querySelector('#section-entry input[aria-label="Left operand"]').focus()`); await b.sleep(200);
  ok((await $(`document.querySelectorAll('#section-entry [role=option]').length`)) >= 6, "focusing an operand lists prices and indicators");
  await $(`(()=>{const i=document.querySelector('#section-entry input[aria-label="Left operand"]');const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;set.call(i,'sm');i.dispatchEvent(new Event('input',{bubbles:true}))})()`); await b.sleep(250);
  const opts = await $(`[...document.querySelectorAll('#section-entry [role=option]')].map(o=>o.innerText.replace(/\\n/g,' '))`);
  ok(opts.length > 0 && opts.every((o) => /sma/i.test(o)), "typing filters the suggestions", JSON.stringify(opts));
  await $(`(()=>{const i=document.querySelector('#section-entry input[aria-label="Left operand"]');const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;set.call(i,'smaa_fast');i.dispatchEvent(new Event('input',{bubbles:true}));i.blur();document.body.dispatchEvent(new MouseEvent('mousedown',{bubbles:true}))})()`); await b.sleep(500);
  const badTxt = await $(`document.getElementById('section-entry').innerText`);
  ok(/not a price or an indicator/.test(badTxt) && /Did you mean/.test(badTxt), "a misspelt operand gets an inline error with a suggestion", badTxt.slice(0, 300));
  await $(`[...document.querySelectorAll('#section-entry button')].find(x=>/^Use /.test(x.innerText.trim()))?.click()`); await b.sleep(400);
  ok(!/not a price or an indicator/.test(await $(`document.getElementById('section-entry').innerText`)), "the suggested fix repairs the rule");
  await setVal('#section-entry select[aria-label="Operator"]', "==", "HTMLSelectElement"); await b.sleep(300);
  ok(/almost never triggers/.test(await $(`document.getElementById('section-entry').innerText`)), "'equals' on continuous values is warned about");

  // ---- phase D: direction, ATR stops, sweep, history ----
  await click("Presets"); await b.sleep(300);
  await click(/Dual Moving Average/, "document.querySelector('[role=dialog]')"); await b.sleep(500);
  await $(`document.querySelector('#section-risk [role=combobox][aria-label=Direction]').click()`); await b.sleep(200);
  await $(`[...document.querySelectorAll('#section-risk [role=option]')].find(o=>/Long & short/.test(o.innerText)).dispatchEvent(new MouseEvent('mousedown',{bubbles:true}))`); await b.sleep(400);
  ok(/flip/i.test(await $(`document.querySelector('[data-testid=direction-help]').innerText`)), "Direction: Long & short explains the flip behaviour");
  ok(/Long & short/.test(await $(`[...document.querySelectorAll('aside')].pop().innerText`)), "summary shows the direction");
  await click(/ATR multiple/, "document.getElementById('section-risk')"); await b.sleep(400);
  ok(await $(`!![...document.querySelectorAll('#section-risk label')].find(l=>/stop.*ATR/i.test(l.innerText))`), "ATR mode shows the ATR stop field");
  ok(/× ATR/.test(await $(`[...document.querySelectorAll('aside')].pop().innerText`)), "summary shows the ATR stop");
  await click(/Percent/, "document.getElementById('section-risk')"); await b.sleep(300);
  ok(await $(`!![...document.querySelectorAll('#section-risk label')].find(l=>/stop loss/i.test(l.innerText))`), "switching back to percent restores the % stop");

  // sweep one indicator parameter on the real engine
  await $(`document.getElementById('section-sweep').scrollIntoView()`);
  await $(`document.querySelector('#section-sweep input[aria-label^="Sweep SMA"]').click()`); await b.sleep(300);
  ok(/Run sweep \(\d+\)/.test(await $(`document.getElementById('section-sweep').innerText`)), "ticking a parameter enables a sweep with a combination count");
  await click(/^Run sweep/, "document.getElementById('section-sweep')");
  ok(await b.waitFor(`!!document.querySelector('[data-testid=sweep-result]')`, 120000), "the sweep returns results", await $(`document.getElementById('section-sweep').innerText.slice(-300)`));
  ok(/Apply best/.test(await $(`document.getElementById('section-sweep').innerText`)), "sweep offers to apply the best values");
  await click(/Apply best/, "document.getElementById('section-sweep')"); await b.sleep(500);
  ok(/Applied the best values/.test(await $(`document.body.innerText`)), "Apply best updates the strategy");

  // history
  await setVal('input[placeholder="e.g. EMA Momentum Alpha"]', "History Probe " + Date.now().toString(36)); await b.sleep(300);
  await key("s", true); await b.sleep(1500);
  await click("History"); await b.sleep(900);
  ok(/Version 1/.test(await $(`document.querySelector('[data-testid=history-list]')?.innerText||''`)), "History lists the saved version");
  await click("Close", "document.querySelector('[role=dialog]')"); await b.sleep(200);
  await setVal('input[placeholder="e.g. EMA Momentum Alpha"]', "History Probe edited"); await key("s", true); await b.sleep(1500);
  await click("History"); await b.sleep(900);
  const hist = await $(`document.querySelector('[data-testid=history-list]').innerText`);
  ok(/Version 2/.test(hist) && /Restore/.test(hist), "a second save adds a version with a restore option", hist.slice(0, 200));

  console.log(`\n${pass} passed, ${fail} failed`);
  b.close(); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); closer(); process.exit(2); });
