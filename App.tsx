
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, BellOff, Calendar, Clock, Volume2, VolumeX, ShieldCheck, AlertCircle } from 'lucide-react';
import { DAILY_SCHEDULE } from './constants';
import { isHoliday, getSecondsToday, getSecondsFromTimeStr, formatTimeLeft } from './utils';
import { ScheduleItem, SoundState } from './types';

const App: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [soundEnabled, setSoundEnabled] = useState<SoundState>(SoundState.DISABLED);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [nextEvent, setNextEvent] = useState<ScheduleItem | null>(null);
  const [secondsToNext, setSecondsToNext] = useState<number>(0);
  const [lastRungTime, setLastRungTime] = useState<string>('');
  
  const holidayName = isHoliday(currentTime);

  // Sound generator
  const ringBell = useCallback((duration: number) => {
    if (!audioCtxRef.current || soundEnabled !== SoundState.ENABLED) return;

    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // Standard bell freq A5
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + duration);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);

    if ('vibrate' in navigator) {
      navigator.vibrate([500, 200, 500, 200, 500]);
    }
  }, [soundEnabled]);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    setSoundEnabled(SoundState.ENABLED);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      const secondsToday = getSecondsToday(now);
      const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const exactSeconds = now.getSeconds();

      // Find next event
      const upcoming = DAILY_SCHEDULE.find(item => {
        const itemSecs = getSecondsFromTimeStr(item.time);
        return itemSecs > secondsToday;
      });

      if (upcoming) {
        setNextEvent(upcoming);
        setSecondsToNext(getSecondsFromTimeStr(upcoming.time) - secondsToday);
      } else {
        // After school hours
        setNextEvent(null);
        setSecondsToNext(0);
      }

      // Trigger bell logic
      if (!holidayName) {
        const activeEvent = DAILY_SCHEDULE.find(item => item.time === currentTimeStr);
        if (activeEvent && exactSeconds === 0 && lastRungTime !== currentTimeStr) {
          ringBell(activeEvent.durationSeconds);
          setLastRungTime(currentTimeStr);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [holidayName, lastRungTime, ringBell]);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-indigo-700 text-white p-6 shadow-lg rounded-b-3xl mb-6 sticky top-0 z-10">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Bell className="w-6 h-6" /> Timbre Escolar
            </h1>
            <p className="text-indigo-100 text-xs font-medium">Curso 2025–2026</p>
          </div>
          <button 
            onClick={initAudio}
            className={`p-3 rounded-full transition-all duration-300 ${
              soundEnabled === SoundState.ENABLED 
                ? 'bg-green-500 hover:bg-green-600 scale-110' 
                : 'bg-indigo-600 hover:bg-indigo-500'
            } shadow-md`}
          >
            {soundEnabled === SoundState.ENABLED ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 space-y-6">
        {/* Main Clock Card */}
        <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 text-center space-y-4">
          <div className="flex flex-col items-center">
            <span className="text-slate-400 text-sm font-semibold uppercase tracking-widest mb-1">Hora Actual</span>
            <h2 className="text-6xl font-black text-slate-800 clock-shadow">
              {currentTime.toLocaleTimeString('es-ES', { hour12: false })}
            </h2>
            <p className="text-slate-500 font-medium capitalize mt-2">
              {currentTime.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>

          {holidayName ? (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded-2xl flex items-center gap-3">
              <Calendar className="w-6 h-6 shrink-0" />
              <div className="text-left">
                <p className="font-bold">Día No Lectivo</p>
                <p className="text-sm">{holidayName}</p>
              </div>
            </div>
          ) : soundEnabled === SoundState.DISABLED ? (
            <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 p-4 rounded-2xl flex items-center gap-3">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <p className="text-sm font-medium text-left">Toca el altavoz arriba para activar las alertas sonoras.</p>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-2xl flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 shrink-0" />
              <p className="text-sm font-medium text-left">Alertas activas y listas para sonar.</p>
            </div>
          )}
        </section>

        {/* Next Event Card */}
        {!holidayName && nextEvent && (
          <section className="bg-indigo-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="relative z-10 flex justify-between items-center">
              <div>
                <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-1">Próximo Evento</p>
                <h3 className="text-2xl font-bold">{nextEvent.event}</h3>
                <div className="flex items-center gap-2 mt-2 text-indigo-100 font-medium">
                  <Clock className="w-4 h-4" />
                  <span>{nextEvent.time}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-1">Faltan</p>
                <p className="text-3xl font-black text-white">{formatTimeLeft(secondsToNext)}</p>
              </div>
            </div>
            {/* Background Decoration */}
            <div className="absolute -right-10 -bottom-10 opacity-10">
              <Bell className="w-40 h-40 rotate-12" />
            </div>
          </section>
        )}

        {/* Today's Schedule Table */}
        <section className="space-y-4">
          <h3 className="text-slate-800 font-bold px-1 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            Tabla de Toques
          </h3>
          <div className="space-y-2">
            {DAILY_SCHEDULE.map((item, idx) => {
              const itemSecs = getSecondsFromTimeStr(item.time);
              const nowSecs = getSecondsToday(currentTime);
              const isPast = itemSecs < nowSecs;
              const isNext = nextEvent?.time === item.time;

              return (
                <div 
                  key={idx} 
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                    isNext 
                      ? 'bg-white border-indigo-600 shadow-md ring-2 ring-indigo-600/10' 
                      : isPast 
                        ? 'bg-slate-100 border-slate-100 opacity-60' 
                        : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`text-lg font-black ${isNext ? 'text-indigo-600' : 'text-slate-700'}`}>
                      {item.time}
                    </span>
                    <div>
                      <p className={`font-semibold ${isNext ? 'text-slate-900' : 'text-slate-600'}`}>{item.event}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Duración: {item.durationSeconds}s</p>
                    </div>
                  </div>
                  {isNext && (
                    <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest animate-pulse">
                      Siguiente
                    </span>
                  )}
                  {isPast && (
                     <div className="w-2 h-2 rounded-full bg-slate-300" />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-4 px-6 text-center text-slate-400 text-xs">
        <p>&copy; 2025 Horario Timbre Escolar - Git Hub Upload Ready</p>
      </footer>
    </div>
  );
};

export default App;
