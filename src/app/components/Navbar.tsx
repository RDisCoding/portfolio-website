'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

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
    <>
      <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${isScrolled ? 'bg-black/30 backdrop-blur-xl border-b border-white/10' : 'bg-transparent'} ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex items-center justify-between md:justify-center h-16 md:h-20">
            
            {/* Logo/Brand - Mobile only */}
            <div className="md:hidden flex items-center">
              <span className="text-purple-400 font-bold text-xl font-mono"></span>
            </div>

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

            {/* Mobile menu button - Top Right Corner */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="relative text-gray-300 hover:text-purple-400 focus:outline-none focus:text-purple-400 p-2.5 rounded-lg transition-all duration-300 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50"
                aria-label="Toggle menu"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Drawer - Slide from Right */}
      <div
        className={`fixed inset-0 z-[60] md:hidden transition-opacity duration-300 ${
          isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>

        {/* Drawer Panel */}
        <div
          className={`absolute top-0 right-0 h-full w-[280px] bg-[#0d1117] border-l border-purple-500/30 shadow-2xl transform transition-transform duration-300 ease-out ${
            isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/10 bg-gradient-to-r from-purple-900/20 to-purple-600/10">
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-lg">Menu</span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-gray-400 hover:text-purple-400 p-2 rounded-lg transition-all duration-200 hover:bg-white/5"
              aria-label="Close menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)]">
            {sections.map((section, index) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className="group text-gray-300 hover:text-white px-4 py-3.5 rounded-lg text-base font-mono font-medium w-full text-left transition-all duration-300 hover:bg-gradient-to-r hover:from-purple-600/20 hover:to-purple-500/10 border border-transparent hover:border-purple-500/30 flex items-center gap-3"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 group-hover:scale-150 transition-transform duration-300"></span>
                <span className="flex-1">{section.label}</span>
                <span className="text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">→</span>
              </button>
            ))}
          </div>

          {/* Resume Button at Bottom */}
          {resumeUrl && (
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-gradient-to-t from-[#0d1117] to-transparent">
              <a
                href={resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="flex items-center justify-center gap-2 w-full px-4 py-3.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-lg font-mono font-bold text-base transition-all duration-300 shadow-lg hover:shadow-purple-500/50 border border-purple-400/30"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Resume
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
