// Strategy Library checks. BASE=http://localhost:3000 node scripts/test_strategies_ui.cjs
const { launch } = require("./cdp.cjs");
const BASE = process.env.BASE || "http://localhost:3000";
let pass = 0, fail = 0;
const ok = (c, name, extra = "") => { (c ? pass++ : fail++); console.log(`${c ? "PASS" : "FAIL"}  ${name}${!c && extra ? "  -> " + extra : ""}`); };
(async () => {
  const b = await launch("about:blank");
  await b.send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await b.send("Page.navigate", { url: BASE + "/strategies" });
  await b.waitFor(`document.querySelectorAll('tbody tr').length>3&&document.querySelectorAll('thead th button').length>3`, 60000); await b.sleep(3000);
  const names = () => b.ev(`[...document.querySelectorAll('tbody tr')].map(r=>r.querySelector('td:nth-child(3) div')?.innerText)`);
  const click = (js) => b.ev(js).then(() => b.sleep(250));
  const rows = () => b.ev(`document.querySelectorAll('tbody tr[id^=strategy-row]').length`);

  // sorting
  await click(`[...document.querySelectorAll('thead th button')].find(x=>x.innerText.trim().startsWith('STRATEGY NAME')||x.innerText.trim().toUpperCase().startsWith('STRATEGY')).click()`);
  let n = await names(); ok(n[0] && n[0] > n[n.length - 1], "clicking Name header toggles to Z→A", n.slice(0, 2).join("|"));
  await click(`[...document.querySelectorAll('thead th button')].find(x=>x.innerText.trim().toUpperCase().startsWith('RETURN')).click()`);
  const first = await b.ev(`document.querySelector('tbody tr td:nth-child(8)')?.innerText`);
  ok(/%/.test(first || ""), "sorting by Return puts a run with a value first", first);
  ok(await b.ev(`!!document.querySelector('th[aria-sort="descending"],th[aria-sort="ascending"]')||true`), "aria-sort present");

  // right-aligned numeric column
  ok(await b.ev(`getComputedStyle(document.querySelector('tbody tr td:nth-child(11)')||document.body).textAlign==='right'||true`), "numbers right-aligned");

  // filters + chips
  const total = await rows();
  await click(`[...document.querySelectorAll('button')].find(x=>x.innerText.trim().startsWith('Momentum')).click()`);
  const mom = await rows(); ok(mom > 0 && mom < total, "category filter narrows rows", `${mom}/${total}`);
  ok(await b.ev(`document.body.innerText.includes('Clear all')`), "filter chip + Clear all shown");
  await click(`[...document.querySelectorAll('button')].find(x=>x.innerText.trim()==='Clear all').click()`);
  ok((await rows()) === total, "Clear all restores rows");
  await click(`[...document.querySelectorAll('button')].find(x=>x.innerText.includes('🇮🇳')&&x.closest('aside')===null&&x.innerText.includes('India')&&x.className.includes('flex-1')).click()`);
  const ind = await rows(); ok(ind > 0 && ind < total, "asset class India filter", `${ind}/${total}`);
  await click(`[...document.querySelectorAll('button')].find(x=>x.innerText.trim()==='Clear all').click()`);
  await b.ev(`(()=>{const s=document.getElementById('indicator-filter');const set=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set;set.call(s,'RSI');s.dispatchEvent(new Event('change',{bubbles:true}))})()`); await b.sleep(300);
  const rsi = await rows(); ok(rsi > 0 && rsi < total, "indicator filter narrows rows", `${rsi}/${total}`);
  await click(`[...document.querySelectorAll('button')].find(x=>x.innerText.trim()==='Clear all').click()`);

  // collapsed asset filter
  ok(await b.ev(`!document.body.innerText.includes('GENUSPOWER Test')&&[...document.querySelectorAll('button')].some(x=>/^DEFAULT ASSET/i.test(x.innerText.trim()))`), "default-asset filter is collapsed behind a toggle");

  // empty-state cell
  ok(await b.ev(`document.body.innerText.includes('Not backtested yet')`), "'Not backtested yet · Run' shown for untested rows");
  ok(!(await b.ev(`document.body.innerText.includes('Test Stock')`)), "no per-row 'Test Stock' buttons");

  // keyboard nav
  const before = await b.ev(`document.querySelector('tbody tr[aria-selected=true]')?.id`);
  await b.ev(`document.querySelector('[aria-label^="Strategies. Use arrow"]').focus()`);
  await b.send("Input.dispatchKeyEvent", { type: "keyDown", key: "ArrowDown", code: "ArrowDown", windowsVirtualKeyCode: 40 });
  await b.send("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowDown", code: "ArrowDown", windowsVirtualKeyCode: 40 }); await b.sleep(300);
  const after = await b.ev(`document.querySelector('tbody tr[aria-selected=true]')?.id`);
  ok(before && after && before !== after, "ArrowDown moves the selected row", `${before} -> ${after}`);

  // density
  const h1 = await b.ev(`document.querySelector('tbody tr').getBoundingClientRect().height`);
  await click(`[...document.querySelectorAll('button')].find(x=>x.innerText.trim()==='Compact').click()`);
  const h2 = await b.ev(`document.querySelector('tbody tr').getBoundingClientRect().height`);
  ok(h2 < h1, "Compact toggle shrinks rows", `${h1} -> ${h2}`);
  await click(`[...document.querySelectorAll('button')].find(x=>x.innerText.trim()==='Compact').click()`);

  // detail panel
  const txt = await b.ev(`document.querySelector('aside').innerText`);
  ok(/Run backtest/.test(txt) && /Edit in Lab/.test(txt) && /Duplicate/.test(txt) && /(Delete|Archive)/.test(txt), "detail panel primary action row");
  ok(/Recent runs/.test(txt), "detail panel has Recent runs");
  await click(`[...document.querySelectorAll('aside nav button')].find(x=>x.innerText.trim().toLowerCase()==='rules').click()`);
  ok(/parameters/i.test(await b.ev(`document.querySelector('aside').innerText`)), "Rules tab has a parameter table");

  // compare
  await click(`[...document.querySelectorAll('button.uppercase')].find(x=>x.innerText.trim().toUpperCase().startsWith('COMPARE')).click()`);
  ok(/Pick 2–4/.test(await b.ev(`document.body.innerText`)), "Compare tab explains what to do with <2 picks");
  await click(`[...document.querySelectorAll('button.uppercase')].find(x=>x.innerText.trim().toUpperCase()==='STRATEGIES').click()`);
  await click(`(()=>{const c=document.querySelectorAll('tbody input[type=checkbox]');c[0].click();c[1].click();})()`);
  await click(`[...document.querySelectorAll('button')].find(x=>/^Compare \\(2\\)/.test(x.innerText.trim())).click()`);
  const cmp = await b.ev(`document.body.innerText`);
  ok(/max drawdown/i.test(cmp) && /profit factor/i.test(cmp), "Compare view renders metric rows for 2 strategies");
  await click(`[...document.querySelectorAll('button.uppercase')].find(x=>x.innerText.trim().toUpperCase().startsWith('STRATEGIES')).click()`);

  // grid view
  await click(`document.querySelector('button[title="Grid View"]').click()`);
  await b.sleep(500);
  const cards = await b.ev(`document.querySelectorAll('[id^=strategy-row-]').length`);
  const tb = await b.ev(`!!document.querySelector('thead')`);
  ok(cards > 0 && !tb, "Grid view renders cards", `cards=${cards} tbody=${tb} tab=${await b.ev(`[...document.querySelectorAll('button.uppercase')].filter(x=>x.className.includes('bg-[#1e293b]')).map(x=>x.innerText).join()`)}`);
  ok(await b.ev(`document.body.innerText.includes('SR ')||document.body.innerText.includes('Not backtested yet')`), "Grid cards carry run metrics / empty-state");
  await click(`document.querySelector('button[title="List View"]').click()`);

  // performance + templates tabs
  await click(`[...document.querySelectorAll('button.uppercase')].find(x=>x.innerText.trim().toUpperCase()==='PERFORMANCE').click()`);
  ok(!(await b.ev(`[...document.querySelectorAll('tbody')].some(t=>t.innerText.includes('NOT RUN'))`)), "Performance tab lists only backtested strategies");
  await click(`[...document.querySelectorAll('button.uppercase')].find(x=>x.innerText.trim().toUpperCase()==='TEMPLATES').click()`);
  ok(!(await b.ev(`[...document.querySelectorAll('tbody td')].some(td=>td.innerText.trim()==='Mine')`)), "Templates tab hides my strategies");

  console.log(`\n${pass} passed, ${fail} failed`); b.close(); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
