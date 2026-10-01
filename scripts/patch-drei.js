const fs = require('fs');
const path = require('path');

const htmlJsPath = path.join(__dirname, '..', 'node_modules', '@react-three', 'drei', 'web', 'Html.js');
const htmlCjsPath = path.join(__dirname, '..', 'node_modules', '@react-three', 'drei', 'web', 'Html.cjs.js');

function patchFile(filePath, targetPattern, replacement) {
  if (!fs.existsSync(filePath)) {
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('setTimeout(() => { try { currentRoot.unmount();') || 
      content.includes('setTimeout(()=>{try{e.unmount()')) {
    console.log(`[patch-drei] ${path.basename(filePath)} already patched.`);
    return;
  }

  if (content.includes(targetPattern)) {
    content = content.replace(targetPattern, replacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[patch-drei] Patched ${path.basename(filePath)} successfully.`);
  } else {
    console.warn(`[patch-drei] Target pattern not found in ${path.basename(filePath)}.`);
  }
}

// 1. Patch ESM Html.js
patchFile(
  htmlJsPath,
  '        currentRoot.unmount();',
  '        setTimeout(() => {\n          try {\n            currentRoot.unmount();\n          } catch (_) {}\n        }, 0);'
);

// 2. Patch CJS Html.cjs.js
patchFile(
  htmlCjsPath,
  'U.removeChild(D),e.unmount()',
  'U.removeChild(D),setTimeout(()=>{try{e.unmount()}catch(_){}},0)'
);
