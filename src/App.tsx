/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

const GRID_SIZE = 20;
const CELL_PERCENT = 100 / GRID_SIZE;

const TRACKS = [
  { id: 1, title: "SECTOR_1_OVERRIDE.WAV", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: 2, title: "CYBER_CONSTRUCT_BETA.MP3", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: 3, title: "VOID_TRANSMISSION.FLAC", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" }
];

type Point = { x: number; y: number };

export default function App() {
  // Game State
  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Point>({ x: 15, y: 10 });
  const directionRef = useRef<Point>({ x: 0, y: -1 });
  const [gameOver, setGameOver] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // Music State
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // --- Music Player Logic ---
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.error("AUDIO_UPLINK_ERR", e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const nextTrack = useCallback(() => {
    setCurrentTrack((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  }, []);

  const prevTrack = () => {
    setCurrentTrack((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.play().catch(e => console.error("AUDIO_UPLINK_ERR", e));
    }
  }, [currentTrack, isPlaying]);

  // --- Game Logic ---
  const generateFood = (currentSnake: Point[]): Point => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      // eslint-disable-next-line no-loop-func
      if (!currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
        break;
      }
    }
    return newFood;
  };

  const startGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    directionRef.current = { x: 0, y: -1 };
    setFood(generateFood([{ x: 10, y: 10 }]));
    setGameOver(false);
    setIsGameStarted(true);
    setScore(0);
    if (!isPlaying) {
      togglePlay();
    }
  };

  const gameLoop = useCallback(() => {
    if (!isGameStarted || gameOver) return;

    setSnake(prev => {
      const head = prev[0];
      const newHead = {
        x: head.x + directionRef.current.x,
        y: head.y + directionRef.current.y
      };

      // Wall collision
      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        setGameOver(true);
        return prev;
      }

      // Self collision
      if (prev.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setGameOver(true);
        return prev;
      }

      const newSnake = [newHead, ...prev];

      // Food collision
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => {
          const newScore = s + 10;
          if (newScore > highScore) setHighScore(newScore);
          return newScore;
        });
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [isGameStarted, gameOver, food, highScore]);

  useEffect(() => {
    const interval = setInterval(gameLoop, 100);
    return () => clearInterval(interval);
  }, [gameLoop]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ' && (!isGameStarted || gameOver)) {
        startGame();
        return;
      }

      const { x, y } = directionRef.current;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (y !== 1) directionRef.current = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (y !== -1) directionRef.current = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (x !== 1) directionRef.current = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (x !== -1) directionRef.current = { x: 1, y: 0 };
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameStarted, gameOver]);

  return (
    <div className="min-h-screen crt-flicker flex flex-col items-center py-8 px-4 relative">
      <div className="static-noise"></div>
      <div className="scanlines"></div>
      
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={TRACKS[currentTrack].url}
        onEnded={nextTrack}
      />

      {/* Header */}
      <header className="mb-8 text-center z-10 w-full max-w-6xl">
        <h1 className="text-5xl md:text-7xl font-mono glitch-text tracking-tighter mb-2" data-text="SYS.SNAKE_PROTOCOL">
          SYS.SNAKE_PROTOCOL
        </h1>
        <div className="h-1 w-full bg-[#ff00ff] mb-1"></div>
        <div className="h-0.5 w-full bg-[#00ffff]"></div>
        <p className="text-[#00ffff] mt-4 font-mono text-lg tracking-widest">
          STATUS: <span className="animate-pulse text-[#ff00ff]">ONLINE</span> // AWAITING_INPUT
        </p>
      </header>

      <div className="flex flex-col xl:flex-row items-center xl:items-start justify-center gap-8 w-full max-w-6xl z-10">
        
        {/* Left Panel: Score & Stats */}
        <div className="w-full max-w-sm xl:w-64 flex flex-col gap-6 order-2 xl:order-1">
          <div className="bg-black brutal-border p-6">
            <h2 className="text-2xl font-mono text-[#ff00ff] mb-4 border-b-2 border-[#ff00ff] pb-2">DATA_YIELD</h2>
            <div className="space-y-6">
              <div>
                <p className="text-[#00ffff] text-sm tracking-widest mb-1">CURRENT_YIELD</p>
                <p className="text-4xl font-mono text-white glitch-text">
                  {score.toString().padStart(4, '0')}
                </p>
              </div>
              <div>
                <p className="text-[#00ffff] text-sm tracking-widest mb-1">MAX_YIELD</p>
                <p className="text-4xl font-mono text-[#ff00ff]">
                  {highScore.toString().padStart(4, '0')}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-black brutal-border-magenta p-6 text-sm">
            <h3 className="text-[#00ffff] text-xl mb-4 border-b-2 border-[#00ffff] pb-2">INPUT_VECTORS</h3>
            <ul className="space-y-3 font-mono text-white">
              <li>[W,A,S,D] : OVERRIDE_DIR</li>
              <li>[ARROWS]  : OVERRIDE_DIR</li>
              <li>[SPACE]   : EXECUTE_RUN</li>
            </ul>
          </div>
        </div>

        {/* Center Panel: Game Board */}
        <div className="order-1 xl:order-2">
          <div className="relative w-[min(100vw-2rem,400px)] h-[min(100vw-2rem,400px)] bg-[#050505] brutal-border overflow-hidden">
            
            {/* Grid Background Pattern */}
            <div className="absolute inset-0 opacity-30" 
                 style={{ backgroundImage: 'linear-gradient(#00ffff 1px, transparent 1px), linear-gradient(90deg, #00ffff 1px, transparent 1px)', backgroundSize: `${CELL_PERCENT}% ${CELL_PERCENT}%` }}>
            </div>

            {/* Snake */}
            {snake.map((segment, index) => {
              const isHead = index === 0;
              return (
                <div
                  key={index}
                  className={`absolute ${isHead ? 'bg-[#00ffff] z-10' : 'bg-black border border-[#00ffff]'}`}
                  style={{
                    left: `${segment.x * CELL_PERCENT}%`,
                    top: `${segment.y * CELL_PERCENT}%`,
                    width: `${CELL_PERCENT}%`,
                    height: `${CELL_PERCENT}%`,
                  }}
                />
              );
            })}

            {/* Food */}
            <div
              className="absolute bg-[#ff00ff] border border-white animate-pulse"
              style={{
                left: `${food.x * CELL_PERCENT}%`,
                top: `${food.y * CELL_PERCENT}%`,
                width: `${CELL_PERCENT}%`,
                height: `${CELL_PERCENT}%`,
              }}
            />

            {/* Overlays */}
            {!isGameStarted && !gameOver && (
              <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-20 p-4 text-center">
                <div className="text-[#00ffff] text-2xl mb-6 glitch-text">SYSTEM_READY</div>
                <button 
                  onClick={startGame}
                  className="btn-glitch px-8 py-4 text-xl font-bold"
                >
                  [ INITIALIZE ]
                </button>
              </div>
            )}

            {gameOver && (
              <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-20 p-4 text-center">
                <h2 className="text-5xl font-mono text-[#ff00ff] mb-2 glitch-text">FATAL_ERR</h2>
                <p className="text-white font-mono mb-8 text-xl">YIELD: {score}</p>
                <button 
                  onClick={startGame}
                  className="btn-glitch-magenta px-8 py-4 text-xl font-bold"
                >
                  [ REBOOT ]
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Music Player */}
        <div className="w-full max-w-sm xl:w-80 order-3">
          <div className="bg-black brutal-border p-6">
            <div className="flex items-center justify-between mb-6 border-b-2 border-[#00ffff] pb-2">
              <h2 className="text-2xl font-mono text-[#00ffff]">AUDIO_UPLINK</h2>
              
              {/* Harsh Visualizer */}
              <div className="flex items-end gap-1 h-8 w-16">
                {[0, 1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    className={`w-2 bg-[#ff00ff] ${isPlaying ? 'animate-eq-harsh' : 'h-[10%]'}`}
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            </div>

            <div className="bg-[#050505] border border-[#ff00ff] p-4 mb-6">
              <p className="text-[#ff00ff] text-xs tracking-widest mb-2">ACTIVE_STREAM</p>
              <p className="text-white font-mono text-lg truncate" title={TRACKS[currentTrack].title}>
                &gt; {TRACKS[currentTrack].title}
              </p>
              <p className="text-[#00ffff] text-xs mt-2">INDEX: 0{currentTrack + 1} / 0{TRACKS.length}</p>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between gap-2 mb-8">
              <button 
                onClick={prevTrack}
                className="btn-glitch px-4 py-2"
              >
                &lt;&lt;
              </button>
              
              <button 
                onClick={togglePlay}
                className="btn-glitch-magenta px-6 py-2 flex-1"
              >
                {isPlaying ? '[ HALT ]' : '[ EXEC ]'}
              </button>
              
              <button 
                onClick={nextTrack}
                className="btn-glitch px-4 py-2"
              >
                &gt;&gt;
              </button>
            </div>

            {/* Volume */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs text-[#00ffff]">
                <span>AMP_LEVEL</span>
                <span>{Math.round((isMuted ? 0 : volume) * 100)}%</span>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setIsMuted(!isMuted)} className="text-[#ff00ff] hover:text-white">
                  {isMuted || volume === 0 ? '[X]' : '[O]'}
                </button>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.01" 
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(parseFloat(e.target.value));
                    if (isMuted) setIsMuted(false);
                  }}
                  className="w-full h-2 bg-[#050505] border border-[#00ffff] appearance-none cursor-pointer accent-[#ff00ff]"
                />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
