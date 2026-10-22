import React, { useState, useEffect, useRef } from 'react';
import { DESI_TRACKS } from '../data/desimusic';
import { DesiTrack } from '../types/music';
import { synthEngine } from '../audio/synthEngine';
import {
  Search,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Youtube,
  Music,
  ExternalLink,
  PlusCircle,
  Radio,
  Sliders,
  Sparkles,
} from 'lucide-react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YouTubeMusicPlayerProps {
  onPlayingChange?: (isPlaying: boolean) => void;
}

export function YouTubeMusicPlayer({ onPlayingChange }: YouTubeMusicPlayerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'Pakistani' | 'Indian'>('ALL');
  const [selectedGenre, setSelectedGenre] = useState<string>('ALL');
  const [customInput, setCustomInput] = useState('');
  const [customTracks, setCustomTracks] = useState<DesiTrack[]>([]);

  // Current track
  const [currentTrack, setCurrentTrack] = useState<DesiTrack>(DESI_TRACKS[0]); // Pasoori default
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // YouTube Player instance
  const ytPlayerRef = useRef<any>(null);

  // All available tracks including user-added custom tracks
  const allTracks = [...customTracks, ...DESI_TRACKS];

  // Helper to extract YouTube video ID from URL or bare ID
  const extractYouTubeId = (input: string): string | null => {
    const trimmed = input.trim();
    if (!trimmed) return null;

    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return trimmed;
    }

    const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : null;
  };

  // Load YouTube IFrame API script for lightweight background audio playback
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      if (window.YT && window.YT.Player && !ytPlayerRef.current) {
        ytPlayerRef.current = new window.YT.Player('yt-audio-host', {
          height: '1',
          width: '1',
          videoId: currentTrack.id,
          playerVars: {
            autoplay: 0,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            iv_load_policy: 3,
            playsinline: 1,
            fs: 0,
          },
          events: {
            onStateChange: (event: any) => {
              // 1 = PLAYING, 2 = PAUSED, 0 = ENDED
              if (event.data === 1) {
                setIsPlaying(true);
                onPlayingChange?.(true);
                // Pause procedural synthwave so tracks don't clash, keeping game SFX intact
                synthEngine.pause();
              } else if (event.data === 2) {
                setIsPlaying(false);
                onPlayingChange?.(false);
              } else if (event.data === 0) {
                handleNextTrack();
              }
            },
          },
        });
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }
  }, []);

  // Filtered tracks list
  const filteredTracks = allTracks.filter((track) => {
    const matchesFilter =
      selectedFilter === 'ALL' || track.origin === selectedFilter;
    const matchesGenre =
      selectedGenre === 'ALL' || track.genre === selectedGenre;

    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      track.title.toLowerCase().includes(q) ||
      track.artist.toLowerCase().includes(q) ||
      track.origin.toLowerCase().includes(q) ||
      track.genre.toLowerCase().includes(q) ||
      track.description.toLowerCase().includes(q);

    return matchesFilter && matchesGenre && matchesQuery;
  });

  const selectAndPlayTrack = (track: DesiTrack) => {
    setCurrentTrack(track);
    synthEngine.pause();

    if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
      ytPlayerRef.current.loadVideoById(track.id);
      setIsPlaying(true);
      onPlayingChange?.(true);
    } else {
      setIsPlaying(true);
      onPlayingChange?.(true);
    }
  };

  const handleTogglePlayPause = () => {
    if (!ytPlayerRef.current) return;

    if (isPlaying) {
      if (typeof ytPlayerRef.current.pauseVideo === 'function') {
        ytPlayerRef.current.pauseVideo();
      }
      setIsPlaying(false);
      onPlayingChange?.(false);
    } else {
      synthEngine.pause();
      if (typeof ytPlayerRef.current.playVideo === 'function') {
        ytPlayerRef.current.playVideo();
      }
      setIsPlaying(true);
      onPlayingChange?.(true);
    }
  };

  const handleNextTrack = () => {
    const currentIndex = allTracks.findIndex((t) => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % allTracks.length;
    selectAndPlayTrack(allTracks[nextIndex]);
  };

  const handlePrevTrack = () => {
    const currentIndex = allTracks.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + allTracks.length) % allTracks.length;
    selectAndPlayTrack(allTracks[prevIndex]);
  };

  const handleToggleMute = () => {
    if (!ytPlayerRef.current) return;
    if (isMuted) {
      if (typeof ytPlayerRef.current.unMute === 'function') {
        ytPlayerRef.current.unMute();
      }
      setIsMuted(false);
    } else {
      if (typeof ytPlayerRef.current.mute === 'function') {
        ytPlayerRef.current.mute();
      }
      setIsMuted(true);
    }
  };

  const handleAddCustomSong = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;

    const ytId = extractYouTubeId(customInput);
    if (!ytId) {
      window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(customInput)}`, '_blank');
      return;
    }

    const newTrack: DesiTrack = {
      id: ytId,
      title: customInput.length > 25 ? customInput.substring(0, 25) + '...' : `YouTube Track (${ytId})`,
      artist: 'Custom Request',
      origin: 'Pakistani',
      genre: 'Indie & Lo-Fi',
      year: 2026,
      duration: '--:--',
      thumbnailUrl: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
      description: 'Custom added track via YouTube video ID / URL.',
    };

    setCustomTracks((prev) => [newTrack, ...prev]);
    setCustomInput('');
    selectAndPlayTrack(newTrack);
  };

  return (
    <div className="w-full bg-slate-950/85 border border-purple-500/30 rounded-2xl p-5 shadow-2xl shadow-purple-950/50 backdrop-blur-md">
      {/* Invisible off-screen Audio Host for YouTube to eliminate all video rendering overhead */}
      <div
        className="w-0 h-0 opacity-0 pointer-events-none overflow-hidden absolute -left-[9999px]"
        aria-hidden="true"
      >
        <div id="yt-audio-host" />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-purple-900/40 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-600/20 border border-rose-500/40 flex items-center justify-center shadow-md shadow-rose-900/30">
            <Youtube className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h2 className="text-sm font-retro font-bold uppercase tracking-wider text-white flex items-center gap-2">
              DESI AUDIO STATION
              <span className="text-[10px] font-mono text-pink-400 bg-pink-950/60 border border-pink-500/30 px-2 py-0.5 rounded">
                AUDIO-ONLY · MAX FPS
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 font-sans-outfit">
              Lightweight background audio engine optimized for 60 FPS Space Invaders gameplay.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-purple-300">
          <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-rose-500 animate-pulse' : 'bg-slate-600'}`} />
          <span>{isPlaying ? 'STREAMING AUDIO' : 'STANDBY'}</span>
        </div>
      </div>

      {/* Lightweight Audio Deck with Mini Visualizer */}
      <div className="bg-slate-900/80 border border-purple-800/40 rounded-xl p-4 my-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Track Thumbnail & Info */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-purple-500/40 shadow-md">
            <img
              src={currentTrack.thumbnailUrl}
              alt={currentTrack.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {isPlaying && (
              <div className="absolute inset-0 bg-pink-600/30 flex items-center justify-center">
                <Radio className="w-5 h-5 text-white animate-pulse" />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.2 text-[9px] font-retro uppercase rounded border ${
                  currentTrack.origin === 'Pakistani'
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                    : 'bg-amber-950/80 border-amber-500 text-amber-300'
                }`}
              >
                {currentTrack.origin}
              </span>
              <span className="text-[10px] text-purple-300 font-retro">
                {currentTrack.genre}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-retro font-bold text-white tracking-wide mt-0.5 neon-text-pink truncate max-w-xs sm:max-w-md">
              {currentTrack.title}
            </h3>
            <p className="text-xs text-slate-300 font-sans-outfit truncate">
              {currentTrack.artist}
            </p>
          </div>
        </div>

        {/* Small Audio Equalizer Visualizer (Zero Main-Thread CPU Overhead) */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-950/70 border border-purple-900/60 rounded-lg">
            <div className="flex items-end gap-1 h-7 w-28 px-1">
              {[
                'animate-eq-1',
                'animate-eq-2',
                'animate-eq-3',
                'animate-eq-4',
                'animate-eq-5',
                'animate-eq-6',
                'animate-eq-7',
                'animate-eq-8',
                'animate-eq-3',
                'animate-eq-5',
                'animate-eq-2',
                'animate-eq-6',
              ].map((animClass, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm origin-bottom transition-all duration-300"
                  style={{
                    height: '100%',
                    background: i % 3 === 0 ? '#ec4899' : i % 3 === 1 ? '#a855f7' : '#06b6d4',
                    boxShadow: isPlaying ? '0 0 6px rgba(236, 72, 153, 0.5)' : 'none',
                  }}
                >
                  <div
                    className={`w-full h-full origin-bottom rounded-sm ${
                      isPlaying ? animClass : 'scale-y-[0.15]'
                    }`}
                    style={{
                      background: 'inherit',
                    }}
                  />
                </div>
              ))}
            </div>
            <span className="text-[9px] font-mono text-purple-400">EQ</span>
          </div>

          {/* Transport Controls */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrevTrack}
              className="w-9 h-9 rounded-lg bg-slate-900 hover:bg-slate-800 border border-purple-500/30 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
              title="Previous Track"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={handleTogglePlayPause}
              className="px-5 h-9 rounded-lg bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-retro font-bold text-xs tracking-wider flex items-center gap-1.5 shadow-md shadow-rose-600/30 transition-transform active:scale-95"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-white" />
                  PAUSE
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" />
                  PLAY
                </>
              )}
            </button>

            <button
              onClick={handleNextTrack}
              className="w-9 h-9 rounded-lg bg-slate-900 hover:bg-slate-800 border border-purple-500/30 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
              title="Next Track"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={handleToggleMute}
              className="w-9 h-9 rounded-lg bg-slate-900 hover:bg-slate-800 border border-purple-500/30 flex items-center justify-center text-slate-400 hover:text-pink-400 transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <a
              href={`https://www.youtube.com/watch?v=${currentTrack.id}`}
              target="_blank"
              rel="noreferrer noopener"
              className="w-9 h-9 rounded-lg bg-slate-900 hover:bg-slate-800 border border-purple-500/30 flex items-center justify-center text-slate-400 hover:text-pink-300 transition-colors hidden sm:flex"
              title="Open Track in YouTube"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Search Bar & Custom YouTube URL Input */}
      <div className="space-y-2.5 mb-4">
        <div className="relative">
          <Search className="w-4 h-4 text-pink-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Pakistani or Indian songs (e.g. Pasoori, Arijit Singh, Atif Aslam, Nazia Hassan, Disco Deewane, Coke Studio)..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-purple-500/40 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 font-sans-outfit transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 hover:text-white"
            >
              CLEAR
            </button>
          )}
        </div>

        <form onSubmit={handleAddCustomSong} className="flex gap-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Paste any YouTube URL or Video ID (e.g. https://www.youtube.com/watch?v=... or 5Eqb_-j3FDA) to play instantly..."
            className="flex-1 px-3.5 py-2 bg-slate-900/60 border border-slate-700 rounded-xl text-xs text-purple-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 hover:text-white font-retro text-xs rounded-xl flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            LOAD TRACK
          </button>
        </form>
      </div>

      {/* Filter Tabs: Country & Genre */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-purple-900/30 text-xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSelectedFilter('ALL')}
            className={`px-3 py-1 rounded-lg font-retro text-[11px] border transition-colors ${
              selectedFilter === 'ALL'
                ? 'bg-pink-600 text-white border-pink-500 shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All Tracks ({allTracks.length})
          </button>
          <button
            onClick={() => setSelectedFilter('Pakistani')}
            className={`px-3 py-1 rounded-lg font-retro text-[11px] border transition-colors ${
              selectedFilter === 'Pakistani'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-emerald-300'
            }`}
          >
            🇵🇰 Pakistani
          </button>
          <button
            onClick={() => setSelectedFilter('Indian')}
            className={`px-3 py-1 rounded-lg font-retro text-[11px] border transition-colors ${
              selectedFilter === 'Indian'
                ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-amber-300'
            }`}
          >
            🇮🇳 Indian
          </button>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {['ALL', 'Coke Studio', '80s Synth Pop', 'Bollywood Romantic', 'Punjabi Wave', 'Indie & Lo-Fi', 'Sufi & Qawwali'].map(
            (genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-2.5 py-0.5 rounded text-[10px] font-mono border whitespace-nowrap transition-colors ${
                  selectedGenre === genre
                    ? 'bg-purple-900/80 border-purple-400 text-purple-200'
                    : 'bg-slate-900/50 border-slate-800/80 text-slate-500 hover:text-slate-300'
                }`}
              >
                {genre}
              </button>
            )
          )}
        </div>
      </div>

      {/* Playlist Results */}
      <div className="mt-3.5 max-h-[300px] overflow-y-auto space-y-1.5 pr-1">
        {filteredTracks.length === 0 ? (
          <div className="text-center py-7 bg-slate-900/30 rounded-xl border border-dashed border-slate-800">
            <Music className="w-7 h-7 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-sans-outfit">
              No matching tracks found for "{searchQuery}".
            </p>
            <p className="text-[11px] text-purple-400/80 font-mono mt-1">
              Tip: Paste the YouTube link or Video ID directly into the input above to play any song!
            </p>
          </div>
        ) : (
          filteredTracks.map((track) => {
            const isSelected = track.id === currentTrack.id;
            return (
              <div
                key={track.id}
                onClick={() => selectAndPlayTrack(track)}
                className={`p-2 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-purple-950/70 border-pink-500 shadow-md shadow-pink-950/40'
                    : 'bg-slate-900/40 border-slate-800/70 hover:bg-slate-900/80 hover:border-purple-600/40'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-purple-900/50">
                    <img
                      src={track.thumbnailUrl}
                      alt={track.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {isSelected && isPlaying && (
                      <div className="absolute inset-0 bg-pink-600/40 flex items-center justify-center">
                        <Radio className="w-4 h-4 text-white animate-pulse" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[8px] font-mono px-1.5 py-0.2 rounded border ${
                          track.origin === 'Pakistani'
                            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                            : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                        }`}
                      >
                        {track.origin}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono truncate">
                        {track.genre}
                      </span>
                    </div>

                    <h4
                      className={`text-xs font-retro font-semibold truncate mt-0.5 ${
                        isSelected ? 'text-pink-300' : 'text-slate-200'
                      }`}
                    >
                      {track.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-sans-outfit truncate">
                      {track.artist}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
                    {track.duration}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isSelected) {
                        handleTogglePlayPause();
                      } else {
                        selectAndPlayTrack(track);
                      }
                    }}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                      isSelected && isPlaying
                        ? 'bg-pink-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-pink-600 hover:text-white'
                    }`}
                  >
                    {isSelected && isPlaying ? (
                      <Pause className="w-3 h-3 fill-current" />
                    ) : (
                      <Play className="w-3 h-3 fill-current" />
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
