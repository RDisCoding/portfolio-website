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
  "cocurriculars": *[_type == "cocurricular"] | order(order asc)[0...6]{
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
  const [isDataLoaded, setIsDataLoaded] = useState(false)
  const { setLoading } = useLoading()
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [currentImages, setCurrentImages] = useState<Array<{ asset?: { url: string }; alt?: string }>>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [selectedAcademic, setSelectedAcademic] = useState<AcademicData | CocurricularData | null>(null)
  const [projectImageIndices, setProjectImageIndices] = useState<{ [key: string]: number }>({})
  const [cocurricularImageIndices, setCocurricularImageIndices] = useState<{ [key: string]: number }>({})
  const testimonialScrollRef = useRef<HTMLDivElement>(null)

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
        setIsDataLoaded(true)
      } catch (error) {
        console.error('Error fetching data:', error)
        setIsDataLoaded(true) // Still show page on error
      } finally {
        setLoading(false)
      }
    }
    fetchData()

    // Handle hash navigation on initial load
    if (window.location.hash) {
      setTimeout(() => {
        const id = window.location.hash.substring(1)
        const element = document.getElementById(id)
        element?.scrollIntoView({ behavior: 'smooth' })
      }, 200)
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
    }, 4000)

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
    }, 4000)

    return () => clearInterval(interval)
  }, [data.cocurriculars])

  // Image navigation functions
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

  // Testimonial navigation
  const scrollTestimonials = useCallback((direction: 'left' | 'right') => {
    if (!testimonialScrollRef.current) return

    const container = testimonialScrollRef.current
    const containerWidth = container.offsetWidth
    const scrollLeft = container.scrollLeft
    const scrollWidth = container.scrollWidth
    const scrollAmount = containerWidth

    if (direction === 'right') {
      const newPosition = scrollLeft + scrollAmount
      if (newPosition >= scrollWidth / 2) {
        container.scrollLeft = 0
      } else {
        container.scrollTo({ left: newPosition, behavior: 'smooth' })
      }
    } else {
      const newPosition = scrollLeft - scrollAmount
      if (newPosition < 0) {
        container.scrollLeft = scrollWidth / 2 - containerWidth
      } else {
        container.scrollTo({ left: newPosition, behavior: 'smooth' })
      }
    }
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

  const openImagePopup = (images: Array<{ asset?: { url: string }; alt?: string }>, startIndex: number = 0, academicItem: AcademicData | CocurricularData | null = null) => {
    setCurrentImages(images)
    setCurrentImageIndex(startIndex)
    setSelectedAcademic(academicItem)
    setIsPopupOpen(true)
    document.body.style.overflow = 'hidden'
  }

  const closeImagePopup = () => {
    setIsPopupOpen(false)
    setCurrentImages([])
    setCurrentImageIndex(0)
    setSelectedAcademic(null)
    document.body.style.overflow = 'unset'
  }

  // Technical skills with icons
  const technicalSkills = [
    { name: 'Artificial Intelligence', icon: '/icons/openai.png' },
    { name: 'Machine Learning', icon: '/icons/ml.svg' },
    { name: 'Deep Learning', icon: '/icons/dl.svg' },
    { name: 'NLP', icon: '/icons/nlp.svg' },
    { name: 'Prompt Engineering', icon: '/icons/l.svg' },
    { name: 'Digital Forensics', icon: '/icons/audio.svg' },
    { name: 'Python', icon: '/icons/python.svg' },
    { name: 'Hadoop', icon: '/icons/hadoop.svg' },
    { name: 'Pig/Hive', icon: '/icons/hive.png' },
    { name: 'GitHub', icon: '/icons/github.svg' },
    { name: 'UI/UX', icon: '/icons/ui.png' },
    { name: 'PostgreSQL', icon: '/icons/pgsql.svg' },
    { name: 'MongoDB', icon: '/icons/mongodb.svg' },
    { name: 'ExpressAPI', icon: '/icons/express.svg' },
    { name: 'Sanity CMS', icon: '/icons/sanity.png' },
    { name: 'React', icon: '/icons/react.svg' },
    { name: 'NextJS', icon: '/icons/next.png' },
    { name: 'JavaScript', icon: '/icons/javascript.svg' },
    { name: 'TypeScript', icon: '/icons/typescript.svg' },
    { name: 'Node.js', icon: '/icons/nodejs.svg' },
    { name: 'C', icon: '/icons/c.svg' },
    { name: 'C++', icon: '/icons/cpp.svg' },
    { name: 'Java', icon: '/icons/java.svg' },
    { name: 'Solidity', icon: '/icons/solidity.svg' }
  ]

  // Hobby icons mapping
  const hobbyIcons: { [key: string]: string } = {
    'music': '🎵',
    'gaming': '🎮',
    'reading': '📚',
    'photography': '📷',
    'travel': '✈️',
    'sports': '⚽',
    'cooking': '🍳',
    'art': '🎨',
    'film': '🎬',
    'writing': '✍️',
    'coding': '💻',
    'chess': '♟️',
    'fitness': '💪',
    'nature': '🌿',
    'default': '⭐'
  }

  const getHobbyIcon = (category: string | undefined) => {
    if (!category) return hobbyIcons.default
    const lowerCategory = category.toLowerCase()
    for (const [key, icon] of Object.entries(hobbyIcons)) {
      if (lowerCategory.includes(key)) return icon
    }
    return hobbyIcons.default
  }

  // Show loading screen until data is fetched
  if (!isDataLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animated-bg">
          <div className="orb orb1"></div>
          <div className="orb orb2"></div>
          <div className="orb orb3"></div>
        </div>
        <div className="relative z-10 text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-white overflow-x-hidden">
      {/* Animated Background */}
      <div className="animated-bg">
        <div className="orb orb1"></div>
        <div className="orb orb2"></div>
        <div className="orb orb3"></div>
        <div className="orb orb4"></div>
        <div className="orb orb5"></div>
      </div>

      <Navbar resumeUrl={data.resumeURL} />

      {/* ============================================
          HERO SECTION - CLEAN & IMPACTFUL
          ============================================ */}
      <section id="home" className="min-h-screen flex flex-col justify-center px-4 sm:px-6 lg:px-8 pt-20 pb-16 relative">
        <div className="max-w-5xl mx-auto w-full text-center">
          {/* Hero Badge */}
          <div className="flex justify-center mb-8">
            <div className="hero-badge">
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
              <span>Available for Opportunities</span>
            </div>
          </div>

          {/* Main Hero Content */}
          <div className="space-y-6">
            <h1>
              <span className="block hero-title text-white">
                Hi, I&apos;m{' '}
                <span className="gradient-text-purple">{data.about?.name?.split(' ')[0] || 'Rudra'}</span>
              </span>
            </h1>

            <p className="hero-subtitle text-gray-300 max-w-3xl mx-auto">
              A passionate <span className="text-purple-400 font-semibold">Full Stack Developer</span> &{' '}
              <span className="text-purple-400 font-semibold">AI Enthusiast</span> who loves turning complex problems into elegant, user-friendly solutions.
            </p>

            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Let&apos;s build something amazing together.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center pt-8">
              <a href="#projects" className="btn-primary">
                <span>View My Work</span>
              </a>
              <a
                href="#contact"
                className="inline-block px-10 py-4 bg-white/5 border border-white/20 text-white font-semibold rounded-lg hover:bg-white/10 hover:border-purple-500/50 transition-all duration-300"
              >
                Get In Touch
              </a>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-500">
            <span className="text-xs uppercase tracking-widest">Scroll</span>
            <div className="w-6 h-10 border-2 border-gray-600 rounded-full flex justify-center pt-2">
              <div className="w-1.5 h-3 bg-purple-500 rounded-full animate-bounce"></div>
            </div>
          </div>
        </div>
      </section>

      <main className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ============================================
              ABOUT SECTION - BENTO GRID LAYOUT
              ============================================ */}
          <section id="about" className="py-20 sm:py-28">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 gradient-text-purple">About Me</h2>
              <div className="section-divider"></div>
            </div>

            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Profile Card - Spans 2 columns */}
              <div className="lg:col-span-2 glass-card p-8 sm:p-10 flex flex-col sm:flex-row gap-8 items-center sm:items-start">
                <div className="flex-shrink-0">
                  <Image
                    src="/image.png"
                    alt="Profile"
                    width={200}
                    height={200}
                    className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl border-2 border-purple-500/30 object-cover shadow-[0_20px_60px_rgba(147,51,234,0.3)]"
                  />
                </div>
                <div className="text-center sm:text-left flex-1">
                  <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                    {data.about?.name || 'Developer'}
                  </h3>
                  <div className="text-gray-400 leading-relaxed space-y-4 text-base sm:text-lg">
                    {data.about?.biography ? (
                      <PortableText value={data.about.biography} />
                    ) : (
                      <p>Passionate full-stack developer with experience building scalable web applications and creating exceptional user experiences.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Info Cards Stack */}
              <div className="space-y-6">
                {/* Education Card */}
                <div className="glass-card p-6 group">
                  <div className="text-purple-400 text-sm font-semibold uppercase tracking-wider mb-2">Education</div>
                  <div className="text-white text-lg font-medium">{data.about?.education || 'Computer Science'}</div>
                </div>

                {/* Location Card */}
                <div className="glass-card p-6 group">
                  <div className="text-purple-400 text-sm font-semibold uppercase tracking-wider mb-2">Location</div>
                  <div className="text-white text-lg font-medium">{data.about?.location || 'India'}</div>
                </div>

                {/* Email Card */}
                <div className="glass-card p-6 group">
                  <div className="text-purple-400 text-sm font-semibold uppercase tracking-wider mb-2">Email</div>
                  <div className="text-white text-base font-medium break-all">{data.about?.email || 'contact@example.com'}</div>
                </div>
              </div>

              {/* Interests Card */}
              <div className="glass-card p-8">
                <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                  <span className="w-2 h-8 bg-purple-500 rounded-full"></span>
                  Interests
                </h4>
                <p className="text-gray-400 leading-relaxed">
                  My primary interest lies in research and continual learning. I am passionate about applying my skills through various projects and exploring new technologies.
                </p>
              </div>

              {/* Status Card */}
              <div className="lg:col-span-2 glass-card p-8 border-purple-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50"></div>
                  <span className="text-sm text-gray-400 uppercase tracking-wider font-semibold">Current Status</span>
                </div>
                <p className="text-xl sm:text-2xl text-white font-medium">
                  Actively seeking opportunities to collaborate on innovative projects. Feel free to reach out!
                </p>
              </div>
            </div>
          </section>

        </div>

        {/* ============================================
            SKILLS SECTION - FULL WIDTH MARQUEE
            ============================================ */}
        <section id="skills" className="skills-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 gradient-text-purple">Skills & Tech</h2>
              <div className="section-divider"></div>
              <p className="text-gray-400 mt-6 text-lg">Technologies I work with daily</p>
            </div>
          </div>

          {/* Full Width Marquee Container */}
          <div className="relative">
            {/* Gradient Fade Edges */}
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none"></div>

            {/* First Row - Left to Right */}
            <div className="flex overflow-hidden mb-4">
              <div className="flex skill-marquee">
                {[...technicalSkills, ...technicalSkills].map((skill, index) => (
                  <div key={`row1-${index}`} className="skill-card">
                    <div className="icon">
                      <Image src={skill.icon} alt={skill.name} fill className="object-contain" />
                    </div>
                    <span className="name">{skill.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Second Row - Right to Left */}
            <div className="flex overflow-hidden">
              <div className="flex skill-marquee-reverse">
                {[...technicalSkills.slice().reverse(), ...technicalSkills.slice().reverse()].map((skill, index) => (
                  <div key={`row2-${index}`} className="skill-card">
                    <div className="icon">
                      <Image src={skill.icon} alt={skill.name} fill className="object-contain" />
                    </div>
                    <span className="name">{skill.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ============================================
              PROJECTS SECTION - STACKED CARDS
              ============================================ */}
          <section id="projects" className="py-20 sm:py-28">
            <div className="text-center mb-16">
              <span className="text-purple-500 text-sm font-semibold uppercase tracking-[3px] mb-4 block">Portfolio</span>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 gradient-text-purple">Featured Projects</h2>
              <div className="section-divider"></div>
            </div>

            <div className="space-y-24 sm:space-y-32">
              {data.projects?.map((project, index) => (
                <div
                  key={project._id}
                  className={`grid lg:grid-cols-2 gap-12 lg:gap-16 items-center ${index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''}`}
                >
                  {/* Project Details */}
                  <div className={`space-y-6 ${index % 2 === 1 ? 'lg:col-start-2' : ''}`}>
                    {/* Large Number */}
                    <div className="project-number select-none">
                      {(index + 1).toString().padStart(2, '0')}
                    </div>

                    <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white -mt-16 relative z-10">
                      {project.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-block bg-purple-500/10 border border-purple-500/30 text-purple-400 px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wider">
                        {project.category === 'research' && 'Research'}
                        {project.category === 'personal' && 'Personal'}
                        {project.category === 'hackathon' && 'Hackathon'}
                        {project.category === 'work' && 'Work'}
                      </span>
                      {project.year && (
                        <span className="text-gray-500 text-sm">{project.year}</span>
                      )}
                    </div>

                    <div className="text-gray-400 text-lg leading-relaxed">
                      {project.description && <PortableText value={project.description} />}
                    </div>

                    {project.techStack && project.techStack.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {project.techStack.map((tech: string, techIndex: number) => (
                          <span
                            key={techIndex}
                            className="bg-white/5 border border-white/10 text-gray-300 px-3 py-1.5 text-xs font-medium uppercase tracking-wide rounded-md hover:border-purple-500/30 hover:bg-purple-500/5 transition-all duration-300"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}

                    {(project.githubLink || project.projectLink) && (
                      <div className="flex flex-wrap gap-6 pt-4">
                        {project.githubLink && (
                          <a
                            href={project.githubLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-white font-semibold flex items-center gap-2 transition-all duration-300 group"
                          >
                            View Code <span className="group-hover:translate-x-1 transition-transform">→</span>
                          </a>
                        )}
                        {project.projectLink && (
                          <a
                            href={project.projectLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-white font-semibold flex items-center gap-2 transition-all duration-300 group"
                          >
                            Live Demo <span className="group-hover:translate-x-1 transition-transform">→</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Project Image */}
                  <div className={`${index % 2 === 1 ? 'lg:col-start-1' : ''}`}>
                    <div className="relative h-80 sm:h-96 lg:h-[500px] rounded-2xl overflow-hidden group">
                      {project.images && project.images.length > 0 ? (
                        <>
                          <Image
                            src={project.images[projectImageIndices[project._id] || 0]?.asset?.url || '/placeholder.png'}
                            alt={project.images[projectImageIndices[project._id] || 0]?.alt || project.title}
                            fill
                            className="object-cover transition-all duration-700 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                          {project.images.length > 1 && (
                            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-xs text-white border border-white/20">
                              {(projectImageIndices[project._id] || 0) + 1} / {project.images.length}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-black flex items-center justify-center">
                          <span className="text-6xl font-bold text-purple-500/20">{(index + 1).toString().padStart(2, '0')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-20">
              <Link href="/projects" className="btn-primary">
                <span>View All Projects</span>
              </Link>
            </div>
          </section>

          {/* ============================================
              ACADEMICS SECTION - PROPER TIMELINE
              ============================================ */}
          <section id="academics" className="py-20 sm:py-28">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 gradient-text-purple">Academic Journey</h2>
              <div className="section-divider"></div>
            </div>

            {/* Timeline */}
            <div className="max-w-3xl mx-auto">
              <div className="timeline-container">
                <div className="timeline-line"></div>

                {data.academics?.map((item, index) => (
                  <div key={item._id} className="timeline-item">
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                        <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-sm font-semibold">
                          {item.year}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                          <span className="text-xs text-gray-500">Completed</span>
                        </div>
                      </div>

                      <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                        {item.title || `Semester ${item.semester || index + 1}`}
                      </h3>

                      {item.institution && (
                        <p className="text-gray-400 text-sm mb-4">{item.institution}</p>
                      )}

                      {item.score && (
                        <p className="text-purple-400 font-semibold mb-4">Score: {item.score}</p>
                      )}

                      {item.semesterImages && item.semesterImages.length > 0 && (
                        <button
                          onClick={() => openImagePopup(item.semesterImages || [], 0, item)}
                          className="text-purple-400 hover:text-white font-semibold text-sm flex items-center gap-2 transition-all duration-300 group"
                        >
                          View Results <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Current Status */}
                <div className="timeline-item">
                  <div className="timeline-dot" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}></div>
                  <div className="timeline-content border-purple-500/30">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-sm text-gray-400 uppercase tracking-wider font-semibold">In Progress</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      Semester {(data.academics?.length || 0) + 1} - Currently Pursuing
                    </h3>
                    {data.academics?.[data.academics.length - 1]?.institution && (
                      <p className="text-purple-400 font-medium">
                        {data.academics[data.academics.length - 1].institution}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ============================================
              HOBBIES SECTION - BENTO GRID
              ============================================ */}
          <section id="cocurriculars" className="py-20 sm:py-28">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 gradient-text-purple">Hobbies & Interests</h2>
              <div className="section-divider"></div>
              <p className="text-gray-400 mt-6 text-lg">What I enjoy beyond coding</p>
            </div>

            {/* Bento Grid */}
            <div className="bento-grid">
              {data.cocurriculars?.map((item, index) => {
                const currentImageIndex = cocurricularImageIndices[item._id] || 0;
                // Create varied sizes for visual interest
                const sizeClass = index === 0 ? 'large' : index === 3 ? 'wide' : index === 2 ? 'tall' : '';

                return (
                  <div
                    key={item._id}
                    className={`bento-item ${sizeClass} group cursor-pointer`}
                    onClick={() => item.images && item.images.length > 0 && openImagePopup(item.images, 0, item)}
                  >
                    {/* Background Image */}
                    {item.images && item.images.length > 0 && (
                      <div className="absolute inset-0 rounded-[20px] overflow-hidden">
                        <Image
                          src={item.images[currentImageIndex]?.asset?.url || '/placeholder.png'}
                          alt={item.images[currentImageIndex]?.alt || item.activity}
                          fill
                          className="object-cover opacity-30 group-hover:opacity-50 group-hover:scale-110 transition-all duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                      </div>
                    )}

                    {/* Content */}
                    <div className="relative z-10 h-full flex flex-col justify-end">
                      <div className="text-4xl mb-3">{getHobbyIcon(item.category)}</div>

                      <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors duration-300">
                        {item.activity}
                      </h3>

                      {item.year && (
                        <span className="inline-block bg-purple-500/20 border border-purple-500/30 text-purple-400 px-3 py-1 rounded-full text-xs font-semibold w-fit mb-2">
                          {item.year}
                        </span>
                      )}

                      <span className="text-gray-400 text-sm capitalize">
                        {item.category || 'Hobby'}
                      </span>
                    </div>

                    {/* Image Counter */}
                    {item.images && item.images.length > 1 && (
                      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-xs text-white border border-white/20 z-10">
                        {currentImageIndex + 1} / {item.images.length}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="text-center mt-12">
              <Link href="/cocurriculars" className="btn-primary">
                <span>View All Hobbies</span>
              </Link>
            </div>
          </section>

          {/* ============================================
              TESTIMONIALS SECTION
              ============================================ */}
          <section id="testimonials" className="py-20 sm:py-28 overflow-hidden">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 gradient-text-purple">Testimonials</h2>
              <div className="section-divider"></div>
            </div>

            <div className="max-w-6xl mx-auto">
              <div className="flex items-center gap-4 sm:gap-6 mb-12">
                <button
                  onClick={() => scrollTestimonials('left')}
                  className="flex-shrink-0 bg-purple-500/20 hover:bg-purple-500 text-white p-3 sm:p-4 rounded-full transition-all duration-300 border border-purple-500/30 hover:border-purple-500"
                  aria-label="Previous testimonial"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div
                  ref={testimonialScrollRef}
                  className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory flex-1"
                >
                  {data.testimonials?.map((item) => (
                    <div key={item._id} className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] snap-start">
                      <div className="glass-card p-6 sm:p-8 h-full relative">
                        {/* Quote Mark */}
                        <div className="quote-mark absolute top-4 left-6">&quot;</div>

                        {/* Rating */}
                        <div className="flex text-yellow-400 mb-4 relative z-10">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={`text-lg ${i < (item.rating || 5) ? 'text-yellow-400' : 'text-gray-600'}`}>
                              ★
                            </span>
                          ))}
                        </div>

                        {/* Testimonial Text */}
                        <blockquote className="text-gray-300 text-base leading-relaxed mb-6 relative z-10">
                          &quot;{item.testimonial}&quot;
                        </blockquote>

                        {/* Author */}
                        <div className="border-t border-white/10 pt-4">
                          <cite className="not-italic text-white font-semibold block">{item.name}</cite>
                          <p className="text-gray-500 text-sm">{item.role} at {item.company}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Duplicate for infinite loop */}
                  {data.testimonials?.map((item) => (
                    <div key={`${item._id}-dup`} className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] snap-start">
                      <div className="glass-card p-6 sm:p-8 h-full relative">
                        <div className="quote-mark absolute top-4 left-6">&quot;</div>
                        <div className="flex text-yellow-400 mb-4 relative z-10">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={`text-lg ${i < (item.rating || 5) ? 'text-yellow-400' : 'text-gray-600'}`}>
                              ★
                            </span>
                          ))}
                        </div>
                        <blockquote className="text-gray-300 text-base leading-relaxed mb-6 relative z-10">
                          &quot;{item.testimonial}&quot;
                        </blockquote>
                        <div className="border-t border-white/10 pt-4">
                          <cite className="not-italic text-white font-semibold block">{item.name}</cite>
                          <p className="text-gray-500 text-sm">{item.role} at {item.company}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => scrollTestimonials('right')}
                  className="flex-shrink-0 bg-purple-500/20 hover:bg-purple-500 text-white p-3 sm:p-4 rounded-full transition-all duration-300 border border-purple-500/30 hover:border-purple-500"
                  aria-label="Next testimonial"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="text-center">
              <Link href="/testimonials" className="btn-primary">
                <span>Add Testimonial</span>
              </Link>
            </div>
          </section>

          {/* ============================================
              CONTACT SECTION - CTA BANNER
              ============================================ */}
          <section id="contact" className="py-20 sm:py-28">
            <div className="relative glass-card p-12 sm:p-16 lg:p-20 text-center overflow-hidden">
              {/* Background Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>

              <div className="relative z-10">
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 gradient-text-purple">Let&apos;s Work Together</h2>
                <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10">
                  I&apos;m always open to discussing new opportunities, collaborations, or just having a chat about technology and innovation.
                </p>
                <Link href="/contact" className="btn-primary inline-block">
                  <span>Get In Touch</span>
                </Link>
              </div>
            </div>
          </section>

        </div>
      </main>

      <Footer
        authorName={data.about?.name}
        email={data.about?.email}
        socialLinks={data.about?.profileLinks}
      />

      {/* ============================================
          IMAGE POPUP MODAL
          ============================================ */}
      {isPopupOpen && selectedAcademic && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="relative max-w-5xl w-full h-[90vh] sm:h-auto bg-black/90 rounded-2xl overflow-hidden border border-white/10">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-black/50 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="text-white font-medium truncate">
                  {currentImages[currentImageIndex]?.alt || getDisplayName(selectedAcademic)}
                </span>
                {currentImages.length > 1 && (
                  <span className="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded text-xs font-mono">
                    {currentImageIndex + 1} / {currentImages.length}
                  </span>
                )}
              </div>
              <button
                onClick={closeImagePopup}
                className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"
              >
                <span className="text-white text-xl">×</span>
              </button>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] h-[calc(90vh-60px)] sm:h-[70vh]">
              {/* Image Viewer */}
              <div className="relative bg-black flex items-center justify-center p-6 lg:border-r border-white/10">
                {currentImages.length > 0 && currentImages[currentImageIndex]?.asset?.url && (
                  <>
                    <Image
                      src={currentImages[currentImageIndex].asset.url}
                      alt={currentImages[currentImageIndex]?.alt || getDisplayName(selectedAcademic)}
                      width={800}
                      height={600}
                      className="max-w-full max-h-full object-contain rounded-lg"
                    />
                    {currentImages.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-purple-500 text-white rounded-full flex items-center justify-center transition-all duration-300"
                        >
                          ←
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-purple-500 text-white rounded-full flex items-center justify-center transition-all duration-300"
                        >
                          →
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>

              {/* Details Panel */}
              <div className="bg-black/50 p-6 overflow-y-auto">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white mb-3">
                    {currentImages[currentImageIndex]?.alt || getDisplayName(selectedAcademic)}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-xs">
                      {selectedAcademic?.year || 'Record'}
                    </span>
                    <span>•</span>
                    <span className="capitalize">{getCategoryName(selectedAcademic)}</span>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-white uppercase tracking-wide mb-3 flex items-center gap-2">
                    <span className="w-1 h-5 bg-purple-500 rounded"></span>
                    Details
                  </h4>
                  <div className="text-gray-400 text-sm leading-relaxed">
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

                {currentImages.length > 1 && (
                  <div>
                    <h4 className="text-sm font-semibold text-white uppercase tracking-wide mb-3 flex items-center gap-2">
                      <span className="w-1 h-5 bg-purple-500 rounded"></span>
                      Images ({currentImages.length})
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {currentImages.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`aspect-square rounded-lg overflow-hidden border-2 transition-all duration-300 hover:scale-105 ${index === currentImageIndex
                            ? 'border-purple-500 shadow-lg shadow-purple-500/30'
                            : 'border-white/10 hover:border-white/30'
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

                <div className="mt-6 p-3 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-xs text-gray-500">
                    <span className="text-purple-400">tip:</span> use arrow keys ← → or ESC to close
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