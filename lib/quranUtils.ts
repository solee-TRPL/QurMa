import { QURAN_MAPPING } from './quranMapping';
import { QURAN_HEADERS } from './quranHeaders';
import { QURAN_BISMILLAH } from './quranBismillah';
import { QURAN_NAME_TO_ID } from './quranNameToId';
import { QURAN_ID_TO_NAME } from './quranIdToName';
import { QURAN_SURAH_VERSES } from './quranSurahVerses';
import { SURAH_PROGRESSION } from './quranData';

/**
 * Standard Mushaf page limits (Max line count for text).
 * Page 1 and 2 are usually decorated and have fewer lines (8).
 * Most others have 15 lines.
 */
const QURAN_PAGE_LIMITS: Record<number, number> = {
    1: 8,
    2: 8
};

/**
 * Calculates total fully-memorized lines between two points.
 * A line is counted only if the student has memorized PAST that line.
 * It strictly respects the Mushaf layout (e.g., Page 1 and 2 only have ~8 lines).
 */
const calculateLinesPhysical = (
    startSurah: string, 
    startAyah: number, 
    endSurah: string, 
    endAyah: number
): number => {
    const sId1 = QURAN_NAME_TO_ID[startSurah];
    const sId2 = QURAN_NAME_TO_ID[endSurah];

    if (!sId1 || !sId2) return 0;

    const startInfo = QURAN_MAPPING[sId1]?.[startAyah];
    if (!startInfo) return 0;

    const next = getNextAyah(endSurah, endAyah);
    let pageBoundary: number;
    let lineBoundary: number;

    if (next) {
        const nId = QURAN_NAME_TO_ID[next.surah];
        const nextInfo = QURAN_MAPPING[nId]?.[next.ayah];
        if (nextInfo) {
            [pageBoundary, lineBoundary] = nextInfo;
        } else {
            [pageBoundary, lineBoundary] = [604, 16];
        }
    } else {
        [pageBoundary, lineBoundary] = [604, 16];
    }

    const [page1, line1] = startInfo;
    let totalLines = 0;

    const isNonVerse = (p: number, l: number) => {
        const headers = QURAN_HEADERS[p] || [];
        const bism = QURAN_BISMILLAH[p] || [];
        return headers.includes(l) || bism.includes(l);
    };

    for (let p = page1; p <= pageBoundary; p++) {
        const maxOnPage = QURAN_PAGE_LIMITS[p] || 15;
        let lStart = (p === page1) ? line1 : 1;
        let lEnd = (p === pageBoundary) ? lineBoundary - 1 : maxOnPage;

        for (let l = lStart; l <= lEnd; l++) {
            if (!isNonVerse(p, l)) {
                totalLines++;
            }
        }
    }

    return Math.max(0, totalLines);
};

export const calculateLines = (
    startSurah: string, 
    startAyah: number, 
    endSurah: string, 
    endAyah: number
): number => {
    if (startSurah === endSurah) {
        return calculateLinesPhysical(startSurah, startAyah, endSurah, endAyah);
    }

    const startIdx = SURAH_PROGRESSION.indexOf(startSurah);
    const endIdx = SURAH_PROGRESSION.indexOf(endSurah);

    if (startIdx === -1 || endIdx === -1) return 0;
    if (startIdx > endIdx) return 0;

    let totalLines = 0;

    // 1. Lines in startSurah
    const sIdStart = QURAN_NAME_TO_ID[startSurah];
    const totalAyahStart = QURAN_SURAH_VERSES[sIdStart];
    totalLines += calculateLinesPhysical(startSurah, startAyah, startSurah, totalAyahStart);

    // 2. Full surahs in between
    for (let i = startIdx + 1; i < endIdx; i++) {
        const midSurah = SURAH_PROGRESSION[i];
        const sIdMid = QURAN_NAME_TO_ID[midSurah];
        const totalAyahMid = QURAN_SURAH_VERSES[sIdMid];
        totalLines += calculateLinesPhysical(midSurah, 1, midSurah, totalAyahMid);
    }

    // 3. Lines in endSurah
    totalLines += calculateLinesPhysical(endSurah, 1, endSurah, endAyah);

    return totalLines;
};

/**
 * Calculates total fully-memorized pages between two points.
 * A page is counted only if the student has memorized PAST the last line of that page.
 * (i.e., the student reaches the first ayah of the NEXT page).
 */
const calculatePagesPhysical = (
    startSurah: string, 
    startAyah: number, 
    endSurah: string, 
    endAyah: number
): number => {
    const sId1 = QURAN_NAME_TO_ID[startSurah];
    const sId2 = QURAN_NAME_TO_ID[endSurah];

    if (!sId1 || !sId2) return 0;

    const startInfo = QURAN_MAPPING[sId1]?.[startAyah];
    const endInfo = QURAN_MAPPING[sId2]?.[endAyah];
    if (!startInfo || !endInfo) return 0;

    const [page1] = startInfo;
    
    // To count COMPLETED pages, we check where the NEXT ayah would be.
    // If the next ayah is on a new page, it means the current page was finished.
    const next = getNextAyah(endSurah, endAyah);
    let pageBoundary: number;
    if (next) {
        const nId = QURAN_NAME_TO_ID[next.surah];
        const nextInfo = QURAN_MAPPING[nId]?.[next.ayah];
        pageBoundary = nextInfo ? nextInfo[0] : 605; // 605 is past the end
    } else {
        pageBoundary = 605; // Finished the whole Quran
    }

    // Number of completed pages = pageBoundary - pageStart
    return Math.max(0, pageBoundary - page1);
};

export const calculatePages = (
    startSurah: string, 
    startAyah: number, 
    endSurah: string, 
    endAyah: number
): number => {
    if (startSurah === endSurah) {
        return calculatePagesPhysical(startSurah, startAyah, endSurah, endAyah);
    }

    const startIdx = SURAH_PROGRESSION.indexOf(startSurah);
    const endIdx = SURAH_PROGRESSION.indexOf(endSurah);

    if (startIdx === -1 || endIdx === -1) return 0;
    if (startIdx > endIdx) return 0;

    let totalPages = 0;

    const sIdStart = QURAN_NAME_TO_ID[startSurah];
    const totalAyahStart = QURAN_SURAH_VERSES[sIdStart];
    totalPages += calculatePagesPhysical(startSurah, startAyah, startSurah, totalAyahStart);

    for (let i = startIdx + 1; i < endIdx; i++) {
        const midSurah = SURAH_PROGRESSION[i];
        const sIdMid = QURAN_NAME_TO_ID[midSurah];
        const totalAyahMid = QURAN_SURAH_VERSES[sIdMid];
        totalPages += calculatePagesPhysical(midSurah, 1, midSurah, totalAyahMid);
    }

    totalPages += calculatePagesPhysical(endSurah, 1, endSurah, endAyah);

    return totalPages;
};

const JUZ_START_PAGES = [
  1, 22, 42, 62, 82, 102, 121, 142, 162, 182,
  201, 222, 242, 262, 282, 302, 322, 342, 362, 382,
  402, 422, 442, 462, 482, 502, 522, 542, 562, 582
];

export const getJuzFromPage = (page: number): number => {
    let juz = 1;
    for (let i = 0; i < JUZ_START_PAGES.length; i++) {
        if (page >= JUZ_START_PAGES[i]) {
            juz = i + 1;
        } else {
            break;
        }
    }
    return juz;
};

export const getSequenceScore = (surahName: string, ayah: number): number => {
    const sId = QURAN_NAME_TO_ID[surahName];
    if (!sId) return 0;
    const info = QURAN_MAPPING[sId]?.[ayah];
    if (!info) return 0;
    
    const page = info[0];
    const juz = getJuzFromPage(page);
    
    // Reverse Juz sequence: Juz 30 gets highest score so sequence progresses from 30 down to 1
    const juzScore = (31 - juz) * 1000000;
    const absolutePosition = page * 100 + info[1];
    
    return juzScore + absolutePosition;
};

export const validateMemorizationSequence = (lastSurah: string, lastAyah: number, newSurah: string, newAyah: number): boolean => {
    if (!lastSurah || !lastAyah) return true;
    const lastScore = getSequenceScore(lastSurah, lastAyah);
    const newScore = getSequenceScore(newSurah, newAyah);
    return newScore >= lastScore;
};

/**
 * Helper to get the next ayah key
 */
export const getNextAyah = (surahName: string, ayah: number): { surah: string; ayah: number } | null => {
    const sId = QURAN_NAME_TO_ID[surahName];
    if (!sId) return null;

    const totalAyah = QURAN_SURAH_VERSES[sId];
    if (ayah < totalAyah) {
        return { surah: surahName, ayah: ayah + 1 };
    }

    if (sId < 114) {
        const nextName = QURAN_ID_TO_NAME[sId + 1];
        if (nextName) return { surah: nextName, ayah: 1 };
    }

    return null;
};
