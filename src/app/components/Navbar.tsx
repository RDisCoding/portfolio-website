'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLoading } from './ClientWrapper'

interface NavbarProps {
  resumeUrl: string | null;
}

export default function Navbar({ resumeUrl }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const pathname = usePathname()
  const router = useRouter()
  const { startPageTransition } = useLoading()

  const sections = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'skills', label: 'Skills' },
    { id: 'projects', label: 'Projects' },
    { id: 'academics', label: 'Academics' },
    { id: 'cocurriculars', label: 'Activities' },
    { id: 'testimonials', label: 'Testimonials' },
    { id: 'contact', label: 'Contact' }
  ]

  const scrollToSection = (id: string) => {
    // If we're on the home page, just scroll
    if (pathname === '/') {
      const element = document.getElementById(id)
      element?.scrollIntoView({ behavior: 'smooth' })
      setIsMobileMenuOpen(false)
      return
    }
    
    // If we're on another page, navigate to home with hash
    // Use router.push to prevent unnecessary loading screens
    router.push(`/#${id}`)
    setIsMobileMenuOpen(false)
  }

  const navigateToHome = () => {
    if (pathname !== '/') {
      startPageTransition()
      router.push('/')
    } else {
      scrollToSection('home')
    }
    setIsMobileMenuOpen(false)
  }

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      if (currentScrollY > 10) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }

      // Hide/show navbar based on scroll direction with immediate upward response
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down
        setIsVisible(false)
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up - show immediately
        setIsVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [lastScrollY])

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${isScrolled ? 'bg-black/30 backdrop-blur-xl border-b border-white/10' : 'bg-transparent'} ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex items-center justify-center h-20">
          
          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-10">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className="text-gray-300 hover:text-purple-400 px-3 py-2 text-base font-mono font-medium transition-colors duration-200 rounded-lg"
                >
                  {section.label}
                </button>
              ))}
              {resumeUrl && (
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="text-gray-300 hover:text-purple-400 px-3 py-2 text-base font-mono font-medium transition-colors duration-200 rounded-lg"
                >
                  Resume
                </a>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-300 hover:text-purple-400 focus:outline-none focus:text-purple-400 p-2 rounded-lg transition-colors duration-200"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-white/10">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-black/80 backdrop-blur-xl">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className="text-gray-300 hover:text-purple-400 block px-3 py-2 rounded-lg text-lg font-mono font-medium w-full text-left transition-colors duration-200"
                >
                  {section.label}
                </button>
              ))}
              {resumeUrl && (
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="text-gray-300 hover:text-purple-400 block px-3 py-2 rounded-lg text-lg font-mono font-medium w-full text-left transition-colors duration-200"
                >
                  Resume
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
