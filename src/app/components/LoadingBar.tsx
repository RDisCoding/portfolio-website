'use client'

import { useState, useEffect } from 'react'

interface LoadingBarProps {
  isLoading: boolean
}

export default function LoadingBar({ isLoading }: LoadingBarProps) {
  const [progress, setProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isLoading) {
      setIsVisible(true)
      setProgress(0)
      
      // Start animation to 100% after a brief delay
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setProgress(100)
        })
      })
    } else {
      // Hide the bar when loading finishes
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
        className="h-full bg-gradient-to-r from-purple-600 via-purple-500 to-purple-400 shadow-lg"
        style={{
          width: `${progress}%`,
          transition: 'width 3s linear',
          boxShadow: '0 0 10px rgba(147, 51, 234, 0.8)'
        }}
      />
    </div>
  )
}