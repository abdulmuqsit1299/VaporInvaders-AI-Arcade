import React from 'react';

export function VaporwaveBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#07020d]">
      {/* Deep purple/magenta ambient gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-b from-purple-900/30 via-pink-600/15 to-transparent blur-3xl rounded-full" />
      <div className="absolute top-1/4 -left-40 w-96 h-96 bg-indigo-900/25 blur-3xl rounded-full" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-fuchsia-900/25 blur-3xl rounded-full" />

      {/* Retro Wireframe Synthwave Sun in distance */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 w-64 h-64 md:w-80 md:h-80 rounded-full opacity-45 pointer-events-none">
        <div className="w-full h-full rounded-full bg-gradient-to-b from-yellow-300 via-pink-500 to-purple-800 shadow-[0_0_60px_rgba(236,72,153,0.5)] relative overflow-hidden">
          {/* Horizontal sun stripes */}
          <div className="absolute bottom-0 inset-x-0 h-2 bg-[#07020d]" />
          <div className="absolute bottom-4 inset-x-0 h-2.5 bg-[#07020d]" />
          <div className="absolute bottom-9 inset-x-0 h-3 bg-[#07020d]" />
          <div className="absolute bottom-15 inset-x-0 h-4 bg-[#07020d]" />
          <div className="absolute bottom-22 inset-x-0 h-5 bg-[#07020d]" />
          <div className="absolute bottom-30 inset-x-0 h-6 bg-[#07020d]" />
        </div>
      </div>

      {/* Perspective Wireframe Horizon Grid at bottom */}
      <div className="absolute bottom-0 inset-x-0 h-[40vh] overflow-hidden">
        {/* Horizon glowing line */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-pink-500 to-transparent shadow-[0_0_15px_#ec4899]" />
        
        {/* Perspective grid floor */}
        <div className="w-full h-full vaporwave-grid opacity-35" />
      </div>

      {/* Subtle star speckles */}
      <div className="absolute inset-0 bg-[radial-gradient(#ec4899_1px,transparent_1px)] [background-size:64px_64px] opacity-15" />
    </div>
  );
}
