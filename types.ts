
export interface ScheduleItem {
  time: string; // HH:mm format
  event: string;
  durationSeconds: number;
}

export interface HolidayRange {
  name: string;
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}

export interface SingleHoliday {
  date: string;  // YYYY-MM-DD
  name: string;
}

export enum SoundState {
  DISABLED = 'DISABLED',
  ENABLED = 'ENABLED',
  RINGING = 'RINGING'
}
