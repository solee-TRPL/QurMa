const fs = require('fs');
const path = require('path');

const filePath = 'pages/teacher/InputHafalan.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove the incorrectly added readOnly in the Ayat field (near Line 1052)
// Actually, I'll just look for 'readOnly' followed by 'disabled={isFuture || !isSurahSelected}'
content = content.replace(/\s+readOnly\s+disabled=\{isFuture\s*\|\|\s*!isSurahSelected\}/, '\n                                                                                         disabled={isFuture || !isSurahSelected}');

// 2. Add readOnly to the Baris/Hal field and remove manual handlers
// This field has type="number", disabled={isFuture}, and onInput
// I'll target the pattern: <input type="number" disabled={isFuture} value={(() => { ... })()} placeholder="0" min={0} className="..." onInput={...} />

const barisRegex = /(<div className=\"flex items-center )bg-slate-50\/50 border border-slate-100( rounded-lg focus-within:ring-1 focus-within:ring-indigo-200 h-8 px-1.5 flex-none w-\[84px\]\">(?:\s*)<input\s*type=\"number\")(\s+disabled=\{isFuture\})/g;
// Replace outer div classes to indicate read-only
content = content.replace(barisRegex, '$1bg-slate-100/50 border border-slate-200$2 readOnly$3');

// 3. Remove onInput and min={0} and change styling for Baris/Hal
// Looking for lines within the first input
const barisStyleRegex = /(placeholder=\"0\")(\s*)min=\{0\}(\s*)className=\"bg-transparent w-full text-\[12px\] font-black text-center text-slate-700 outline-none border-none ring-0 appearance-none ([^"]+)\"(\s*)onInput=\{[^}]+\}/g;
content = content.replace(barisStyleRegex, '$1$2className=\"bg-transparent w-full text-\[12px\] font-black text-center text-slate-500 outline-none border-none ring-0 appearance-none cursor-default\"');

fs.writeFileSync(filePath, content);
console.log('Update complete.');
