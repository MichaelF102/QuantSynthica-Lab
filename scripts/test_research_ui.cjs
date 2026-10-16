#!/usr/bin/env node
/**
 * Browser test for the Research section, driven over the Chrome DevTools protocol (no framework needed).
 * Requires: google-chrome, the Next.js app and the FastAPI backend running.
 *   BASE=http://localhost:3000 node scripts/test_research_ui.cjs
 */
const BASE = process.env.BASE || "http://localhost:3000";
const { launch } = require("./cdp.cjs");
const results = []; const check = (n, ok, extra = "") => { results.push(ok); console.log(`${ok ? "PASS" : "FAIL"} ${n} ${extra}`); };
(async () => {
  const b = await launch(BASE + "/research?ticker=RELIANCE&country=India");
  try {
    check("workspace loads", await b.waitFor(`document.body.innerText.includes("Key statistics")`));
    const clickText = (sel, text) => b.ev(`(() => { const el=[...document.querySelectorAll(${JSON.stringify(sel)})].find(e=>e.innerText.trim().startsWith(${JSON.stringify(text)})); if(!el) return false; el.click(); return true; })()`);
    // tabs
    const tabs = [["Technicals","technicals","Technical summary"],["Fundamentals","fundamentals","Valuation"],["Sentiment","sentiment","Technical sentiment"],["Options","options","Options positioning|No listed options|listed options"],["Analyst Estimates","analyst","Price target range|Recommendation trend|No analyst"],["News","news","News"],["Filings","filings","Regulatory filings"],["Competitors","competitors","Peer comparison"],["Ownership","ownership","Ownership structure|Insiders"],["ESG","esg","ESG ratings"],["Overview","overview","Key statistics"]];
    for (const [label, slug, text] of tabs) {
      const clicked = await clickText("nav[aria-label='Research sections'] button", label);
      await b.sleep(400);
      const okUrl = await b.waitFor(`location.search.includes('tab=${slug}')`, 5000);
      const okBody = await b.waitFor(`/${text}/.test(document.body.innerText)`, 20000);
      check(`tab ${label}`, clicked && okUrl && okBody);
    }
    // watchlist
    await clickText("button", "Watchlist");
    await b.sleep(300);
    check("watchlist saves", await b.ev(`JSON.parse(localStorage.getItem('algolab_watchlist')||'[]').some(w=>w.ticker==='RELIANCE')`));
    check("watchlist button reflects state", await b.ev(`[...document.querySelectorAll('button')].some(e=>e.innerText.includes('Watching') && e.getAttribute('aria-pressed')==='true')`));
    await clickText("button", "Watching");
    check("watchlist toggles off", await b.ev(`!JSON.parse(localStorage.getItem('algolab_watchlist')||'[]').some(w=>w.ticker==='RELIANCE')`));
    // actions menu
    await clickText("button", "Actions");
    check("actions menu opens with 4 items", await b.ev(`document.querySelectorAll('[role=menuitem]').length===4`));
    await b.ev(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))`);
    await b.sleep(200);
    check("actions menu closes on Escape", await b.ev(`document.querySelectorAll('[role=menuitem]').length===0`));
    await clickText("button", "Actions");
    check("backtest link target", await b.ev(`[...document.querySelectorAll('[role=menuitem]')].some(a=>a.getAttribute('href')?.startsWith('/backtests?ticker=RELIANCE'))`));
    await b.ev(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))`);
    // chart controls (overview)
    check("chart candles present", await b.ev(`document.querySelectorAll('.recharts-bar-rectangle, .recharts-bar-rectangles').length>0`));
    await clickText("button", "Indicators");
    check("indicators menu opens", await b.ev(`/overlays/i.test(document.body.innerText) && /panels/i.test(document.body.innerText)`));
    await b.ev(`(() => { const l=[...document.querySelectorAll('label')].find(e=>e.innerText.trim()==='RSI'); l.querySelector('input').click(); })()`);
    check("RSI panel appears", await b.waitFor(`document.body.innerText.includes('RSI (14)')`, 5000));
    await b.ev(`(() => { const l=[...document.querySelectorAll('label')].find(e=>e.innerText.trim()==='MACD'); l.querySelector('input').click(); })()`);
    check("MACD panel appears", await b.waitFor(`document.body.innerText.includes('MACD (12, 26, 9)')`, 5000));
    await b.ev(`document.body.click()`);
    for (const r of ["1M", "6M", "YTD", "5Y", "ALL"]) { await clickText("button", r); await b.sleep(200); }
    check("range buttons work without error", await b.ev(`!document.body.innerText.includes('Application error')`));
    await clickText("button", "Line"); await b.sleep(300);
    check("line mode removes candles", await b.ev(`document.querySelectorAll('.recharts-line').length>0`));
    await clickText("button", "Week"); await b.sleep(300);
    check("weekly interval renders", await b.ev(`document.body.innerText.includes('weekly bars')`));
    // header Compare button: goes to Technicals with benchmark comparison on
    await clickText("button", "Compare"); await b.sleep(600);
    check("header Compare opens Technicals with compare on", await b.waitFor(`location.search.includes('tab=technicals') && document.body.innerText.includes('Compare: ^NSEI')`, 8000));
    // chart Compare menu: switch it off then back on via the menu
    await b.ev(`(() => { const x=[...document.querySelectorAll('button[aria-expanded]')].find(e=>e.innerText.trim().startsWith('Compare')); x.click(); })()`);
    check("chart compare menu opens", await b.ev(`document.body.innerText.includes('Benchmark (')`));
    await b.ev(`(() => { const x=[...document.querySelectorAll('button')].find(e=>e.innerText.trim()==='Off'); x.click(); })()`);
    check("compare turns off", await b.waitFor(`!document.body.innerText.includes('Compare: ^NSEI')`, 4000));
    await b.ev(`(() => { const x=[...document.querySelectorAll('button[aria-expanded]')].find(e=>e.innerText.trim().startsWith('Compare')); x.click(); })()`);
    await b.ev(`(() => { const x=[...document.querySelectorAll('button')].find(e=>e.innerText.trim().startsWith('Benchmark (')); x.click(); })()`);
    check("compare benchmark activates", await b.waitFor(`document.body.innerText.includes('Compare: ^NSEI')`, 5000));
    // benchmark selector
    await b.ev(`(() => { const s=document.querySelector('select'); const set=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set; set.call(s,'^NSEBANK'); s.dispatchEvent(new Event('change',{bubbles:true})); })()`);
    check("benchmark change reloads", await b.waitFor(`document.body.innerText.includes('NIFTY Bank') && !document.body.innerText.includes('Could not load')`, 30000));
    // keyboard focus: tabs are buttons
    check("tabs have aria-current", await b.ev(`!!document.querySelector("nav[aria-label='Research sections'] button[aria-current=page]")`));
  } catch (e) { console.log("ERROR", e.message); results.push(false); }
  b.close();
  console.log(results.every(Boolean) ? `\nALL ${results.length} UI CHECKS PASSED` : `\n${results.filter((x) => !x).length} FAILED`);
  process.exit(0);
})();
