// Benchmark picker backed by data/indian_indices.csv. BASE=http://localhost:3000 node scripts/test_benchmark_ui.cjs
const { launch } = require("./cdp.cjs");
const BASE = process.env.BASE || "http://localhost:3000";
let pass = 0, fail = 0;
const ok = (c, name, extra = "") => { (c ? pass++ : fail++); console.log(`${c ? "PASS" : "FAIL"}  ${name}${!c && extra ? "  -> " + extra : ""}`); };
let closer = () => {};
(async () => {
  const b = await launch(`${BASE}/strategies/builder?asset=RELIANCE`); closer = b.close;
  await b.send("Emulation.setDeviceMetricsOverride", { width: 1700, height: 1100, deviceScaleFactor: 1, mobile: false });
  const $ = (e) => b.ev(e);
  const body = () => $(`document.body.innerText`);
  const trigger = `document.querySelector('#section-execution button[aria-haspopup=listbox]')`;
  const opts = `[...document.querySelectorAll('[role=listbox] [role=option]')]`;
  const setVal = (sel, v) => $(`(()=>{const i=document.querySelector(${JSON.stringify(sel)});const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;set.call(i,${JSON.stringify(v)});i.dispatchEvent(new Event('input',{bubbles:true}))})()`);

  // backend list
  const api = await $(`fetch('http://localhost:8000/market/indices').then(r=>r.json())`);
  ok(api.indices.length >= 150, `backend serves the CSV universe (${api.indices.length})`);
  ok(!api.probing && api.indices.filter((i) => i.available).length >= 10, "availability probed", `probing=${api.probing}`);
  ok(api.indices.some((i) => i.symbol === "^NSEI" && i.name === "Nifty 50"), "names come from the CSV");

  ok(await b.waitFor(`document.body.innerText.includes('Execution friction')&&!!${trigger}`, 90000), "builder shows the benchmark picker for an Indian stock");
  await b.sleep(1500);
  ok((await $(`${trigger}.innerText`)).includes("Nifty 50"), "default benchmark is Nifty 50");

  await $(`${trigger}.click()`); await b.sleep(400);
  const usable = (await $(`${opts}.length`));
  ok(usable >= 10 && usable <= 30, `only indices with price data are listed by default (${usable})`);
  ok(/\d+ of \d+ indices have price data/.test(await body()), "footer states how many indices have data");

  await setVal('[role=listbox] input[placeholder^="Search"]', "bank"); await b.sleep(250);
  const bank = await $(`${opts}.map(o=>o.innerText)`);
  ok(bank.length >= 1 && bank.every((t) => /bank/i.test(t)), "search filters by name", JSON.stringify(bank));
  await setVal('[role=listbox] input[placeholder^="Search"]', ""); await b.sleep(150);
  await $(`[...document.querySelectorAll('[role=listbox] button')].find(x=>x.innerText.trim()==='Sectoral').click()`); await b.sleep(250);
  const sect = await $(`${opts}.map(o=>o.innerText)`);
  ok(sect.length >= 2 && sect.every((t) => /Sectoral/.test(t)), "category filter works", JSON.stringify(sect).slice(0, 120));
  await $(`[...document.querySelectorAll('[role=listbox] button')].find(x=>x.innerText.trim()==='All').click()`);

  await $(`document.querySelector('[role=listbox] input[type=checkbox]').click()`); await b.sleep(300);
  const all = await $(`${opts}.length`), off = await $(`${opts}.filter(o=>o.disabled).length`);
  ok(all >= 150 && off >= 100, `"Show unavailable" lists the full universe (${all}, ${off} disabled)`);
  await $(`${opts}.find(o=>o.disabled).click()`); await b.sleep(200);
  ok(await $(`!!document.querySelector('[role=listbox]')`), "a disabled index cannot be selected");
  await $(`document.querySelector('[role=listbox] input[type=checkbox]').click()`);

  await setVal('[role=listbox] input[placeholder^="Search"]', "nifty it"); await b.sleep(250);
  await $(`${opts}.find(o=>/Nifty IT/.test(o.innerText)).click()`); await b.sleep(300);
  ok(!(await $(`!!document.querySelector('[role=listbox]')`)), "choosing an index closes the picker");
  ok((await $(`${trigger}.innerText`)).includes("Nifty IT"), "trigger shows the chosen index");
  ok(/Benchmark\s*\^CNXIT/.test(await $(`[...document.querySelectorAll('aside')].pop().innerText`)), "summary shows ^CNXIT");

  await $(`${trigger}.click()`); await b.sleep(200);
  await $(`window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))`); await b.sleep(200);
  ok(!(await $(`!!document.querySelector('[role=listbox]')`)), "Escape closes the picker");
  await $(`${trigger}.click()`); await b.sleep(200);
  await $(`document.body.dispatchEvent(new MouseEvent('mousedown',{bubbles:true}))`); await b.sleep(200);
  ok(!(await $(`!!document.querySelector('[role=listbox]')`)), "outside click closes the picker");

  // US stock -> plain US list, no India indices
  await $(`[...document.querySelectorAll('#section-universe button')].find(e=>/United States/.test(e.innerText)).click()`); await b.sleep(200);
  await $(`[...document.querySelectorAll('#section-universe button')].find(e=>e.innerText.startsWith('AAPL')).click()`); await b.sleep(500);
  const us = await $(`[...document.querySelectorAll('#section-execution select[aria-label=Benchmark] option')].map(o=>o.value)`);
  ok(us.includes("SPY") && !us.some((v) => v.startsWith("^CNX") || v.endsWith(".BO")), "US stock offers only US benchmarks", us.join(","));
  // back to India and run a real backtest against a chosen index
  await $(`[...document.querySelectorAll('#section-universe button')].find(e=>/India/.test(e.innerText)&&e.getAttribute('aria-pressed')!==null).click()`); await b.sleep(200);
  await $(`[...document.querySelectorAll('#section-universe button')].find(e=>e.innerText.startsWith('RELIANCE')).click()`); await b.sleep(500);
  await $(`${trigger}.click()`); await b.sleep(200);
  await setVal('[role=listbox] input[placeholder^="Search"]', "nifty it"); await b.sleep(200);
  await $(`${opts}.find(o=>/Nifty IT/.test(o.innerText)).click()`); await b.sleep(300);
  await $(`[...document.querySelectorAll('button')].find(e=>/^Run full backtest/.test(e.innerText.trim())).click()`);
  ok(await b.waitFor(`/^\\/backtests\\/bt_/.test(location.pathname)`, 150000), "backtest runs against the chosen index", await $(`location.pathname`));
  await b.sleep(2500);
  const res = await body();
  ok(/\^CNXIT/.test(res) || /Nifty IT/.test(res), "result page shows the chosen benchmark", res.slice(0, 200).split("\n").join(" "));

  // other pages expose the picker for Indian context
  for (const [path, label] of [["/backtests", "backtests page"], ["/risk?tab=portfolio", "risk"], ["/portfolio", "portfolio"]]) {
    await b.send("Page.navigate", { url: BASE + path }); await b.sleep(5000);
    const has = await $(`!!document.querySelector('button[aria-haspopup=listbox]')||!!document.querySelector('select[aria-label=Benchmark]')`);
    ok(has, `${label} uses the shared benchmark picker`);
  }
  await b.send("Page.navigate", { url: BASE + "/research?ticker=RELIANCE&country=India" }); await b.sleep(9000);
  ok(await $(`!!document.querySelector('button[aria-haspopup=listbox]')`), "research uses the shared benchmark picker for India");
  ok(b.errors.length === 0, "no console errors", b.errors.join(" | ").slice(0, 300));
  console.log(`\n${pass} passed, ${fail} failed`);
  b.close(); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); closer(); process.exit(2); });
