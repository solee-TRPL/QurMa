const fs = require('fs');
const filePath = 'pages/teacher/InputHafalan.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Fix the stray brace in Line 1010
content = content.replace(/cursor-default\"\}\s*\/>/g, 'cursor-default\"\n                                                                             \/>');

// Fix indentation on Ayat field disabled prop
content = content.replace(/  disabled=\{isFuture \|\| !isSurahSelected\}/g, ' disabled={isFuture || !isSurahSelected}');

fs.writeFileSync(filePath, content);
console.log('Cleanup complete.');
