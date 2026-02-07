'use client'

import { createContext, useContext } from 'react'
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
    // Return a no-op context to avoid breaking existing code
    return {
      isLoading: false,
      setLoading: () => { },
      startPageTransition: () => { }
    }
  }
  return context
}

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  // Simplified - no loading screen, direct render
  const setLoading = () => { }
  const startPageTransition = () => { }

  return (
    <LoadingContext.Provider value={{ isLoading: false, setLoading, startPageTransition }}>
      {children}
      <ScrollToTop />
    </LoadingContext.Provider>
  )
}
