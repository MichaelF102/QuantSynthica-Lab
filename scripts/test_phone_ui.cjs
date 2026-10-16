// Phone-width checks: no sideways page scroll, navbar fits, key controls on screen. BASE=http://localhost:3000 node scripts/test_phone_ui.cjs
const { launch } = require("./cdp.cjs");
const BASE = process.env.BASE || "http://localhost:3000";
let pass = 0, fail = 0;
const ok = (c, name, extra = "") => { (c ? pass++ : fail++); console.log(`${c ? "PASS" : "FAIL"}  ${name}${!c && extra ? "  -> " + extra : ""}`); };
const ROUTES = ["/", "/about", "/docs", "/research", "/research?ticker=AAPL&country=US", "/strategies", "/strategies/builder", "/backtests", "/backtests/bt_d06d4bc9", "/analytics", "/portfolio", "/risk", "/settings"];
let closer = () => {};
(async () => {
  const b = await launch("about:blank"); closer = b.close;
  for (const W of [360, 390, 430]) {
    await b.send("Emulation.setDeviceMetricsOverride", { width: W, height: 844, deviceScaleFactor: 1, mobile: true });
    for (const r of ROUTES) {
      await b.send("Page.navigate", { url: BASE + r });
      await b.waitFor(`document.readyState==='complete'&&!!document.querySelector('header')`, 60000);
      await b.sleep(4500);
      const m = await b.ev(`(()=>{const cw=document.documentElement.clientWidth;const menu=document.querySelector('button[aria-label="Open menu"],button[aria-label="Close menu"]');const mr=menu&&menu.getBoundingClientRect();const logo=document.querySelector('header a[aria-label$="home"]');const search=document.querySelector('header input[placeholder]');const lr=logo&&logo.getBoundingClientRect(),sr=search&&search.getBoundingClientRect();
        return {sw:document.documentElement.scrollWidth,cw,menuIn:!!mr&&mr.right<=cw+0.5&&mr.left>=0,overlap:!!(lr&&sr)&&lr.right>sr.left+1}})()`);
      ok(m.sw <= m.cw, `${r} @${W}: no sideways page scroll`, `scrollWidth ${m.sw} > ${m.cw}`);
      ok(m.menuIn, `${r} @${W}: menu button on screen`);
      ok(!m.overlap, `${r} @${W}: logo does not overlap search`);
    }
  }
  // strategies page: detail panel stacks under the list instead of being cut off
  await b.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await b.send("Page.navigate", { url: BASE + "/strategies" }); await b.sleep(6000);
  const st = await b.ev(`(()=>{const a=document.querySelector('aside');const r=a&&a.getBoundingClientRect();return {asideInView:!!r&&r.left>=0&&r.right<=document.documentElement.clientWidth+1,filters:[...document.querySelectorAll('button')].some(x=>/^Filters/.test(x.innerText.trim()))}})()`);
  ok(st.asideInView, "strategies: detail panel fits the screen"); ok(st.filters, "strategies: filters collapse behind a toggle");
  await b.ev(`[...document.querySelectorAll('button')].find(x=>/^Filters/.test(x.innerText.trim())).click()`); await b.sleep(300);
  ok(await b.ev(`[...document.querySelectorAll('button')].some(x=>x.innerText.trim().startsWith('Mean Reversion'))&&document.body.innerText.includes('ASSET FILTER')`), "strategies: filter toggle reveals the filters");
  // hero cards become a sideways strip on phones
  await b.send("Page.navigate", { url: BASE + "/" }); await b.sleep(6500);
  const cards = await b.ev(`(()=>{const c=[...document.querySelectorAll('div')].find(d=>/overflow-x-auto/.test(d.className)&&d.querySelectorAll(':scope > div').length===3&&/S&P 500/.test(d.innerText));if(!c)return null;const k=[...c.children].map(x=>x.getBoundingClientRect());return {noOverlap:k.every((r,i)=>i===0||r.left>=k[i-1].right-1),count:k.length}})()`);
  ok(cards && cards.count === 3 && cards.noOverlap, "landing: market cards do not overlap", JSON.stringify(cards));
  console.log(`\n${pass} passed, ${fail} failed`);
  b.close(); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); closer(); process.exit(2); });
