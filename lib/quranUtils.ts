import { QURAN_MAPPING } from './quranMapping';
import { QURAN_HEADERS } from './quranHeaders';
import { QURAN_BISMILLAH } from './quranBismillah';
import { QURAN_NAME_TO_ID } from './quranNameToId';
import { QURAN_ID_TO_NAME } from './quranIdToName';
import { QURAN_SURAH_VERSES } from './quranSurahVerses';

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
export const calculateLines = (
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

/**
 * Calculates total fully-memorized pages between two points.
 * A page is counted only if the student has memorized PAST the last line of that page.
 * (i.e., the student reaches the first ayah of the NEXT page).
 */
export const calculatePages = (
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

    const [page1] = startInfo;

    const next = getNextAyah(endSurah, endAyah);
    let pageBoundary: number;

    if (next) {
        const nId = QURAN_NAME_TO_ID[next.surah];
        const nextInfo = QURAN_MAPPING[nId]?.[next.ayah];
        if (nextInfo) {
            [pageBoundary] = nextInfo;
        } else {
            pageBoundary = 605;
        }
    } else {
        pageBoundary = 605;
    }

    // Full pages = difference in page index
    const pages = pageBoundary - page1;
    return Math.max(0, pages);
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
