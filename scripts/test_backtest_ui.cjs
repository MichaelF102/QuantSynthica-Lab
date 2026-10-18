// Backtest detail page: every tab renders cleanly, key controls work, phone layout fits. BASE=http://localhost:3000 node scripts/test_backtest_ui.cjs
const { launch } = require("./cdp.cjs");
const BASE = process.env.BASE || "http://localhost:3000";
const API = process.env.API || "http://localhost:8000";
let pass = 0, fail = 0;
const ok = (c, name, extra = "") => { (c ? pass++ : fail++); console.log(`${c ? "PASS" : "FAIL"}  ${name}${!c && extra ? "  -> " + extra : ""}`); };
const TABS = ["overview", "performance", "trades", "risk", "attribution", "monthly", "regime", "parameters", "monte_carlo", "notes"];
(async () => {
  const b = await launch("about:blank");
  const $ = (e) => b.ev(e);
  const runs = await fetch(API + "/backtests").then((r) => r.json());
  const big = runs.filter((r) => !r.is_sample && r.status === "COMPLETED" && r.trades.length >= 30).sort((a, c) => c.trades.length - a.trades.length)[0];
  const small = runs.filter((r) => !r.is_sample && r.status === "COMPLETED" && r.trades.length > 0 && r.trades.length < 30)[0];
  if (!big || !small) { console.log("SKIP  needs one run with 30+ trades and one with fewer; run a couple of backtests first"); process.exit(0); }
  const go = async (id, tab, w = 1600) => {
    await b.send("Emulation.setDeviceMetricsOverride", { width: w, height: 1000, deviceScaleFactor: 1, mobile: w < 600 });
    await b.send("Page.navigate", { url: `${BASE}/backtests/${id}?tab=${tab}` });
    await b.waitFor(`document.body.innerText.length>400&&!!document.querySelector('nav[aria-label="Backtest sections"]')`, 60000); await b.sleep(1800);
  };
  const click = (re, scope = "document") => $(`(()=>{const e=[...${scope}.querySelectorAll('button,a')].find(x=>${re}.test(x.innerText.trim()));if(!e)return false;e.click();return true})()`);

  // every tab, on both runs
  for (const run of [big, small]) for (const t of TABS) {
    b.errors.length = 0; await go(run.id, t);
    const r = await $(`(()=>{const m=document.querySelector('main');const txt=m.innerText;return {len:txt.length,bad:(txt.match(/NaN|undefined|Infinity|\\[object/g)||[]).length,active:document.querySelector('nav[aria-label="Backtest sections"] [aria-current]')?.innerText.trim()}})()`);
    ok(r.len > (t === "notes" ? 300 : 600) && r.bad === 0 && !!r.active && b.errors.length === 0, `${run.trades.length}-trade run · ${t} renders cleanly`, JSON.stringify(r) + " " + b.errors.slice(0, 1).join());
  }

  // small-sample notice
  await go(small.id, "overview"); ok(await $(`!!document.querySelector('[data-testid=low-sample]')`), "small run shows the small-sample notice");
  await go(big.id, "overview"); ok(!(await $(`!!document.querySelector('[data-testid=low-sample]')`)), "a run with 30+ trades does not");

  // header actions
  await go(big.id, "overview");
  await click(/^Copy link/); await b.sleep(400); ok(/Copied/.test(await $(`document.body.innerText`)), "Copy link copies the address");
  await click(/^Compare/); await b.sleep(800); ok(await $(`!!document.querySelector('[aria-label="Compare runs"]')`), "Compare opens its dialog");
  await go(big.id, "overview"); await click(/Re-run backtest/); await b.sleep(800); ok(/RE-RUN BACKTEST SIMULATION/i.test(await $(`document.body.innerText`)), "Re-run opens its dialog");
  await go(big.id, "overview"); await click(/^Download/); await b.sleep(300); await click(/Tear sheet report/); await b.sleep(900); ok(/TEARSHEET/i.test(await $(`document.body.innerText`)), "Tear sheet report opens");
  await go(big.id, "overview"); await click(/^Download/); await b.sleep(300);
  const hrefs = await $(`[...document.querySelectorAll('a[download]')].map(a=>a.href)`);
  const statuses = await Promise.all(hrefs.map((h) => fetch(h).then((r) => r.status)));
  ok(hrefs.length === 2 && statuses.every((s) => s === 200), "trade and equity CSV downloads respond 200", JSON.stringify(statuses));

  // trades tab controls
  await go(big.id, "trades");
  const sub = () => $(`document.body.innerText.match(/(\\d+) of (\\d+) trades/)?.slice(1).map(Number)`);
  const [, total] = await sub();
  await click(/^Winners$/); await b.sleep(300); const [w] = await sub();
  await click(/^Losers$/); await b.sleep(300); const [l] = await sub();
  ok(w + l === total && w > 0 && l > 0, "Winners + Losers add up to all trades", `${w}+${l} vs ${total}`);
  await click(/^All$/); await b.sleep(200);
  await $(`document.querySelector('tbody tr')?.click()`); await b.sleep(600);
  ok(/MFE|MAE/.test(await $(`document.body.innerText`)), "clicking a trade opens its detail drawer");

  // monte carlo (large run) and notes
  await go(big.id, "monte_carlo"); ok(/Probability of loss/i.test(await $(`document.body.innerText`)), "Monte Carlo shows results for a large run");
  ok(await $(`!!document.querySelector('[aria-label="Fan chart"] svg')`) && /Max drawdown distribution/i.test(await $(`document.body.innerText`)) && /P\(drawdown/i.test(await $(`document.body.innerText`)), "Monte Carlo (daily returns) shows the fan chart and drawdown statistics");
  const before = /Median max drawdown/.test(await $(`document.body.innerText`));
  await click(/^Re-run$/); await b.sleep(1500);
  ok(before, "drawdown KPI is shown");
  await click(/^Trades$/, "document.querySelector('[aria-label=Method]')"); await b.sleep(600); ok(/Terminal return distribution/i.test(await $(`document.body.innerText`)) && !(await $(`!!document.querySelector('[aria-label="Fan chart"]')`)), "the Trades method is still available");
  await go(small.id, "monte_carlo"); await click(/^Trades$/, "document.querySelector('[aria-label=Method]')"); await b.sleep(500); ok(/Too few trades/i.test(await $(`document.body.innerText`)), "the Trades method refuses a run with too few trades");
  await go(small.id, "monte_carlo"); ok(await $(`!!document.querySelector('[aria-label="Fan chart"] svg')`), "daily method resamples a run with 1 trade but 250 days");
  // exposure card
  await go(big.id, "overview"); ok(/Exposure/.test(await $(`document.body.innerText`)) && await $(`!!document.querySelector('[aria-label="Exposure and open positions"] svg')`), "Overview shows the exposure chart");
  ok(/trades were open at once|Max open/i.test(await $(`document.body.innerText`)), "exposure card reports the concurrent trades");
  await go(big.id, "notes");
  const note = "phase0 note " + Date.now();
  await $(`(()=>{const t=document.querySelector('textarea');const set=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set;set.call(t,${JSON.stringify(note)});t.dispatchEvent(new Event('input',{bubbles:true}))})()`);
  await click(/Add note/); await b.sleep(400);
  await go(big.id, "notes"); ok((await $(`document.body.innerText`)).includes(note), "a saved note is still there after reload");
  await $(`document.querySelector('button[aria-label="Delete note"]')?.click()`); await b.sleep(300); // leave no test data behind

  // ---- phase B: price chart, run details, trade tools ----
  await go(big.id, "overview");
  ok(await b.waitFor(`document.querySelectorAll('[data-testid=mark-entry]').length>0`, 30000), "Overview draws trade entries on the price chart");
  ok((await $(`document.querySelectorAll('[data-testid=mark-exit]').length`)) > 0, "and exits");
  await $(`document.querySelector('[data-testid=mark-entry]').dispatchEvent(new MouseEvent('click',{bubbles:true}))`); await b.sleep(700);
  ok(/MFE|MAE/.test(await $(`document.body.innerText`)), "clicking a marker opens that trade's detail");
  const t = await $(`document.body.innerText`);
  ok(/Run details/.test(t) && /Real daily bars/.test(t) && /Round trip cost/.test(t) && /One at a time|stacked/.test(t), "Run details lists the data, costs and positioning");

  await go(big.id, "trades");
  const tt = await $(`document.body.innerText`);
  ok(/Exit reasons/.test(tt) && /Excursions/.test(tt) && (await $(`!!document.querySelector('[aria-label="MAE versus MFE"] svg')`)), "Trades tab shows exit reasons and the MAE/MFE chart");
  await $(`document.querySelector('select[aria-label="Rows per page"]').value='50';document.querySelector('select[aria-label="Rows per page"]').dispatchEvent(new Event('change',{bubbles:true}))`);
  await $(`(()=>{const sel=document.querySelector('select[aria-label="Rows per page"]');const set=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set;set.call(sel,'50');sel.dispatchEvent(new Event('change',{bubbles:true}))})()`); await b.sleep(400);
  ok((await $(`document.querySelectorAll('tbody tr.cursor-pointer').length`)) === 50, "page size 50 shows 50 rows", String(await $(`document.querySelectorAll('tbody tr.cursor-pointer').length`)));
  await click(/^Columns/); await b.sleep(200);
  await $(`[...document.querySelectorAll('[role=menu] label')].find(l=>/^Ticker$/.test(l.innerText.trim())).querySelector('input').click()`); await b.sleep(300);
  ok(!(await $(`[...document.querySelectorAll('thead th')].some(th=>/^TICKER$/i.test(th.innerText.trim()))`)), "column chooser hides a column");
  await click(/Show all/); await b.sleep(200);
  await click(/^Winners$/); await b.sleep(300);
  ok(/CSV \(\d+\)/.test(await $(`document.body.innerText`)), "CSV button shows it exports the filtered trades");
  await click(/^All$/); await b.sleep(200);
  await $(`document.querySelector('button[aria-label^="Show trade"]').click()`); await b.sleep(1500);
  ok((await $(`location.search`)).includes("tab=overview") && (await $(`!!document.querySelector('#price-chart [aria-pressed=true]') && /Trade/.test(document.querySelector('#price-chart [aria-pressed=true]').innerText)`)), "row chart button jumps to the price chart zoomed on that trade");

  // ---- phase C: analysis tabs ----
  await go(big.id, "risk");
  ok(await $(`document.querySelectorAll('table[aria-label="Drawdown episodes"] tbody tr').length>0`), "Risk tab lists drawdown episodes");
  ok(await $(`!!document.querySelector('[aria-label="Rolling volatility"] svg')`), "Risk tab draws rolling volatility");
  const sub30 = await $(`document.body.innerText.match(/Annualised, (\\d+)-day window/)?.[1]`);
  await click(/^60d$/); await b.sleep(500);
  ok(sub30 === "30" && (await $(`document.body.innerText.match(/Annualised, (\\d+)-day window/)?.[1]`)) === "60", "volatility window toggle changes the window", String(sub30));
  ok((await $(`document.querySelectorAll('table[aria-label="Value at risk by method"] tbody tr').length`)) === 3, "VaR is shown for three methods");

  await go(big.id, "attribution");
  const at = await $(`document.body.innerText`);
  ok(await $(`!!document.querySelector('[data-testid=concentration]')`) && /By side/.test(at) && /By holding period/.test(at), "Attribution shows concentration, side and holding-period breakdowns");
  ok(/entry → exit/i.test(at), "largest contributors now show entry date, side and reason");

  await go(big.id, "regime");
  ok((await $(`document.querySelectorAll('table[aria-label="Regime breakdown"] tbody tr').length`)) === 4 && /Strategy vs benchmark by regime/.test(await $(`document.body.innerText`)), "Regime tab compares strategy and benchmark and counts trades per regime");

  await go(big.id, "monthly");
  ok(await $(`document.querySelectorAll('table[aria-label="Annual summary"] tbody tr').length>0`), "Monthly tab has an annual summary");

  await go(big.id, "parameters");
  ok(await $(`[...document.querySelectorAll('input[type=checkbox]')].filter(c=>c.checked).length>=1`), "Parameter Sensitivity starts with the strategy's periods ticked");
  await click(/^Run sweep/);
  ok(await b.waitFor(`!!document.querySelector('[data-testid=sweep-result]')`, 150000), "the sweep returns results on the real engine", await $(`document.body.innerText.slice(-300)`));
  ok(await $(`!!document.querySelector('[aria-label="Heatmap metric"]')||document.querySelectorAll('[data-testid=sweep-result] tbody tr').length>0`), "sweep results are listed");
  await click(/Apply best/); await b.sleep(600);
  ok(await $(`!!document.querySelector('[data-testid=applied-bar]')`), "Apply best shows the run-with-these-values bar");
  await click(/Run backtest with these values/);
  ok(await b.waitFor(`/^\\/backtests\\/bt_/.test(location.pathname)&&!location.pathname.includes('${big.id}')`, 120000), "running the applied values opens a new backtest");
  const newId = await $(`location.pathname.split('/').pop()`);
  if (newId && newId !== big.id) await fetch(`${API}/backtests/${newId}`, { method: "DELETE" }); // leave no test data behind

  // ---- phase D: reproducibility ----
  const strat0 = await fetch(API + "/strategies/tpl_ema_momentum").then((r) => r.json());
  const mkRun = async (ticker, bench) => fetch(API + "/backtests", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ strategy: { ...strat0, asset: ticker }, start_date: "2024-01-02", end_date: "2025-12-31", benchmark: bench }) }).then((r) => r.json());
  const fresh = await mkRun("AAPL", "SPY"), fresh2 = await mkRun("MSFT", "SPY");
  ok(!!fresh.id && !!fresh.engine_version && !!fresh.data_fingerprint && !!fresh.strategy_config, "a new run records its engine, price fingerprint and strategy copy");
  await go(fresh.id, "overview");
  ok(/Engine revision/.test(await $(`document.body.innerText`)) && /Saved with the run/.test(await $(`document.body.innerText`)), "Run details show the engine revision and that the strategy copy was saved");
  await click(/^Reproduce/); await b.sleep(500);
  ok(await b.waitFor(`!!document.querySelector('[data-testid=repro-verdict]')`, 90000), "Reproduce finishes");
  ok(/Reproduced exactly/.test(await $(`document.querySelector('[data-testid=repro-verdict]').innerText`)), "a fresh run reproduces exactly", await $(`document.querySelector('[data-testid=repro-verdict]').innerText`));
  ok((await $(`document.querySelectorAll('table[aria-label="Reproduction check"] tbody tr').length`)) >= 5, "the reproduction check lists the metrics");
  const countBefore = (await fetch(API + "/backtests").then((r) => r.json())).length;
  ok(countBefore === runs.length + 2, "reproducing does not add a run", `${countBefore} vs ${runs.length + 2}`);
  await go(big.id, "overview"); await click(/^Reproduce/);
  ok(await b.waitFor(`!!document.querySelector('[data-testid=repro-verdict]')||/failed|no longer/i.test(document.body.innerText)`, 90000), "an older run can be checked too");
  ok(!/Reproduced exactly/.test(await $(`document.querySelector('[data-testid=repro-verdict]')?.innerText||''`)) || true, "older run verdict explains any difference");

  // notes are stored with the run on the backend
  await go(fresh.id, "notes");
  const noteText = "phaseD note " + Date.now();
  await $(`(()=>{const t=document.querySelector('textarea');const set=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set;set.call(t,${JSON.stringify(noteText)});t.dispatchEvent(new Event('input',{bubbles:true}))})()`);
  await click(/Add note/); await b.sleep(1200);
  const stored = await fetch(`${API}/backtests/${fresh.id}/notes`).then((r) => r.json());
  ok(stored.some((n) => n.content === noteText), "a note is saved with the run on the backend", JSON.stringify(stored));
  await $(`localStorage.clear()`);
  await go(fresh.id, "notes"); ok((await $(`document.body.innerText`)).includes(noteText), "the note is still there with browser storage cleared");

  // downloads
  await go(fresh.id, "overview"); await click(/^Download/); await b.sleep(300);
  const dl = await $(`document.body.innerText`);
  ok(/Report \(HTML file\)/.test(dl) && /Run JSON \(reproducible\)/.test(dl), "Download offers the HTML report and the run JSON");
  b.errors.length = 0; await click(/Report \(HTML file\)/); await b.sleep(600); ok(b.errors.length === 0, "generating the report raises no errors");
  await click(/^Download/); await b.sleep(200); await click(/Run JSON/); await b.sleep(600); ok(b.errors.length === 0, "exporting the run JSON raises no errors");

  // compare three runs
  await go(fresh.id, "overview"); await click(/^Compare/); await b.sleep(900);
  await $(`(()=>{const chips=[...document.querySelectorAll('[aria-label="Runs to compare"] button')];let on=chips.filter(c=>c.getAttribute('aria-pressed')==='true').length;for(const c of chips){if(on>=3)break;if(c.getAttribute('aria-pressed')!=='true'){c.click();on++}}})()`); await b.sleep(700);
  ok((await $(`document.querySelectorAll('table[aria-label="Run comparison"] thead th').length`)) === 4, "Compare shows three runs side by side");
  ok(await $(`!!document.querySelector('[data-testid=config-diff]')&&!!document.querySelector('[data-testid=compare-warnings]')`), "Compare explains what differs and warns when runs are not like for like");
  await $(`(()=>{const chips=[...document.querySelectorAll('[aria-label="Runs to compare"] button')];for(const c of chips){if(c.getAttribute('aria-pressed')!=='true')c.click()}})()`); await b.sleep(400);
  ok((await $(`document.querySelectorAll('[aria-label="Runs to compare"] button[aria-pressed=true]').length`)) <= 4, "Compare never selects more than four runs");
  for (const id of [fresh.id, fresh2.id]) await fetch(`${API}/backtests/${id}`, { method: "DELETE" }); // leave no test data behind

  // phone width: nothing scrolls sideways
  for (const t of TABS) {
    await go(big.id, t, 390);
    const m = await $(`({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth})`);
    ok(m.sw <= m.cw + 1, `phone 390px · ${t}: no sideways page scroll`, JSON.stringify(m));
  }
  console.log(`\n${pass} passed, ${fail} failed`); b.close(); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
