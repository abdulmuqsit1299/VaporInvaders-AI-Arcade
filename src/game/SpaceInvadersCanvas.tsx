import React, { useEffect, useRef, useState, useCallback } from 'react';
import { synthEngine } from '../audio/synthEngine';
import { Play, RotateCcw, Pause, Shield, Zap, Trophy, Volume2, VolumeX } from 'lucide-react';

// Pixel art representations (1 = filled pixel, 0 = empty)
const SPRITES = {
  // 8x8 Squid (Top Row - 30 pts)
  squid: [
    [
      [0,0,0,1,1,0,0,0],
      [0,0,1,1,1,1,0,0],
      [0,1,1,1,1,1,1,0],
      [1,1,0,1,1,0,1,1],
      [1,1,1,1,1,1,1,1],
      [0,0,1,0,0,1,0,0],
      [0,1,0,1,1,0,1,0],
      [1,0,1,0,0,1,0,1]
    ],
    [
      [0,0,0,1,1,0,0,0],
      [0,0,1,1,1,1,0,0],
      [0,1,1,1,1,1,1,0],
      [1,1,0,1,1,0,1,1],
      [1,1,1,1,1,1,1,1],
      [0,1,0,0,0,0,1,0],
      [1,0,0,1,1,0,0,1],
      [0,1,0,0,0,0,1,0]
    ]
  ],
  // 11x8 Crab (Middle Rows - 20 pts)
  crab: [
    [
      [0,0,1,0,0,0,0,0,1,0,0],
      [0,0,0,1,0,0,0,1,0,0,0],
      [0,0,1,1,1,1,1,1,1,0,0],
      [0,1,1,0,1,1,1,0,1,1,0],
      [1,1,1,1,1,1,1,1,1,1,1],
      [1,0,1,1,1,1,1,1,1,0,1],
      [1,0,1,0,0,0,0,0,1,0,1],
      [0,0,0,1,1,0,1,1,0,0,0]
    ],
    [
      [0,0,1,0,0,0,0,0,1,0,0],
      [1,0,0,1,0,0,0,1,0,0,1],
      [1,0,1,1,1,1,1,1,1,0,1],
      [1,1,1,0,1,1,1,0,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1],
      [0,0,1,1,1,1,1,1,1,0,0],
      [0,0,1,0,0,0,0,0,1,0,0],
      [0,1,0,0,0,0,0,0,0,1,0]
    ]
  ],
  // 12x8 Octopus (Bottom Rows - 10 pts)
  octopus: [
    [
      [0,0,0,0,1,1,1,1,0,0,0,0],
      [0,1,1,1,1,1,1,1,1,1,1,0],
      [1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,0,0,1,1,0,0,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1,1],
      [0,0,0,1,1,0,0,1,1,0,0,0],
      [0,0,1,1,0,1,1,0,1,1,0,0],
      [1,1,0,0,0,0,0,0,0,0,1,1]
    ],
    [
      [0,0,0,0,1,1,1,1,0,0,0,0],
      [0,1,1,1,1,1,1,1,1,1,1,0],
      [1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,0,0,1,1,0,0,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1,1],
      [0,0,1,1,0,0,0,0,1,1,0,0],
      [0,1,0,0,1,1,1,1,0,0,1,0],
      [0,0,1,0,0,0,0,0,0,1,0,0]
    ]
  ],
  // 16x7 UFO (Mystery Ship - 50-300 pts)
  ufo: [
    [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
    [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
    [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
    [0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [0,0,1,1,1,0,0,1,1,0,0,1,1,1,0,0],
    [0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0]
  ],
  // 13x8 Player Cannon
  player: [
    [0,0,0,0,0,0,1,0,0,0,0,0,0],
    [0,0,0,0,0,1,1,1,0,0,0,0,0],
    [0,0,0,0,0,1,1,1,0,0,0,0,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1]
  ]
};

interface Invader {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'squid' | 'crab' | 'octopus';
  points: number;
  color: string;
  alive: boolean;
  row: number;
  col: number;
}

interface Bullet {
  x: number;
  y: number;
  width: number;
  height: number;
  vy: number;
  isPlayer: boolean;
  color: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
}

interface FloatingScore {
  x: number;
  y: number;
  text: string;
  alpha: number;
  vy: number;
}

interface BunkerPixel {
  x: number;
  y: number;
  alive: boolean;
}

export function SpaceInvadersCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // High score from localStorage
  const [highScore, setHighScore] = useState<number>(() => {
    const saved = localStorage.getItem('vapor_invaders_hi_score');
    return saved ? parseInt(saved, 10) : 5000;
  });

  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [wave, setWave] = useState<number>(1);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'WAVE_CLEAR'>('START');
  const [scanlinesActive, setScanlinesActive] = useState<boolean>(true);
  const [aliensDefeated, setAliensDefeated] = useState<number>(0);

  // Touch control state
  const leftPressed = useRef(false);
  const rightPressed = useRef(false);
  const shootPressed = useRef(false);

  // Mutable game state in refs for smooth 60fps loop
  const stateRef = useRef({
    score: 0,
    highScore: 5000,
    lives: 3,
    wave: 1,
    gameState: 'START' as 'START' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'WAVE_CLEAR',
    playerX: 320,
    playerY: 490,
    playerSpeed: 300,
    playerWidth: 36,
    playerHeight: 22,
    playerAlive: true,
    playerHitTimer: 0,
    bullets: [] as Bullet[],
    invaders: [] as Invader[],
    invaderDx: 1,
    invaderSpeed: 24, // steps
    invaderStepTimer: 0,
    invaderStepInterval: 0.65,
    animationFrame: 0,
    bunkers: [] as BunkerPixel[],
    particles: [] as Particle[],
    floatingScores: [] as FloatingScore[],
    lastTime: 0,
    ufo: null as { x: number; y: number; dir: number; speed: number; points: number } | null,
    ufoTimer: 18,
    aliensDefeated: 0,
    shotsFired: 0,
    shotsHit: 0,
  });

  // Sync ref values
  useEffect(() => {
    stateRef.current.highScore = highScore;
  }, [highScore]);

  const initWave = useCallback((waveNum: number, keepScore = true) => {
    const s = stateRef.current;
    if (!keepScore) {
      s.score = 0;
      s.lives = 3;
      s.aliensDefeated = 0;
      setScore(0);
      setLives(3);
      setAliensDefeated(0);
    }
    s.wave = waveNum;
    setWave(waveNum);

    s.bullets = [];
    s.particles = [];
    s.floatingScores = [];
    s.playerX = 320 - s.playerWidth / 2;
    s.playerAlive = true;
    s.invaderDx = 1;
    s.invaderStepTimer = 0;
    // Speed scales slightly with wave
    s.invaderStepInterval = Math.max(0.2, 0.6 - (waveNum - 1) * 0.06);

    // Build Invaders (5 rows x 11 cols = 55 aliens)
    const invaders: Invader[] = [];
    const startX = 60;
    const startY = 80 + Math.min(60, (waveNum - 1) * 15);
    const colSpacing = 48;
    const rowSpacing = 32;

    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 11; c++) {
        let type: 'squid' | 'crab' | 'octopus' = 'octopus';
        let points = 10;
        let color = '#06b6d4'; // Cyan for octopus
        let width = 32;
        let height = 22;

        if (r === 0) {
          type = 'squid';
          points = 30;
          color = '#ec4899'; // Neon Pink for squid
          width = 24;
        } else if (r === 1 || r === 2) {
          type = 'crab';
          points = 20;
          color = '#d946ef'; // Magenta/Purple for crab
          width = 30;
        }

        invaders.push({
          x: startX + c * colSpacing,
          y: startY + r * rowSpacing,
          width,
          height,
          type,
          points,
          color,
          alive: true,
          row: r,
          col: c,
        });
      }
    }
    s.invaders = invaders;

    // Build 4 Bunkers
    const bunkers: BunkerPixel[] = [];
    const bunkerCount = 4;
    const bunkerY = 410;
    const bunkerBlockSize = 4;
    const spacing = 640 / (bunkerCount + 1);

    for (let b = 0; b < bunkerCount; b++) {
      const centerX = spacing * (b + 1);
      const startBx = centerX - 26;
      // 13 cols x 9 rows bunker shape
      const bunkerMatrix = [
        [0,0,1,1,1,1,1,1,1,1,1,0,0],
        [0,1,1,1,1,1,1,1,1,1,1,1,0],
        [1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,0,0,0,0,0,1,1,1,1],
        [1,1,1,0,0,0,0,0,0,0,1,1,1],
        [1,1,1,0,0,0,0,0,0,0,1,1,1]
      ];

      for (let by = 0; by < bunkerMatrix.length; by++) {
        for (let bx = 0; bx < bunkerMatrix[by].length; bx++) {
          if (bunkerMatrix[by][bx] === 1) {
            bunkers.push({
              x: startBx + bx * bunkerBlockSize,
              y: bunkerY + by * bunkerBlockSize,
              alive: true
            });
          }
        }
      }
    }
    s.bunkers = bunkers;

    synthEngine.playWaveStart();
  }, []);

  const startGame = () => {
    initWave(1, false);
    stateRef.current.gameState = 'PLAYING';
    setGameState('PLAYING');
    synthEngine.play();
  };

  const restartGame = () => {
    initWave(1, false);
    stateRef.current.gameState = 'PLAYING';
    setGameState('PLAYING');
    synthEngine.play();
  };

  const togglePause = () => {
    if (stateRef.current.gameState === 'PLAYING') {
      stateRef.current.gameState = 'PAUSED';
      setGameState('PAUSED');
    } else if (stateRef.current.gameState === 'PAUSED') {
      stateRef.current.gameState = 'PLAYING';
      setGameState('PLAYING');
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        leftPressed.current = true;
      }
      if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        rightPressed.current = true;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        shootPressed.current = true;
        handleShoot();
      }
      if (e.code === 'KeyP') {
        togglePause();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        leftPressed.current = false;
      }
      if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        rightPressed.current = false;
      }
      if (e.code === 'Space') {
        shootPressed.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleShoot = () => {
    const s = stateRef.current;
    if (s.gameState !== 'PLAYING' || !s.playerAlive) return;

    // Allow maximum 2 simultaneous player bullets for classic arcade pacing
    const activePlayerBullets = s.bullets.filter(b => b.isPlayer).length;
    if (activePlayerBullets < 2) {
      s.bullets.push({
        x: s.playerX + s.playerWidth / 2 - 2,
        y: s.playerY - 6,
        width: 4,
        height: 12,
        vy: -550,
        isPlayer: true,
        color: '#38bdf8',
      });
      s.shotsFired++;
      synthEngine.playPlayerShoot();
    }
  };

  // Main 60fps Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = (time: number) => {
      const s = stateRef.current;
      if (!s.lastTime) s.lastTime = time;
      const dt = Math.min(0.05, (time - s.lastTime) / 1000);
      s.lastTime = time;

      // Update if PLAYING
      if (s.gameState === 'PLAYING') {
        // 1. Move Player
        if (s.playerAlive) {
          if (leftPressed.current) {
            s.playerX = Math.max(16, s.playerX - s.playerSpeed * dt);
          }
          if (rightPressed.current) {
            s.playerX = Math.min(640 - s.playerWidth - 16, s.playerX + s.playerSpeed * dt);
          }
        } else {
          s.playerHitTimer -= dt;
          if (s.playerHitTimer <= 0) {
            s.playerAlive = true;
            s.playerX = 320 - s.playerWidth / 2;
          }
        }

        // 2. UFO spawn & movement
        s.ufoTimer -= dt;
        if (s.ufoTimer <= 0 && !s.ufo) {
          const dir = Math.random() > 0.5 ? 1 : -1;
          const possibleScores = [50, 100, 150, 300];
          s.ufo = {
            x: dir === 1 ? -40 : 640,
            y: 50,
            dir,
            speed: 120,
            points: possibleScores[Math.floor(Math.random() * possibleScores.length)],
          };
          s.ufoTimer = 22 + Math.random() * 15;
          synthEngine.playUfoSound();
        }

        if (s.ufo) {
          s.ufo.x += s.ufo.dir * s.ufo.speed * dt;
          if (Math.random() < 0.05) synthEngine.playUfoSound();
          if ((s.ufo.dir === 1 && s.ufo.x > 660) || (s.ufo.dir === -1 && s.ufo.x < -60)) {
            s.ufo = null;
          }
        }

        // 3. March Invaders
        const aliveInvaders = s.invaders.filter(inv => inv.alive);
        if (aliveInvaders.length === 0) {
          // Wave Cleared!
          s.gameState = 'WAVE_CLEAR';
          setGameState('WAVE_CLEAR');
          setTimeout(() => {
            initWave(s.wave + 1, true);
            s.gameState = 'PLAYING';
            setGameState('PLAYING');
          }, 1500);
        } else {
          // Step acceleration based on remaining aliens
          const ratioRemaining = aliveInvaders.length / 55;
          const currentStepInterval = Math.max(0.08, s.invaderStepInterval * ratioRemaining);

          s.invaderStepTimer += dt;
          if (s.invaderStepTimer >= currentStepInterval) {
            s.invaderStepTimer = 0;
            s.animationFrame = (s.animationFrame + 1) % 2;

            // Check if fleet hits wall
            let hitEdge = false;
            for (const inv of aliveInvaders) {
              if (s.invaderDx > 0 && inv.x + inv.width >= 620) {
                hitEdge = true;
                break;
              } else if (s.invaderDx < 0 && inv.x <= 20) {
                hitEdge = true;
                break;
              }
            }

            if (hitEdge) {
              s.invaderDx = -s.invaderDx;
              for (const inv of aliveInvaders) {
                inv.y += 18;
                // Check if aliens reach bunker/player level
                if (inv.y + inv.height >= s.playerY) {
                  s.gameState = 'GAME_OVER';
                  setGameState('GAME_OVER');
                }
              }
            } else {
              for (const inv of aliveInvaders) {
                inv.x += s.invaderDx * 12;
              }
            }
          }

          // 4. Invader Bullets (Alien attack)
          // Random bottom-most invaders drop bombs
          const alienFireChance = 0.03 + (s.wave - 1) * 0.01;
          if (Math.random() < alienFireChance && s.bullets.filter(b => !b.isPlayer).length < 4) {
            // Pick a column with an alive invader
            const cols = [...new Set(aliveInvaders.map(i => i.col))];
            if (cols.length > 0) {
              const chosenCol = cols[Math.floor(Math.random() * cols.length)];
              const invadersInCol = aliveInvaders.filter(i => i.col === chosenCol);
              // Bottom-most in column
              const bottomInv = invadersInCol.reduce((prev, curr) => curr.row > prev.row ? curr : prev, invadersInCol[0]);

              if (bottomInv) {
                s.bullets.push({
                  x: bottomInv.x + bottomInv.width / 2 - 2,
                  y: bottomInv.y + bottomInv.height,
                  width: 4,
                  height: 10,
                  vy: 220 + s.wave * 20,
                  isPlayer: false,
                  color: '#f43f5e',
                });
              }
            }
          }
        }

        // 5. Update Bullets
        for (let i = s.bullets.length - 1; i >= 0; i--) {
          const b = s.bullets[i];
          b.y += b.vy * dt;

          // Out of screen
          if (b.y < 10 || b.y > 550) {
            s.bullets.splice(i, 1);
            continue;
          }

          // Collision with Bunkers
          let hitBunker = false;
          for (let pIdx = 0; pIdx < s.bunkers.length; pIdx++) {
            const bp = s.bunkers[pIdx];
            if (bp.alive && Math.abs(bp.x - b.x) < 5 && Math.abs(bp.y - b.y) < 6) {
              bp.alive = false;
              hitBunker = true;
              // Blast adjacent bunker pixels to create natural erosion
              for (const adj of s.bunkers) {
                if (adj.alive && Math.hypot(adj.x - bp.x, adj.y - bp.y) < 8 && Math.random() < 0.6) {
                  adj.alive = false;
                }
              }
              // Bunker hit particles
              for (let k = 0; k < 4; k++) {
                s.particles.push({
                  x: bp.x,
                  y: bp.y,
                  vx: (Math.random() - 0.5) * 80,
                  vy: (Math.random() - 0.5) * 80,
                  size: 2,
                  color: '#10b981',
                  alpha: 1,
                  life: 0.3,
                });
              }
              break;
            }
          }
          if (hitBunker) {
            s.bullets.splice(i, 1);
            continue;
          }

          // Player Bullet hits Alien / UFO
          if (b.isPlayer) {
            let hitTarget = false;

            // UFO check
            if (s.ufo && b.x >= s.ufo.x && b.x <= s.ufo.x + 36 && b.y >= s.ufo.y && b.y <= s.ufo.y + 18) {
              const ufoPts = s.ufo.points;
              s.score += ufoPts;
              s.shotsHit++;
              setScore(s.score);
              if (s.score > s.highScore) {
                s.highScore = s.score;
                setHighScore(s.score);
                localStorage.setItem('vapor_invaders_hi_score', s.score.toString());
              }

              s.floatingScores.push({
                x: s.ufo.x,
                y: s.ufo.y,
                text: `+${ufoPts}`,
                alpha: 1,
                vy: -30,
              });

              // Explosive particles
              for (let k = 0; k < 25; k++) {
                s.particles.push({
                  x: s.ufo.x + 18,
                  y: s.ufo.y + 9,
                  vx: (Math.random() - 0.5) * 220,
                  vy: (Math.random() - 0.5) * 220,
                  size: Math.random() * 3 + 2,
                  color: '#fbbf24',
                  alpha: 1,
                  life: 0.8,
                });
              }

              synthEngine.playInvaderHit();
              s.ufo = null;
              hitTarget = true;
            }

            // Invader check
            if (!hitTarget) {
              for (const inv of s.invaders) {
                if (inv.alive && b.x >= inv.x && b.x <= inv.x + inv.width && b.y >= inv.y && b.y <= inv.y + inv.height) {
                  inv.alive = false;
                  s.score += inv.points;
                  s.aliensDefeated++;
                  s.shotsHit++;
                  setScore(s.score);
                  setAliensDefeated(s.aliensDefeated);

                  if (s.score > s.highScore) {
                    s.highScore = s.score;
                    setHighScore(s.score);
                    localStorage.setItem('vapor_invaders_hi_score', s.score.toString());
                  }

                  // Neon burst particles
                  for (let k = 0; k < 14; k++) {
                    s.particles.push({
                      x: inv.x + inv.width / 2,
                      y: inv.y + inv.height / 2,
                      vx: (Math.random() - 0.5) * 160,
                      vy: (Math.random() - 0.5) * 160,
                      size: Math.random() * 3 + 1,
                      color: inv.color,
                      alpha: 1,
                      life: 0.5,
                    });
                  }

                  s.floatingScores.push({
                    x: inv.x,
                    y: inv.y,
                    text: `+${inv.points}`,
                    alpha: 1,
                    vy: -25,
                  });

                  synthEngine.playInvaderHit();
                  hitTarget = true;
                  break;
                }
              }
            }

            if (hitTarget) {
              s.bullets.splice(i, 1);
              continue;
            }
          }

          // Alien Bullet hits Player
          if (!b.isPlayer && s.playerAlive) {
            if (b.x >= s.playerX && b.x <= s.playerX + s.playerWidth && b.y >= s.playerY && b.y <= s.playerY + s.playerHeight) {
              s.bullets.splice(i, 1);
              s.playerAlive = false;
              s.playerHitTimer = 1.2;
              s.lives -= 1;
              setLives(s.lives);

              synthEngine.playPlayerExplode();

              // Big explosion
              for (let k = 0; k < 30; k++) {
                s.particles.push({
                  x: s.playerX + s.playerWidth / 2,
                  y: s.playerY + s.playerHeight / 2,
                  vx: (Math.random() - 0.5) * 250,
                  vy: (Math.random() - 0.5) * 250,
                  size: Math.random() * 4 + 2,
                  color: '#ec4899',
                  alpha: 1,
                  life: 0.9,
                });
              }

              if (s.lives <= 0) {
                s.gameState = 'GAME_OVER';
                setGameState('GAME_OVER');
              }
              continue;
            }
          }
        }

        // 6. Update Particles
        for (let i = s.particles.length - 1; i >= 0; i--) {
          const p = s.particles[i];
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.life -= dt;
          p.alpha = Math.max(0, p.life / 0.5);
          if (p.life <= 0) {
            s.particles.splice(i, 1);
          }
        }

        // 7. Update Floating Scores
        for (let i = s.floatingScores.length - 1; i >= 0; i--) {
          const fs = s.floatingScores[i];
          fs.y += fs.vy * dt;
          fs.alpha -= dt * 1.2;
          if (fs.alpha <= 0) {
            s.floatingScores.splice(i, 1);
          }
        }
      }

      // --- DRAW CANVAS ---
      ctx.fillStyle = '#070312';
      ctx.fillRect(0, 0, 640, 560);

      // Subtle background starfield & vaporwave perspective lines
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.12)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= 640; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 560);
        ctx.lineTo(320 + (x - 320) * 0.25, 430);
        ctx.stroke();
      }
      for (let y = 430; y <= 560; y += 26) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(640, y);
        ctx.stroke();
      }

      // Draw Bunkers
      ctx.fillStyle = '#10b981';
      for (const bp of s.bunkers) {
        if (bp.alive) {
          ctx.fillRect(bp.x, bp.y, 4, 4);
        }
      }

      // Draw Invaders with authentic pixel sprites
      for (const inv of s.invaders) {
        if (!inv.alive) continue;
        const spriteFrames = SPRITES[inv.type];
        const currentFrame = spriteFrames[s.animationFrame];
        const pixelSize = inv.type === 'squid' ? 3 : (inv.type === 'crab' ? 2.7 : 2.5);

        ctx.fillStyle = inv.color;
        for (let r = 0; r < currentFrame.length; r++) {
          for (let c = 0; c < currentFrame[r].length; c++) {
            if (currentFrame[r][c] === 1) {
              ctx.fillRect(inv.x + c * pixelSize, inv.y + r * pixelSize, pixelSize, pixelSize);
            }
          }
        }
      }

      // Draw Mystery UFO
      if (s.ufo) {
        const ufoSprite = SPRITES.ufo;
        const pixelSize = 2.2;
        ctx.fillStyle = '#fbbf24'; // Golden amber
        for (let r = 0; r < ufoSprite.length; r++) {
          for (let c = 0; c < ufoSprite[r].length; c++) {
            if (ufoSprite[r][c] === 1) {
              ctx.fillRect(s.ufo.x + c * pixelSize, s.ufo.y + r * pixelSize, pixelSize, pixelSize);
            }
          }
        }
      }

      // Draw Player Cannon
      if (s.playerAlive) {
        const pSprite = SPRITES.player;
        const pixelSize = 2.8;
        ctx.fillStyle = '#38bdf8'; // Electric Cyan
        for (let r = 0; r < pSprite.length; r++) {
          for (let c = 0; c < pSprite[r].length; c++) {
            if (pSprite[r][c] === 1) {
              ctx.fillRect(s.playerX + c * pixelSize, s.playerY + r * pixelSize, pixelSize, pixelSize);
            }
          }
        }
      } else {
        // Player hit flash
        ctx.fillStyle = Math.floor(time / 80) % 2 === 0 ? '#ec4899' : '#a855f7';
        ctx.fillRect(s.playerX, s.playerY + 8, s.playerWidth, 10);
      }

      // Draw Bullets
      for (const b of s.bullets) {
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 6;
        ctx.fillRect(b.x, b.y, b.width, b.height);
        ctx.shadowBlur = 0; // reset
      }

      // Draw Particles
      for (const p of s.particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
      ctx.globalAlpha = 1.0;

      // Draw Floating Scores
      ctx.font = '10px "Press Start 2P", monospace';
      for (const fs of s.floatingScores) {
        ctx.fillStyle = `rgba(253, 224, 71, ${Math.max(0, fs.alpha)})`;
        ctx.fillText(fs.text, fs.x, fs.y);
      }

      // Bottom Defense Line
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(10, 525);
      ctx.lineTo(630, 525);
      ctx.stroke();

      // In-canvas HUD at bottom: Lives icons & Wave
      ctx.font = '9px "Press Start 2P", monospace';
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(`${s.lives} LIVES`, 20, 545);

      for (let i = 0; i < s.lives; i++) {
        const pSprite = SPRITES.player;
        ctx.fillStyle = '#38bdf8';
        for (let r = 0; r < pSprite.length; r++) {
          for (let c = 0; c < pSprite[r].length; c++) {
            if (pSprite[r][c] === 1) {
              ctx.fillRect(95 + i * 22 + c * 1.2, 537 + r * 1.2, 1.2, 1.2);
            }
          }
        }
      }

      ctx.fillStyle = '#f472b6';
      ctx.fillText(`WAVE ${s.wave}`, 540, 545);

      // Overlay screens (START, PAUSED, GAME_OVER, WAVE_CLEAR)
      if (s.gameState === 'START') {
        ctx.fillStyle = 'rgba(11, 4, 22, 0.85)';
        ctx.fillRect(0, 0, 640, 560);

        ctx.font = '16px "Press Start 2P", monospace';
        ctx.fillStyle = '#ec4899';
        ctx.shadowColor = '#ec4899';
        ctx.shadowBlur = 10;
        ctx.textAlign = 'center';
        ctx.fillText('SPACE INVADERS', 320, 160);
        ctx.shadowBlur = 0;

        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillStyle = '#38bdf8';
        ctx.fillText('80s VAPORWAVE EDITION', 320, 195);

        // Point value table
        ctx.font = '9px "Press Start 2P", monospace';
        ctx.textAlign = 'left';

        // UFO
        ctx.fillStyle = '#fbbf24';
        const uSprite = SPRITES.ufo;
        for (let r = 0; r < uSprite.length; r++) {
          for (let c = 0; c < uSprite[r].length; c++) {
            if (uSprite[r][c] === 1) ctx.fillRect(200 + c * 1.6, 230 + r * 1.6, 1.6, 1.6);
          }
        }
        ctx.fillText('= ? MYSTERY', 245, 242);

        // Squid
        ctx.fillStyle = '#ec4899';
        const sSprite = SPRITES.squid[0];
        for (let r = 0; r < sSprite.length; r++) {
          for (let c = 0; c < sSprite[r].length; c++) {
            if (sSprite[r][c] === 1) ctx.fillRect(205 + c * 1.8, 260 + r * 1.8, 1.8, 1.8);
          }
        }
        ctx.fillText('= 30 POINTS', 245, 272);

        // Crab
        ctx.fillStyle = '#d946ef';
        const cSprite = SPRITES.crab[0];
        for (let r = 0; r < cSprite.length; r++) {
          for (let c = 0; c < cSprite[r].length; c++) {
            if (cSprite[r][c] === 1) ctx.fillRect(202 + c * 1.8, 290 + r * 1.8, 1.8, 1.8);
          }
        }
        ctx.fillText('= 20 POINTS', 245, 302);

        // Octopus
        ctx.fillStyle = '#06b6d4';
        const oSprite = SPRITES.octopus[0];
        for (let r = 0; r < oSprite.length; r++) {
          for (let c = 0; c < oSprite[r].length; c++) {
            if (oSprite[r][c] === 1) ctx.fillRect(200 + c * 1.8, 320 + r * 1.8, 1.8, 1.8);
          }
        }
        ctx.fillText('= 10 POINTS', 245, 332);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText('CONTROLS: [LEFT/RIGHT] TO MOVE', 320, 380);
        ctx.fillText('[SPACEBAR] TO FIRE LASER', 320, 405);

        ctx.fillStyle = '#4ade80';
        ctx.shadowColor = '#4ade80';
        ctx.shadowBlur = 8;
        if (Math.floor(time / 400) % 2 === 0) {
          ctx.fillText('PRESS [START GAME] TO PLAY', 320, 460);
        }
        ctx.shadowBlur = 0;
        ctx.textAlign = 'left';
      } else if (s.gameState === 'PAUSED') {
        ctx.fillStyle = 'rgba(11, 4, 22, 0.7)';
        ctx.fillRect(0, 0, 640, 560);
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.fillStyle = '#fde047';
        ctx.textAlign = 'center';
        ctx.fillText('SYSTEM PAUSED', 320, 270);
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText('PRESS [P] OR CLICK RESUME', 320, 310);
        ctx.textAlign = 'left';
      } else if (s.gameState === 'GAME_OVER') {
        ctx.fillStyle = 'rgba(11, 4, 22, 0.85)';
        ctx.fillRect(0, 0, 640, 560);

        ctx.font = '18px "Press Start 2P", monospace';
        ctx.fillStyle = '#f43f5e';
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 10;
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', 320, 220);
        ctx.shadowBlur = 0;

        ctx.font = '11px "Press Start 2P", monospace';
        ctx.fillStyle = '#e2e8f0';
        ctx.fillText(`FINAL SCORE: ${s.score}`, 320, 270);
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(`WAVES CLEARED: ${s.wave - 1}`, 320, 300);

        ctx.fillStyle = '#4ade80';
        if (Math.floor(time / 400) % 2 === 0) {
          ctx.fillText('INSERT COIN / PLAY AGAIN', 320, 360);
        }
        ctx.textAlign = 'left';
      } else if (s.gameState === 'WAVE_CLEAR') {
        ctx.fillStyle = 'rgba(11, 4, 22, 0.7)';
        ctx.fillRect(0, 0, 640, 560);

        ctx.font = '16px "Press Start 2P", monospace';
        ctx.fillStyle = '#a855f7';
        ctx.textAlign = 'center';
        ctx.fillText(`WAVE ${s.wave} CLEARED!`, 320, 260);
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillStyle = '#38bdf8';
        ctx.fillText('PREPARE FOR NEXT ASSAULT...', 320, 300);
        ctx.textAlign = 'left';
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [initWave]);

  return (
    <div className="relative flex flex-col items-center">
      {/* Top Arcade Marquee & Score Board */}
      <div className="w-full max-w-[640px] bg-slate-950/90 border border-purple-500/40 rounded-t-xl px-4 py-3 flex items-center justify-between shadow-lg shadow-purple-900/30">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-pink-400 font-arcade">SCORE&lt;1&gt;</span>
          <span className="text-sm font-arcade tabular-nums text-pink-200 neon-text-pink">
            {score.toString().padStart(5, '0')}
          </span>
        </div>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5 text-yellow-400">
            <Trophy className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase tracking-wider font-arcade">HI-SCORE</span>
          </div>
          <span className="text-sm font-arcade tabular-nums text-yellow-300 neon-text-yellow">
            {highScore.toString().padStart(5, '0')}
          </span>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-arcade">WAVE</span>
          <span className="text-sm font-arcade tabular-nums text-cyan-200 neon-text-cyan">
            {wave.toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Center Arcade Screen with Scanlines & Curved CRT Bezel */}
      <div className="relative w-full max-w-[640px] aspect-[640/560] bg-black border-x-4 border-b-4 border-purple-900/80 shadow-[0_0_35px_rgba(168,85,247,0.35)] rounded-b-xl overflow-hidden">
        <canvas
          ref={canvasRef}
          width={640}
          height={560}
          className="w-full h-full block select-none"
        />

        {/* Scanlines CRT filter overlay */}
        {scanlinesActive && (
          <div className="absolute inset-0 scanlines-overlay scanlines-flicker pointer-events-none" />
        )}

        {/* Screen glass reflection overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-pink-500/5 pointer-events-none rounded-b-xl" />

        {/* Floating In-Game Quick Action Overlay if Start or Game Over */}
        {gameState === 'START' && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-3">
            <button
              onClick={startGame}
              className="px-6 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-arcade text-xs rounded-lg shadow-lg shadow-pink-500/40 transition-transform active:scale-95 whitespace-nowrap"
            >
              START GAME
            </button>
          </div>
        )}

        {gameState === 'GAME_OVER' && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-3">
            <button
              onClick={restartGame}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-arcade text-xs rounded-lg shadow-lg shadow-emerald-500/40 transition-transform active:scale-95 whitespace-nowrap"
            >
              PLAY AGAIN
            </button>
          </div>
        )}
      </div>

      {/* Screen Control Bar (CRT Toggle, Pause, Reset, Quick Touch controls) */}
      <div className="w-full max-w-[640px] mt-3 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setScanlinesActive(prev => !prev)}
            className={`px-3 py-1.5 rounded text-[11px] font-retro border transition-colors ${
              scanlinesActive
                ? 'bg-purple-950/80 border-purple-500 text-purple-300'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Retro CRT Scanlines"
          >
            SCANLINES: {scanlinesActive ? 'ON' : 'OFF'}
          </button>

          {gameState === 'PLAYING' && (
            <button
              onClick={togglePause}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-retro bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white transition-colors"
            >
              <Pause className="w-3 h-3" />
              PAUSE
            </button>
          )}

          {gameState === 'PAUSED' && (
            <button
              onClick={togglePause}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-retro bg-pink-950/80 border border-pink-500 text-pink-300 hover:text-white transition-colors"
            >
              <Play className="w-3 h-3" />
              RESUME
            </button>
          )}

          {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
            <button
              onClick={restartGame}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-retro bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              RESTART
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs font-retro text-purple-300">
          <Zap className="w-3.5 h-3.5 text-pink-400" />
          <span>ALIENS ZAPPED: <span className="tabular-nums font-mono text-pink-300">{aliensDefeated}</span></span>
        </div>
      </div>

      {/* On-Screen Mobile/Tablet Arcade Touch Controls */}
      <div className="w-full max-w-[640px] mt-4 p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl flex items-center justify-between gap-4">
        {/* Left & Right D-Pad buttons */}
        <div className="flex items-center gap-2">
          <button
            onTouchStart={() => (leftPressed.current = true)}
            onTouchEnd={() => (leftPressed.current = false)}
            onMouseDown={() => (leftPressed.current = true)}
            onMouseUp={() => (leftPressed.current = false)}
            onMouseLeave={() => (leftPressed.current = false)}
            className="w-14 h-12 flex items-center justify-center bg-slate-900 hover:bg-slate-800 active:bg-pink-900/60 border border-purple-500/40 rounded-lg text-purple-200 font-retro font-bold text-sm select-none shadow-md"
          >
            ◀ LEFT
          </button>
          <button
            onTouchStart={() => (rightPressed.current = true)}
            onTouchEnd={() => (rightPressed.current = false)}
            onMouseDown={() => (rightPressed.current = true)}
            onMouseUp={() => (rightPressed.current = false)}
            onMouseLeave={() => (rightPressed.current = false)}
            className="w-14 h-12 flex items-center justify-center bg-slate-900 hover:bg-slate-800 active:bg-pink-900/60 border border-purple-500/40 rounded-lg text-purple-200 font-retro font-bold text-sm select-none shadow-md"
          >
            RIGHT ▶
          </button>
        </div>

        <div className="hidden sm:block text-[11px] text-slate-400 font-sans-outfit text-center">
          Keyboard: <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-pink-300 font-mono">←</kbd> <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-pink-300 font-mono">→</kbd> Move · <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-cyan-300 font-mono">SPACE</kbd> Fire
        </div>

        {/* Big Arcade Fire Laser Button */}
        <div>
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              handleShoot();
            }}
            onMouseDown={() => handleShoot()}
            className="px-6 h-12 flex items-center gap-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 active:scale-95 border border-pink-400 rounded-lg text-white font-arcade text-xs select-none shadow-lg shadow-pink-600/30 transition-transform"
          >
            <Zap className="w-4 h-4" />
            FIRE
          </button>
        </div>
      </div>
    </div>
  );
}
