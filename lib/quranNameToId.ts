import { SURAH_DATA } from "./quranData";

export const QURAN_NAME_TO_ID: Record<string, number> = SURAH_DATA.reduce(
  (acc, surah, index) => {
    acc[surah.name] = index + 1;
    return acc;
  },
  {} as Record<string, number>,
);
