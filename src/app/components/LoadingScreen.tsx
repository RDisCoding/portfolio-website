'use client'

import { useState, useEffect } from 'react'

interface LoadingScreenProps {
  isLoading: boolean
}

export default function LoadingScreen({ isLoading }: LoadingScreenProps) {

  const [progress, setProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [animationDone, setAnimationDone] = useState(false)

  useEffect(() => {
    let animationFrame: number;
    let timeout: NodeJS.Timeout;
    if (isLoading) {
      setIsVisible(true);
      setAnimationDone(false);
      setProgress(0);
      const start = performance.now();
      const duration = 1200; // ms
      function animate(now: number) {
        const elapsed = now - start;
        const percent = Math.min(100, (elapsed / duration) * 100);
        setProgress(percent);
        if (percent < 100) {
          animationFrame = requestAnimationFrame(animate);
        } else {
          setAnimationDone(true);
        }
      }
      animationFrame = requestAnimationFrame(animate);
    } else if (!isLoading && isVisible) {
      setProgress(100);
      timeout = setTimeout(() => {
        setIsVisible(false);
        setAnimationDone(false);
        setProgress(0);
      }, 400);
    }
    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      if (timeout) clearTimeout(timeout);
    };
  }, [isLoading, isVisible]);

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-xl transition-opacity duration-300"
      style={{ 
        opacity: isLoading ? 1 : 0,
        backgroundColor: 'rgba(0, 0, 0, 0.95)'
      }}
    >
      <div className="w-full max-w-2xl px-4 sm:px-8">
        {/* Loading Text */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4 bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent font-mono tracking-tight">
            Loading...
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-400 font-mono">
            Please wait...
          </p>
        </div>

        {/* Progress Bar Container */}

        <div className="relative w-full h-3 sm:h-4 bg-gray-800/50 border border-gray-700/50 rounded-full overflow-hidden">
          {/* Progress Bar - Single smooth transition */}
          <div
            className="h-full bg-gradient-to-r from-purple-600 via-purple-500 to-purple-400 rounded-full shadow-[0_0_30px_rgba(147,51,234,0.8)]"
            style={{
              width: `${Math.min(progress, 100)}%`,
              transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)'
            }}
          />
          {/* Shimmer Effect - only while animating */}
          {!animationDone && (
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)',
                animation: 'shimmer 1.2s linear infinite',
                zIndex: 2
              }}
            />
          )}
        </div>

        {/* Progress Percentage */}
        <div className="text-center mt-4 sm:mt-6">
          <span className="text-xl sm:text-2xl font-bold text-purple-400 font-mono">
            {Math.round(Math.min(progress, 100))}%
          </span>
        </div>
      </div>
    </div>
  )
}
