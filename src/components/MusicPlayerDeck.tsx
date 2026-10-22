import React, { useEffect, useRef, useState } from 'react';
import { synthEngine, TRACKS, TrackInfo } from '../audio/synthEngine';
import { YouTubeMusicPlayer } from './YouTubeMusicPlayer';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Disc3,
  Radio,
  Sliders,
  Youtube,
  CassetteTape as TapeIcon,
  Sparkles,
} from 'lucide-react';

export function MusicPlayerDeck() {
  const [activeTab, setActiveTab] = useState<'YOUTUBE' | 'CASSETTE'>('YOUTUBE');

  // Synthwave Engine State
  const [currentTrack, setCurrentTrack] = useState<TrackInfo>(synthEngine.getTrack());
  const [isPlayingSynth, setIsPlayingSynth] = useState<boolean>(synthEngine.getIsPlaying());
  const [volume, setVolume] = useState<number>(synthEngine.getVolume());
  const [isMuted, setIsMuted] = useState<boolean>(synthEngine.getIsMuted());
  const [elapsed, setElapsed] = useState<number>(0);
  const [duration, setDuration] = useState<number>(synthEngine.getTrack().durationSec);

  const visualizerCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Subscribe to synthwave engine
  useEffect(() => {
    const unsubscribe = synthEngine.subscribe(
      (newTrack) => {
        setCurrentTrack(newTrack);
        setDuration(newTrack.durationSec);
      },
      (playing) => {
        setIsPlayingSynth(playing);
      },
      (curElapsed, totalDuration) => {
        setElapsed(curElapsed);
        setDuration(totalDuration);
      }
    );
    return () => unsubscribe();
  }, []);

  // Real-time Audio Spectrum Visualizer for Synthwave
  useEffect(() => {
    const canvas = visualizerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const dataArray = new Uint8Array(64);

    const draw = () => {
      if (synthEngine.analyser && isPlayingSynth) {
        synthEngine.analyser.getByteFrequencyData(dataArray);
      } else {
        for (let i = 0; i < dataArray.length; i++) {
          dataArray[i] = Math.max(0, dataArray[i] * 0.9);
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / 32) - 2;
      let x = 0;

      for (let i = 0; i < 32; i++) {
        const val = dataArray[i * 2] || 0;
        const barHeight = Math.max(3, (val / 255) * canvas.height * 0.9);

        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#ec4899');
        gradient.addColorStop(0.5, '#a855f7');
        gradient.addColorStop(1, '#06b6d4');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        ctx.fillStyle = '#67e8f9';
        ctx.fillRect(x, canvas.height - barHeight - 2, barWidth, 1.5);

        x += barWidth + 2;
      }

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, [isPlayingSynth]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setElapsed(val);
    synthEngine.seek(val);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    synthEngine.setVolume(val);
  };

  const handleToggleMute = () => {
    const muted = synthEngine.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Soundtrack Mode Selector Tabs */}
      <div className="flex items-center justify-center">
        <div className="p-1 bg-slate-950/90 border border-purple-500/40 rounded-xl flex items-center gap-1.5 shadow-lg shadow-purple-950/40">
          <button
            onClick={() => setActiveTab('YOUTUBE')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-retro font-bold transition-all ${
              activeTab === 'YOUTUBE'
                ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md shadow-rose-900/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Youtube className="w-4 h-4 text-white" />
            <span>YouTube Desi Audio (Pak &amp; Ind) · Max FPS</span>
          </button>

          <button
            onClick={() => setActiveTab('CASSETTE')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-retro font-bold transition-all ${
              activeTab === 'CASSETTE'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-4 h-4 text-purple-300" />
            <span>80s Synthwave Cassettes (MK-84)</span>
          </button>
        </div>
      </div>

      {/* Mode 1: YouTube Search & Desi Music Player */}
      {activeTab === 'YOUTUBE' && <YouTubeMusicPlayer />}

      {/* Mode 2: 80s Procedural Synthwave Cassette Deck */}
      {activeTab === 'CASSETTE' && (
        <div className="w-full bg-slate-950/80 border border-purple-500/30 rounded-2xl p-5 shadow-2xl shadow-purple-950/50 backdrop-blur-md">
          {/* Player Header */}
          <div className="flex items-center justify-between pb-4 border-b border-purple-900/40">
            <div className="flex items-center gap-2.5">
              <Radio className="w-5 h-5 text-pink-400" />
              <h2 className="text-sm font-retro font-bold uppercase tracking-wider text-white">
                SYNTHWAVE TAPE DECK <span className="text-pink-400 text-xs font-normal">MK-84</span>
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-purple-300 font-mono">
              <span className={`w-2 h-2 rounded-full ${isPlayingSynth ? 'bg-pink-500 animate-pulse' : 'bg-slate-600'}`} />
              <span>{isPlayingSynth ? 'TAPE RUNNING' : 'STANDBY'}</span>
            </div>
          </div>

          {/* Cassette Graphic & Spectrum Visualizer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 my-4 items-center">
            {/* Cassette Visualizer Window */}
            <div className="md:col-span-5 relative bg-gradient-to-b from-slate-900 to-black border-2 border-purple-900/60 rounded-xl p-3 shadow-inner">
              <div className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 px-3 py-1 rounded text-center text-[10px] font-retro text-white tracking-widest shadow-sm">
                TYPE II · HIGH BIAS · CHROME
              </div>

              {/* Tape window with spools */}
              <div className="my-2.5 h-16 bg-slate-950/90 border border-purple-500/30 rounded-lg flex items-center justify-around px-4 relative overflow-hidden">
                <div className={`w-10 h-10 rounded-full border-2 border-slate-700 bg-slate-900 flex items-center justify-center relative shadow-sm ${isPlayingSynth ? 'animate-spin-slow' : ''}`}>
                  <div className="w-6 h-6 rounded-full border border-pink-500/50 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-pink-400" />
                  </div>
                  <div className="absolute w-full h-0.5 bg-purple-500/40" />
                  <div className="absolute h-full w-0.5 bg-purple-500/40" />
                </div>

                <div className="flex-1 mx-3 h-2 bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 rounded border border-amber-800/40" />

                <div className={`w-10 h-10 rounded-full border-2 border-slate-700 bg-slate-900 flex items-center justify-center relative shadow-sm ${isPlayingSynth ? 'animate-spin-slow' : ''}`}>
                  <div className="w-6 h-6 rounded-full border border-cyan-500/50 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-cyan-400" />
                  </div>
                  <div className="absolute w-full h-0.5 bg-cyan-500/40" />
                  <div className="absolute h-full w-0.5 bg-cyan-500/40" />
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-purple-300/80 px-1">
                <span>STEREO DOLBY B</span>
                <span>SIDE A · 45 MIN</span>
              </div>
            </div>

            {/* Real-time Audio Spectrum Visualizer */}
            <div className="md:col-span-7 bg-black/70 border border-purple-900/50 rounded-xl p-3 flex flex-col justify-between h-full min-h-[120px]">
              <div className="flex items-center justify-between text-[11px] font-retro text-purple-300 pb-1">
                <span className="flex items-center gap-1.5">
                  <Disc3 className="w-3.5 h-3.5 text-cyan-400" />
                  AUDIO SPECTRUM ANALYZER
                </span>
                <span className="font-mono text-[10px] text-pink-400">64-BAND FFT</span>
              </div>

              <canvas
                ref={visualizerCanvasRef}
                width={320}
                height={68}
                className="w-full h-16 block rounded"
              />

              <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 pt-1">
                <span>60Hz</span>
                <span>250Hz</span>
                <span>1kHz</span>
                <span>4kHz</span>
                <span>16kHz</span>
              </div>
            </div>
          </div>

          {/* Current Track Display */}
          <div className="bg-slate-900/60 border border-purple-800/30 rounded-xl p-3.5 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-mono bg-pink-500/20 text-pink-300 border border-pink-500/30 rounded">
                    TRACK 0{currentTrack.id}
                  </span>
                  <span className="text-xs text-purple-300 font-retro">{currentTrack.subgenre}</span>
                </div>
                <h3 className="text-base font-retro font-bold text-white tracking-wide mt-1 neon-text-pink">
                  {currentTrack.title}
                </h3>
                <p className="text-xs text-slate-400 font-sans-outfit mt-0.5">
                  Artist: <span className="text-pink-300 font-medium">{currentTrack.artist}</span> · Key: {currentTrack.key} · Tempo: {currentTrack.bpm} BPM
                </p>
              </div>

              <div className="text-right">
                <div className="font-mono text-lg font-bold text-cyan-300 tabular-nums neon-text-cyan">
                  {formatTime(elapsed)}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  TOTAL: {formatTime(duration)}
                </div>
              </div>
            </div>

            <div className="mt-3">
              <input
                type="range"
                min={0}
                max={duration || 180}
                value={elapsed}
                onChange={handleSeek}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => synthEngine.prevTrack()}
                className="w-10 h-10 rounded-lg bg-slate-900 hover:bg-slate-800 border border-purple-500/30 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                title="Previous Track"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={() => synthEngine.togglePlayPause()}
                className="px-6 h-11 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-retro font-bold text-xs tracking-wider flex items-center gap-2 shadow-lg shadow-pink-600/30 transition-transform active:scale-95"
              >
                {isPlayingSynth ? (
                  <>
                    <Pause className="w-4 h-4 fill-white" />
                    PAUSE
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    PLAY
                  </>
                )}
              </button>

              <button
                onClick={() => synthEngine.nextTrack()}
                className="w-10 h-10 rounded-lg bg-slate-900 hover:bg-slate-800 border border-purple-500/30 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                title="Next Track"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                onClick={handleToggleMute}
                className="text-slate-400 hover:text-pink-400 transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-28 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <span className="font-mono text-xs text-cyan-300 tabular-nums w-8">
                {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
              </span>
            </div>
          </div>

          {/* 3 Dummy Tracks Selector */}
          <div className="mt-5 pt-4 border-t border-purple-900/40">
            <div className="text-[11px] font-retro uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-pink-400" />
              CASSETTE PLAYLIST (SELECT TRACK)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {TRACKS.map((track, idx) => {
                const isSelected = track.id === currentTrack.id;
                return (
                  <button
                    key={track.id}
                    onClick={() => synthEngine.selectTrack(idx)}
                    className={`text-left p-2.5 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-purple-900/40 border-pink-500 shadow-md shadow-pink-950/40'
                        : 'bg-slate-900/40 border-slate-800 hover:border-purple-600/50 hover:bg-slate-900/80 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className={isSelected ? 'text-pink-300 font-bold' : 'text-slate-400'}>
                        0{track.id}.
                      </span>
                      <span className="text-cyan-400 font-mono">{track.bpm} BPM</span>
                    </div>
                    <div className={`text-xs font-retro font-medium truncate mt-0.5 ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                      {track.title}
                    </div>
                    <div className="text-[11px] text-slate-400 font-sans-outfit truncate">
                      {track.artist}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
