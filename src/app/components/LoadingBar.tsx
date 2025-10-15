'use client'

import { useState, useEffect, useRef } from 'react'

interface LoadingBarProps {
  isLoading: boolean
}

export default function LoadingBar({ isLoading }: LoadingBarProps) {
  const [progress, setProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isLoading) {
      setIsVisible(true)
      setProgress(0)
      
      // Smooth, consistent progress increment
      let currentProgress = 0
      intervalRef.current = setInterval(() => {
        currentProgress += 1.5
        
        if (currentProgress >= 90) {
          // Slow down near completion
          if (intervalRef.current) clearInterval(intervalRef.current)
        } else {
          setProgress(currentProgress)
        }
      }, 50)

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current)
      }
    } else {
      // Quickly complete to 100% when loading finishes
      setProgress(100)
      const timeout = setTimeout(() => {
        setIsVisible(false)
        setProgress(0)
      }, 400)
      return () => clearTimeout(timeout)
    }
  }, [isLoading])

  if (!isVisible) return null

  return (
    <div className="fixed top-0 left-0 w-full h-1 bg-transparent z-50">
      <div
        className="h-full bg-gradient-to-r from-purple-600 via-purple-500 to-purple-400 transition-all duration-200 ease-linear shadow-lg"
        style={{
          width: `${Math.min(progress, 100)}%`,
          boxShadow: '0 0 10px rgba(147, 51, 234, 0.8)'
        }}
      />
    </div>
  )
}