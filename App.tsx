
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Bell, 
  BellRing, 
  Clock, 
  Calendar, 
  Volume2, 
  VolumeX, 
  ChevronRight,
  Info,
  History
} from 'lucide-react';
import { DAILY_SCHEDULE } from './constants';
import { isHoliday, getSecondsToday, getSecondsFromTimeStr, formatTimeLeft } from './utils';
import { ScheduleItem, SoundState } from './types';

const App: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [lastRungTime, setLastRungTime] = useState<string | null>(null);

  const holiday = useMemo(() => isHoliday(currentTime), [currentTime.toDateString()]);

  const { nextEvent, secondsToNext } = useMemo(() => {
    const secs = getSecondsToday(currentTime);
    const next = DAILY_SCHEDULE.find(item => getSecondsFromTimeStr(item.time) > secs);
    return {
      nextEvent: next || null,
      secondsToNext: next ? getSecondsFromTimeStr(next.time) - secs : 0
    };
  }, [currentTime]);

  const playSound = useCallback((duration: number) => {
    if (!audioCtxRef.current || !soundEnabled) return;
    
    setIsRinging(true);
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + duration);
    
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);

    if (navigator.vibrate) navigator.vibrate([500, 200, 500]);
    setTimeout(() => setIsRinging(false), duration * 1000);
  }, [soundEnabled]);

  const initSound = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
    setSoundEnabled(true);
    // Test sound
    playSound(0.2);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
      if (now.getSeconds() === 0 && !holiday) {
        const event = DAILY_SCHEDULE.find(s => s.time === timeStr);
        if (event && lastRungTime !== timeStr) {
          playSound(event.durationSeconds);
          setLastRungTime(timeStr);
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [holiday, lastRungTime, playSound]);

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <header className="bg-indigo-600 text-white p-6 shadow-xl flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <span className={isRinging ? 'bell-active' : ''}>
              <Bell className="w-8 h-8" />
            </span>
            TIMBRE
          </h1>
          <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest">Sincronizado Oficial</p>
        </div>
        <button 
          onClick={initSound}
          className={`p-4 rounded-2xl transition-all shadow-lg ${soundEnabled ? 'bg-emerald-500 scale-105' : 'bg-white/20 hover:bg-white/30'}`}
        >
          {soundEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
        </button>
      </header>

      <main className="max-w-xl mx-auto p-4 space-y-6 -mt-4">
        {/* Reloj Principal */}
        <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl text-center border-4 border-white">
          <p className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-2">Hora del Sistema</p>
          <h2 className="text-7xl font-black text-slate-800 tabular-nums">
            {currentTime.toLocaleTimeString('es-ES', { hour12: false })}
          </h2>
          <p className="text-indigo-500 font-semibold mt-2 capitalize">
            {currentTime.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        {/* Estado y Próximo Evento */}
        {holiday ? (
          <div className="bg-amber-500 text-white p-6 rounded-3xl shadow-lg flex items-center gap-4">
            <Calendar className="w-10 h-10" />
            <div>
              <p className="font-black text-xl">DÍA FESTIVO</p>
              <p className="opacity-90">{holiday}</p>
            </div>
          </div>
        ) : (
          nextEvent && (
            <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-indigo-400 font-black text-xs uppercase tracking-[0.2em] mb-4">Siguiente Señal</p>
                <div className="flex justify-between items-end">
                  <div>
                    <h3 className="text-3xl font-black mb-1">{nextEvent.event}</h3>
                    <p className="text-indigo-300 font-bold flex items-center gap-2">
                      <Clock className="w-4 h-4" /> A las {nextEvent.time}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-5xl font-black tabular-nums">{formatTimeLeft(secondsToNext)}</p>
                    <p className="text-indigo-400 text-[10px] font-bold uppercase">Restante</p>
                  </div>
                </div>
              </div>
              <div className="absolute -right-6 -bottom-6 opacity-10">
                <BellRing className="w-32 h-32" />
              </div>
            </div>
          )
        )}

        {/* Lista de Horarios */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-2">
            <h4 className="font-black text-slate-800 flex items-center gap-2">
              <History className="w-5 h-5" /> Cronograma de Hoy
            </h4>
            {!soundEnabled && (
              <span className="text-rose-500 text-[10px] font-black animate-pulse">SONIDO DESACTIVADO</span>
            )}
          </div>
          
          <div className="grid gap-2">
            {DAILY_SCHEDULE.map((item, i) => {
              const itemSecs = getSecondsFromTimeStr(item.time);
              const nowSecs = getSecondsToday(currentTime);
              const isPast = itemSecs < nowSecs;
              const isNow = nextEvent?.time === item.time;

              return (
                <div key={i} className={`flex items-center p-4 rounded-2xl border-2 transition-all ${
                  isNow ? 'bg-white border-indigo-600 shadow-xl scale-[1.02]' : isPast ? 'bg-slate-50 border-slate-100 opacity-40' : 'bg-white border-transparent'
                }`}>
                  <span className={`text-xl font-black w-16 tabular-nums ${isNow ? 'text-indigo-600' : 'text-slate-400'}`}>
                    {item.time}
                  </span>
                  <div className="flex-1 ml-4">
                    <p className={`font-bold ${isNow ? 'text-slate-900' : 'text-slate-600'}`}>{item.event}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Señal: {item.durationSeconds}s</p>
                  </div>
                  {isNow && <ChevronRight className="text-indigo-600" />}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <footer className="p-8 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
        Sistema Timbre V3.0 • Sincronización UTC/Local Activa
      </footer>
    </div>
  );
};

export default App;
