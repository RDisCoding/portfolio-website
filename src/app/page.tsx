'use client'

import { sanityClient } from '@/lib/sanity.client'
import { groq } from 'next-sanity'
import { PortableText } from '@portabletext/react'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'
import { useLoading } from '@/app/components/ClientWrapper'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useCallback, useRef } from 'react'
import type { AboutData, AcademicData, ProjectData, CocurricularData, TestimonialData } from '@/types'

// GROQ query to fetch data for homepage
const query = groq`{
  "about": *[_type == "about"][0],
  "academics": *[_type == "academics"] | order(order asc){
    _id,
    title,
    institution,
    year,
    score,
    order,
    semester,
    description,
    semesterImages[]{
      asset->{
        _id,
        url
      },
      alt
    }
  },
  "projects": *[_type == "project"] | order(order asc)[0...3]{
    _id,
    title,
    category,
    year,
    description,
    techStack,
    projectLink,
    docsLink,
    githubLink,
    images[]{
      asset->{
        _id,
        url
      },
      alt
    }
  },
  "allProjects": *[_type == "project"] | order(order asc),
  "cocurriculars": *[_type == "cocurricular"] | order(order asc)[0...3]{
    _id,
    activity,
    category,
    year,
    description,
    link,
    images[]{
      asset->{
        _id,
        url
      },
      alt
    }
  },
  "allCocurriculars": *[_type == "cocurricular"] | order(order asc),
  "testimonials": *[_type == "testimonial" && approved == true] | order(_createdAt desc)[0...3]{
    _id,
    name,
    role,
    company,
    testimonial,
    rating,
    _createdAt
  },
  "resumeURL": *[_type == "resume"][0].resumeFile.asset->url
}`

// Define TypeScript types for our data
interface SanityData {
  about: AboutData | null;
  academics: AcademicData[];
  projects: ProjectData[];
  allProjects: ProjectData[];
  cocurriculars: CocurricularData[];
  allCocurriculars: CocurricularData[];
  testimonials: TestimonialData[];
  resumeURL: string | null;
}

export default function Home() {
  const [data, setData] = useState<SanityData>({
    about: null,
    academics: [],
    projects: [],
    allProjects: [],
    cocurriculars: [],
    allCocurriculars: [],
    testimonials: [],
    resumeURL: null
  })
  const { setLoading } = useLoading()
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [currentImages, setCurrentImages] = useState<Array<{ asset?: { url: string }; alt?: string }>>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [animatedCards, setAnimatedCards] = useState<Set<number>>(new Set())
  const [timelineProgress, setTimelineProgress] = useState(0)
  const [selectedAcademic, setSelectedAcademic] = useState<AcademicData | CocurricularData | null>(null)
  const [projectImageIndices, setProjectImageIndices] = useState<{[key: string]: number}>({})
  const [cocurricularImageIndices, setCocurricularImageIndices] = useState<{[key: string]: number}>({})
  const testimonialScrollRef = useRef<HTMLDivElement>(null)
  const [isTestimonialPaused, setIsTestimonialPaused] = useState(false)

  // Type guard functions
  const isAcademicData = (item: AcademicData | CocurricularData | null): item is AcademicData => {
    return item !== null && 'title' in item
  }

  const isCocurricularData = (item: AcademicData | CocurricularData | null): item is CocurricularData => {
    return item !== null && 'activity' in item
  }

  // Helper function to get display name
  const getDisplayName = (item: AcademicData | CocurricularData | null): string => {
    if (!item) return 'Document'
    if (isAcademicData(item)) return item.title || 'Document'
    if (isCocurricularData(item)) return item.activity || 'Document'
    return 'Document'
  }

  // Helper function to get category name
  const getCategoryName = (item: AcademicData | CocurricularData | null): string => {
    if (!item) return 'Activity'
    if (isAcademicData(item)) return item.title || 'Academic'
    if (isCocurricularData(item)) return item.category || item.activity || 'Activity'
    return 'Activity'
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const result = await sanityClient.fetch(query)
        setData(result)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        // Reduced delay for faster initial loading
        setTimeout(() => {
          setLoading(false)
        }, 100) // Reduced from 200ms to 100ms
      }
    }
    fetchData()
    
    // Handle hash navigation on initial load
    if (window.location.hash) {
      setTimeout(() => {
        const id = window.location.hash.substring(1)
        const element = document.getElementById(id)
        element?.scrollIntoView({ behavior: 'smooth' })
      }, 200) // Reduced from 300ms to 200ms
    }
  }, [setLoading])

  // Auto-rotate project images
  useEffect(() => {
    const interval = setInterval(() => {
      setProjectImageIndices(prev => {
        const newIndices = { ...prev }
        data.projects?.forEach((project) => {
          if (project.images && project.images.length > 1) {
            const currentIndex = newIndices[project._id] || 0
            newIndices[project._id] = (currentIndex + 1) % project.images.length
          }
        })
        return newIndices
      })
    }, 3000) // Change image every 3 seconds

    return () => clearInterval(interval)
  }, [data.projects])

  // Auto-rotate co-curricular images
  useEffect(() => {
    const interval = setInterval(() => {
      setCocurricularImageIndices(prev => {
        const newIndices = { ...prev }
        data.cocurriculars?.forEach((item) => {
          if (item.images && item.images.length > 1) {
            const currentIndex = newIndices[item._id] || 0
            newIndices[item._id] = (currentIndex + 1) % item.images.length
          }
        })
        return newIndices
      })
    }, 3000) // Change image every 3 seconds

    return () => clearInterval(interval)
  }, [data.cocurriculars])

  // Image navigation functions wrapped in useCallback
  const nextImage = useCallback(() => {
    setCurrentImageIndex(prev => 
      prev < currentImages.length - 1 ? prev + 1 : 0
    )
  }, [currentImages.length])

  const prevImage = useCallback(() => {
    setCurrentImageIndex(prev => 
      prev > 0 ? prev - 1 : currentImages.length - 1
    )
  }, [currentImages.length])

  // Testimonial navigation functions
  const scrollTestimonials = useCallback((direction: 'left' | 'right') => {
    if (!testimonialScrollRef.current) return
    
    const scrollAmount = 450 // Adjust based on card width + gap
    const newScrollPosition = testimonialScrollRef.current.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount)
    
    testimonialScrollRef.current.scrollTo({
      left: newScrollPosition,
      behavior: 'smooth'
    })
  }, [])

  // Keyboard navigation for popup
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isPopupOpen) return
      
      switch (e.key) {
        case 'Escape':
          closeImagePopup()
          break
        case 'ArrowLeft':
          if (currentImages.length > 1) prevImage()
          break
        case 'ArrowRight':
          if (currentImages.length > 1) nextImage()
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isPopupOpen, currentImages.length, nextImage, prevImage])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const cardIndex = parseInt(entry.target.getAttribute('data-card-index') || '0')
            setAnimatedCards(prev => new Set(prev).add(cardIndex))
          }
        })
      },
      { threshold: 0.5, rootMargin: '0px 0px -150px 0px' }
    )

    // Observe timeline cards after component mounts
    const timelineCards = document.querySelectorAll('.timeline-card')
    timelineCards.forEach(card => observer.observe(card))

    return () => {
      timelineCards.forEach(card => observer.unobserve(card))
      observer.disconnect()
    }
  }, [data.academics])

  // Timeline scroll progress
  useEffect(() => {
    const handleTimelineScroll = () => {
      const timelineContainer = document.getElementById('timeline-container')
      if (!timelineContainer) return

      const containerRect = timelineContainer.getBoundingClientRect()
      const windowHeight = window.innerHeight
      const windowCenter = windowHeight / 2
      
      // Calculate progress only when the container is in the right viewport area
      if (containerRect.top <= windowCenter && containerRect.bottom >= windowCenter) {
        // Get only the timeline cards section height, exclude status card
        const timelineCards = timelineContainer.querySelectorAll('[data-timeline-card]')
        if (timelineCards.length === 0) return
        
        const lastCard = timelineCards[timelineCards.length - 1] as HTMLElement
        const lastCardRect = lastCard.getBoundingClientRect()
        const firstCardRect = timelineCards[0].getBoundingClientRect()
        
        // Calculate height from first to last card only
        const timelineHeight = lastCardRect.bottom - firstCardRect.top + containerRect.top
        const scrollableDistance = timelineHeight - windowHeight
        const scrolled = windowCenter - containerRect.top
        
        // Cap the progress at the last timeline card
        const maxScroll = lastCardRect.bottom - containerRect.top
        const cappedScroll = Math.min(scrolled, maxScroll)
        
        const scrollProgress = Math.max(0, Math.min(1, cappedScroll / scrollableDistance))
        
        // Only allow forward progress
        setTimelineProgress(prev => {
          if (scrollProgress > prev) {
            return scrollProgress
          }
          return prev
        })
      }
    }

    const throttledScroll = () => {
      requestAnimationFrame(handleTimelineScroll)
    }

    window.addEventListener('scroll', throttledScroll, { passive: true })
    handleTimelineScroll() // Initial call
    return () => window.removeEventListener('scroll', throttledScroll)
  }, [])

  const openImagePopup = (images: Array<{ asset?: { url: string }; alt?: string }>, startIndex: number = 0, academicItem: AcademicData | CocurricularData | null = null) => {
    setCurrentImages(images)
    setCurrentImageIndex(startIndex)
    setSelectedAcademic(academicItem)
    setIsPopupOpen(true)
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden'
  }

  const closeImagePopup = () => {
    setIsPopupOpen(false)
    setCurrentImages([])
    setCurrentImageIndex(0)
    setSelectedAcademic(null)
    // Re-enable body scroll when modal is closed
    document.body.style.overflow = 'unset'
  }

  // Technical skills list with relevant icons
  const technicalSkills = [
    { name: 'Artificial Intelligence', icon: '🤖', level: 'Advanced' },
    { name: 'Machine Learning', icon: '🧠', level: 'Advanced' },
    { name: 'Deep Learning', icon: '🔮', level: 'Advanced' },
    { name: 'Natural Language Processing', icon: '💬', level: 'Advanced' },
    { name: 'Prompt Engineering', icon: '⚡', level: 'Advanced' },
    { name: 'Digital Forensics', icon: '🔍', level: 'Intermediate' },
    { name: 'Python & Libraries', icon: '🐍', level: 'Advanced' },
    { name: 'Hadoop', icon: '🐘', level: 'Intermediate' },
    { name: 'Pig/Hive', icon: '🐽', level: 'Intermediate' },
    { name: 'GitHub', icon: '📋', level: 'Advanced' },
    { name: 'UI/UX', icon: '🎨', level: 'Intermediate' },
    { name: 'PostgreSQL', icon: '🗄️', level: 'Advanced' },
    { name: 'MongoDB', icon: '🍃', level: 'Advanced' },
    { name: 'ExpressAPI', icon: '🚀', level: 'Advanced' },
    { name: 'Sanity CMS', icon: '📝', level: 'Advanced' },
    { name: 'React', icon: '⚛️', level: 'Advanced' },
    { name: 'NextJS', icon: '▲', level: 'Advanced' },
    { name: 'JavaScript', icon: '🟨', level: 'Advanced' },
    { name: 'TypeScript', icon: '🔷', level: 'Advanced' },
    { name: 'Node.js', icon: '📦', level: 'Advanced' },
    { name: 'C', icon: '⚙️', level: 'Intermediate' },
    { name: 'C++', icon: '🔧', level: 'Intermediate' },
    { name: 'Java', icon: '☕', level: 'Intermediate' },
    { name: 'Solidity', icon: '💎', level: 'Intermediate' }
  ]

  return (
    <div className="min-h-screen text-white">
      {/* Animated Background */}
      <div className="animated-bg">
        <div className="orb orb1"></div>
        <div className="orb orb2"></div>
        <div className="orb orb3"></div>
        <div className="orb orb4"></div>
        <div className="orb orb5"></div>
      </div>

      <Navbar resumeUrl={data.resumeURL} />
      
      {/* Hero/Landing Section */}

      <section id="home" className="min-h-screen flex items-center justify-center px-2 sm:px-4 py-16 sm:py-20">
        <div className="text-center w-full max-w-2xl sm:max-w-3xl md:max-w-4xl mx-auto flex flex-col items-center">
          <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold mb-3 sm:mb-5 bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent animate-[fadeInScale_1s_ease-out] leading-tight break-words">
            Crafting Digital<br />
            <span className="block text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl mt-1 font-bold">Experiences</span>
          </h1>
          <p className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl text-gray-400 mb-4 sm:mb-6 md:mb-8 animate-[fadeInUp_1s_ease-out_0.3s_both] px-1 sm:px-2">
            Full Stack Developer specializing in modern web applications
          </p>
          <p className="text-xs xs:text-sm sm:text-base md:text-lg text-gray-500 mb-6 sm:mb-8 md:mb-10 animate-[fadeInUp_1s_ease-out_0.4s_both] px-1 sm:px-2">
            Creating innovative solutions with cutting-edge technology
          </p>
          {data.resumeURL ? (
            <a 
              href={data.resumeURL}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="inline-block w-full max-w-xs sm:max-w-sm md:max-w-md px-6 sm:px-8 md:px-10 py-3 sm:py-3.5 md:py-4 bg-transparent border-2 border-purple-600 text-white text-base sm:text-lg font-bold uppercase tracking-wide rounded-lg hover:bg-purple-600 transition-all duration-300 relative overflow-hidden group animate-[fadeInUp_1s_ease-out_0.6s_both] focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <span className="relative z-10">Download Resume</span>
              <div className="absolute inset-0 bg-purple-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-lg"></div>
            </a>
          ) : (
            <a 
              href="#about"
              className="inline-block w-full max-w-xs sm:max-w-sm md:max-w-md px-6 sm:px-8 md:px-10 py-3 sm:py-3.5 md:py-4 bg-transparent border-2 border-purple-600 text-white text-base sm:text-lg font-bold uppercase tracking-wide rounded-lg hover:bg-purple-600 transition-all duration-300 relative overflow-hidden group animate-[fadeInUp_1s_ease-out_0.6s_both] focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <span className="relative z-10">View My Work</span>
              <div className="absolute inset-0 bg-purple-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-lg"></div>
            </a>
          )}
        </div>
      </section>
      
      <main className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">

          {/* About Section */}
          <section id="about" className="py-16 sm:py-20 md:py-24">
            <div className="text-center mb-12 sm:mb-14 md:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent font-mono tracking-tight px-2">About Me</h2>
            </div>
            
            <div className="about-container w-full max-w-7xl mx-auto bg-white/3 backdrop-blur-lg border border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 lg:p-12 grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-8 sm:gap-10 md:gap-12 transition-all duration-300 hover:bg-white/5 hover:border-purple-500/50 hover:shadow-[0_20px_80px_rgba(147,51,234,0.3)]">
              
              {/* Left Column - Profile and Info */}
              <div className="flex flex-col gap-6 sm:gap-8 items-center xl:items-start">
                {/* Profile Photo */}
                <div className="flex justify-center w-full">
                  {data.about?.profileImage ? (
                    <Image 
                      src={data.about.profileImage} 
                      alt="Profile" 
                      width={224}
                      height={224}
                      className="w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 rounded-full border-4 border-purple-500/50 object-cover shadow-[0_20px_60px_rgba(147,51,234,0.5)] animate-pulse" 
                    />
                  ) : (
                    <div className="w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 rounded-full border-4 border-purple-500/50 bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center text-5xl sm:text-6xl font-extrabold text-white shadow-[0_20px_60px_rgba(147,51,234,0.5)] animate-pulse">
                      {data.about?.name ? data.about.name[0] : '<>'}
                    </div>
                  )}
                </div>

                {/* Name and Info */}
                <div className="text-center xl:text-left w-full">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-6 sm:mb-8 bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">
                    {data.about?.name}
                  </h1>
                  
                  <div className="space-y-3 sm:space-y-4">
                    <div className="info-item">
                      <div className="text-xs sm:text-sm text-gray-500 uppercase tracking-wider mb-1.5 sm:mb-2">Education</div>
                      <div className="text-white text-sm sm:text-base">{data.about?.education || 'Computer Science'}</div>
                    </div>
                    <div className="info-item">
                      <div className="text-xs sm:text-sm text-gray-500 uppercase tracking-wider mb-1.5 sm:mb-2">Email</div>
                      <div className="text-white text-sm sm:text-base break-all">{data.about?.email}</div>
                    </div>
                    <div className="info-item">
                      <div className="text-xs sm:text-sm text-gray-500 uppercase tracking-wider mb-1.5 sm:mb-2">Location</div>
                      <div className="text-white text-sm sm:text-base">{data.about?.location}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Biography and Status */}
              <div className="flex flex-col gap-6 sm:gap-8">
                {/* Biography */}
                <div className="bg-white/2 border border-white/8 rounded-xl sm:rounded-2xl p-6 sm:p-7 md:p-8 hover:bg-purple-600/5 hover:border-purple-500/30 transition-all duration-300">
                  <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-5 md:mb-6">
                    <h2 className="text-2xl sm:text-2xl md:text-3xl font-bold text-white">Biography</h2>
                  </div>
                  <div className="text-gray-400 leading-relaxed space-y-3 sm:space-y-4 text-base sm:text-lg">
                    {data.about?.biography ? (
                      <PortableText value={data.about.biography} />
                    ) : (
                      <>
                        <p>Passionate full-stack developer with experience building scalable web applications and creating exceptional user experiences.</p>
                        <p>I thrive on solving complex problems and turning innovative ideas into reality, always focusing on delivering high-quality solutions.</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Bottom Row - Interests and Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                  {/* Interests */}
                  <div className="bg-white/2 border border-white/8 rounded-xl sm:rounded-2xl p-6 sm:p-7 md:p-8 hover:bg-purple-600/5 hover:border-purple-500/30 transition-all duration-300">
                    <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5 md:mb-6">
                      <h3 className="text-white font-bold text-lg sm:text-xl">Interests</h3>
                    </div>
                    <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                      My primary interest lies in research and continual learning. I am passionate about applying my skills through various projects and exploring new technologies.
                    </p>
                  </div>

                  {/* Status */}
                  <div className="bg-white/2 border border-white/8 rounded-xl sm:rounded-2xl p-6 sm:p-7 md:p-8 hover:bg-purple-600/5 hover:border-purple-500/30 transition-all duration-300">
                    <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5 md:mb-6">
                      <h3 className="text-white font-bold text-lg sm:text-xl">Status</h3>
                    </div>
                    <p className="text-purple-400 text-sm sm:text-base leading-relaxed font-medium">
                      {'I am actively seeking opportunities to collaborate on innovative projects. Feel free to connect with me!'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Technical Skills Section */}
          <section id="skills" className="py-16 sm:py-20 md:py-24">
            <div className="text-center mb-12 sm:mb-14 md:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent px-2">Technical Skills</h2>
              <p className="text-gray-400 mt-3 sm:mt-4 text-base sm:text-lg md:text-xl px-2">Technologies I work with</p>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4 md:gap-5 max-w-7xl mx-auto">
              {technicalSkills.map((skill, index) => (
                <div 
                  key={index} 
                  className="glass-card p-2 sm:p-3 md:p-4 text-center group hover:scale-105 transition-all duration-300 flex flex-col justify-center items-center min-h-[90px] sm:min-h-[110px] md:min-h-[130px]"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="text-2xl sm:text-3xl md:text-4xl mb-1 sm:mb-2">{skill.icon}</div>
                  <div className="text-[10px] sm:text-xs md:text-sm font-semibold text-white mb-0.5 sm:mb-1 leading-tight px-1 line-clamp-2">{skill.name}</div>
                  <div className="text-[9px] sm:text-[10px] md:text-xs text-purple-400">
                    {skill.level}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Projects Section */}
          <section id="projects" className="py-16 sm:py-20 md:py-24">
            <div className="text-center mb-12 sm:mb-14 md:mb-16 px-2">
              <div className="text-purple-400 text-xs sm:text-sm md:text-base uppercase tracking-[2px] sm:tracking-[3px] font-semibold mb-3 sm:mb-4">Portfolio</div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">Featured Projects</h2>
              <p className="text-gray-400 mt-3 sm:mt-4 text-base sm:text-lg md:text-xl">A selection of my recent work</p>
            </div>
            
            <div className="flex flex-col gap-16 sm:gap-20 md:gap-24 lg:gap-32">
              {data.projects?.map((project, index) => (
                <div 
                  key={project._id} 
                  className={`grid lg:grid-cols-2 gap-8 sm:gap-12 md:gap-16 items-center ${index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''}`}
                >
                  {/* Project Details */}
                  <div className={`space-y-4 sm:space-y-5 md:space-y-6 ${index % 2 === 1 ? 'lg:col-start-2' : ''}`}>
                    <div className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black opacity-10 leading-none bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">
                      {(index + 1).toString().padStart(2, '0')}
                    </div>
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-tight -mt-2 sm:-mt-3 md:-mt-4">
                      {project.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <span className="inline-block bg-purple-900/20 border border-purple-600/30 text-purple-300 px-3 sm:px-4 py-1.5 sm:py-2 rounded-sm text-xs sm:text-sm font-semibold uppercase tracking-wider">
                        {project.category === 'research' && 'Research Work'}
                        {project.category === 'personal' && 'Personal Project'}
                        {project.category === 'hackathon' && 'Hackathon'}
                        {project.category === 'work' && 'Work Experience'}
                      </span>
                      {project.year && (
                        <span className="text-gray-400 text-xs sm:text-sm">
                          {project.year}
                        </span>
                      )}
                    </div>
                    <div className="text-gray-400 text-sm sm:text-base md:text-lg leading-relaxed">
                      {project.description && <PortableText value={project.description} />}
                    </div>
                    
                    {project.techStack && project.techStack.length > 0 && (
                      <div className="flex flex-wrap gap-2 sm:gap-3">
                        {project.techStack.map((tech: string, techIndex: number) => (
                          <span 
                            key={techIndex} 
                            className="bg-purple-900/10 border border-purple-600/20 text-purple-300 px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold uppercase tracking-wide hover:bg-purple-900/20 hover:border-purple-600/40 transition-all duration-300"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {(project.githubLink || project.projectLink) && (
                      <div className="flex flex-wrap gap-4 sm:gap-6 md:gap-8 pt-2 sm:pt-4">
                        {project.githubLink && (
                          <a 
                            href={project.githubLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-white font-bold flex items-center gap-2 transition-all duration-300 hover:translate-x-1 text-sm sm:text-base"
                          >
                            View Project <span>→</span>
                          </a>
                        )}
                        {project.projectLink && (
                          <a 
                            href={project.projectLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-white font-bold flex items-center gap-2 transition-all duration-300 hover:translate-x-1 text-sm sm:text-base"
                          >
                            Live Site <span>→</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Project Visual */}
                  <div className={`${index % 2 === 1 ? 'lg:col-start-1' : ''}`}>
                    <div className="relative h-64 sm:h-80 md:h-96 lg:h-[500px] group perspective-1000">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-purple-800/5 border border-purple-600/20 rounded-xl backdrop-blur-sm overflow-hidden transition-all duration-700 group-hover:scale-[1.02]">
                        {/* Project Image */}
                        {project.images && project.images.length > 0 ? (
                          <div className="relative w-full h-full">
                            <Image
                              src={project.images[projectImageIndices[project._id] || 0]?.asset?.url || '/placeholder.png'}
                              alt={project.images[projectImageIndices[project._id] || 0]?.alt || project.title}
                              fill
                              className="object-cover transition-all duration-700 group-hover:scale-110 animate-fadeIn"
                              key={projectImageIndices[project._id] || 0}
                              style={{
                                animation: 'fadeIn 0.6s ease-in-out'
                              }}
                            />
                            {/* Image overlay gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                            
                            {/* Image count badge */}
                            {project.images.length > 1 && (
                              <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-white flex items-center gap-2">
                                  <span>{(projectImageIndices[project._id] || 0) + 1} / {project.images.length}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          // Fallback animated background if no images
                          <>
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-transparent to-purple-800/20"></div>
                            <div className="absolute top-1/2 left-1/2 w-32 h-32 -translate-x-1/2 -translate-y-1/2 bg-gradient-radial from-purple-600/30 to-transparent rounded-full animate-pulse"></div>
                          </>
                        )}
                        
                        {/* Content overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 to-transparent">
                          <div className="flex gap-8">
                            {project.year && (
                              <div className="text-center">
                                <div className="text-2xl font-black text-purple-400">{project.year}</div>
                                <div className="text-xs text-gray-400 uppercase tracking-wide">Year</div>
                              </div>
                            )}
                            {project.techStack && project.techStack.length > 0 && (
                              <div className="text-center">
                                <div className="text-2xl font-black text-purple-400">{project.techStack.length}+</div>
                                <div className="text-xs text-gray-400 uppercase tracking-wide">Technologies</div>
                              </div>
                            )}
                            {project.projectLink && (
                              <div className="text-center">
                                <div className="text-2xl font-black text-purple-400">🔗</div>
                                <div className="text-xs text-gray-400 uppercase tracking-wide">Live</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-24">
              <Link 
                href="/projects"
                className="inline-block px-12 py-4 bg-transparent border-2 border-purple-600 text-white font-bold uppercase tracking-wide hover:bg-purple-600 transition-all duration-300 relative overflow-hidden group"
              >
                <span className="relative z-10">View All Projects</span>
                <div className="absolute inset-0 bg-purple-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </Link>
            </div>
          </section>

          {/* Academics Section */}
          <section id="academics" className="py-16 sm:py-20 md:py-24 px-4">
            <div className="text-center mb-12 sm:mb-14 md:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">Academic Journey</h2>
              <div className="w-16 sm:w-20 md:w-24 h-1 bg-gradient-to-r from-purple-600 to-purple-400 mx-auto"></div>
            </div>

            {/* Timeline - dynamic from backend */}
            <div className="mt-12 sm:mt-14 md:mt-16" id="timeline-container">
              <div className="relative pb-20 sm:pb-24 md:pb-32">
                {/* Timeline Points */}
                <div className="space-y-12 sm:space-y-14 md:space-y-16 relative">
                  {/* Background Timeline Line - Only for academic cards */}
                  <div className="absolute left-4 sm:left-1/2 transform sm:-translate-x-1/2 w-0.5 sm:w-1 h-full bg-gray-700/30 rounded-full"></div>
                  {/* Animated Timeline Line - Builds as user scrolls */}
                  <div
                    className="absolute left-4 sm:left-1/2 transform sm:-translate-x-1/2 w-0.5 sm:w-1 bg-gradient-to-b from-purple-600 via-purple-500 to-purple-400 rounded-full transition-all duration-300 ease-out origin-top"
                    style={{
                      height: `${timelineProgress * 100}%`,
                      boxShadow: '0 0 20px rgba(147, 51, 234, 0.6)'
                    }}
                  ></div>
                  
                  {data.academics?.map((item, index) => {
                    const isEven = index % 2 === 0;
                    const isAnimated = animatedCards.has(index);
                    return (
                      <div
                        key={item._id}
                        className={`timeline-card relative flex items-center justify-start sm:${isEven ? 'justify-start' : 'justify-end'} transition-all duration-1000 ${
                          isAnimated
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-8'
                        }`}
                        data-card-index={index}
                        data-timeline-card="true"
                        style={{ transitionDelay: `${index * 100}ms` }}
                      >
                        {/* Timeline Dot */}
                        <div className={`absolute left-4 sm:left-1/2 transform -translate-x-1/2 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-purple-600 border-2 sm:border-3 md:border-4 border-purple-400 rounded-full z-10 shadow-lg shadow-purple-600/50 transition-all duration-700 ${
                          isAnimated ? 'scale-100' : 'scale-0'
                        }`}></div>
                        {/* Semester Card */}
                        <div className={`w-full pl-12 sm:pl-0 sm:w-11/12 md:w-5/12 ${isEven ? 'sm:mr-auto sm:pr-6 md:pr-8' : 'sm:ml-auto sm:pl-6 md:pl-8'}`}>
                          <div className={`relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 transition-all duration-700 hover:bg-white/10 hover:shadow-[0_20px_60px_-15px_rgba(147,51,234,0.3)] hover:border-purple-500/50 hover:scale-[1.03] ${
                            isAnimated
                              ? 'opacity-100 translate-y-0'
                              : 'opacity-0 translate-y-12'
                          }`}>
                            {/* Card Content */}
                            <div className={`relative z-10 text-left sm:${isEven ? 'text-right' : 'text-left'}`}>
                              <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 justify-between">
                                <span className="inline-block px-3 sm:px-4 py-1 bg-purple-600/20 border border-purple-500/30 rounded-full text-purple-300 text-xs sm:text-sm font-semibold uppercase tracking-wider">
                                  {item.year}
                                </span>
                                <div className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-400 animate-pulse shadow-lg shadow-green-400/50"></div>
                                  <span className="text-[10px] sm:text-xs text-gray-400 font-mono">Completed</span>
                                </div>
                              </div>
                              <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 sm:mb-4 tracking-tight">
                                {item.title || `Semester ${item.semester || index + 1}`}
                              </h3>
                              <div className="mt-4 sm:mt-5 md:mt-6">
                                <button
                                  onClick={() => openImagePopup(item.semesterImages || [], 0, item)}
                                  className="inline-block px-5 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 bg-transparent border-2 border-purple-600 text-white font-bold uppercase tracking-wide hover:bg-purple-600 transition-all duration-300 relative overflow-hidden group text-xs sm:text-sm"
                                >
                                  <span className="relative z-10">View Results</span>
                                  <div className="absolute inset-0 bg-purple-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                                </button>
                              </div>
                            </div>
                            {/* Decorative Glow */}
                            <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-radial from-purple-600/10 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Final Timeline Endpoint */}
                  {data.academics && data.academics.length > 0 && (
                    <div className="relative flex items-center justify-start sm:justify-center pt-12 sm:pt-14 md:pt-16 pl-12 sm:pl-0">
                      {/* End dot with glow - positioned on the left for mobile, center for desktop */}
                      <div className="absolute left-4 sm:left-1/2 sm:-translate-x-1/2 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-gradient-to-r from-purple-600 to-purple-400 rounded-full shadow-lg shadow-purple-600/50 flex items-center justify-center z-10">
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 bg-white rounded-full"></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Current Status Card - Outside timeline */}
              {data.academics && data.academics.length > 0 && (
                <div className="mt-0 max-w-2xl mx-auto px-2">
                  <div className="glass-card p-5 sm:p-6 md:p-8 text-center border-2 border-purple-500/30">
                    <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-5 md:mb-6">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-400 animate-pulse"></div>
                      <span className="text-xs sm:text-sm text-gray-400 uppercase tracking-wider font-semibold">Current Status</span>
                    </div>
                    
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2">Semester {data.academics.length + 1} - Ongoing</h3>
                    <p className="text-gray-400 text-sm sm:text-base mb-3 sm:mb-4">{Math.round((data.academics.length / 8) * 100)}% Complete</p>
                    <p className="text-purple-400 font-medium text-base sm:text-lg md:text-xl">{data.academics[data.academics.length-1]?.institution || "University"}</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Co-Curriculars Section */}
          <section id="cocurriculars" className="py-16 sm:py-20 md:py-24 px-4">
            <div className="text-center mb-12 sm:mb-14 md:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">Co-Curricular Activities</h2>
              <div className="w-16 sm:w-20 md:w-24 h-1 bg-gradient-to-r from-purple-600 to-purple-400 mx-auto"></div>
              <p className="text-gray-400 mt-3 sm:mt-4 text-base sm:text-lg md:text-xl">Beyond the classroom achievements</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 md:gap-8 mb-8 sm:mb-10 md:mb-12">
              {data.cocurriculars?.map((item) => {
                const currentImageIndex = cocurricularImageIndices[item._id] || 0
                return (
                  <div 
                    key={item._id} 
                    className="group relative h-[320px] sm:h-[360px] md:h-[400px] rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer"
                    onClick={() => item.images && item.images.length > 0 && openImagePopup(item.images, 0, item)}
                  >
                    {/* Background with Image */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-lg border border-white/10 transition-all duration-500 group-hover:scale-105 group-hover:border-purple-500/50">
                      {item.images && item.images.length > 0 && (
                        <div className="relative w-full h-full">
                          <Image
                            src={item.images[currentImageIndex]?.asset?.url || '/placeholder.png'}
                            alt={item.images[currentImageIndex]?.alt || item.activity}
                            fill
                            className="object-cover opacity-20 group-hover:opacity-30 transition-opacity duration-500 animate-fadeIn"
                          />
                        </div>
                      )}
                    </div>

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-purple-950/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-[1]"></div>

                    {/* Large Category Number (Design Template Style) */}
                    <div className="absolute top-4 sm:top-6 md:top-8 left-4 sm:left-6 md:left-8 text-6xl sm:text-7xl md:text-8xl font-extrabold bg-gradient-to-br from-white/30 to-purple-400/30 bg-clip-text text-transparent leading-none z-[2] select-none pointer-events-none">
                      {(data.cocurriculars?.indexOf(item) || 0) + 1 < 10 ? `0${(data.cocurriculars?.indexOf(item) || 0) + 1}` : (data.cocurriculars?.indexOf(item) || 0) + 1}
                    </div>

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 md:p-8 z-[2] transform translate-y-12 sm:translate-y-14 md:translate-y-16 group-hover:translate-y-0 transition-transform duration-500">
                      {/* Year Badge */}
                      {item.year && (
                        <div className="inline-block bg-purple-600/40 backdrop-blur-md px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm text-purple-200 border border-purple-500/50 font-semibold mb-2 sm:mb-3">
                          {item.year}
                        </div>
                      )}
                      
                      <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2 group-hover:text-purple-300 transition-colors duration-300 line-clamp-2">
                        {item.activity}
                      </h3>
                      
                      <span className="inline-block bg-purple-900/50 backdrop-blur-sm text-purple-300 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm border border-purple-700/70 capitalize mb-4 sm:mb-6 md:mb-8">
                        {item.category || 'Activity'}
                      </span>

                      {/* Description - Only visible on hover */}
                      {item.description && (
                        <div className="text-gray-300 text-xs sm:text-sm leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 prose prose-invert prose-sm max-w-none line-clamp-3">
                          {typeof item.description === 'string' ? (
                            <p>{item.description}</p>
                          ) : Array.isArray(item.description) ? (
                            <PortableText value={item.description} />
                          ) : (
                            <p>No description available</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Image Counter Badge */}
                    {item.images && item.images.length > 1 && (
                      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-xs text-white/80 border border-white/20 z-[3] font-mono">
                        {currentImageIndex + 1} / {item.images.length}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="text-center">
              <Link 
                href="/cocurriculars"
                className="inline-block px-12 py-4 bg-transparent border-2 border-purple-600 text-white font-bold uppercase tracking-wide hover:bg-purple-600 transition-all duration-300 relative overflow-hidden group"
              >
                <span className="relative z-10">View All Activities</span>
                <div className="absolute inset-0 bg-purple-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </Link>
            </div>
          </section>

          {/* Testimonials Section */}
          <section id="testimonials" className="py-16 sm:py-20 md:py-24 overflow-hidden px-4">
            <div className="text-center mb-12 sm:mb-14 md:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">What People Say</h2>
              <div className="w-16 sm:w-20 md:w-24 h-1 bg-gradient-to-r from-purple-600 to-purple-400 mx-auto"></div>
            </div>
            
            {/* Infinite Slider Container with Navigation */}
            <div className="relative mb-8 sm:mb-10 md:mb-12 py-4">
              {/* Navigation Buttons */}
              <button
                onClick={() => scrollTestimonials('left')}
                onMouseEnter={() => setIsTestimonialPaused(true)}
                onMouseLeave={() => setIsTestimonialPaused(false)}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 bg-purple-600/80 hover:bg-purple-600 backdrop-blur-md text-white p-2 sm:p-3 rounded-full transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-400"
                aria-label="Previous testimonial"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button
                onClick={() => scrollTestimonials('right')}
                onMouseEnter={() => setIsTestimonialPaused(true)}
                onMouseLeave={() => setIsTestimonialPaused(false)}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 bg-purple-600/80 hover:bg-purple-600 backdrop-blur-md text-white p-2 sm:p-3 rounded-full transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-400"
                aria-label="Next testimonial"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              {/* Translucent fade overlays for smooth blending */}
              <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 md:w-32 bg-gradient-to-r to-transparent z-10 pointer-events-none"></div>
              <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 md:w-32 bg-gradient-to-l to-transparent z-10 pointer-events-none"></div>
              
              {/* Slider Track - Fixed infinite loop with proper duplication */}
              <div 
                ref={testimonialScrollRef}
                className="flex gap-4 sm:gap-6 md:gap-8 overflow-x-auto scrollbar-hide scroll-smooth"
                style={{ 
                  animationPlayState: isTestimonialPaused ? 'paused' : 'running',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }} 
                onMouseEnter={() => setIsTestimonialPaused(true)} 
                onMouseLeave={() => setIsTestimonialPaused(false)}
              >
                {/* First set of testimonials */}
                {data.testimonials?.map((item) => {
                  const rating = item.rating || 5;
                  return (
                    <div key={item._id} className="flex-shrink-0 w-[280px] sm:w-[320px] md:w-[400px]">
                      <div className="glass-card p-5 sm:p-6 md:p-8 h-full relative hover:border-purple-500/50 hover:shadow-[0_20px_60px_rgba(147,51,234,0.3)] transition-all duration-300">
                        {/* Star Rating */}
                        <div className="absolute top-4 sm:top-5 md:top-6 right-4 sm:right-5 md:right-6 flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={`text-sm sm:text-base md:text-lg ${i < rating ? 'text-yellow-400' : 'text-gray-600'}`}>
                              {i < rating ? '⭐' : '☆'}
                            </span>
                          ))}
                        </div>
                        
                        {/* Name and Company at Top */}
                        <div className="mb-4 sm:mb-5 md:mb-6">
                          <cite className="not-italic text-purple-400 font-semibold text-base sm:text-lg block">
                            {item.name}
                          </cite>
                          <p className="text-gray-500 text-sm sm:text-base mt-1">{item.role} at {item.company}</p>
                        </div>
                        
                        {/* Testimonial */}
                        <blockquote className="text-gray-300 italic text-sm sm:text-base leading-relaxed border-t border-white/10 pt-4 sm:pt-5 md:pt-6">
                          &quot;{item.testimonial}&quot;
                        </blockquote>
                      </div>
                    </div>
                  );
                })}
                {/* Duplicate set for seamless loop */}
                {data.testimonials?.map((item) => {
                  const rating = item.rating || 5;
                  return (
                    <div key={`${item._id}-duplicate`} className="flex-shrink-0 w-[280px] sm:w-[320px] md:w-[400px]">
                      <div className="glass-card p-5 sm:p-6 md:p-8 h-full relative hover:border-purple-500/50 hover:shadow-[0_20px_60px_rgba(147,51,234,0.3)] transition-all duration-300">
                        {/* Star Rating */}
                        <div className="absolute top-4 sm:top-5 md:top-6 right-4 sm:right-5 md:right-6 flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={`text-sm sm:text-base md:text-lg ${i < rating ? 'text-yellow-400' : 'text-gray-600'}`}>
                              {i < rating ? '⭐' : '☆'}
                            </span>
                          ))}
                        </div>
                        
                        {/* Name and Company at Top */}
                        <div className="mb-4 sm:mb-5 md:mb-6">
                          <cite className="not-italic text-purple-400 font-semibold text-base sm:text-lg block">
                            {item.name}
                          </cite>
                          <p className="text-gray-500 text-sm sm:text-base mt-1">{item.role} at {item.company}</p>
                        </div>
                        
                        {/* Testimonial */}
                        <blockquote className="text-gray-300 italic text-sm sm:text-base leading-relaxed border-t border-white/10 pt-4 sm:pt-5 md:pt-6">
                          &quot;{item.testimonial}&quot;
                        </blockquote>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="text-center">
              <Link 
                href="/testimonials"
                className="inline-block px-8 sm:px-10 md:px-12 py-3 sm:py-3.5 md:py-4 bg-transparent border-2 border-purple-600 text-white font-bold uppercase tracking-wide hover:bg-purple-600 transition-all duration-300 relative overflow-hidden group text-sm sm:text-base"
              >
                <span className="relative z-10">Add Testimonial</span>
                <div className="absolute inset-0 bg-purple-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </Link>
            </div>
          </section>

          {/* Contact Section */}
          <section id="contact" className="py-16 sm:py-20 md:py-24 px-4">
            <div className="text-center mb-12 sm:mb-14 md:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">Get In Touch</h2>
              <div className="w-16 sm:w-20 md:w-24 h-1 bg-gradient-to-r from-purple-600 to-purple-400 mx-auto"></div>
              <p className="text-gray-400 mt-4 sm:mt-5 md:mt-6 text-base sm:text-lg md:text-xl max-w-2xl mx-auto px-4">
                I&apos;m always open to discussing new opportunities, collaborations, or just having a chat about technology and innovation.
              </p>
            </div>
            <div className="text-center">
              <Link 
                href="/contact"
                className="inline-block px-8 sm:px-10 md:px-12 py-3 sm:py-3.5 md:py-4 bg-transparent border-2 border-purple-600 text-white font-bold uppercase tracking-wide hover:bg-purple-600 transition-all duration-300 relative overflow-hidden group text-sm sm:text-base"
              >
                <span className="relative z-10">Contact Me</span>
                <div className="absolute inset-0 bg-purple-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </Link>
            </div>
          </section>

        </div>
      </main>

      <Footer 
        authorName={data.about?.name} 
        email={data.about?.email}
        socialLinks={data.about?.profileLinks}
      />

      {/* Image Popup Modal */}
      {isPopupOpen && selectedAcademic && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-300">
          <div className="relative max-w-5xl w-full h-[95vh] sm:h-auto bg-[#0d1117] rounded-lg overflow-hidden shadow-2xl border border-[#21262d]">
            {/* Dark Terminal Header */}
            <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 py-3 sm:py-4 bg-[#161b22] border-b border-[#21262d]">
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                <div className="flex items-center space-x-1 sm:space-x-2 min-w-0">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 text-[#8b949e] flex-shrink-0">📄</div>
                  <span className="text-[#c9d1d9] text-xs sm:text-sm font-medium font-mono truncate">
                    {currentImages[currentImageIndex]?.alt || getDisplayName(selectedAcademic)}
                  </span>
                </div>
                {/* Image Counter */}
                {currentImages.length > 1 && (
                  <div className="bg-[#21262d] text-[#8b949e] px-2 sm:px-3 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-mono border border-[#30363d] flex-shrink-0">
                    {currentImageIndex + 1} / {currentImages.length}
                  </div>
                )}
              </div>
              {/* Close Button on Top Right */}
              <button
                onClick={closeImagePopup}
                className="w-7 h-7 sm:w-8 sm:h-8 bg-[#21262d] hover:bg-[#30363d] rounded-md flex items-center justify-center transition-colors group border border-[#30363d] flex-shrink-0 ml-2"
                title="Close (ESC)"
              >
                <span className="text-[#8b949e] group-hover:text-[#c9d1d9] text-lg sm:text-xl font-bold">×</span>
              </button>
            </div>
            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] h-[calc(95vh-60px)] sm:h-[70vh]">
              {/* Left Side - Image Viewer */}
              <div className="relative bg-[#0d1117] flex items-center justify-center p-4 sm:p-6 md:p-8 lg:border-r border-[#21262d]">
                {currentImages.length > 0 && currentImages[currentImageIndex]?.asset?.url && (
                  <>
                    <Image
                      src={currentImages[currentImageIndex].asset.url}
                      alt={currentImages[currentImageIndex]?.alt || getDisplayName(selectedAcademic)}
                      width={800}
                      height={600}
                      className="max-w-full max-h-full object-contain rounded shadow-2xl border border-[#21262d]"
                    />
                    {/* Navigation Arrows */}
                    {currentImages.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg font-bold border border-[#30363d] text-sm sm:text-base"
                        >
                          ←
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg font-bold border border-[#30363d] text-sm sm:text-base"
                        >
                          →
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
              {/* Right Side - Details Panel */}
              <div className="bg-[#0d1117] p-4 sm:p-5 md:p-6 overflow-y-auto">
                {/* Document Info */}
                <div className="mb-4 sm:mb-5 md:mb-6">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-[#c9d1d9] mb-2">
                    {currentImages[currentImageIndex]?.alt || getDisplayName(selectedAcademic)}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-xs text-[#8b949e] mb-3 sm:mb-4">
                    <span className="px-2 py-1 bg-[#a371f7]/20 text-[#a371f7] rounded border border-[#a371f7]/30 font-mono">
                      {selectedAcademic?.year || 'Record'}
                    </span>
                    <span>•</span>
                    <span className="capitalize">{getCategoryName(selectedAcademic)}</span>
                  </div>
                </div>
                {/* Description Section */}
                <div className="mb-4 sm:mb-5 md:mb-6">
                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <div className="w-1 h-4 sm:h-5 md:h-6 bg-[#a371f7] rounded"></div>
                    <h4 className="text-xs sm:text-sm font-semibold text-[#c9d1d9] uppercase tracking-wide">Details</h4>
                  </div>
                  <div className="text-[#8b949e] text-xs sm:text-sm leading-relaxed pl-2 sm:pl-3 prose prose-invert prose-sm max-w-none">
                    {selectedAcademic?.description ? (
                      typeof selectedAcademic.description === 'string' ? (
                        <p>{selectedAcademic.description}</p>
                      ) : Array.isArray(selectedAcademic.description) ? (
                        <PortableText value={selectedAcademic.description} />
                      ) : (
                        <p>No description provided.</p>
                      )
                    ) : (
                      <p>No description provided.</p>
                    )}
                  </div>
                </div>
                {/* Thumbnails */}
                {currentImages.length > 1 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2 sm:mb-3">
                      <div className="w-1 h-4 sm:h-5 md:h-6 bg-[#a371f7] rounded"></div>
                      <h4 className="text-xs sm:text-sm font-semibold text-[#c9d1d9] uppercase tracking-wide">Images ({currentImages.length})</h4>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pl-2 sm:pl-3">
                      {currentImages.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`aspect-square rounded overflow-hidden border-2 transition-all duration-300 hover:scale-105 ${
                            index === currentImageIndex
                              ? 'border-[#a371f7] shadow-lg shadow-[#a371f7]/30 ring-2 ring-[#a371f7]/20'
                              : 'border-[#21262d] hover:border-[#30363d]'
                          }`}
                        >
                          {image.asset?.url && (
                            <Image
                              src={image.asset.url}
                              alt={image.alt || 'Thumbnail'}
                              width={100}
                              height={100}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {/* Help Text */}
                <div className="mt-4 sm:mt-5 md:mt-6 p-2 sm:p-3 bg-[#161b22] rounded border border-[#21262d]">
                  <p className="text-[10px] sm:text-xs text-[#6e7681] font-mono">
                    <span className="text-[#a371f7]">tip:</span> use arrow keys ← → or ESC to close
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}