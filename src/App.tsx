/**
 * VaporInvaders - 80s Synthwave Space Invaders & Music Player
 */

import React, { useState } from 'react';
import { VaporwaveBackground } from './components/VaporwaveBackground';
import { SpaceInvadersCanvas } from './game/SpaceInvadersCanvas';
import { MusicPlayerDeck } from './components/MusicPlayerDeck';
import { ScoreBoardSection } from './components/ScoreBoardSection';
import { synthEngine } from './audio/synthEngine';

export default function App() {
  const handlePrimaryCta = () => {
    const arcadeElem = document.getElementById('arcade');
    if (arcadeElem) {
      arcadeElem.scrollIntoView({ behavior: 'smooth' });
    }
    // Also initiate audio context and music playback
    synthEngine.play();
  };

  return (
    <div className="min-h-screen relative flex flex-col text-pink-100 selection:bg-pink-500 selection:text-white">
      {/* Dynamic 80s Vaporwave Background Grid & Sunset */}
      <VaporwaveBackground />

      {/* Top Bar (Strict 3-Zone Contract) */}
      <header className="relative z-30 flex items-center justify-between gap-8 px-6 lg:px-12 py-4 border-b border-purple-500/20 bg-slate-950/80 backdrop-blur-md">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="/"
          className="text-lg lg:text-xl font-bold tracking-wider font-retro text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-300 to-cyan-300 whitespace-nowrap shrink-0 neon-text-pink"
        >
          VAPOR INVADERS
        </a>

        {/* Zone 2: 4 clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-retro font-medium text-purple-200/80">
          <a
            href="#arcade"
            className="hover:text-pink-300 hover:underline underline-offset-8 transition-colors whitespace-nowrap shrink-0"
          >
            Arcade
          </a>
          <a
            href="#soundtrack"
            className="hover:text-pink-300 hover:underline underline-offset-8 transition-colors whitespace-nowrap shrink-0"
          >
            Soundtrack
          </a>
          <a
            href="#high-scores"
            className="hover:text-pink-300 hover:underline underline-offset-8 transition-colors whitespace-nowrap shrink-0"
          >
            Hall of Fame
          </a>
          <a
            href="#how-to-play"
            className="hover:text-pink-300 hover:underline underline-offset-8 transition-colors whitespace-nowrap shrink-0"
          >
            Intel
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handlePrimaryCta}
            className="px-5 py-2 text-xs font-retro font-bold text-white bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg hover:from-pink-500 hover:to-purple-500 shadow-md shadow-pink-600/30 transition-all active:scale-95 whitespace-nowrap shrink-0"
          >
            Play Now
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center">
        {/* App Title & Subtitle */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-4xl font-extrabold font-retro tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-300 to-cyan-300 neon-text-pink">
            SPACE INVADERS 1984
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-purple-300/80 font-sans-outfit max-w-xl mx-auto">
            Defend the neon grid from incoming waves of alien invaders while streaming your favorite Pakistani &amp; Indian tracks or retro synthwave in the background.
          </p>
        </div>

        {/* Center Window: Space Invaders Arcade Game */}
        <section id="arcade" className="w-full flex justify-center mb-10">
          <SpaceInvadersCanvas />
        </section>

        {/* Integrated Synthwave Music Player Deck */}
        <section id="soundtrack" className="w-full max-w-3xl mb-10">
          <MusicPlayerDeck />
        </section>

        {/* Hall of Fame & Combat Intel */}
        <section className="w-full max-w-5xl">
          <ScoreBoardSection />
        </section>
      </main>

      {/* Minimal Anti-slop Footer */}
      <footer className="relative z-10 py-6 border-t border-purple-900/30 bg-slate-950/70 text-center text-xs text-purple-400/60 font-mono">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>VAPOR INVADERS · 80S SYNTHWAVE ARCADE</span>
          <span>STEREO SYNTHESIS · 44.1KHZ WEB AUDIO</span>
        </div>
      </footer>
    </div>
  );
}
