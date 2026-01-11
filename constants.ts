
import { ScheduleItem, HolidayRange, SingleHoliday } from './types';

export const DAILY_SCHEDULE: ScheduleItem[] = [
  { time: "08:25", event: "AVISO", durationSeconds: 10 },
  { time: "08:30", event: "ENTRADA", durationSeconds: 15 },
  { time: "09:20", event: "AVISO", durationSeconds: 10 },
  { time: "09:25", event: "ENTRADA", durationSeconds: 15 },
  { time: "10:15", event: "AVISO", durationSeconds: 10 },
  { time: "10:20", event: "ENTRADA", durationSeconds: 15 },
  { time: "11:10", event: "SALIDA RECREO", durationSeconds: 15 },
  { time: "11:35", event: "AVISO fin recreo", durationSeconds: 10 },
  { time: "11:40", event: "ENTRADA", durationSeconds: 15 },
  { time: "12:30", event: "AVISO", durationSeconds: 10 },
  { time: "12:35", event: "ENTRADA", durationSeconds: 15 },
  { time: "13:25", event: "AVISO", durationSeconds: 10 },
  { time: "13:30", event: "ENTRADA", durationSeconds: 15 },
  { time: "14:20", event: "AVISO", durationSeconds: 10 },
  { time: "14:25", event: "ENTRADA", durationSeconds: 15 },
  { time: "15:15", event: "FIN JORNADA (mañana)", durationSeconds: 15 },
  { time: "15:55", event: "AVISO", durationSeconds: 10 },
  { time: "16:00", event: "ENTRADA", durationSeconds: 15 },
  { time: "16:50", event: "AVISO", durationSeconds: 10 },
  { time: "16:55", event: "ENTRADA", durationSeconds: 15 },
  { time: "17:45", event: "AVISO", durationSeconds: 10 },
  { time: "17:50", event: "ENTRADA", durationSeconds: 15 },
  { time: "18:40", event: "SALIDA RECREO (tarde)", durationSeconds: 15 },
  { time: "18:55", event: "AVISO fin recreo (tarde)", durationSeconds: 10 },
  { time: "19:00", event: "ENTRADA (tarde)", durationSeconds: 15 },
  { time: "19:50", event: "AVISO", durationSeconds: 10 },
  { time: "19:55", event: "ENTRADA", durationSeconds: 15 },
  { time: "20:45", event: "AVISO", durationSeconds: 10 },
  { time: "20:50", event: "ENTRADA", durationSeconds: 15 },
  { time: "21:40", event: "FIN JORNADA (tarde)", durationSeconds: 15 },
];

export const HOLIDAY_RANGES: HolidayRange[] = [
  { name: "NAVIDAD", start: "2025-12-20", end: "2026-01-07" },
  { name: "CARNAVAL", start: "2026-02-16", end: "2026-02-17" },
  { name: "SEMANA SANTA", start: "2026-03-27", end: "2026-04-06" },
];

export const SINGLE_HOLIDAYS: SingleHoliday[] = [
  { date: "2025-10-13", name: "Traslado Fiesta Nacional" },
  { date: "2025-10-31", name: "Día del Docente" },
  { date: "2025-11-01", name: "Todos los Santos" },
  { date: "2025-12-06", name: "Constitución" },
  { date: "2025-12-08", name: "Inmaculada Concepción" },
  { date: "2026-04-23", name: "Día de Castilla y León" },
  { date: "2026-04-24", name: "Puente Día de Castilla y León" },
  { date: "2026-05-01", name: "Día del Trabajo" },
];
