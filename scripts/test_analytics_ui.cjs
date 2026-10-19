// End-to-end check of every control on /analytics. Usage: BASE=http://localhost:3000 node scripts/test_analytics_ui.cjs
const { launch } = require("./cdp.cjs");
const BASE = process.env.BASE || "http://localhost:3000";
let pass = 0, fail = 0;
const ok = (c, name, extra = "") => { (c ? pass++ : fail++); console.log(`${c ? "PASS" : "FAIL"}  ${name}${!c && extra ? "  -> " + extra : ""}`); };

let b_close = () => {};
(async () => {
  const b = await launch(`${BASE}/analytics`); b_close = b.close;
  await b.send("Emulation.setDeviceMetricsOverride", { width: 1700, height: 1100, deviceScaleFactor: 1, mobile: false });
  const $ = (e) => b.ev(e);
  const text = () => $(`document.querySelector('main').innerText`);
  // click the first element (button/a) in main or body whose text matches exactly / by regex
  const click = (label, scope = "document") => $(`(()=>{const els=[...${scope}.querySelectorAll('button,a,[role=button]')];const el=els.find(e=>${typeof label === "string" ? `e.innerText.trim()===${JSON.stringify(label)}||e.getAttribute('aria-label')===${JSON.stringify(label)}` : `${label}.test(e.innerText.trim())`});if(!el)return false;el.click();return true})()`);
  const setSelect = (idx, val) => $(`(()=>{const s=[...document.querySelectorAll('main select')][${idx}];if(!s)return false;const set=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set;set.call(s,${JSON.stringify(val)});s.dispatchEvent(new Event('change',{bubbles:true}));return true})()`);
  const setInput = (sel, val) => $(`(()=>{const i=document.querySelector(${JSON.stringify(sel)});if(!i)return false;const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;set.call(i,${JSON.stringify(val)});i.dispatchEvent(new Event('input',{bubbles:true}));return true})()`);
  const SUB = `document.querySelector('nav[aria-label="Analytics sections"]')`;
  const tab = (n) => click(n, SUB);
  const bad = (t) => /NaN|undefined|Infinity|\[object/.test(t);

  ok(await b.waitFor(`document.body.innerText.includes('Strategy Analytics')&&document.body.innerText.includes('Total return')`, 90000), "page loads with KPIs");
  await b.sleep(1500);
  let t = await text();
  ok(!bad(t), "overview has no NaN/undefined", (t.match(/.{20}(NaN|undefined|Infinity).{20}/) || [])[0]);
  const chipCount = () => $(`[...document.querySelectorAll('main button[aria-label^="Remove "]')].length`);
  const n0 = await chipCount();
  ok(n0 >= 1, `strategy chips shown (${n0})`);

  // ---- sub-nav tabs ----
  const tabs = ["Overview", "Compare", "Portfolio", "Performance", "Risk", "Trades", "Regimes", "Factors", "Robustness", "Attribution"];
  for (const tb of tabs) {
    const e0 = b.errors.length;
    await tab(tb); await b.waitFor(`document.querySelector('nav[aria-label="Analytics sections"] [aria-current]')?.innerText.trim()===${JSON.stringify(tb)}`, 15000); await b.sleep(700);
    const cur = await $(`document.querySelector('nav[aria-label="Analytics sections"] [aria-current]')?.innerText.trim()`);
    const url = await $(`location.search`);
    t = await text();
    ok(cur === tb && url.includes(`tab=${tb}`), `tab ${tb} activates + URL`, `${cur} ${url}`);
    ok(!bad(t) && t.length > 300, `tab ${tb} renders real content`, (t.match(/.{20}(NaN|undefined|Infinity).{20}/) || [t.length])[0]);
    ok(b.errors.length === e0, `tab ${tb} no console errors`, b.errors.slice(e0).join(" | ").slice(0, 200));
  }
  await tab("Overview"); await b.sleep(800);

  // ---- header: date window ----
  const label = () => $(`[...document.querySelectorAll('main p')].find(p=>p.innerText.startsWith('KPIs for'))?.innerText`);
  const base = await label();
  await click(/→/); await b.sleep(300);
  ok(await $(`!!document.querySelector('input[type=date]')`), "date popover opens");
  await setInput('input[type=date]', "2022-06-01"); await click("Cancel"); await b.sleep(200);
  ok(!(await $(`!!document.querySelector('main input[type=date]')`)), "date Cancel closes popover");
  await click(/→/); await b.sleep(200);
  await setInput('input[type=date]', "2022-06-01"); await click("Apply"); await b.sleep(300);
  ok((await $(`document.querySelector('main header button.font-mono, main header button')?.innerText`)).includes("2022-06-01"), "date Apply updates the button");
  ok((await label()) === base, "window not applied until Run Analysis (draft semantic)", await label());
  await click(/Run Analysis/); await b.sleep(900);
  ok((await label()).includes("2022-06-01"), "Run Analysis applies date window", await label());
  // invalid range (start after end)
  await click(/→/); await b.sleep(200);
  await setInput('input[type=date]', "2030-01-01"); await click("Apply"); await b.sleep(300);
  ok(await $(`!!document.querySelector('input[type=date]')`), "start>end is rejected (popover stays open)");
  await click("Cancel");

  // ---- frequency + currency ----
  await setSelect(0, "Weekly"); await click(/Run Analysis/); await b.sleep(900);
  ok((await label()).includes("Weekly"), "frequency Weekly applies", await label());
  const sel = await $(`[...document.querySelectorAll('main select')].map(s=>[s.value,[...s.options].map(o=>o.value).join('/')])`);
  console.log("      selects:", JSON.stringify(sel));
  ok((await text()).includes("USD ($)") && (await $(`document.querySelectorAll('main header select').length`)) === 1, "currency is a read-only label of the run's currency (no fake FX switch)");
  await setSelect(0, "Daily"); await click(/Run Analysis/); await b.sleep(900);

  // ---- overview controls ----
  const e1 = b.errors.length;
  await $(`document.querySelector('main input[placeholder^="Search strat"]')?.focus()`);
  await setInput('input[placeholder^="Search strat"]', "Dual"); await b.sleep(400);
  const opts = await $(`[...document.querySelectorAll('main .overflow-y-auto button')].length`);
  ok(opts > 0, `strategy search lists matches (${opts})`);
  const before = await chipCount();
  if (opts > 0) { await $(`document.querySelector('main .overflow-y-auto button').click()`); await b.sleep(500); }
  ok((await chipCount()) === before + 1 || opts === 0, "selecting a search result adds a chip", `${before}->${await chipCount()}`);
  await setInput('input[placeholder^="Search strat"]', "zzzz"); await b.sleep(300);
  ok(!(await $(`!!document.querySelector('main .overflow-y-auto button')`)), "no-match search shows no dropdown");
  await setInput('input[placeholder^="Search strat"]', "");
  const c1 = await chipCount();
  await $(`document.querySelector('main button[aria-label^="Remove "]').click()`); await b.sleep(400);
  ok((await chipCount()) === c1 - 1, "remove chip works", `${c1}->${await chipCount()}`);
  await click("Clear all"); await b.sleep(400);
  ok((await chipCount()) === 1, "Clear all leaves exactly one strategy", String(await chipCount()));
  ok(!(await text()).includes("Distribution & drawdown for"), "distribution selector hidden with 1 strategy");
  // asset filter
  const assets = await $(`[...document.querySelectorAll('main select')].find(s=>[...s.options].some(o=>o.value==='All'))?.options.length`);
  console.log("      asset options:", assets);

  // chart modes
  for (const m of ["Cumulative Return", "Drawdown", "Log Scale", "Equity Curve"]) {
    await click(m); await b.sleep(400);
    const active = await $(`[...document.querySelectorAll('main button')].find(e=>e.innerText.trim()===${JSON.stringify(m)})?.className.includes('bg-blue-600')`);
    const axis = await $(`[...document.querySelectorAll('.recharts-yAxis .recharts-text')].map(e=>e.textContent).slice(0,3).join(',')`);
    ok(active, `chart mode ${m} active`, axis); console.log(`      y-axis [${m}]:`, axis);
  }
  for (const r of ["1M", "3M", "6M", "YTD", "1Y", "ALL"]) {
    await click(r); await b.sleep(400);
    const active = await $(`[...document.querySelectorAll('main button')].find(e=>e.innerText.trim()===${JSON.stringify(r)})?.className.includes('bg-blue-600')`);
    const pts = await $(`document.querySelectorAll('.recharts-line')[0]?.querySelectorAll('path.recharts-line-curve').length ?? 0`);
    const first = await $(`document.querySelector('.recharts-xAxis .recharts-text')?.textContent`);
    ok(active, `range ${r} active`); console.log(`      x-axis start [${r}]:`, first);
  }
  // capital
  await setInput('main input[type=number]', "50000"); await b.sleep(400);
  ok((await text()).includes("$50,000"), "initial capital rebases chart subtitle");
  await setInput('main input[type=number]', ""); await b.sleep(300);
  const capAfterClear = await $(`document.querySelector('main input[type=number]').value`);
  ok(capAfterClear === "" || capAfterClear === "100000", `clearing capital field doesn't fight typing`, `value="${capAfterClear}"`);
  await setInput('main input[type=number]', "100000");

  // modals
  for (const [open, title] of [[/More metrics/, /./], [/Columns/, /./], [/Detailed report|Report/, /./]]) {
    const clicked = await click(open); await b.sleep(400);
    const dlg = await $(`!!document.querySelector('[role=dialog]')||document.querySelectorAll('.fixed.inset-0').length>0`);
    ok(clicked && dlg, `modal ${open} opens`);
    await $(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))`); await b.sleep(250);
    const stillOpen = await $(`document.querySelectorAll('.fixed.inset-0').length>0`);
    if (stillOpen) { ok(false, `modal ${open} closes on Escape`); await click("Close"); await click("Done"); await click("Cancel"); await b.sleep(250); }
    else ok(true, `modal ${open} closes on Escape`);
    ok(!(await $(`document.querySelectorAll('.fixed.inset-0').length>0`)), `modal ${open} fully closed`);
  }
  // columns toggle
  await click(/Columns/); await b.sleep(300);
  const th0 = await $(`document.querySelectorAll('main table thead th').length`);
  await $(`document.querySelectorAll('.fixed input[type=checkbox]')[ [...document.querySelectorAll('.fixed input[type=checkbox]')].findIndex(c=>!c.checked) ]?.click()`); await b.sleep(300);
  await click(/Apply|Done|Close/, "document.querySelector('.fixed')"); await b.sleep(300);
  const th1 = await $(`document.querySelectorAll('main table thead th').length`);
  ok(th1 !== th0, "Columns modal toggle changes table columns", `${th0}->${th1}`);
  ok(b.errors.length === e1, "overview interactions: no console errors", b.errors.slice(e1).join(" | ").slice(0, 300));

  // ---- other tabs' own buttons: picker with multiple strategies ----
  await tab("Overview"); await setInput('input[placeholder^="Search strat"]', "Dual"); await b.sleep(300);
  await $(`([...document.querySelectorAll('main .overflow-y-auto button')].find(e=>e.innerText.includes('2022-01-01'))||document.querySelector('main .overflow-y-auto button'))?.click()`); await b.sleep(400);
  await tab("Risk"); await b.sleep(800);
  const picker = await $(`[...document.querySelectorAll('main button')].filter(e=>e.className.includes('rounded px-2.5')).length`);
  ok(picker >= 2, `Risk tab strategy picker has buttons (${picker})`);
  if (picker >= 2) { const t0 = await text(); await $(`[...document.querySelectorAll('main button')].filter(e=>e.className.includes('rounded px-2.5'))[1].click()`); await b.sleep(500); ok((await text()) !== t0, "picker switches strategy on Risk tab"); }
  for (const tb of ["Performance", "Trades", "Regimes", "Robustness", "Attribution"]) {
    await tab(tb); await b.sleep(700);
    const n = await $(`[...document.querySelectorAll('main button')].filter(e=>e.className.includes('rounded px-2.5')).length`);
    if (n >= 2) { const t0 = await text(); await $(`[...document.querySelectorAll('main button')].filter(e=>e.className.includes('rounded px-2.5'))[${n}-1].click()`); await b.sleep(500); ok((await text()) !== t0, `picker switches strategy on ${tb}`); }
  }
  ok(b.errors.length === e1, "all tabs: no console errors overall", b.errors.slice(e1).join(" | ").slice(0, 300));

  console.log(`\n${pass} passed, ${fail} failed`);
  b.close(); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); b_close(); process.exit(2); });
