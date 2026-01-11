
import { HOLIDAY_RANGES, SINGLE_HOLIDAYS } from './constants';

export const isHoliday = (date: Date): string | null => {
  const dayOfWeek = date.getDay();
  // Saturday (6) and Sunday (0)
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return "Fin de semana";
  }

  const isoDate = date.toISOString().split('T')[0];

  // Check single holidays
  const single = SINGLE_HOLIDAYS.find(h => h.date === isoDate);
  if (single) return single.name;

  // Check ranges
  for (const range of HOLIDAY_RANGES) {
    if (isoDate >= range.start && isoDate <= range.end) {
      return range.name;
    }
  }

  return null;
};

export const parseTime = (timeStr: string): { hours: number; minutes: number } => {
  const [h, m] = timeStr.split(':').map(Number);
  return { hours: h, minutes: m };
};

export const getSecondsToday = (date: Date): number => {
  return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
};

export const getSecondsFromTimeStr = (timeStr: string): number => {
  const { hours, minutes } = parseTime(timeStr);
  return hours * 3600 + minutes * 60;
};

export const formatTimeLeft = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  
  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0 || h > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  
  return parts.join(' ');
};
