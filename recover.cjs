const fs = require('fs');
let code = fs.readFileSync('c:/dataD/Project/QurMa-next/views/teacher/InputHafalan.tsx', 'utf8');

// 1. Fix findLatestPosition
code = code.replace(
    /\/\/ Check pending first[\s\S]*?if \(!pending \|\| \(!pending\.surah_name && !pending\.ayat_end\)\) \{[\s\S]*?const existing = \(recordsByDate\[d\] \|\| \[\]\)\.find\(r => r\.type === type\);[\s\S]*?if \(existing\?\.surah_name && existing\?\.ayat_end\) \{[\s\S]*?return \{ surah_name: existing\.surah_name, ayat_pos: existing\.ayat_end \};[\s\S]*?\}[\s\S]*?\}/,
    `const existing = (recordsByDate[d] || []).find(r => r.type === type);
            const curr = {
                ...existing,
                ...(activePending[key] || {})
            };
            
            if (curr.surah_name && curr.ayat_end) {
                return { surah_name: curr.surah_name, ayat_pos: curr.ayat_end };
            }`
);

// 2. Add applyRippleEffect
const applyRippleCode = `
    const applyRippleEffect = (basePending: Record<string, any>, startDate: string, type: MemorizationType) => {
        let newPending = { ...basePending };
        const sortedDates = [...weekDates].sort((a, b) => a.localeCompare(b));
        const startIndex = sortedDates.indexOf(startDate);
        
        for (let i = startIndex + 1; i < sortedDates.length; i++) {
            const d = sortedDates[i];
            const k = \`\${d}|\${type}\`;
            const rec = (recordsByDate[d] || []).find(r => r.type === type);
            const curr = {
                ...rec,
                ...(newPending[k] || {})
            };

            if (curr.surah_name && curr.ayat_end) {
                const lastPos = findLatestPosition(type, d, newPending);
                if (lastPos) {
                    const start = getNextAyah(lastPos.surah_name, lastPos.ayat_pos);
                    if (start) {
                        const val = (type === MemorizationType.SABAQ)
                            ? calculateLines(start.surah, start.ayah, curr.surah_name, curr.ayat_end)
                            : calculatePages(start.surah, start.ayah, curr.surah_name, curr.ayat_end);
                        
                        if (val <= 0 && type === MemorizationType.SABAQ) {
                            newPending[k] = {
                                ...newPending[k],
                                surah_name: '',
                                ayat_end: 0,
                                jumlah: 0,
                                is_verified: false,
                                status: MemorizationStatus.EMPTY,
                                keterangan: '-'
                            };
                        } else {
                            newPending[k] = {
                                ...newPending[k],
                                jumlah: val > 0 ? val : 0,
                                is_verified: false
                            };
                        }
                    } else {
                        newPending[k] = { ...newPending[k], jumlah: 0, is_verified: false };
                    }
                } else {
                    newPending[k] = { ...newPending[k], jumlah: 0, is_verified: false };
                }
            }
        }
        return newPending;
    };
`;

code = code.replace('const handleLocalChange = (date: string, type: MemorizationType, value: string, subType: string = \'value\') => {', applyRippleCode + '\n    const handleLocalChange = (date: string, type: MemorizationType, value: string, subType: string = \'value\') => {');

// 3. Apply applyRippleEffect in handleLocalChange
// Replace the early returns
code = code.replace(
    /setPendingChanges\(prev => \(\{\s*\.\.\.prev,\s*\[key\]: \{\s*\.\.\.prev\[key\],\s*surah_name: value,\s*ayat_end: suggestedAyat,\s*jumlah: autoJumlah > 0 \? autoJumlah : 0,\s*is_verified: false,\s*is_read_by_parent: false,\s*\.\.\.\(value === '' \? \{ status: MemorizationStatus\.EMPTY \} : \{\}\)\s*\}\s*\}\)\);/g,
    `setPendingChanges(prev => {
                const newPending = {
                    ...prev,
                    [key]: {
                        ...prev[key],
                        surah_name: value,
                        ayat_end: suggestedAyat,
                        jumlah: autoJumlah > 0 ? autoJumlah : 0,
                        is_verified: false,
                        is_read_by_parent: false,
                        ...(value === '' ? { status: MemorizationStatus.EMPTY } : {})
                    }
                };
                return applyRippleEffect(newPending, date, type);
            });`
);

code = code.replace(
    /setPendingChanges\(prev => \(\{\s*\.\.\.prev,\s*\[key\]: \{\s*\.\.\.prev\[key\],\s*\[subType === 'score' \? 'score' : subType === 'ayat_end' \? 'ayat_end' : 'jumlah'\]: null,\s*is_verified: false,\s*is_read_by_parent: false\s*\}\s*\}\)\);/g,
    `setPendingChanges(prev => {
                const newPending = {
                    ...prev,
                    [key]: {
                        ...prev[key],
                        [subType === 'score' ? 'score' : subType === 'ayat_end' ? 'ayat_end' : 'jumlah']: null,
                        is_verified: false,
                        is_read_by_parent: false
                    }
                };
                return applyRippleEffect(newPending, date, type);
            });`
);

code = code.replace(
    /\/\/ RIPPLE EFFECT: Update subsequent days in the week[\s\S]*?return newPending;/g,
    'return applyRippleEffect(newPending, date, type);'
);

// 3.5 ADD ACTIVEE PERIODS AND DAYS LOGIC
code = code.replace(
    /const weekDates = useMemo\(\(\) => \{[\s\S]*?return dates;\s*\}, \[currentWeekOffset, activeDays\]\);/,
    `    const activePeriodsStr = JSON.stringify(tenant?.cycle_config?.activePeriods || []);
    const activeDaysStr = JSON.stringify(activeDays);
    
    const weekDates = useMemo(() => {
        const today = new Date();
        const day = today.getDay(); // 0-6
        // Adjust to Monday: Monday is 1, Sunday is 0 -> diff: (1 - day)
        // If Sunday (0), it goes back 6 days to prev Monday.
        const diff = (day === 0 ? -6 : 1) - day + (currentWeekOffset * 7);
        
        const start = new Date(today);
        start.setDate(today.getDate() + diff);
        
        const dates: string[] = [];
        const activePeriods = JSON.parse(activePeriodsStr);
        const parsedActiveDays = JSON.parse(activeDaysStr);

        // Loop through 7 full days starting from Monday
        for (let i = 0; i < 7; i++) {
            const current = new Date(start);
            current.setDate(start.getDate() + i);
            const currentDateStr = getLocalDateString(current);

            let isWithinActiveRange = true;
            if (activePeriods.length > 0) {
                isWithinActiveRange = activePeriods.some((period: any) => {
                    const startOk = !period.startDate || currentDateStr >= period.startDate;
                    const endOk = !period.endDate || currentDateStr <= period.endDate;
                    return startOk && endOk;
                });
            }

            // Only add to table if it's an active day based on config and within active range
            if (parsedActiveDays.includes(current.getDay()) && isWithinActiveRange) {
                dates.push(currentDateStr);
            }
        }
        return dates;
    }, [currentWeekOffset, activeDaysStr, activePeriodsStr]);`
);


// 4. Implement Holiday logic
const holidayCode = `
    const checkHoliday = (offset: number) => {
        const today = new Date();
        const day = today.getDay();
        const diff = (day === 0 ? -6 : 1) - day + (offset * 7);
        const start = new Date(today);
        start.setDate(today.getDate() + diff);
        
        const activePeriods = JSON.parse(activePeriodsStr);
        const parsedActiveDays = JSON.parse(activeDaysStr);
        
        let hasActiveDay = false;
        for (let i = 0; i < 7; i++) {
            const current = new Date(start);
            current.setDate(start.getDate() + i);
            const currentDateStr = getLocalDateString(current);
            
            let isWithinActiveRange = true;
            if (activePeriods.length > 0) {
                isWithinActiveRange = activePeriods.some((period: any) => {
                    const startOk = !period.startDate || currentDateStr >= period.startDate;
                    const endOk = !period.endDate || currentDateStr <= period.endDate;
                    return startOk && endOk;
                });
            }
            if (parsedActiveDays.includes(current.getDay()) && isWithinActiveRange) {
                hasActiveDay = true;
                break;
            }
        }
        return !hasActiveDay;
    };

    const holidayBlock = useMemo(() => {
        if (weekDates.length > 0) return null;
        
        let startOffset = currentWeekOffset;
        while (checkHoliday(startOffset - 1)) {
            startOffset--;
        }
        
        let endOffset = currentWeekOffset;
        while (checkHoliday(endOffset + 1)) {
            endOffset++;
        }
        
        const getMonday = (offset: number) => {
            const today = new Date();
            const day = today.getDay();
            const diff = (day === 0 ? -6 : 1) - day + (offset * 7);
            const d = new Date(today);
            d.setDate(today.getDate() + diff);
            return d;
        };
        const getSunday = (offset: number) => {
            const d = getMonday(offset);
            d.setDate(d.getDate() + 6);
            return d;
        };
        
        const startDate = getMonday(startOffset);
        const endDate = getSunday(endOffset);
        
        const formatOptions: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
        return {
            startOffset,
            endOffset,
            displayRange: \`\${startDate.toLocaleDateString('id-ID', formatOptions)} - \${endDate.toLocaleDateString('id-ID', formatOptions)}\`
        };
    }, [currentWeekOffset, weekDates.length, activePeriodsStr, activeDaysStr]);
`;

code = code.replace('const weekDisplayRange = useMemo(() => {', holidayCode + '\n    const weekDisplayRange = useMemo(() => {');

// 5. Apply to Pagination buttons
code = code.replace(
    /onClick=\{\(\) => setCurrentWeekOffset\(prev => prev - 1\)\}/g,
    'onClick={() => holidayBlock ? setCurrentWeekOffset(holidayBlock.startOffset - 1) : setCurrentWeekOffset(prev => prev - 1)}'
);
code = code.replace(
    /onClick=\{\(\) => setCurrentWeekOffset\(prev => prev \+ 1\)\}/g,
    'onClick={() => holidayBlock ? setCurrentWeekOffset(holidayBlock.endOffset + 1) : setCurrentWeekOffset(prev => prev + 1)}'
);
code = code.replace(
    /\{weekDisplayRange\}/g,
    '{holidayBlock ? holidayBlock.displayRange : weekDisplayRange}'
);
code = code.replace(
    /\{currentWeekOffset === 0 \? 'Pekan Ini' :[\s\S]*?`\$\{currentWeekOffset\} Pekan Depan`\}/g,
    `{holidayBlock ? 'Masa Liburan' : (
                                                 currentWeekOffset === 0 ? 'Pekan Ini' : 
                                                 currentWeekOffset === -1 ? 'Pekan Lalu' : 
                                                 currentWeekOffset === 1 ? 'Pekan Depan' : 
                                                 currentWeekOffset < 0 ? \`\${Math.abs(currentWeekOffset)} Pekan Lalu\` : 
                                                 \`\${currentWeekOffset} Pekan Depan\`
                                                )}`
);

// 6. Apply to Desktop Empty State
code = code.replace(
    /<h4 className="text-\[11px\] font-black text-slate-400 uppercase tracking-\[0\.2em\]">Pekan Ini Sedang Libur<\/h4>[\s\S]*?<p className="text-\[10px\] font-bold text-slate-400 mt-2 max-w-xs mx-auto">Tidak ada hari efektif yang dikonfigurasi pada pekan ini\.<\/p>/g,
    `<h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Masa Liburan</h4>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-2 max-w-xs mx-auto">Tidak ada hari efektif yang dikonfigurasi pada periode ini.</p>
                                                    {holidayBlock && (
                                                        <div className="inline-block mt-4 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest border border-emerald-100">
                                                            {holidayBlock.displayRange}
                                                        </div>
                                                    )}`
);

// 7. Hide disabled surahs in dropdown
code = code.replace(
    /\{SURAH_DATA\.slice\(0, 114\)\.map\(\(s\) => \{[\s\S]*?return \([\s\S]*?<option key=\{s\.id\} value=\{s\.name\} disabled=\{!isValid\}>[\s\S]*?\{s\.name\}[\s\S]*?<\/option>[\s\S]*?\);[\s\S]*?\}\)\}/g,
    `{SURAH_DATA.slice(0, 114).map((s) => {
                                                                            if (type === MemorizationType.SABAQ && prevSurahIndex !== -1) {
                                                                                const currentSurahIndex = SURAH_PROGRESSION.indexOf(s.name);
                                                                                if (currentSurahIndex < prevSurahIndex) return null;
                                                                            }
                                                                            return (
                                                                                <option key={s.id} value={s.name}>
                                                                                    {s.name}
                                                                                </option>
                                                                            );
                                                                        })}`
);


// 8. Mobile Empty State Wrapper!
code = code.replace(
    /className="lg:hidden h-full overflow-x-auto overflow-y-hidden no-scrollbar snap-x snap-mandatory scroll-smooth"[\s\S]*?style=\{\{ scrollPaddingLeft: '50px' \}\}[\s\S]*?>\s*<table className="border-separate border-spacing-0 table-fixed w-max h-full">/,
    `className="lg:hidden h-full overflow-x-auto overflow-y-hidden no-scrollbar snap-x snap-mandatory scroll-smooth"
                                    style={{ scrollPaddingLeft: '50px' }}
                                 >
                                    {weekDates.length > 0 ? (
                                     <table className="border-separate border-spacing-0 table-fixed w-max h-full">`
);

code = code.replace(
    /<\/table>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/form>/,
    `</table>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-8 bg-slate-50/30 min-h-[300px] w-full max-w-sm mx-auto">
                                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-3 text-slate-300 ring-1 ring-slate-200 shadow-sm">
                                                <BookOpen className="w-7 h-7 opacity-50" />
                                            </div>
                                            <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">Masa Liburan</h4>
                                            <p className="text-[10px] font-bold text-slate-400 text-center max-w-[200px] leading-relaxed">
                                                Tidak ada hari efektif yang dikonfigurasi pada periode ini.
                                            </p>
                                            {holidayBlock && (
                                                <div className="inline-block mt-4 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg font-bold text-[9px] uppercase tracking-widest border border-emerald-100">
                                                    {holidayBlock.displayRange}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>`
);

fs.writeFileSync('c:/dataD/Project/QurMa-next/views/teacher/InputHafalan.tsx', code);
console.log('Successfully recovered all changes!');
