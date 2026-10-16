// Checks the platform navbar: sizing at several widths, dropdowns, the QuantSynthica button. BASE=http://localhost:3000 node scripts/test_navbar_ui.cjs
const { launch } = require("./cdp.cjs");
const BASE = process.env.BASE || "http://localhost:3000";
let pass = 0, fail = 0;
const ok = (c, name, extra = "") => { (c ? pass++ : fail++); console.log(`${c ? "PASS" : "FAIL"}  ${name}${!c && extra ? "  -> " + extra : ""}`); };
let closer = () => {};
(async () => {
  const b = await launch(`${BASE}/analytics`); closer = b.close;
  const $ = (e) => b.ev(e);
  const view = (w, h = 900) => b.send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: false });
  await view(1920);
  ok(await b.waitFor(`!!document.querySelector('nav[aria-label=Primary]')`, 90000), "navbar renders");
  await b.sleep(1500);
  const tabBtn = (label) => `[...document.querySelectorAll('nav[aria-label=Primary] > div')].find(d=>d.innerText.trim().startsWith(${JSON.stringify(label)}))`;
  const hover = async (label) => { await $(`(()=>{const d=${tabBtn(label)};d.dispatchEvent(new MouseEvent('mouseover',{bubbles:true}));d.dispatchEvent(new MouseEvent('mouseenter',{bubbles:false}));})()`); await b.sleep(250); };

  // layout at several widths: no horizontal overflow of the header row, nav tabs fit
  for (const w of [1280, 1366, 1440, 1536, 1600, 1699, 1700, 1840, 1920, 2560]) {
    await view(w); await b.sleep(500);
    const m = await $(`(()=>{const row=document.querySelector('header > div');const nav=document.querySelector('nav[aria-label=Primary]');const r=row.getBoundingClientRect();let maxRight=0;[...row.children].forEach(c=>{maxRight=Math.max(maxRight,c.getBoundingClientRect().right)});return {rowRight:Math.round(r.right),maxRight:Math.round(maxRight),sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,navOverflow:nav?nav.scrollWidth>nav.clientWidth+1:false,gap:(()=>{const q=document.querySelector('a[href="https://quant-synthica.vercel.app/"]');const last=nav&&nav.lastElementChild;return q&&last?Math.round(q.getBoundingClientRect().left-last.getBoundingClientRect().right):99})(),h:Math.round(row.getBoundingClientRect().height)}})()`);
    ok(m.sw <= m.cw && m.maxRight <= m.rowRight + 1 && !m.navOverflow && m.gap >= 8 && m.h === 64, `header fits at ${w}px`, JSON.stringify(m));
  }
  await view(1920); await b.sleep(400);

  // QuantSynthica button
  const qs = await $(`(()=>{const a=document.querySelector('a[href="https://quant-synthica.vercel.app/"]');return a?{t:a.target,rel:a.rel,txt:a.innerText.replace(/\\n/g,' ')}:null})()`);
  ok(qs && qs.t === "_blank" && /noopener/.test(qs.rel) && /QuantSynthica/.test(qs.txt), "QuantSynthica button links to the main site in a new tab", JSON.stringify(qs));

  // dropdowns open on hover with the right items
  const expected = { Research: ["Technicals", "Options", "ESG"], Strategies: ["Strategy Library", "Strategy Lab"], Backtests: ["Backtest Registry"], Analytics: ["Performance", "Robustness", "Attribution"], Portfolio: ["Allocation", "Stress Test"], Risk: ["Value at Risk", "Factor Risk"] };
  for (const [label, items] of Object.entries(expected)) {
    await hover(label);
    const txt = await $(`document.querySelector('[role=menu]')?.innerText||''`);
    const exp = await $(`${tabBtn(label)}.querySelector('button')?.getAttribute('aria-expanded')`);
    ok(exp === "true" && items.every((i) => txt.includes(i)), `${label} dropdown opens on hover`, txt.slice(0, 80));
    await $(`(()=>{const d=${tabBtn(label)};d.dispatchEvent(new MouseEvent('mouseout',{bubbles:true}));d.dispatchEvent(new MouseEvent('mouseleave',{bubbles:false}))})()`); await b.sleep(400);
    ok(!(await $(`!!document.querySelector('[role=menu]')`)), `${label} dropdown closes on mouse leave`);
  }
  ok(!(await $(`!!${tabBtn("Settings")}.querySelector('button')`)) && (await $(`${tabBtn("Settings")}.querySelector('a').getAttribute('href')`)) === "/settings", "Settings is a plain link");

  // click toggles, Escape + outside click close
  await $(`${tabBtn("Analytics")}.querySelector('button').click()`); await b.sleep(200);
  ok(await $(`!!document.querySelector('[role=menu]')`), "click opens a dropdown");
  await $(`window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))`); await b.sleep(200);
  ok(!(await $(`!!document.querySelector('[role=menu]')`)), "Escape closes the dropdown");
  await $(`${tabBtn("Risk")}.querySelector('button').click()`); await b.sleep(200);
  await $(`document.body.dispatchEvent(new MouseEvent('mousedown',{bubbles:true}))`); await b.sleep(200);
  ok(!(await $(`!!document.querySelector('[role=menu]')`)), "clicking outside closes the dropdown");

  // every dropdown link resolves to a working page
  const links = await $(`(async()=>{const out=[];for(const lab of ['Research','Strategies','Backtests','Analytics','Portfolio','Risk']){const d=${tabBtn("__X__")}||null;}return out})()`).catch(() => []);
  const hrefs = new Set();
  for (const label of Object.keys(expected)) {
    await $(`${tabBtn(label)}.querySelector('button').click()`); await b.sleep(200);
    (await $(`[...document.querySelectorAll('[role=menu] a')].map(a=>a.getAttribute('href'))`)).forEach((h) => hrefs.add(h));
    await $(`window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))`); await b.sleep(120);
  }
  console.log(`      ${hrefs.size} distinct dropdown links`);
  let bad = [];
  for (const h of hrefs) { const r = await $(`fetch(${JSON.stringify(h)}).then(r=>r.status).catch(()=>0)`); if (r !== 200) bad.push(`${h}=${r}`); }
  ok(bad.length === 0, "all dropdown links return 200", bad.join(", "));

  // navigation through a dropdown + closes after navigating
  await $(`${tabBtn("Risk")}.querySelector('button').click()`); await b.sleep(200);
  await $(`[...document.querySelectorAll('[role=menu] a')].find(a=>a.innerText.includes('Drawdown Analysis')).click()`);
  ok(await b.waitFor(`location.pathname==='/risk'&&location.search.includes('tab=drawdown')`, 30000), "dropdown item navigates to the right tab");
  await b.sleep(1200);
  ok(!(await $(`!!document.querySelector('[role=menu]')`)), "dropdown closes after navigating");
  ok(await $(`(document.querySelector('nav[aria-label=Primary] [aria-current=page]')?.innerText||'').includes('Risk')`), "current section is highlighted");
  ok(/Drawdown/.test(await $(`document.body.innerText`)), "Risk page opened on the Drawdown tab");

  // research items follow the active ticker
  await $(`localStorage.setItem('algolab_active_ticker','RELIANCE');localStorage.setItem('algolab_active_country','India');window.dispatchEvent(new CustomEvent('algolab:security-change',{detail:{symbol:'RELIANCE',country:'India'}}))`); await b.sleep(300);
  await $(`${tabBtn("Research")}.querySelector('button').click()`); await b.sleep(200);
  const rh = await $(`[...document.querySelectorAll('[role=menu] a')].find(a=>a.innerText.includes('Technicals')).getAttribute('href')`);
  ok(rh === "/research?ticker=RELIANCE&country=India&tab=technicals", "Research items open on the active ticker", rh);
  await $(`window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))`);

  // mobile drawer
  await view(800); await b.sleep(500);
  ok(!(await $(`getComputedStyle(document.querySelector('nav[aria-label=Primary]')).display!=='none'`)), "desktop nav hidden on small screens");
  await $(`document.querySelector('button[aria-label="Open menu"]').click()`); await b.sleep(300);
  ok(await $(`!!document.querySelector('nav[aria-label=Mobile]')`), "mobile menu opens");
  await $(`[...document.querySelectorAll('nav[aria-label=Mobile] button')].find(x=>x.innerText.includes('Analytics')).click()`); await b.sleep(250);
  ok((await $(`document.querySelector('nav[aria-label=Mobile]').innerText`)).includes("Robustness"), "mobile accordion expands");
  ok(await $(`!!document.querySelector('nav[aria-label=Mobile] a[href="https://quant-synthica.vercel.app/"]')`), "mobile menu has the QuantSynthica link");
  ok(b.errors.length === 0, "no console errors", b.errors.join(" | ").slice(0, 300));
  console.log(`\n${pass} passed, ${fail} failed`);
  b.close(); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); closer(); process.exit(2); });
