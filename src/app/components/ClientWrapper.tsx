'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import LoadingScreen from './LoadingScreen'
import ScrollToTop from './ScrollToTop'

interface LoadingContextType {
  isLoading: boolean
  setLoading: (loading: boolean) => void
  startPageTransition: () => void
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export function useLoading() {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error('useLoading must be used within ClientWrapper')
  }
  return context
}

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const [previousPath, setPreviousPath] = useState<string>('')
  const pathname = usePathname()

  // Check if we're on a studio route
  const isStudioRoute = pathname.startsWith('/studio')

  // Handle initial mount
  useEffect(() => {
    setIsMounted(true)
    setPreviousPath(pathname)
    // For initial page load, hide loading after a brief delay
    // Skip loading screen entirely for studio routes
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, isStudioRoute ? 0 : 300) // Reduced from 500ms to 300ms
    return () => clearTimeout(timer)
  }, [isStudioRoute, pathname])

  // Handle route changes - only show loading when actually navigating between pages
  useEffect(() => {
    if (!isMounted || previousPath === pathname || isStudioRoute) return
    
    // Only show loading for actual page navigation (not hash changes)
    const isPreviousHomePage = previousPath === '/' || previousPath.startsWith('/#')
    const isCurrentHomePage = pathname === '/' || pathname.startsWith('/#')
    
    // If both are the same base page (ignoring hash), don't show loading
    if (isPreviousHomePage && isCurrentHomePage) {
      setPreviousPath(pathname)
      return
    }
    
    // Show loading screen for actual page transitions
    setIsLoading(true)
    
    // Reduced loading screen duration for faster transitions
    const timer = setTimeout(() => {
      setIsLoading(false)
      setPreviousPath(pathname)
    }, 400) // Reduced from 1000ms to 400ms
    
    return () => clearTimeout(timer)
  }, [pathname, isMounted, isStudioRoute, previousPath])

  const setLoading = (loading: boolean) => {
    setIsLoading(loading)
  }

  const startPageTransition = () => {
    setIsLoading(true)
  }

  return (
    <LoadingContext.Provider value={{ isLoading, setLoading, startPageTransition }}>
      {!isStudioRoute && <LoadingScreen isLoading={isLoading} />}
      <div style={{ opacity: (isLoading && !isStudioRoute) ? 0 : 1, transition: 'opacity 0.3s ease-in-out' }}>
        {children}
      </div>
      <ScrollToTop />
    </LoadingContext.Provider>
  )
}
