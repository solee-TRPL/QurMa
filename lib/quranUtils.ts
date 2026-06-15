import { QURAN_MAPPING } from "./quranMapping";
import { QURAN_HEADERS } from "./quranHeaders";
import { QURAN_BISMILLAH } from "./quranBismillah";
import { QURAN_NAME_TO_ID } from "./quranNameToId";
import { QURAN_ID_TO_NAME } from "./quranIdToName";
import { QURAN_SURAH_VERSES } from "./quranSurahVerses";
import { SURAH_PROGRESSION } from "./quranData";

/**
 * Standard Mushaf page limits (Max line count for text).
 * Page 1 and 2 are usually decorated and have fewer lines (8).
 * Most others have 15 lines.
 */
const QURAN_PAGE_LIMITS: Record<number, number> = {
  1: 8,
  2: 8,
};

/**
 * Calculates total fully-memorized lines between two points.
 * A line is counted only if the student has memorized PAST that line.
 * It strictly respects the Mushaf layout (e.g., Page 1 and 2 only have ~8 lines).
 */
const calculateLinesPhysical = (startSurah: string, startAyah: number, endSurah: string, endAyah: number): number => {
  const sId1 = QURAN_NAME_TO_ID[startSurah];
  const sId2 = QURAN_NAME_TO_ID[endSurah];

  if (!sId1 || !sId2) return 0;

  const startInfo = QURAN_MAPPING[sId1]?.[startAyah];
  if (!startInfo) return 0;

  const next = getNextAyahPhysical(endSurah, endAyah);
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
    let lStart = p === page1 ? line1 : 1;
    let lEnd = p === pageBoundary ? lineBoundary - 1 : maxOnPage;

    for (let l = lStart; l <= lEnd; l++) {
      if (!isNonVerse(p, l)) {
        totalLines++;
      }
    }
  }

  return Math.max(0, totalLines);
};

export const calculateLines = (startSurah: string, startAyah: number, endSurah: string, endAyah: number): number => {
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
const calculatePagesPhysical = (startSurah: string, startAyah: number, endSurah: string, endAyah: number): number => {
  const sId1 = QURAN_NAME_TO_ID[startSurah];
  const sId2 = QURAN_NAME_TO_ID[endSurah];

  if (!sId1 || !sId2) return 0;

  const startInfo = QURAN_MAPPING[sId1]?.[startAyah];
  const endInfo = QURAN_MAPPING[sId2]?.[endAyah];
  if (!startInfo || !endInfo) return 0;

  const [page1] = startInfo;

  // To count COMPLETED pages, we check where the NEXT ayah would be.
  // If the next ayah is on a new page, it means the current page was finished.
  const next = getNextAyahPhysical(endSurah, endAyah);
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

export const calculatePages = (startSurah: string, startAyah: number, endSurah: string, endAyah: number): number => {
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

const JUZ_START_PAGES = [1, 22, 42, 62, 82, 102, 121, 142, 162, 182, 201, 222, 242, 262, 282, 302, 322, 342, 362, 382, 402, 422, 442, 462, 482, 502, 522, 542, 562, 582];

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
  
  const progressionIndex = SURAH_PROGRESSION.indexOf(surahName);
  if (progressionIndex === -1) return 0;

  // The primary sorting key is the position in SURAH_PROGRESSION
  // The secondary sorting key is the ayah number within that Surah.
  // We use 1000 multiplier since max ayah in Quran is 286.
  return (progressionIndex * 1000) + ayah;
};

export const validateMemorizationSequence = (lastSurah: string, lastAyah: number, newSurah: string, newAyah: number): boolean => {
  if (!lastSurah || !lastAyah) return true;
  const lastScore = getSequenceScore(lastSurah, lastAyah);
  const newScore = getSequenceScore(newSurah, newAyah);
  return newScore >= lastScore;
};

/**
 * [INTERNAL] Mendapatkan ayah berikutnya berdasarkan urutan MUSHAF fisik (1→114).
 * Dipakai oleh calculateLinesPhysical & calculatePagesPhysical untuk menentukan
 * batas halaman/baris di mushaf. JANGAN pakai untuk alur sabaq.
 */
const getNextAyahPhysical = (surahName: string, ayah: number): { surah: string; ayah: number } | null => {
  const sId = QURAN_NAME_TO_ID[surahName];
  if (!sId) return null;

  const totalAyah = QURAN_SURAH_VERSES[sId];
  if (ayah < totalAyah) {
    return { surah: surahName, ayah: ayah + 1 };
  }

  // Lanjut ke surah berikutnya dalam urutan mushaf (ID numerik)
  if (sId < 114) {
    const nextName = QURAN_ID_TO_NAME[sId + 1];
    if (nextName) return { surah: nextName, ayah: 1 };
  }

  return null;
};

/**
 * [EXPORTED] Mendapatkan ayah berikutnya berdasarkan urutan SABAQ (SURAH_PROGRESSION).
 * Dipakai untuk menentukan titik mulai setoran sabaq berikutnya.
 * Alur: Juz 30 → Juz 1, per-juz dari depan (An-Naba' → An-Nas, lalu Al-Mulk, dst.)
 */
const JUZ_STARTS = [
  { surah: "Al-Fatihah", ayah: 1 },       // Juz 1
  { surah: "Al-Baqarah", ayah: 142 },     // Juz 2
  { surah: "Al-Baqarah", ayah: 253 },     // Juz 3
  { surah: "Ali Imran", ayah: 93 },       // Juz 4
  { surah: "An-Nisa'", ayah: 24 },        // Juz 5
  { surah: "An-Nisa'", ayah: 148 },       // Juz 6
  { surah: "Al-Ma'idah", ayah: 82 },      // Juz 7
  { surah: "Al-An'am", ayah: 111 },       // Juz 8
  { surah: "Al-A'raf", ayah: 88 },        // Juz 9
  { surah: "Al-Anfal", ayah: 41 },        // Juz 10
  { surah: "At-Taubah", ayah: 93 },       // Juz 11
  { surah: "Hud", ayah: 6 },              // Juz 12
  { surah: "Yusuf", ayah: 53 },           // Juz 13
  { surah: "Al-Hijr", ayah: 1 },          // Juz 14
  { surah: "Al-Isra'", ayah: 1 },         // Juz 15
  { surah: "Al-Kahf", ayah: 75 },         // Juz 16
  { surah: "Al-Anbiya'", ayah: 1 },       // Juz 17
  { surah: "Al-Mu'minun", ayah: 1 },      // Juz 18
  { surah: "Al-Furqan", ayah: 21 },       // Juz 19
  { surah: "An-Naml", ayah: 56 },         // Juz 20
  { surah: "Al-'Ankabut", ayah: 46 },     // Juz 21
  { surah: "Al-Ahzab", ayah: 31 },        // Juz 22
  { surah: "Ya-Sin", ayah: 28 },          // Juz 23
  { surah: "Az-Zumar", ayah: 32 },        // Juz 24
  { surah: "Fussilat", ayah: 47 },        // Juz 25
  { surah: "Al-Ahqaf", ayah: 1 },         // Juz 26
  { surah: "Az-Zariyat", ayah: 31 },      // Juz 27
  { surah: "Al-Mujadilah", ayah: 1 },     // Juz 28
  { surah: "Al-Mulk", ayah: 1 },          // Juz 29
  { surah: "An-Naba'", ayah: 1 },         // Juz 30
];

export const getJuzStart = (juz: number): { surah: string; ayah: number } | null => {
  if (juz < 1 || juz > 30) return null;
  return JUZ_STARTS[juz - 1];
};

/**
 * [EXPORTED] Mendapatkan ayah berikutnya berdasarkan urutan SABAQ (Juz per Juz mundur, namun maju di dalam Juz).
 */
export const getNextAyah = (surahName: string, ayah: number): { surah: string; ayah: number } | null => {
  const currentLoc = getPhysicalLocation(surahName, ayah);
  if (!currentLoc) return null;

  const nextPhysical = getNextAyahPhysical(surahName, ayah);
  const nextLoc = nextPhysical ? getPhysicalLocation(nextPhysical.surah, nextPhysical.ayah) : null;

  // Jika ini adalah akhir dari Juz (ayah fisik berikutnya berada di Juz yang berbeda)
  const isJuzEnd = nextLoc && nextLoc.juz !== currentLoc.juz;

  if (isJuzEnd || !nextPhysical) {
    // Pindah ke awal Juz SEBELUMNYA (karena hafalan sabaq mundur dari Juz 30 ke Juz 1)
    if (currentLoc.juz <= 1) return null; // Sudah selesai seluruh Al-Quran
    return getJuzStart(currentLoc.juz - 1);
  }

  // Jika masih di dalam Juz yang sama, maju terus ke ayah/surah berikutnya sesuai urutan mushaf fisik
  return nextPhysical;
};

/**
 * [EXPORTED] Menentukan Surah dan Ayah untuk Sabaq berdasarkan Jumlah Juz dan Halaman yang sudah dihafal.
 * Asumsi: Hafalan mundur dari Juz 30 ke Juz 1.
 */
export const getSabaqPositionFromHafalan = (juzCompleted: number, pagesCompleted: number): { surah: string; ayah: number } | null => {
  const activeJuz = 30 - juzCompleted;
  
  if (activeJuz < 1) return { surah: "Al-Baqarah", ayah: 1 }; // Sudah selesai semua

  if (pagesCompleted === 0) {
    return getJuzStart(activeJuz);
  }

  const startPageOfJuz = JUZ_START_PAGES[activeJuz - 1];
  const targetPage = startPageOfJuz + pagesCompleted;

  const startLoc = getJuzStart(activeJuz);
  if (!startLoc) return null;

  let currentSurah = startLoc.surah;
  let currentAyah = startLoc.ayah;

  while (true) {
    const loc = getPhysicalLocation(currentSurah, currentAyah);
    if (!loc) break;
    if (loc.page >= targetPage) {
      return { surah: currentSurah, ayah: currentAyah };
    }
    
    const nextLoc = getNextAyahPhysical(currentSurah, currentAyah);
    if (!nextLoc) break;
    currentSurah = nextLoc.surah;
    currentAyah = nextLoc.ayah;
  }

  return { surah: currentSurah, ayah: currentAyah };
};

export const getJuzFromSurahAyah = (surahName: string, ayah: number): number => {
  const sId = QURAN_NAME_TO_ID[surahName];
  if (!sId) return 1;

  let currentJuz = 1;
  for (let i = 0; i < JUZ_STARTS.length; i++) {
    const start = JUZ_STARTS[i];
    const startSId = QURAN_NAME_TO_ID[start.surah];
    
    if (startSId < sId || (startSId === sId && start.ayah <= ayah)) {
      currentJuz = i + 1;
    } else {
      break;
    }
  }
  return currentJuz;
};

/**
 * [EXPORTED] Mendapatkan Juz dan Halaman fisik dari suatu surah dan ayat.
 */
export const getPhysicalLocation = (surahName: string, ayah: number): { juz: number, page: number } | null => {
  const sId = QURAN_NAME_TO_ID[surahName];
  if (!sId) return null;
  const ayahToUse = ayah === 0 ? 1 : ayah;
  const info = QURAN_MAPPING[sId]?.[ayahToUse];
  if (!info) return null;
  const page = info[0];
  const juz = getJuzFromSurahAyah(surahName, ayahToUse);
  return { juz, page };
};
