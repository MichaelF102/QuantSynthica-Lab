// Analytics tabs: regime exposure and the block-bootstrap robustness view. BASE=http://localhost:3000 node scripts/test_analytics_tabs.cjs
const { launch } = require("./cdp.cjs");
const BASE = process.env.BASE || "http://localhost:3000";
let pass = 0, fail = 0;
const ok = (c, name, extra = "") => { (c ? pass++ : fail++); console.log(`${c ? "PASS" : "FAIL"}  ${name}${!c && extra ? "  -> " + extra : ""}`); };
(async () => {
  const b = await launch("about:blank");
  await b.send("Emulation.setDeviceMetricsOverride", { width: 1500, height: 1600, deviceScaleFactor: 1, mobile: false });
  const $ = (e) => b.ev(e);
  const go = async (tab) => { await b.send("Page.navigate", { url: `${BASE}/analytics?tab=${tab}` }); await b.waitFor(`document.body.innerText.includes('Strategy Analytics')&&document.body.innerText.length>700`, 60000); await b.sleep(2500); };
  const pickers = () => $(`[...document.querySelectorAll('button')].map((x,i)=>[i,x.innerText.trim()]).filter(([i,t])=>/\\([A-Z.\\-^]+\\)$/.test(t)).map(([i])=>i)`);
  const pick = async (n) => { await $(`(()=>{const bs=[...document.querySelectorAll('button')].filter(x=>/\\([A-Z.\\-^]+\\)$/.test(x.innerText.trim()));bs[${n}]?.click()})()`); await b.sleep(1500); };
  const click = (re, scope = "document") => $(`(()=>{const e=[...${scope}.querySelectorAll('button')].find(x=>${re}.test(x.innerText.trim()));if(!e)return false;e.click();return true})()`);
  const setSelect = async (label, text) => { await $(`document.querySelector('[role=combobox][aria-label="${label}"]').click()`); await b.sleep(250); await $(`[...document.querySelectorAll('[role=option]')].find(o=>${JSON.stringify(text)}===o.innerText.trim()).dispatchEvent(new MouseEvent('mousedown',{bubbles:true}))`); await b.sleep(900); };

  // ---- Regimes ----
  await go("Regimes");
  const n = (await pickers()).length;
  ok(n >= 2, "several runs are selectable on the Regimes tab", String(n));
  let sawIdle = false, sawInvested = false;
  for (let i = 0; i < n; i++) {
    await pick(i);
    const rows = await $(`[...document.querySelectorAll('table[aria-label="Performance by regime"] tbody tr')].map(r=>[...r.children].map(c=>c.innerText.trim()))`);
    ok(rows.length === 4 && rows.every((r) => r.length === 7), `run ${i + 1}: four regimes with an Invested column`, JSON.stringify(rows).slice(0, 200));
    ok(/invested/i.test(await $(`document.querySelector('table[aria-label="Performance by regime"] thead').innerText`)), `run ${i + 1}: header has Invested`);
    const bad = rows.filter((r) => r[2] === "0%" && (r[5] !== "—" || r[6] !== "—"));
    ok(bad.length === 0, `run ${i + 1}: a regime with 0% invested shows no Sharpe or win rate`, JSON.stringify(bad));
    ok(!/NaN|undefined/.test(await $(`document.body.innerText`)), `run ${i + 1}: no NaN`);
    if (await $(`!!document.querySelector('[data-testid=regime-idle-note]')`)) sawIdle = true; else sawInvested = true;
  }
  ok(sawIdle, "a mostly idle run gets the 'held a position on only N% of days' note");

  // ---- Robustness ----
  await go("Robustness");
  const n2 = (await pickers()).length;
  let sawShort = false;
  for (let i = 0; i < n2; i++) {
    await pick(i);
    const t = await $(`document.body.innerText`);
    ok(/Probability of loss/.test(t) && /Median max drawdown/.test(t) && /P\(drawdown/.test(t) && /P\(losing half\)/.test(t), `run ${i + 1}: loss, drawdown and ruin statistics are shown`);
    ok(await $(`!!document.querySelector('[aria-label="Equity path bands"] svg')`), `run ${i + 1}: equity path bands are drawn`);
    ok(await $(`document.body.innerText.includes('Max drawdown distribution')`), `run ${i + 1}: max drawdown distribution is shown`);
    ok(!/NaN|undefined/.test(t), `run ${i + 1}: no NaN`);
    if (await $(`!![...document.querySelectorAll('[data-testid=robustness-warnings] p')].find(p=>/Short sample|Only \\d+ trade/.test(p.innerText))`)) sawShort = true;
  }
  ok(sawShort, "short samples and few trades are called out");
  await pick(0);
  await setSelect("Horizon", "6 months");
  ok(/Probability of loss \(6M\)/i.test(await $(`document.body.innerText`)), "changing the horizon relabels the outcomes (6M)");
  await setSelect("Block length", "Block 20 days");
  ok(!/NaN|undefined/.test(await $(`document.body.innerText`)), "block length change recomputes cleanly");
  const before = await $(`document.body.innerText.match(/Median max drawdown[\\s\\S]{0,40}/)?.[0]`);
  await click(/^Re-run$/); await b.sleep(1500);
  ok(await $(`!!document.querySelector('[aria-label="Equity path bands"] svg')`), "Re-run keeps the chart");
  await click(/^30%$/); await b.sleep(300);
  ok(/P\(drawdown ≥ 30%\)/.test(await $(`document.body.innerText`)), "drawdown threshold buttons change the statistic");
  // ---- Phase B: depth ported from Backtests ----
  const API = process.env.API || "http://localhost:8000";
  const runs = (await fetch(API + "/backtests").then((r) => r.json())).filter((r) => !r.is_sample && r.status === "COMPLETED" && r.equity_curve.length > 1).slice(0, 3);
  const richest = runs.reduce((bi, r, i) => (r.trades.length > runs[bi].trades.length ? i : bi), 0);
  ok(runs[richest].trades.length >= 5, "there is a run with enough trades to test the depth cards", String(runs[richest].trades.length));
  const text = () => $(`document.body.innerText`);

  await go("Performance"); await pick(richest);
  ok(await $(`!!document.querySelector('[data-testid=performance-extras]')`) && /Up capture/.test(await text()) && /Down capture/.test(await text()), "Performance shows capture ratios");
  ok(await $(`!!document.querySelector('[aria-label="Rolling Sharpe"] svg')&&!!document.querySelector('[aria-label="Rolling beta"] svg')`), "Performance draws rolling Sharpe and rolling beta");
  ok((await $(`document.querySelectorAll('table[aria-label="Best and worst periods"] tbody tr').length`)) >= 2, "Performance lists best and worst periods");
  const sub = await $(`document.body.innerText.match(/(\\d+)-day window, risk-free/)?.[1]`);
  await click(/^90d$/); await b.sleep(500);
  ok(sub === "60" && (await $(`document.body.innerText.match(/(\\d+)-day window, risk-free/)?.[1]`)) === "90", "the rolling window toggle changes the window", String(sub));
  ok(!/NaN|undefined|Infinity/.test(await text()), "Performance has no NaN");

  await go("Risk"); await pick(richest);
  ok((await $(`document.querySelectorAll('table[aria-label="Drawdown episodes"] tbody tr').length`)) > 0 && (await $(`document.querySelectorAll('table[aria-label="Value at risk by method"] tbody tr').length`)) === 3 && await $(`!!document.querySelector('[aria-label="Rolling volatility"] svg')`), "Risk adds drawdown episodes, VaR by method and rolling volatility");

  await go("Trades"); await pick(richest);
  const tt = await text();
  ok(/Exit reasons/.test(tt) && /Excursions/.test(tt) && /Exposure/.test(tt) && await $(`!!document.querySelector('[aria-label="MAE versus MFE"] svg')`), "Trades adds exit reasons with win rates, excursions and exposure");
  ok(!/0\.00x/.test(tt) || runs[richest].trades.some((t) => t.net_pnl > 0), "payoff ratio is not shown as 0.00x without winners");

  await go("Attribution"); await pick(richest);
  ok(await $(`!!document.querySelector('[data-testid=concentration]')`) && /By side/.test(await text()) && /By holding period/.test(await text()), "Attribution adds concentration, side and holding-period breakdowns");

  await go("Regimes"); await pick(richest);
  ok(/Strategy vs benchmark by regime/.test(await text()) && (await $(`document.querySelectorAll('table[aria-label="Regime breakdown"] tbody tr').length`)) === 4, "Regimes adds strategy vs benchmark and trades per regime");
  for (const t of ["Performance", "Risk", "Trades", "Attribution", "Regimes"]) { await go(t); for (let i = 0; i < runs.length; i++) { await pick(i); ok(!/NaN|undefined|Infinity/.test(await text()), `${t}: run ${i + 1} has no NaN`); } }
  // ---- Phase C: factors and the robustness study ----
  await go("Factors"); await pick(richest);
  ok(await b.waitFor(`!!document.querySelector('table[aria-label="Factor regression"]')||/unavailable/i.test(document.body.innerText)`, 90000), "Factors loads its proxy series and fits a regression", (await text()).slice(0, 200));
  const ftxt = await text();
  ok(/Alpha \(annualised\)/.test(ftxt) && /Market beta/.test(ftxt) && /R²/.test(ftxt) && /Observations/.test(ftxt), "Factors shows alpha, market beta, R² and observations");
  ok((await $(`document.querySelectorAll('table[aria-label="Factor regression"] tbody tr').length`)) >= 4, "the regression table lists alpha, factors and the unexplained share");
  ok(await $(`!!document.querySelector('[aria-label="Factor betas"] svg')&&!!document.querySelector('[aria-label="Variance shares"] svg')`), "factor betas and variance shares are charted");
  ok(/tradable ETF\/index proxies/.test(ftxt), "the page says these are ETF proxies, not academic factors");
  ok(!/NaN|undefined|Infinity/.test(ftxt), "Factors has no NaN");
  const obsAll = Number((await $(`document.body.innerText.match(/Observations\\s*\\n?\\s*([\\d,]+)/)?.[1]`) || "0").replace(/,/g, ""));
  await click(/^Market only$/); await b.sleep(1200);
  ok((await $(`document.querySelectorAll('table[aria-label="Factor regression"] tbody tr').length`)) === 3, "Market only fits one factor plus alpha");
  await click(/^Multi-factor$/); await b.sleep(800);
  await click(/^Invested days$/); await b.sleep(1200);
  const obsInv = Number((await $(`document.body.innerText.match(/Observations\\s*\\n?\\s*([\\d,]+)/)?.[1]`) || "0").replace(/,/g, ""));
  ok(obsInv > 0 && obsInv < obsAll, "Invested days uses fewer observations than All days", `${obsInv} vs ${obsAll}`);
  ok(await $(`!!document.querySelector('[data-testid=factor-warnings]')`), "factor results come with warnings about sample and exposure");
  await go("Factors"); await pick(1);
  ok(await b.waitFor(`!!document.querySelector('[data-testid=factor-warnings]')||!!document.querySelector('table[aria-label="Factor regression"]')`, 90000), "a short run also loads");

  await go("Robustness"); await pick(richest);
  ok(await $(`!!document.querySelector('[data-testid=robustness-study]')`) && /Probability Sharpe > 0/.test(await text()) && !!(await $(`!!document.querySelector('[data-testid=sharpe-verdict]')`)), "Robustness shows the probabilistic Sharpe with a verdict");
  ok(/Walk-forward validation/.test(await text()) && /Parameter stability/.test(await text()), "Robustness offers parameter stability and walk-forward");
  await click(/^Run sweep/);
  ok(await b.waitFor(`!!document.querySelector('[data-testid=sweep-result]')`, 180000), "the sweep runs from the Analytics page");
  ok(await $(`!!document.querySelector('[data-testid=stability]')`), "the sweep gets a stability verdict");
  const noteTxt = await $(`document.querySelector('[data-testid=sweep-note]')?.innerText||''`), boxTxt = await $(`document.querySelector('[data-testid=stability]')?.innerText||''`);
  ok((/Fragile peak/.test(noteTxt) && /Fragile peak/.test(boxTxt)) || (/Stable plateau/.test(noteTxt) && /Stable plateau/.test(boxTxt)) || (/No tested setting/.test(noteTxt) && /Unprofitable/.test(boxTxt)), "the sweep note and the stability verdict agree", noteTxt.slice(0, 80) + " | " + boxTxt.slice(0, 60));
  ok(/[a-z]+_[a-z]+=\d/.test(await text()) && !/period=\d+, period=/.test(await text()), "sweep results name parameters by indicator, not just 'period'");
  const dsrTxt = await $(`[...document.querySelectorAll('div')].find(d=>/^Deflated Sharpe/i.test(d.innerText.trim())&&d.children.length===0)?.parentElement?.innerText||''`);
  ok(/\d+%/.test(dsrTxt) && /Best of \d+ trials/.test(await text()), "after the sweep the Sharpe is deflated for the number of trials", dsrTxt);
  // walk-forward needs at most 20 settings per fold: untick one swept parameter, then run
  await $(`(()=>{const boxes=[...document.querySelectorAll('input[type=checkbox]')].filter(c=>c.checked);if(boxes.length>1)boxes[1].click()})()`); await b.sleep(400);
  await setSelect("Train bars", "63 (3 months)"); await setSelect("Test bars", "21 (1 month)");
  await click(/^Run walk-forward/);
  ok(await b.waitFor(`!!document.querySelector('[data-testid=walkforward-result]')||!!document.querySelector('[role=alert]')`, 240000), "walk-forward finishes");
  ok(await $(`!!document.querySelector('[data-testid=walkforward-result]')`) && (await $(`document.querySelectorAll('table[aria-label="Walk-forward folds"] tbody tr').length`)) >= 2, "walk-forward lists its folds", (await text()).slice(-300));
  ok(/Out-of-sample Sharpe/.test(await text()) && /Degradation/.test(await text()) && await $(`!!document.querySelector('[aria-label="Out-of-sample equity"] svg')`), "walk-forward reports out-of-sample Sharpe, degradation and the stitched equity");
  ok(!/NaN|undefined|Infinity/.test(await text()), "Robustness study has no NaN");
  // ---- Phase D: compare, portfolio, export, URL, lazy loading ----
  const ids = runs.map((r) => r.id);
  await go("Compare");
  ok(await $(`!!document.querySelector('[data-testid=compare-tab]')`) && (await $(`document.querySelectorAll('table[aria-label="Side by side comparison"] thead th').length`)) === runs.length + 1, "Compare has one column per selected run");
  ok((await $(`document.querySelectorAll('table[aria-label="Side by side comparison"] tbody tr').length`)) >= 25, "Compare covers performance, risk, trades, regimes and robustness");
  ok(await $(`!!document.querySelector('[aria-label="Comparison growth chart"] svg')`) && await $(`!!document.querySelector('[data-testid=compare-warnings]')`), "Compare draws a growth chart and lists the caveats");
  ok(await $(`!![...document.querySelectorAll('table[aria-label="Side by side comparison"] td')].find(td=>td.className.includes('text-emerald-400')&&td.className.includes('font-bold'))`), "the best value in a row is highlighted");
  ok(!/NaN|undefined|Infinity/.test(await text()), "Compare has no NaN");

  await go("Portfolio");
  ok(await $(`!!document.querySelector('[data-testid=portfolio-tab]')`) && /Diversification ratio/.test(await text()) && /Combined return/.test(await text()), "Portfolio shows the combined return and diversification ratio");
  const diag = await $(`[...document.querySelectorAll('table[aria-label="Correlation matrix"] tbody tr')].map((r,i)=>r.querySelectorAll('td')[i]?.innerText.trim())`);
  ok(diag.length === runs.length && diag.every((d) => d === "1.00" || d === "—"), "correlation matrix has 1.00 on the diagonal", JSON.stringify(diag));
  const shares = await $(`[...document.querySelectorAll('table[aria-label="Portfolio contribution"] tbody tr')].map(r=>parseFloat(r.lastElementChild.innerText))`);
  ok(Math.abs(shares.reduce((a, c) => a + c, 0) - 100) < 3 || shares.every((x) => Number.isNaN(x)), "risk shares add up to about 100%", JSON.stringify(shares));
  const wEq = await $(`[...document.querySelectorAll('table[aria-label="Portfolio contribution"] tbody tr')].map(r=>r.children[1].innerText.trim())`);
  await click(/^Inverse volatility$/); await b.sleep(500);
  const wIv = await $(`[...document.querySelectorAll('table[aria-label="Portfolio contribution"] tbody tr')].map(r=>r.children[1].innerText.trim())`);
  ok(JSON.stringify(wEq) !== JSON.stringify(wIv) || runs.length < 2, "inverse-volatility weights differ from equal weights", JSON.stringify([wEq, wIv]));
  await click(/^Custom$/); await b.sleep(400);
  ok((await $(`document.querySelectorAll('table[aria-label="Portfolio contribution"] input[type=number]').length`)) === runs.length, "custom weighting offers a weight box per run");
  ok(!/NaN|undefined|Infinity/.test(await text()), "Portfolio has no NaN");

  // selection is in the URL and restored from it
  await go("Overview");
  ok(new URL(await $(`location.href`)).searchParams.get("runs") === ids.join(",") || (new URL(await $(`location.href`)).searchParams.get("runs") || "").split(",").sort().join() === [...ids].sort().join(), "the selection is written to the URL", await $(`location.search`));
  await b.send("Page.navigate", { url: `${BASE}/analytics?tab=Compare&runs=${ids.slice(0, 2).join(",")}` });
  await b.waitFor(`document.body.innerText.includes('Strategy Analytics')&&!!document.querySelector('[data-testid=compare-tab]')`, 60000); await b.sleep(1500);
  ok((await $(`document.querySelectorAll('table[aria-label="Side by side comparison"] thead th').length`)) === 3, "a link with runs= restores exactly those runs");
  await b.send("Page.navigate", { url: `${BASE}/analytics?tab=Compare&from=2023-01-01&to=2023-12-29&runs=${ids.join(",")}` }); await b.sleep(5000);
  ok(/2023-01-01/.test(await text()), "the window in the URL is applied");

  // only what is selected is downloaded in full
  await go("Overview");
  const reqs = await $(`performance.getEntriesByType('resource').map(e=>e.name).filter(n=>n.includes('/backtests'))`);
  ok(reqs.some((n) => /\/backtests\/summaries$/.test(n)) && !reqs.some((n) => /\/backtests$/.test(n)), "the page loads the lightweight run list, not every curve and trade", JSON.stringify(reqs));
  ok(reqs.filter((n) => /\/backtests\/bt_/.test(n)).length === runs.length, "only the selected runs are fetched in full", JSON.stringify(reqs));

  // export
  await $(`window.__blobs=[];const o=URL.createObjectURL;URL.createObjectURL=(x)=>{window.__blobs.push(x);return o.call(URL,x)}`);
  await click(/^Export/); await b.sleep(300);
  ok(/Comparison \(CSV\)/.test(await text()) && /Report \(HTML file\)/.test(await text()), "Export offers CSV and an HTML report");
  await click(/^Comparison \(CSV\)/); await b.sleep(500);
  const csvTxt = await $(`window.__blobs.at(-1).text()`);
  ok(/^Group,Metric,/.test(csvTxt) && /Total return/.test(csvTxt) && csvTxt.split("\n").length > 25, "the CSV has a header and one line per metric", csvTxt.slice(0, 120));
  await click(/^Export/); await b.sleep(200); await click(/^Report \(HTML file\)/); await b.sleep(500);
  const htmlTxt = await $(`window.__blobs.at(-1).text()`);
  ok(htmlTxt.startsWith("<!doctype html>") && /Combined portfolio/.test(htmlTxt) && !/<script/i.test(htmlTxt), "the HTML report is self-contained and includes the combined portfolio");
  ok(b.errors.length === 0, "no console errors", b.errors.slice(0, 2).join(" | "));
  console.log(`\n${pass} passed, ${fail} failed`); b.close(); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
