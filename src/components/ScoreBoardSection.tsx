import React, { useState, useEffect } from 'react';
import { Trophy, Shield, Zap, Sparkles, Award } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  initials: string;
  score: number;
  wave: number;
  date: string;
}

export function ScoreBoardSection() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(() => {
    const saved = localStorage.getItem('vapor_invaders_leaderboard');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return [
      { rank: 1, initials: 'VPR', score: 12450, wave: 9, date: '1984.07.12' },
      { rank: 2, initials: 'NEO', score: 9800, wave: 7, date: '1984.08.23' },
      { rank: 3, initials: 'SYN', score: 7650, wave: 6, date: '1984.09.04' },
      { rank: 4, initials: 'OUT', score: 5400, wave: 4, date: '1984.10.19' },
      { rank: 5, initials: 'RUN', score: 4200, wave: 3, date: '1984.11.02' },
    ];
  });

  return (
    <div id="high-scores" className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
      {/* Hall of Fame Arcade Leaderboard */}
      <div className="bg-slate-950/80 border border-purple-500/30 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between pb-4 border-b border-purple-900/40">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <h2 className="text-sm font-retro font-bold uppercase tracking-wider text-white">
              ARCADE HALL OF FAME
            </h2>
          </div>
          <span className="text-[11px] font-mono text-purple-300">TOP SCORES</span>
        </div>

        <div className="mt-4 divide-y divide-purple-950/60">
          {entries.map((entry) => (
            <div
              key={entry.rank}
              className="py-3 flex items-center justify-between text-xs font-mono transition-colors hover:bg-purple-950/20 px-2 rounded-lg"
            >
              <div className="flex items-center gap-4">
                <span
                  className={`w-6 text-center font-arcade text-[10px] ${
                    entry.rank === 1
                      ? 'text-yellow-400 font-bold'
                      : entry.rank === 2
                      ? 'text-slate-300'
                      : entry.rank === 3
                      ? 'text-amber-600'
                      : 'text-slate-500'
                  }`}
                >
                  #{entry.rank}
                </span>
                <span className="font-arcade text-xs text-pink-300 tracking-wider">
                  {entry.initials}
                </span>
                <span className="text-[11px] text-slate-500 hidden sm:inline">
                  Wave {entry.wave}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <span className="font-arcade text-xs text-yellow-300 tabular-nums">
                  {entry.score.toLocaleString()} PTS
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invader Target Roster & Combat Intel */}
      <div id="how-to-play" className="bg-slate-950/80 border border-purple-500/30 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between pb-4 border-b border-purple-900/40">
          <div className="flex items-center gap-2.5">
            <Zap className="w-5 h-5 text-pink-400" />
            <h2 className="text-sm font-retro font-bold uppercase tracking-wider text-white">
              INVADER ROSTER &amp; INTEL
            </h2>
          </div>
          <span className="text-[11px] font-mono text-pink-400">POINT VALUES</span>
        </div>

        <div className="mt-4 space-y-3.5 text-xs">
          <div className="flex items-center justify-between p-2.5 bg-slate-900/50 rounded-lg border border-purple-900/30">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-yellow-400 shadow-sm shadow-yellow-400/50" />
              <div>
                <div className="font-retro font-bold text-yellow-300">Mystery Command Saucer (UFO)</div>
                <div className="text-[11px] text-slate-400">Cruises along the upper atmosphere intermittently</div>
              </div>
            </div>
            <span className="font-arcade text-[10px] text-yellow-400">50 - 300 PTS</span>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-slate-900/50 rounded-lg border border-purple-900/30">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-pink-500 shadow-sm shadow-pink-500/50" />
              <div>
                <div className="font-retro font-bold text-pink-300">Squid Vanguard</div>
                <div className="text-[11px] text-slate-400">Top row infiltrator, agile small profile</div>
              </div>
            </div>
            <span className="font-arcade text-[10px] text-pink-400">30 PTS</span>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-slate-900/50 rounded-lg border border-purple-900/30">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-fuchsia-500 shadow-sm shadow-fuchsia-500/50" />
              <div>
                <div className="font-retro font-bold text-fuchsia-300">Crab Raider</div>
                <div className="text-[11px] text-slate-400">Middle ranks combatant, drops rapid plasma bombs</div>
              </div>
            </div>
            <span className="font-arcade text-[10px] text-fuchsia-400">20 PTS</span>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-slate-900/50 rounded-lg border border-purple-900/30">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
              <div>
                <div className="font-retro font-bold text-cyan-300">Octopus Heavy Troop</div>
                <div className="text-[11px] text-slate-400">Frontline defensive wave, wide target footprint</div>
              </div>
            </div>
            <span className="font-arcade text-[10px] text-cyan-300">10 PTS</span>
          </div>
        </div>
      </div>
    </div>
  );
}
