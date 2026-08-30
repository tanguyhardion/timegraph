'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Volume2, VolumeX, Sparkles, Activity } from 'lucide-react';
import { horologyAudio } from '@/lib/utils';

export function HeaderClock() {
  const [time, setTime] = useState<{ hours: number; minutes: number; seconds: number; date: number; ms: number }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    date: 1,
    ms: 0,
  });
  const [audioEnabled, setAudioEnabled] = useState(false);
  const lastSecondRef = useRef<number>(-1);

  useEffect(() => {
    let animFrameId: number;

    const updateClock = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();
      const ms = now.getMilliseconds();
      const date = now.getDate();

      setTime({ hours, minutes, seconds, date, ms });

      // Mechanical 8-beat tick trigger
      const currentTickStep = Math.floor(ms / 125);
      if (currentTickStep !== lastSecondRef.current) {
        lastSecondRef.current = currentTickStep;
        if (horologyAudio.enabled) {
          horologyAudio.playTick(currentTickStep % 2 === 0 ? 'tic' : 'tac');
        }
      }

      animFrameId = requestAnimationFrame(updateClock);
    };

    animFrameId = requestAnimationFrame(updateClock);
    return () => cancelAnimationFrame(animFrameId);
  }, []);

  const toggleAudio = () => {
    const next = !audioEnabled;
    setAudioEnabled(next);
    horologyAudio.enabled = next;
    if (next) {
      horologyAudio.playCrownWinding();
    }
  };

  // Mechanical smooth second hand calculation (continuous sweeping with subtle 8Hz mechanical pulse)
  const totalSeconds = time.seconds + time.ms / 1000;
  const secondAngle = totalSeconds * 6; // 360 / 60
  const minuteAngle = (time.minutes + totalSeconds / 60) * 6;
  const hourAngle = ((time.hours % 12) + time.minutes / 60) * 30;

  return (
    <div className="flex items-center gap-4 bg-dial-900/90 border border-gold-hairline rounded-full px-4 py-1.5 shadow-dial backdrop-blur-md">
      {/* Live Analog Dial */}
      <div className="relative w-11 h-11 rounded-full fluted-bezel p-[2px] shadow-[0_0_15px_rgba(0,0,0,0.8)]">
        <div className="relative w-full h-full rounded-full bg-dial-950 flex items-center justify-center overflow-hidden border border-white/10">
          {/* Subtle Radial Sunburst */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(207,159,45,0.18)_0%,transparent_70%)]" />

          {/* Dial Markers */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <div
              key={deg}
              className={`absolute top-0.5 bottom-0.5 left-1/2 -translate-x-1/2 flex flex-col justify-between pointer-events-none ${
                deg % 90 === 0 ? 'w-[1.5px]' : 'w-[0.75px]'
              }`}
              style={{ transform: `rotate(${deg}deg)` }}
            >
              <div
                className={`w-full ${
                  deg % 90 === 0 ? 'h-1.5 bg-gold-400' : 'h-1 bg-white/40'
                }`}
              />
              <div
                className={`w-full ${
                  deg % 90 === 0 ? 'h-1.5 bg-gold-400' : 'h-1 bg-white/40'
                }`}
              />
            </div>
          ))}

          {/* Hour Hand */}
          <div
            className="absolute top-1/2 left-1/2 w-0.5 h-3 bg-gradient-to-t from-gold-500 to-gold-200 rounded-full origin-bottom pointer-events-none shadow-[0_0_3px_rgba(0,0,0,0.9)]"
            style={{
              transform: `translate(-50%, -100%) rotate(${hourAngle}deg)`,
              transition: 'transform 0.05s linear',
            }}
          />

          {/* Minute Hand */}
          <div
            className="absolute top-1/2 left-1/2 w-[1.5px] h-4 bg-gradient-to-t from-steel-200 to-white rounded-full origin-bottom pointer-events-none shadow-[0_0_3px_rgba(0,0,0,0.9)]"
            style={{
              transform: `translate(-50%, -100%) rotate(${minuteAngle}deg)`,
              transition: 'transform 0.05s linear',
            }}
          />

          {/* Second Hand (Blued Steel / Gold with Counterbalance) */}
          <div
            className="absolute top-1/2 left-1/2 w-[0.8px] h-5 bg-rose-400 origin-bottom pointer-events-none shadow-[0_0_4px_rgba(244,63,94,0.7)]"
            style={{
              transform: `translate(-50%, -100%) rotate(${secondAngle}deg)`,
            }}
          >
            <div className="absolute -top-0.5 -left-[1.5px] w-1 h-1 rounded-full bg-rose-300" />
          </div>

          {/* Center Jewel Pin */}
          <div className="relative z-10 w-1.5 h-1.5 rounded-full bg-ruby-accent ring-1 ring-gold-400 shadow-sm" />
        </div>
      </div>

      {/* Timegrapher Readout */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold tracking-wider text-white">
            {String(time.hours).padStart(2, '0')}:{String(time.minutes).padStart(2, '0')}:
            <span className="text-gold-400">{String(time.seconds).padStart(2, '0')}</span>
          </span>
          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-dial-800 text-gold-300 border border-gold-500/20">
            DAY {time.date}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-steel-400 font-mono">
          <span className="flex items-center gap-1">
            <Activity className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
            28,800 vph
          </span>
          <span>·</span>
          <span className="text-emerald-400/90">+1.2 s/d</span>
        </div>
      </div>

      {/* Audio Tick Toggle */}
      <button
        onClick={toggleAudio}
        title={audioEnabled ? 'Mute mechanical escapement tick' : 'Enable mechanical ticking audio'}
        className={`p-1.5 rounded-full transition-all duration-200 border ${
          audioEnabled
            ? 'bg-gold-500/20 border-gold-500/50 text-gold-300 shadow-gold'
            : 'bg-dial-800 border-white/10 text-steel-400 hover:text-white'
        }`}
      >
        {audioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}
