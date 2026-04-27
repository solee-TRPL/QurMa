const fs = require('fs');
const path = require('path');

const base = 'node_modules/quran-qcf4/pages';
const mapping = {};
const headers = {};
const bismillah = {};
const pageMapping = {};

for (let pNum = 1; pNum <= 604; pNum++) {
    const pStr = pNum.toString().padStart(3, '0');
    const pageData = JSON.parse(fs.readFileSync(path.join(base, `${pStr}.json`)));
    
    headers[pNum] = [];
    bismillah[pNum] = [];
    pageMapping[pNum] = [];

    pageData.lines.forEach((lineObj, idx) => {
        const lineNum = lineObj.line;
        const words = lineObj.words;
        
        const hasHeader = words.some(w => w.type === 'surah_header');
        const hasBism = words.some(w => w.type === 'bismillah');
        
        if (hasHeader) headers[pNum].push(lineNum);
        if (hasBism) bismillah[pNum].push(lineNum);

        words.forEach(w => {
            if (w.verse_key) {
                const [sId, aId] = w.verse_key.split(':').map(Number);
                
                if (!mapping[sId]) mapping[sId] = {};
                // Only store the FIRST line where an ayah appears.
                if (!mapping[sId][aId]) {
                    mapping[sId][aId] = [pNum, lineNum];
                }
                
                // For pageMapping, store unique [s, a, line]
                const exists = pageMapping[pNum].some(x => x[0] === sId && x[1] === aId && x[2] === lineNum);
                if (!exists) {
                    pageMapping[pNum].push([sId, aId, lineNum]);
                }
            }
        });
    });
    
    if (headers[pNum].length === 0) delete headers[pNum];
    if (bismillah[pNum].length === 0) delete bismillah[pNum];
}

fs.writeFileSync('lib/quranMapping.ts', `export const QURAN_MAPPING: Record<number, Record<number, [number, number]>> = ${JSON.stringify(mapping)};`);
fs.writeFileSync('lib/quranHeaders.ts', `export const QURAN_HEADERS: Record<number, number[]> = ${JSON.stringify(headers)};`);
fs.writeFileSync('lib/quranBismillah.ts', `export const QURAN_BISMILLAH: Record<number, number[]> = ${JSON.stringify(bismillah)};`);
fs.writeFileSync('lib/quranPageMapping.ts', `export const QURAN_PAGE_MAPPING: Record<number, [number, number, number][]> = ${JSON.stringify(pageMapping)};`);

console.log('Regeneration complete.');
