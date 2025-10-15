'use client'

import { sanityClient } from '@/lib/sanity.client'
import { groq } from 'next-sanity'
import { PortableText } from '@portabletext/react'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'
import { useLoading } from '@/app/components/ClientWrapper'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'

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
  about: any;
  academics: any[];
  projects: any[];
  allProjects: any[];
  cocurriculars: any[];
  allCocurriculars: any[];
  testimonials: any[];
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
  const [currentImages, setCurrentImages] = useState<any[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [animatedCards, setAnimatedCards] = useState<Set<number>>(new Set())
  const [timelineProgress, setTimelineProgress] = useState(0)
  const [hasTimelineStarted, setHasTimelineStarted] = useState(false)
  const [selectedAcademic, setSelectedAcademic] = useState<any>(null)
  const [projectImageIndices, setProjectImageIndices] = useState<{[key: string]: number}>({})
  const [cocurricularImageIndices, setCocurricularImageIndices] = useState<{[key: string]: number}>({})

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const result = await sanityClient.fetch(query)
        setData(result)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        // Ensure loading state is cleared
        setTimeout(() => {
          setLoading(false)
        }, 200)
      }
    }
    fetchData()
    
    // Handle hash navigation on initial load
    if (window.location.hash) {
      setTimeout(() => {
        const id = window.location.hash.substring(1)
        const element = document.getElementById(id)
        element?.scrollIntoView({ behavior: 'smooth' })
      }, 300)
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
  }, [isPopupOpen, currentImages.length])

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

  const openImagePopup = (images: any[], startIndex: number = 0, academicItem: any = null) => {
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

  const nextImage = () => {
    setCurrentImageIndex(prev => 
      prev < currentImages.length - 1 ? prev + 1 : 0
    )
  }

  const prevImage = () => {
    setCurrentImageIndex(prev => 
      prev > 0 ? prev - 1 : currentImages.length - 1
    )
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
      <section id="home" className="min-h-screen flex items-center justify-center">
        <div className="text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-8xl font-extrabold mb-6 bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent animate-[fadeInScale_1s_ease-out]">
            Crafting Digital<br />
            <span className="text-5xl md:text-7xl">Experiences</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 mb-10 animate-[fadeInUp_1s_ease-out_0.3s_both]">
            Full Stack Developer specializing in modern web applications
          </p>
          <p className="text-lg text-gray-500 mb-12 animate-[fadeInUp_1s_ease-out_0.4s_both]">
            Creating innovative solutions with cutting-edge technology
          </p>
          {data.resumeURL ? (
            <a 
              href={data.resumeURL}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="inline-block px-12 py-4 bg-transparent border-2 border-purple-600 text-white font-bold uppercase tracking-wide hover:bg-purple-600 transition-all duration-300 relative overflow-hidden group animate-[fadeInUp_1s_ease-out_0.6s_both]"
            >
              <span className="relative z-10">Download Resume</span>
              <div className="absolute inset-0 bg-purple-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            </a>
          ) : (
            <a 
              href="#about"
              className="inline-block px-12 py-4 bg-transparent border-2 border-purple-600 text-white font-bold uppercase tracking-wide hover:bg-purple-600 transition-all duration-300 relative overflow-hidden group animate-[fadeInUp_1s_ease-out_0.6s_both]"
            >
              <span className="relative z-10">View My Work</span>
              <div className="absolute inset-0 bg-purple-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            </a>
          )}
        </div>
      </section>
      
      <main className="relative z-10">
        <div className="max-w-7xl mx-auto px-8">

          {/* About Section */}
          <section id="about" className="py-24">
            <div className="text-center mb-16">
              <h2 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent font-mono tracking-tight">About Me</h2>
            </div>
            
            <div className="about-container w-full max-w-7xl mx-auto bg-white/3 backdrop-blur-lg border border-white/10 rounded-3xl p-12 grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-12 transition-all duration-300 hover:bg-white/5 hover:border-purple-500/50 hover:shadow-[0_20px_80px_rgba(147,51,234,0.3)]">
              
              {/* Left Column - Profile and Info */}
              <div className="flex flex-col gap-8">
                {/* Profile Photo */}
                <div className="flex justify-center">
                  {data.about?.profileImage ? (
                    <img 
                      src={data.about.profileImage} 
                      alt="Profile" 
                      className="w-56 h-56 rounded-full border-4 border-purple-500/50 object-cover shadow-[0_20px_60px_rgba(147,51,234,0.5)] animate-pulse" 
                    />
                  ) : (
                    <div className="w-56 h-56 rounded-full border-4 border-purple-500/50 bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center text-6xl font-extrabold text-white shadow-[0_20px_60px_rgba(147,51,234,0.5)] animate-pulse">
                      {data.about?.name ? data.about.name[0] : '<>'}
                    </div>
                  )}
                </div>

                {/* Name and Info */}
                <div className="text-center">
                  <h1 className="text-4xl font-extrabold mb-8 bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">
                    {data.about?.name}
                  </h1>
                  
                  <div className="space-y-4 text-left">
                    <div className="info-item">
                      <div className="text-sm text-gray-500 uppercase tracking-wider mb-2">Education</div>
                      <div className="text-white text-base">{data.about?.education || 'Computer Science'}</div>
                    </div>
                    <div className="info-item">
                      <div className="text-sm text-gray-500 uppercase tracking-wider mb-2">Email</div>
                      <div className="text-white text-base">{data.about?.email}</div>
                    </div>
                    <div className="info-item">
                      <div className="text-sm text-gray-500 uppercase tracking-wider mb-2">Location</div>
                      <div className="text-white text-base">{data.about?.location}</div>
                    </div>
                    
                  </div>
                </div>
              </div>

              {/* Right Column - Biography and Status */}
              <div className="flex flex-col gap-8">
                {/* Biography */}
                <div className="bg-white/2 border border-white/8 rounded-2xl p-8 hover:bg-purple-600/5 hover:border-purple-500/30 transition-all duration-300">
                  <div className="flex items-center gap-4 mb-6">
                    
                    <h2 className="text-3xl font-bold text-white">Biography</h2>
                  </div>
                  <div className="text-gray-400 leading-relaxed space-y-4 text-lg">
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

                {/* Bottom Row - Interests and Status (Larger) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Interests */}
                  <div className="bg-white/2 border border-white/8 rounded-2xl p-8 hover:bg-purple-600/5 hover:border-purple-500/30 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-6">
                      <h3 className="text-white font-bold text-xl">Interests</h3>
                    </div>
                    <p className="text-gray-400 text-base leading-relaxed">
                      My primary interest lies in research and continual learning. I am passionate about applying my skills through various projects and exploring new technologies.
                    </p>
                  </div>

                  {/* Status */}
                  <div className="bg-white/2 border border-white/8 rounded-2xl p-8 hover:bg-purple-600/5 hover:border-purple-500/30 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-6">
                      <h3 className="text-white font-bold text-xl">Status</h3>
                    </div>
                    <p className="text-purple-400 text-base leading-relaxed font-medium">
                      {'I am actively seeking opportunities to collaborate on innovative projects. Feel free to connect with me!'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Technical Skills Section */}
          <section id="skills" className="py-24">
            <div className="text-center mb-16">
              <h2 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">Technical Skills</h2>
              <p className="text-gray-400 mt-4 text-xl">Technologies I work with</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 max-w-7xl mx-auto">
              {technicalSkills.map((skill, index) => (
                <div 
                  key={index} 
                  className="glass-card aspect-square p-4 text-center group hover:scale-105 transition-all duration-300 flex flex-col justify-center items-center"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="text-4xl mb-3">{skill.icon}</div>
                  <div className="text-sm font-semibold text-white mb-2 leading-tight">{skill.name}</div>
                  <div className="text-xs text-purple-400">
                    {skill.level}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Projects Section */}
          <section id="projects" className="py-24">
            <div className="text-center mb-16">
              <div className="text-purple-400 text-base uppercase tracking-[3px] font-semibold mb-4">Portfolio</div>
              <h2 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">Featured Projects</h2>
              <p className="text-gray-400 mt-4 text-xl">A selection of my recent work</p>
            </div>
            
            <div className="flex flex-col gap-32">
              {data.projects?.map((project, index) => (
                <div 
                  key={project._id} 
                  className={`grid lg:grid-cols-2 gap-16 items-center ${index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''}`}
                >
                  {/* Project Details */}
                  <div className={`space-y-6 ${index % 2 === 1 ? 'lg:col-start-2' : ''}`}>
                    <div className="text-8xl font-black opacity-10 leading-none bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">
                      {(index + 1).toString().padStart(2, '0')}
                    </div>
                    <h3 className="text-3xl font-bold text-white leading-tight -mt-4">
                      {project.title}
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className="inline-block bg-purple-900/20 border border-purple-600/30 text-purple-300 px-4 py-2 rounded-sm text-sm font-semibold uppercase tracking-wider">
                        {project.category === 'research' && 'Research Work'}
                        {project.category === 'personal' && 'Personal Project'}
                        {project.category === 'hackathon' && 'Hackathon'}
                        {project.category === 'work' && 'Work Experience'}
                      </span>
                      {project.year && (
                        <span className="text-gray-400 text-sm">
                          {project.year}
                        </span>
                      )}
                    </div>
                    <div className="text-gray-400 text-lg leading-relaxed">
                      {project.description && <PortableText value={project.description} />}
                    </div>
                    
                    {project.techStack && project.techStack.length > 0 && (
                      <div className="flex flex-wrap gap-3">
                        {project.techStack.map((tech: string, techIndex: number) => (
                          <span 
                            key={techIndex} 
                            className="bg-purple-900/10 border border-purple-600/20 text-purple-300 px-3 py-1 text-xs font-semibold uppercase tracking-wide hover:bg-purple-900/20 hover:border-purple-600/40 transition-all duration-300"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {(project.githubLink || project.projectLink) && (
                      <div className="flex gap-8 pt-4">
                        {project.githubLink && (
                          <a 
                            href={project.githubLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-white font-bold flex items-center gap-2 transition-all duration-300 hover:translate-x-1"
                          >
                            View Project <span>→</span>
                          </a>
                        )}
                        {project.projectLink && (
                          <a 
                            href={project.projectLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-white font-bold flex items-center gap-2 transition-all duration-300 hover:translate-x-1"
                          >
                            Live Site <span>→</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Project Visual */}
                  <div className={`${index % 2 === 1 ? 'lg:col-start-1' : ''}`}>
                    <div className="relative h-96 lg:h-[500px] group perspective-1000">
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
          <section id="academics" className="py-24">
            <div className="text-center mb-16">
              <h2 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">Academic Journey</h2>
              <div className="w-24 h-1 bg-gradient-to-r from-purple-600 to-purple-400 mx-auto"></div>
            </div>

            {/* Timeline - dynamic from backend */}
            <div className="mt-16" id="timeline-container">
              <div className="relative pb-32">
                {/* Timeline Points */}
                <div className="space-y-16 relative">
                  {/* Background Timeline Line - Only for academic cards */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gray-700/30 rounded-full"></div>
                  {/* Animated Timeline Line - Builds as user scrolls */}
                  <div
                    className="absolute left-1/2 transform -translate-x-1/2 w-1 bg-gradient-to-b from-purple-600 via-purple-500 to-purple-400 rounded-full transition-all duration-300 ease-out origin-top"
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
                        className={`timeline-card relative flex items-center ${isEven ? 'justify-start' : 'justify-end'} transition-all duration-1000 ${
                          isAnimated
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-8'
                        }`}
                        data-card-index={index}
                        data-timeline-card="true"
                        style={{ transitionDelay: `${index * 100}ms` }}
                      >
                        {/* Timeline Dot */}
                        <div className={`absolute left-1/2 transform -translate-x-1/2 w-6 h-6 bg-purple-600 border-4 border-purple-400 rounded-full z-10 shadow-lg shadow-purple-600/50 transition-all duration-700 ${
                          isAnimated ? 'scale-100' : 'scale-0'
                        }`}></div>
                        {/* Semester Card */}
                        <div className={`w-5/12 ${isEven ? 'mr-auto pr-8' : 'ml-auto pl-8'}`}>
                          <div className={`relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 transition-all duration-700 hover:bg-white/10 hover:shadow-[0_20px_60px_-15px_rgba(147,51,234,0.3)] hover:border-purple-500/50 hover:scale-[1.03] ${
                            isAnimated
                              ? 'opacity-100 translate-y-0'
                              : 'opacity-0 translate-y-12'
                          }`}>
                            {/* Card Content */}
                            <div className={`relative z-10 ${isEven ? 'text-right' : 'text-left'}`}>
                              <div className="mb-4 flex items-center gap-3 justify-between">
                                <span className="inline-block px-4 py-1 bg-purple-600/20 border border-purple-500/30 rounded-full text-purple-300 text-sm font-semibold uppercase tracking-wider">
                                  {item.year}
                                </span>
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-lg shadow-green-400/50"></div>
                                  <span className="text-xs text-gray-400 font-mono">Completed</span>
                                </div>
                              </div>
                              <h3 className="text-4xl font-black text-white mb-4 tracking-tight">
                                {item.title || `Semester ${item.semester || index + 1}`}
                              </h3>
                              <div className="mt-6">
                                <button
                                  onClick={() => openImagePopup(item.semesterImages || [], 0, item)}
                                  className="inline-block px-8 py-3 bg-transparent border-2 border-purple-600 text-white font-bold uppercase tracking-wide hover:bg-purple-600 transition-all duration-300 relative overflow-hidden group text-sm"
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
                    <div className="relative flex items-center justify-center pt-16">
                      {/* End dot with glow */}
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-purple-400 rounded-full shadow-lg shadow-purple-600/50 flex items-center justify-center relative z-10">
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Current Status Card - Outside timeline */}
              {data.academics && data.academics.length > 0 && (
                <div className="mt-0 max-w-2xl mx-auto">
                  <div className="glass-card p-8 text-center border-2 border-purple-500/30">
                    <div className="flex items-center justify-center gap-3 mb-6">
                      <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
                      <span className="text-sm text-gray-400 uppercase tracking-wider font-semibold">Current Status</span>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-white mb-2">Semester {data.academics.length + 1} - Ongoing</h3>
                    <p className="text-gray-400 text-base mb-4">{Math.round((data.academics.length / 8) * 100)}% Complete</p>
                    <p className="text-purple-400 font-medium text-lg">{data.academics[data.academics.length-1]?.institution || "University"}</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Co-Curriculars Section */}
          <section id="cocurriculars" className="py-24">
            <div className="text-center mb-16">
              <h2 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">Co-Curricular Activities</h2>
              <div className="w-24 h-1 bg-gradient-to-r from-purple-600 to-purple-400 mx-auto"></div>
              <p className="text-gray-400 mt-4 text-xl">Beyond the classroom achievements</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {data.cocurriculars?.map((item) => {
                const currentImageIndex = cocurricularImageIndices[item._id] || 0
                return (
                  <div 
                    key={item._id} 
                    className="group relative h-[400px] rounded-3xl overflow-hidden cursor-pointer"
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
                    <div className="absolute top-8 left-8 text-8xl font-extrabold bg-gradient-to-br from-white/30 to-purple-400/30 bg-clip-text text-transparent leading-none z-[2] select-none pointer-events-none">
                      {(data.cocurriculars?.indexOf(item) || 0) + 1 < 10 ? `0${(data.cocurriculars?.indexOf(item) || 0) + 1}` : (data.cocurriculars?.indexOf(item) || 0) + 1}
                    </div>

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-8 z-[2] transform translate-y-16 group-hover:translate-y-0 transition-transform duration-500">
                      {/* Year Badge */}
                      {item.year && (
                        <div className="inline-block bg-purple-600/40 backdrop-blur-md px-4 py-1.5 rounded-full text-sm text-purple-200 border border-purple-500/50 font-semibold mb-3">
                          {item.year}
                        </div>
                      )}
                      
                      <h3 className="text-3xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors duration-300">
                        {item.activity}
                      </h3>
                      
                      <span className="inline-block bg-purple-900/50 backdrop-blur-sm text-purple-300 px-3 py-1 rounded-full text-sm border border-purple-700/70 capitalize mb-8">
                        {item.category}
                      </span>

                      {/* Description - Only visible on hover */}
                      {item.description && (
                        <div className="text-gray-300 text-sm leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 prose prose-invert prose-sm max-w-none line-clamp-3">
                          {typeof item.description === 'string' ? (
                            <p>{item.description}</p>
                          ) : (
                            <PortableText value={item.description} />
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
          <section id="testimonials" className="py-24 overflow-hidden">
            <div className="text-center mb-16">
              <h2 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">What People Say</h2>
              <div className="w-24 h-1 bg-gradient-to-r from-purple-600 to-purple-400 mx-auto"></div>
            </div>
            
            {/* Infinite Slider Container */}
            <div className="relative mb-12 py-4">
              {/* Translucent fade overlays for smooth blending */}
              <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r to-transparent z-10 pointer-events-none"></div>
              <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l to-transparent z-10 pointer-events-none"></div>
              
              {/* Slider Track - Fixed infinite loop with proper duplication */}
              <div className="flex gap-8 animate-[scroll_40s_linear_infinite]" style={{ animationPlayState: 'running' }} onMouseEnter={(e) => e.currentTarget.style.animationPlayState = 'paused'} onMouseLeave={(e) => e.currentTarget.style.animationPlayState = 'running'}>
                {/* First set of testimonials */}
                {data.testimonials?.map((item) => {
                  const rating = item.rating || 5;
                  return (
                    <div key={item._id} className="flex-shrink-0 w-[400px]">
                      <div className="glass-card p-8 h-full relative hover:border-purple-500/50 hover:shadow-[0_20px_60px_rgba(147,51,234,0.3)] transition-all duration-300">
                        {/* Star Rating */}
                        <div className="absolute top-6 right-6 flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={`text-lg ${i < rating ? 'text-yellow-400' : 'text-gray-600'}`}>
                              {i < rating ? '⭐' : '☆'}
                            </span>
                          ))}
                        </div>
                        
                        {/* Name and Company at Top */}
                        <div className="mb-6">
                          <cite className="not-italic text-purple-400 font-semibold text-lg block">
                            {item.name}
                          </cite>
                          <p className="text-gray-500 text-base mt-1">{item.role} at {item.company}</p>
                        </div>
                        
                        {/* Testimonial */}
                        <blockquote className="text-gray-300 italic text-base leading-relaxed border-t border-white/10 pt-6">
                          "{item.testimonial}"
                        </blockquote>
                      </div>
                    </div>
                  );
                })}
                {/* Duplicate set for seamless loop */}
                {data.testimonials?.map((item) => {
                  const rating = item.rating || 5;
                  return (
                    <div key={`${item._id}-duplicate`} className="flex-shrink-0 w-[400px]">
                      <div className="glass-card p-8 h-full relative hover:border-purple-500/50 hover:shadow-[0_20px_60px_rgba(147,51,234,0.3)] transition-all duration-300">
                        {/* Star Rating */}
                        <div className="absolute top-6 right-6 flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={`text-lg ${i < rating ? 'text-yellow-400' : 'text-gray-600'}`}>
                              {i < rating ? '⭐' : '☆'}
                            </span>
                          ))}
                        </div>
                        
                        {/* Name and Company at Top */}
                        <div className="mb-6">
                          <cite className="not-italic text-purple-400 font-semibold text-lg block">
                            {item.name}
                          </cite>
                          <p className="text-gray-500 text-base mt-1">{item.role} at {item.company}</p>
                        </div>
                        
                        {/* Testimonial */}
                        <blockquote className="text-gray-300 italic text-base leading-relaxed border-t border-white/10 pt-6">
                          "{item.testimonial}"
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
                className="inline-block px-12 py-4 bg-transparent border-2 border-purple-600 text-white font-bold uppercase tracking-wide hover:bg-purple-600 transition-all duration-300 relative overflow-hidden group"
              >
                <span className="relative z-10">Add Testimonial</span>
                <div className="absolute inset-0 bg-purple-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </Link>
            </div>
          </section>

          {/* Contact Section */}
          <section id="contact" className="py-24">
            <div className="text-center mb-16">
              <h2 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">Get In Touch</h2>
              <div className="w-24 h-1 bg-gradient-to-r from-purple-600 to-purple-400 mx-auto"></div>
              <p className="text-gray-400 mt-6 text-xl max-w-2xl mx-auto">
                I'm always open to discussing new opportunities, collaborations, or just having a chat about technology and innovation.
              </p>
            </div>
            <div className="text-center">
              <Link 
                href="/contact"
                className="inline-block px-12 py-4 bg-transparent border-2 border-purple-600 text-white font-bold uppercase tracking-wide hover:bg-purple-600 transition-all duration-300 relative overflow-hidden group"
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="relative max-w-5xl w-full bg-[#0d1117] rounded-lg overflow-hidden shadow-2xl border border-[#21262d]">
            {/* Dark Terminal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#161b22] border-b border-[#21262d]">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 text-[#8b949e]">📄</div>
                  <span className="text-[#c9d1d9] text-sm font-medium font-mono">
                    {currentImages[currentImageIndex]?.alt || selectedAcademic.title || selectedAcademic.activity || 'Document'}
                  </span>
                </div>
                {/* Image Counter */}
                {currentImages.length > 1 && (
                  <div className="bg-[#21262d] text-[#8b949e] px-3 py-1 rounded text-xs font-mono border border-[#30363d]">
                    {currentImageIndex + 1} / {currentImages.length}
                  </div>
                )}
              </div>
              {/* Close Button on Top Right */}
              <button
                onClick={closeImagePopup}
                className="w-8 h-8 bg-[#21262d] hover:bg-[#30363d] rounded-md flex items-center justify-center transition-colors group border border-[#30363d]"
                title="Close (ESC)"
              >
                <span className="text-[#8b949e] group-hover:text-[#c9d1d9] text-xl font-bold">×</span>
              </button>
            </div>
            {/* Main Content Area */}
            <div className="grid lg:grid-cols-[1fr_350px] h-[70vh]">
              {/* Left Side - Image Viewer */}
              <div className="relative bg-[#0d1117] flex items-center justify-center p-8 border-r border-[#21262d]">
                {currentImages.length > 0 && (
                  <>
                    <img
                      src={currentImages[currentImageIndex]?.asset?.url}
                      alt={currentImages[currentImageIndex]?.alt || selectedAcademic.title || selectedAcademic.activity || 'Image'}
                      className="max-w-full max-h-full object-contain rounded shadow-2xl border border-[#21262d]"
                    />
                    {/* Navigation Arrows */}
                    {currentImages.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg font-bold border border-[#30363d]"
                        >
                          ←
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg font-bold border border-[#30363d]"
                        >
                          →
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
              {/* Right Side - Details Panel */}
              <div className="bg-[#0d1117] p-6 overflow-y-auto">
                {/* Document Info */}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-[#c9d1d9] mb-2">
                    {currentImages[currentImageIndex]?.alt || selectedAcademic.title || selectedAcademic.activity || 'Document'}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-[#8b949e] mb-4">
                    <span className="px-2 py-1 bg-[#a371f7]/20 text-[#a371f7] rounded border border-[#a371f7]/30 font-mono">
                      {selectedAcademic.year || 'Record'}
                    </span>
                    <span>•</span>
                    <span className="capitalize">{selectedAcademic.title || selectedAcademic.category || selectedAcademic.activity || 'Activity'}</span>
                  </div>
                </div>
                {/* Description Section */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-6 bg-[#a371f7] rounded"></div>
                    <h4 className="text-sm font-semibold text-[#c9d1d9] uppercase tracking-wide">Details</h4>
                  </div>
                  <div className="text-[#8b949e] text-sm leading-relaxed pl-3 prose prose-invert prose-sm max-w-none">
                    {selectedAcademic.description ? (
                      typeof selectedAcademic.description === 'string' ? (
                        <p>{selectedAcademic.description}</p>
                      ) : (
                        <PortableText value={selectedAcademic.description} />
                      )
                    ) : (
                      <p>No description provided.</p>
                    )}
                  </div>
                </div>
                {/* Thumbnails */}
                {currentImages.length > 1 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1 h-6 bg-[#a371f7] rounded"></div>
                      <h4 className="text-sm font-semibold text-[#c9d1d9] uppercase tracking-wide">Images ({currentImages.length})</h4>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pl-3">
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
                          <img
                            src={image.asset?.url}
                            alt={image.alt}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {/* Help Text */}
                <div className="mt-6 p-3 bg-[#161b22] rounded border border-[#21262d]">
                  <p className="text-xs text-[#6e7681] font-mono">
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