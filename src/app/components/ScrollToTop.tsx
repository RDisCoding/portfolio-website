'use client'

import { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false)

  // Show button when page is scrolled down
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', toggleVisibility)
    
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  // Scroll to top smoothly
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-40 p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg hover:shadow-[0_0_20px_rgba(147,51,234,0.8)] transition-all duration-300 transform hover:scale-110 group"
          aria-label="Scroll to top"
        >
          <ArrowUp 
            className="w-6 h-6 transition-transform group-hover:-translate-y-0" 
          />
          
          {/* Ripple effect on hover */}
          <span className="absolute inset-0 rounded-full bg-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
        </button>
      )}
    </>
  )
}
