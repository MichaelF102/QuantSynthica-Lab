#!/usr/bin/env node
/**
 * Browser test for the Research section, driven over the Chrome DevTools protocol (no framework needed).
 * Requires: google-chrome, the Next.js app and the FastAPI backend running.
 *   BASE=http://localhost:3000 node scripts/test_research_landing_ui.cjs
 */
const BASE = process.env.BASE || "http://localhost:3000";
const { launch } = require("./cdp.cjs");
const results = []; const check = (n, ok, extra = "") => { results.push(ok); console.log(`${ok ? "PASS" : "FAIL"} ${n} ${extra}`); };
(async () => {
  const b = await launch(BASE + "/research");
  const type = (text) => b.ev(`(() => { const i=document.querySelector('input[role=combobox]'); i.focus(); const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; set.call(i,${JSON.stringify(text)}); i.dispatchEvent(new Event('input',{bubbles:true})); })()`);
  const key = (k) => b.send("Input.dispatchKeyEvent", { type: "keyDown", key: k, code: k, windowsVirtualKeyCode: { ArrowDown: 40, Enter: 13, Escape: 27 }[k] }).then(() => b.send("Input.dispatchKeyEvent", { type: "keyUp", key: k, code: k, windowsVirtualKeyCode: { ArrowDown: 40, Enter: 13, Escape: 27 }[k] }));
  try {
    check("landing loads", await b.waitFor(`document.body.innerText.includes('Security Research')`));
    check("market snapshot real cards", await b.waitFor(`/S&P 500|NASDAQ|NIFTY 50/.test(document.body.innerText)`, 30000));
    await type("hdfc");
    check("search lists results", await b.waitFor(`document.querySelectorAll('[role=option]').length>0`, 15000), await b.ev(`document.querySelectorAll('[role=option]').length+' options: '+[...document.querySelectorAll('[role=option]')].slice(0,3).map(o=>o.innerText.split('\\n')[0]).join(', ')`));
    await key("ArrowDown");
    check("arrow key highlights option", await b.ev(`document.querySelector('[role=option][aria-selected=true]')!==null`));
    await key("Enter");
    check("Enter opens the research workspace", await b.waitFor(`location.pathname==='/research' && location.search.includes('ticker=')`, 8000), await b.ev(`location.search`));
    check("workspace loads for the chosen security", await b.waitFor(`document.body.innerText.includes('Key statistics')`, 40000));
    // chips + market filter + recents
    await b.ev(`history.back()`); 
    check("back to landing", await b.waitFor(`document.body.innerText.includes('Security Research')`, 15000));
    check("recently viewed recorded", await b.waitFor(`document.body.innerText.includes('Recently viewed') && !document.body.innerText.includes('Nothing viewed yet')`, 8000));
    await b.ev(`[...document.querySelectorAll('button')].find(e=>e.innerText.trim().startsWith('AAPL')).click()`);
    check("popular chip opens AAPL (US)", await b.waitFor(`location.search.includes('ticker=AAPL') && location.search.includes('country=US')`, 8000));
  } catch (e) { console.log("ERROR", e.message); results.push(false); }
  b.close();
  console.log(results.every(Boolean) ? `\nALL ${results.length} LANDING CHECKS PASSED` : `\n${results.filter((x) => !x).length} FAILED`);
  process.exit(0);
})();
