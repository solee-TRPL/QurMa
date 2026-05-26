import { SURAH_DATA } from './quranData';

export const QURAN_ID_TO_NAME: Record<number, string> = SURAH_DATA.reduce((acc, surah, index) => {
  acc[index + 1] = surah.name;
  return acc;
}, {} as Record<number, string>);