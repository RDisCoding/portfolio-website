'use client'

import { useState, useEffect } from 'react'

interface LoadingScreenProps {
  isLoading: boolean
}

export default function LoadingScreen({ isLoading }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (isLoading) {
      setIsVisible(true)
      setProgress(0)
      
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            return prev + Math.random() * 1
          }
          return prev + Math.random() * 10 + 3
        })
      }, 150)

      return () => clearInterval(interval)
    } else {
      setProgress(100)
      const timeout = setTimeout(() => {
        setIsVisible(false)
        setProgress(0)
      }, 600)
      return () => clearTimeout(timeout)
    }
  }, [isLoading])

  if (!isVisible) return null

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-xl transition-opacity duration-500"
      style={{ 
        opacity: isLoading ? 1 : 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)'
      }}
    >
      <div className="w-full max-w-2xl px-8">
        {/* Loading Text */}
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent font-mono tracking-tight">
            Loading...
          </h2>
          <p className="text-lg text-gray-400 font-mono">
            Please wait...
          </p>
        </div>

        {/* Progress Bar Container */}
        <div className="relative w-full h-4 bg-gray-800/50 border border-gray-700/50 rounded-full overflow-hidden">
          {/* Progress Bar */}
          <div
            className="h-full bg-gradient-to-r from-purple-600 via-purple-500 to-purple-400 transition-all duration-300 ease-out rounded-full shadow-[0_0_30px_rgba(147,51,234,0.8)]"
            style={{
              width: `${Math.min(progress, 100)}%`
            }}
          />
          
          {/* Shimmer Effect */}
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            style={{
              animation: 'shimmer 1.5s infinite'
            }}
          />
        </div>

        {/* Progress Percentage */}
        <div className="text-center mt-6">
          <span className="text-2xl font-bold text-purple-400 font-mono">
            {Math.round(Math.min(progress, 100))}%
          </span>
        </div>
      </div>
    </div>
  )
}
