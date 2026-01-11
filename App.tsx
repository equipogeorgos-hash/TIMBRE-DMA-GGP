
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Bell, 
  BellRing, 
  Clock, 
  Calendar, 
  Volume2, 
  VolumeX, 
  ChevronRight, 
  ShieldCheck, 
  AlertTriangle,
  Info,
  History
} from 'lucide-react';
import { DAILY_SCHEDULE } from './constants';
import { isHoliday, getSecondsToday, getSecondsFromTimeStr, formatTimeLeft } from './utils';
import { ScheduleItem, SoundState } from './types';

const App: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [soundState, setSoundState] = useState<SoundState>(SoundState.DISABLED);
  const [isRinging, setIsRinging] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [lastRung, setLastRung] = useState<string | null>(null);

  // Memoized Holiday check
  const holidayName = useMemo(() => isHoliday(currentTime), [currentTime.toDateString()]);

  // Derived state for next event
  const { nextEvent, secondsToNext, currentProgress } = useMemo(() => {
    const secondsToday = getSecondsToday(currentTime);
    const upcoming = DAILY_SCHEDULE.find(item => getSecondsFromTimeStr(item.time) > secondsToday);
    
    // Find previous event to calculate progress
    const pastEvents = [...DAILY_SCHEDULE].reverse().filter(item => getSecondsFromTimeStr(item.time) <= secondsToday);
    const prevEvent = pastEvents[0];

    let progress = 0;
    if (upcoming && prevEvent) {
      const start = getSecondsFromTimeStr(prevEvent.time);
      const end = getSecondsFromTimeStr(upcoming.time);
      const total = end - start;
      const elapsed = secondsToday - start;
      progress = Math.min(100, Math.max(0, (elapsed / total) * 100));
    }

    return {
      nextEvent: upcoming || null,
      secondsToNext: upcoming ? getSecondsFromTimeStr(upcoming.time) - secondsToday : 0,
      currentProgress: progress
    };
  }, [currentTime]);

  const triggerBell = useCallback((duration: number) => {
    if (!audioCtxRef.current || soundState !== SoundState.ENABLED) return;

    setIsRinging(true);
    const ctx = audioCtxRef.current;
    
    // Simple synth bell
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + duration);
    
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);

    // Vibration API
    if ('vibrate' in navigator) {
      navigator.vibrate([400, 200, 400]);
    }

    setTimeout(() => setIsRinging(false), duration * 1000);
  }, [soundState]);

  const enableAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    setSoundState(SoundState.ENABLED);
    // Play a tiny silent puff to "unlock" audio in some browsers
    triggerBell(0.1);
  };

  useEffect(() => {
    const ticker = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      // Bell Check (Exact Second 0)
      const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
      if (now.getSeconds() === 0 && !holidayName) {
        const scheduled = DAILY_SCHEDULE.find(s => s.time === timeStr);
        if (scheduled && lastRung !== timeStr) {
          triggerBell(scheduled.durationSeconds);
          setLastRung(timeStr);
        }
      }
    }, 1000);

    return () => clearInterval(ticker);
  }, [holidayName, lastRung, triggerBell]);

  return (
    <div className="max-w-xl mx-auto min-h-screen flex flex-col p-4 md:p-6 pb-24">
      {/* Top Navigation / Status */}
      <header className="flex justify-between items-center mb-8 px-2">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <span className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
              {isRinging ? <BellRing className="w-6 h-6 bell-shake" /> : <Bell className="w-6 h-6" />}
            </span>
            IES Horario
          </h1>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mt-1">Sincronizado • 2025/26</p>
        </div>
        <button 
          onClick={enableAudio}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-bold transition-all ${
            soundState === SoundState.ENABLED 
            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
            : 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:scale-105 active:scale-95'
          }`}
        >
          {soundState === SoundState.ENABLED ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          <span className="hidden sm:inline">{soundState === SoundState.ENABLED ? 'Activo' : 'Activar Sonido'}</span>
        </button>
      </header>

      {/* Main Clock Dashboard */}
      <main className="space-y-6">
        <div className="glass-card rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 text-center relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-center items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-400 text-sm font-bold tracking-widest uppercase">Hora Oficial</span>
            </div>
            <h2 className="text-7xl font-extrabold text-slate-900 tracking-tighter tabular-nums mb-2">
              {currentTime.toLocaleTimeString('es-ES', { hour12: false })}
            </h2>
            <p className="text-slate-500 font-semibold capitalize text-lg">
              {currentTime.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          
          {/* Subtle background ring */}
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-8 border-indigo-50 rounded-full ${isRinging ? 'clock-pulse' : ''}`} />
        </div>

        {/* Dynamic Status Banner */}
        {holidayName ? (
          <div className="bg-amber-500 text-white rounded-3xl p-6 flex items-center gap-4 shadow-lg shadow-amber-200">
            <div className="p-3 bg-white/20 rounded-2xl">
              <Calendar className="w-8 h-8" />
            </div>
            <div>
              <p className="font-bold text-lg uppercase tracking-tight">Día No Lectivo</p>
              <p className="opacity-90 font-medium">{holidayName}</p>
            </div>
          </div>
        ) : nextEvent && (
          <div className="bg-indigo-900 text-white rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-indigo-300 text-xs font-black uppercase tracking-widest mb-1">Próximo Cambio</p>
                  <h3 className="text-3xl font-extrabold tracking-tight">{nextEvent.event}</h3>
                </div>
                <div className="bg-white/10 px-4 py-2 rounded-2xl backdrop-blur-md">
                  <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest text-center">A las</p>
                  <p className="text-xl font-black">{nextEvent.time}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <p className="text-4xl font-black tabular-nums">{formatTimeLeft(secondsToNext)}</p>
                  <p className="text-indigo-300 text-sm font-bold">restantes</p>
                </div>
                
                {/* Progress Bar */}
                <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-400 transition-all duration-1000 ease-linear shadow-[0_0_15px_rgba(129,140,248,0.5)]"
                    style={{ width: `${currentProgress}%` }}
                  />
                </div>
              </div>
            </div>
            
            {/* Background Decoration */}
            <Bell className="absolute -right-8 -bottom-8 w-48 h-48 text-white/5 rotate-12 group-hover:rotate-0 transition-transform duration-700" />
          </div>
        )}

        {/* Schedule Grid */}
        <section className="mt-8 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" />
              Secuencia de Hoy
            </h3>
            <span className="text-slate-400 text-xs font-bold">{DAILY_SCHEDULE.length} eventos</span>
          </div>
          
          <div className="grid gap-3">
            {DAILY_SCHEDULE.map((item, idx) => {
              const itemSecs = getSecondsFromTimeStr(item.time);
              const nowSecs = getSecondsToday(currentTime);
              const isPast = itemSecs < nowSecs;
              const isCurrent = nextEvent?.time === item.time;

              return (
                <div 
                  key={idx}
                  className={`group flex items-center p-4 rounded-3xl transition-all duration-300 border ${
                    isCurrent 
                      ? 'bg-white border-indigo-600 shadow-xl shadow-indigo-100 scale-[1.02] z-10' 
                      : isPast 
                        ? 'bg-slate-50 border-slate-100 opacity-50' 
                        : 'bg-white border-transparent hover:border-slate-200 shadow-sm'
                  }`}
                >
                  <div className={`w-14 text-lg font-black tracking-tighter tabular-nums ${isCurrent ? 'text-indigo-600' : 'text-slate-400'}`}>
                    {item.time}
                  </div>
                  <div className="flex-1 px-4">
                    <p className={`font-bold ${isCurrent ? 'text-slate-900 text-lg' : 'text-slate-600'}`}>
                      {item.event}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`h-1.5 w-1.5 rounded-full ${isPast ? 'bg-slate-300' : 'bg-indigo-400'}`} />
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        Señal de {item.durationSeconds}s
                      </p>
                    </div>
                  </div>
                  {isCurrent && (
                    <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-200">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Safety Info Box */}
      <footer className="mt-12 mb-8 bg-slate-200/50 p-6 rounded-[2rem] border border-slate-200">
        <div className="flex gap-4">
          <div className="p-2 bg-slate-300 rounded-xl shrink-0">
            <Info className="w-5 h-5 text-slate-600" />
          </div>
          <div className="text-sm text-slate-600">
            <p className="font-bold mb-1">Información de Sistema</p>
            <p className="leading-relaxed opacity-80">
              Esta aplicación utiliza la hora del sistema de su dispositivo (sincronizada vía Internet). Para alertas precisas, mantenga la pantalla activa y el volumen activado.
            </p>
          </div>
        </div>
      </footer>
      
      {/* Fixed bottom helper for PWA style */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm glass-card px-6 py-3 rounded-2xl shadow-2xl flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-slate-200">
        <span>v2.1.0 Build Stable</span>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          Online & Ready
        </div>
      </div>
    </div>
  );
};

export default App;
