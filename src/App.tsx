/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Trophy, RefreshCw, Music, Terminal, Zap, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
type Position = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

interface Track {
  id: number;
  title: string;
  artist: string;
  duration: string;
  color: string;
}

// --- Constants ---
const GRID_SIZE = 20;
const INITIAL_SNAKE: Position[] = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
const INITIAL_DIRECTION: Direction = 'UP';
const GAME_SPEED = 120;

const TRACKS: Track[] = [
  { id: 1, title: "DATA_PULSE.EXE", artist: "UNIT_77", duration: "3:45", color: "text-cyan-400" },
  { id: 2, title: "VOID_SIGNAL.BIN", artist: "NULL_PINTER", duration: "4:20", color: "text-magenta-500" },
  { id: 3, title: "NEURAL_FLUX.SYS", artist: "VOID_WALK", duration: "2:55", color: "text-cyan-400" },
];

export default function App() {
  // --- Music Player State ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const currentTrack = TRACKS[currentTrackIndex];

  // --- Snake Game State ---
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Position>({ x: 5, y: 5 });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  
  const gameLoopRef = useRef<number | null>(null);

  // --- Game Logic ---
  const generateFood = useCallback((currentSnake: Position[]) => {
    let newFood: Position;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      const isOnSnake = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!isOnSnake) break;
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setFood(generateFood(INITIAL_SNAKE));
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
  };

  const moveSnake = useCallback(() => {
    if (gameOver || isPaused) return;

    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead = { ...head };

      switch (direction) {
        case 'UP': newHead.y -= 1; break;
        case 'DOWN': newHead.y += 1; break;
        case 'LEFT': newHead.x -= 1; break;
        case 'RIGHT': newHead.x += 1; break;
      }

      // Check collisions (walls)
      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        setGameOver(true);
        if (score > highScore) setHighScore(score);
        return prevSnake;
      }

      // Check collisions (self)
      if (prevSnake.some((segment, index) => index !== 0 && segment.x === newHead.x && segment.y === newHead.y)) {
        setGameOver(true);
        if (score > highScore) setHighScore(score);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check food
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 10);
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, gameOver, isPaused, score, highScore, generateFood]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (key === 'W' || key === 'ARROWUP') {
        if (direction !== 'DOWN') setDirection('UP');
      } else if (key === 'S' || key === 'ARROWDOWN') {
        if (direction !== 'UP') setDirection('DOWN');
      } else if (key === 'A' || key === 'ARROWLEFT') {
        if (direction !== 'RIGHT') setDirection('LEFT');
      } else if (key === 'D' || key === 'ARROWRIGHT') {
        if (direction !== 'LEFT') setDirection('RIGHT');
      } else if (e.key === ' ') {
        setIsPaused(p => !p);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [direction]);

  useEffect(() => {
    if (!gameOver && !isPaused) {
      gameLoopRef.current = window.setInterval(moveSnake, GAME_SPEED);
    } else {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    }
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [moveSnake, gameOver, isPaused]);

  // --- Music Controls ---
  const handlePlayPause = () => setIsPlaying(!isPlaying);
  const handleNext = () => setCurrentTrackIndex((currentTrackIndex + 1) % TRACKS.length);
  const handlePrev = () => setCurrentTrackIndex((currentTrackIndex - 1 + TRACKS.length) % TRACKS.length);

  return (
    <div className="min-h-screen bg-black text-cyan-400 font-mono flex flex-col items-center justify-center p-4 overflow-hidden relative selection:bg-magenta-500/50">
      
      {/* CRT Overlay */}
      <div className="fixed inset-0 crttv z-[100] opacity-30 pointer-events-none" />

      {/* Decorative Glitch Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 z-0">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-magenta-500 animate-[bounce_0.2s_infinite]" />
        <div className="absolute top-[45%] left-0 w-full h-[2px] bg-cyan-400 animate-[pulse_0.1s_infinite]" />
        <div className="absolute bottom-[20%] left-0 w-full h-10 bg-magenta-900/20 blur-3xl" />
      </div>

      <div className="z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Left Side: Music Player */}
        <motion.div 
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-4 flex flex-col gap-10"
        >
          <div className="bg-black border-2 border-magenta-500 p-8 shadow-[10px_10px_0px_#ff00ff] relative group">
            <div className="absolute -top-4 -left-4 bg-magenta-500 text-black px-4 py-1 text-[10px] font-pixel uppercase">
              SIGNAL_INPUT
            </div>
            
            <div className="mb-10">
              <h2 className="text-2xl font-pixel glitch-text tracking-widest break-all" data-text="OS-AUDIO.V01">
                OS-AUDIO.V01
              </h2>
              <div className="h-1 w-full bg-cyan-400 mt-2 scale-x-105 shadow-[0_0_10px_#00ffff]" />
            </div>

            {/* Visualizer Placeholder */}
            <div className="aspect-square w-full bg-slate-900/50 border-2 border-cyan-500/30 mb-8 flex items-center justify-center relative overflow-hidden group-hover:border-magenta-500 transition-colors">
              <div className="absolute inset-0 flex items-center justify-center gap-1.5 px-4">
                {Array.from({ length: 16 }).map((_, i) => (
                  <motion.div
                    key={i}
                    animate={isPlaying ? { height: [10, 80, 20, 90, 40] } : { height: 4 }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.04 }}
                    className="w-1.5 bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]"
                  />
                ))}
              </div>
              
              <AnimatePresence mode="wait">
                <motion.div 
                   key={currentTrack.id}
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -20 }}
                   className="absolute bottom-6 left-6 right-6 bg-black/90 p-4 border-l-4 border-magenta-500 shadow-[4px_4px_0px_rgba(255,0,255,0.2)]"
                >
                  <p className="text-[10px] font-pixel text-magenta-500 truncate mb-2">{currentTrack.title}</p>
                  <p className="text-[9px] text-cyan-500 uppercase tracking-tighter opacity-80">SOURCE: {currentTrack.artist}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
               <div className="h-0.5 w-full bg-slate-800 relative overflow-hidden">
                 <motion.div 
                   animate={isPlaying ? { x: ["-100%", "100%"] } : { x: "-100%" }}
                   transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                   className="absolute inset-0 w-1/3 bg-white blur-[1px]"
                 />
                 <div className="h-full bg-cyan-500 w-1/2 shadow-[0_0_8px_#00ffff]" />
               </div>
               <div className="flex justify-between mt-3 text-[9px] font-pixel text-slate-700 tracking-tighter">
                 <span>BUFF_START</span>
                 <span>{currentTrack.duration}</span>
               </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between gap-4">
              <button 
                onClick={handlePrev}
                className="p-4 bg-black border border-cyan-900 group-hover:border-cyan-500 hover:bg-magenta-500 hover:text-black transition-all active:translate-y-1"
                id="prev-btn"
              >
                <SkipBack className="w-5 h-5" />
              </button>
              <button 
                onClick={handlePlayPause}
                className="flex-1 h-16 bg-cyan-500 text-black border-2 border-black flex items-center justify-center hover:bg-magenta-500 transition-all font-pixel text-sm shadow-[6px_6px_0px_#ff00ff] active:translate-x-1 active:translate-y-1 active:shadow-none"
                id="play-pause-btn"
              >
                {isPlaying ? "HALT_PROC" : "INIT_BOOT"}
              </button>
              <button 
                onClick={handleNext}
                className="p-4 bg-black border border-cyan-900 group-hover:border-cyan-500 hover:bg-magenta-500 hover:text-black transition-all active:translate-y-1"
                id="next-btn"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            <div className="text-[8px] uppercase tracking-[0.4em] text-cyan-800 flex justify-between mt-8 font-bold">
              <span>ENCRYPTED_STREAM</span>
              <span className={isPlaying ? "animate-pulse text-magenta-600" : ""}>{isPlaying ? "RX_STABLE" : "IDLE"}</span>
            </div>
          </div>
          
          {/* Track List */}
          <div className="bg-black border-2 border-cyan-500 p-4 max-h-[250px] overflow-y-auto scrollbar-hide shadow-[8px_8px_0px_#00ffff]">
             <div className="text-[10px] font-pixel text-cyan-900 mb-6 uppercase tracking-widest border-b border-cyan-900 pb-2">STORAGE_INDEX</div>
             {TRACKS.map((track, index) => (
               <button
                 key={track.id}
                 onClick={() => setCurrentTrackIndex(index)}
                 className={`w-full flex items-center gap-6 p-4 text-left transition-all border-b border-cyan-900/30 ${currentTrackIndex === index ? 'bg-cyan-500/20 border-l-4 border-l-magenta-500 text-white' : 'hover:bg-slate-900/50 text-cyan-700'}`}
               >
                 <div className="flex-1 min-w-0">
                   <p className="text-[10px] font-pixel truncate">{track.title}</p>
                 </div>
                 <div className={`w-2 h-2 rounded-full ${currentTrackIndex === index ? 'bg-magenta-500 animate-ping' : 'bg-slate-900'}`} />
               </button>
             ))}
          </div>
        </motion.div>

        {/* Center: Snake Game */}
        <motion.div 
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-8 flex flex-col gap-10"
        >
          <div className="bg-black border-4 border-cyan-500 p-10 shadow-[20px_20px_0px_#00ffff] relative overflow-hidden">
            
            {/* Background Static Pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#00ffff 0.5px, transparent 0.5px)', backgroundSize: '10px 10px' }} />

            <div className="absolute -top-6 right-10 bg-cyan-500 text-black px-8 py-3 text-xs font-pixel shadow-[6px_6px_0px_#ff00ff] z-20">
              NODE_SNAKE.SYS
            </div>

            {/* Game Header */}
            <div className="flex flex-wrap items-end justify-between mb-12 gap-8 border-b border-cyan-900 pb-12 z-10 relative">
              <div className="flex items-center gap-16">
                <div className="relative">
                  <p className="text-[10px] uppercase font-pixel text-magenta-500 mb-6 tracking-tighter">DATA_RECOVERED (HEX)</p>
                  <p className="text-7xl font-black font-mono text-cyan-400 drop-shadow-[0_0_20px_#00ffff]">
                    0x{score.toString(16).padStart(4, '0').toUpperCase()}
                  </p>
                </div>
                <div className="relative">
                  <p className="text-[10px] uppercase font-pixel text-slate-800 mb-6 tracking-tighter">SEC_MAX_BUFF</p>
                  <p className="text-5xl font-black font-mono text-slate-900">
                    {highScore.toString().padStart(4, '0')}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <button 
                  onClick={resetGame}
                  className="px-8 py-4 bg-magenta-500 text-black font-pixel text-[10px] hover:bg-cyan-400 transition-colors shadow-[6px_6px_0px_#00ffff] active:shadow-none active:translate-x-1 active:translate-y-1 uppercase"
                  id="reset-game-btn"
                >
                  SYSTEM_REBOOT
                </button>
                <div className="flex gap-4">
                  <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-slate-900' : 'bg-green-500 shadow-[0_0_10px_#22c55e] animate-pulse'}`} />
                  <div className={`w-3 h-3 rounded-full ${gameOver ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-slate-900'}`} />
                </div>
              </div>
            </div>

            {/* Game Canvas / Grid */}
            <div 
              className="relative aspect-square w-full max-w-[600px] mx-auto bg-black border-[12px] border-cyan-900/30 overflow-hidden shadow-[inset_0_0_60px_rgba(0,255,255,0.2)] group"
              onClick={() => isPaused && !gameOver && setIsPaused(false)}
            >
              
              {/* Scanline / Grid Effect */}
              <div className="absolute inset-0 pointer-events-none z-30 opacity-40">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.4)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,4px_100%]" />
              </div>

              <div className="relative w-full h-full">
                {/* Food - Glitchy Magenta */}
                <motion.div 
                  initial={false}
                  animate={{ 
                    x: `${(food.x / GRID_SIZE) * 100}%`, 
                    y: `${(food.y / GRID_SIZE) * 100}%` 
                  }}
                  className="absolute w-[5%] h-[5%] p-1"
                >
                  <div className="w-full h-full bg-magenta-500 shadow-[0_0_20px_#ff00ff] animate-[ping_1.5s_infinite] opacity-90" />
                  <div className="absolute inset-0 bg-white opacity-40 blur-[4px]" />
                </motion.div>

                {/* Snake - Machine-like Blocks */}
                {snake.map((segment, i) => (
                  <motion.div 
                    key={`${i}-${segment.x}-${segment.y}`}
                    initial={false}
                    animate={{ 
                      x: `${(segment.x / GRID_SIZE) * 100}%`, 
                      y: `${(segment.y / GRID_SIZE) * 100}%` 
                    }}
                    className="absolute w-[5%] h-[5%] p-[1px] z-10"
                  >
                    <div className={`w-full h-full border border-black relative ${i === 0 ? 'bg-white shadow-[0_0_25px_#fff] scale-125 z-20' : 'bg-cyan-400 shadow-[0_0_12px_#00ffff]'}`}>
                       {i === 0 && <div className="absolute inset-0 bg-magenta-500 opacity-20 animate-pulse" />}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Overlays */}
              <AnimatePresence>
                {gameOver && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-magenta-600/95 flex flex-col items-center justify-center z-50 text-center p-12"
                  >
                    <motion.div
                      initial={{ scale: 0.7, rotate: -8 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="flex flex-col items-center"
                    >
                      <ShieldAlert className="w-24 h-24 text-black mb-8 animate-bounce" />
                      <h2 className="text-7xl font-pixel text-black mb-6 glitch-text tracking-tighter" data-text="FATAL_ERROR">FATAL_ERROR</h2>
                      <div className="bg-black text-magenta-500 font-bold px-6 py-2 mb-12 text-sm italic tracking-[0.2em]">
                         ACCESS_DENIED // BUFFER_OVERFLOW
                      </div>
                      <button 
                        onClick={resetGame}
                        className="px-16 py-8 bg-black text-cyan-400 font-pixel text-xl border-4 border-cyan-400 hover:bg-cyan-400 hover:text-black transition-all shadow-[25px_25px_0px_#000]"
                      >
                        RETRY_PAYLOAD
                      </button>
                    </motion.div>
                  </motion.div>
                )}

                {isPaused && !gameOver && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-[4px] flex items-center justify-center z-40 border-[12px] border-magenta-500/10"
                  >
                    <div className="flex flex-col items-center gap-10">
                      <div className="flex gap-4">
                         {Array.from({length: 3}).map((_, i) => (
                           <motion.div key={i} animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} className="w-4 h-4 bg-cyan-500 rounded-sm" />
                         ))}
                      </div>
                      <p className="font-pixel text-magenta-500 animate-pulse text-3xl tracking-widest">PROCESS_STALLED</p>
                      <button 
                        onClick={() => setIsPaused(false)}
                        className="w-32 h-32 bg-cyan-500 text-black flex items-center justify-center hover:scale-110 hover:rotate-90 transition-all shadow-[0_0_60px_rgba(0,255,255,0.4)] border-4 border-black group"
                      >
                        <Zap className="w-16 h-16 fill-current group-hover:scale-125 transition-transform" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Instruction Footer */}
            <div className="mt-16 flex flex-col items-center gap-6 border-t border-cyan-900/30 pt-10">
              <div className="flex gap-16 text-[10px] font-pixel text-cyan-900 tracking-tighter uppercase">
                <div className="flex items-center gap-4">
                  <div className="p-2 border border-cyan-900 text-cyan-500">W/A/S/D</div>
                  <span>V_DIR_MAP</span>
                </div>
                <div className="flex items-center gap-4">
                   <div className="p-2 border border-magenta-900 text-magenta-500">SPACE</div>
                  <span>HALT_SEQUENCE</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[9px] text-slate-800 font-pixel w-full justify-between mt-4">
                <span className="flex items-center gap-2"> <Terminal className="w-3 h-3" /> CONSOLE_READY</span>
                <span className="animate-pulse">STREAMING_UPLINK_00%</span>
              </div>
            </div>
          </div>
        </motion.div>

      </div>

      {/* Floating Status Bar / Footer */}
      <footer className="mt-20 w-full flex justify-between px-16 text-[9px] font-pixel text-slate-800 tracking-tighter z-20 uppercase">
        <div className="flex gap-10">
          <span className="text-magenta-950 font-bold border-r border-magenta-950 pr-10">ENTITY_ID: {Math.random().toString(16).slice(2, 10).toUpperCase()}</span>
          <span>NET_COORD: 34.22.88.NULL</span>
        </div>
        <div className="flex gap-10">
          <span className="text-cyan-900 animate-[pulse_0.5s_infinite]">LINK_ACTIVE</span>
          <span className="text-slate-900">VER_2.0.FINAL_STABLE</span>
        </div>
      </footer>
    </div>
  );
}
