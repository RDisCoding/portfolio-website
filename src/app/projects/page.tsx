'use client'

import { sanityClient } from '@/lib/sanity.client'
import { groq } from 'next-sanity'
import { PortableText } from '@portabletext/react'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import type { AboutData, ProjectData } from '@/types'

const query = groq`{
  "about": *[_type == "about"][0],
  "projects": *[_type == "project"] | order(order asc){
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
  "resumeURL": *[_type == "resume"][0].resumeFile.asset->url
}`

interface ProjectsData {
  about: AboutData | null;
  projects: ProjectData[];
  resumeURL: string | null;
}

export default function ProjectsPage() {
  const [data, setData] = useState<ProjectsData>({
    about: null,
    projects: [],
    resumeURL: null
  })
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [projectImageIndices, setProjectImageIndices] = useState<{[key: string]: number}>({})

  useEffect(() => {
    const fetchData = async () => {
      const result = await sanityClient.fetch(query)
      setData(result)
    }
    fetchData()
  }, [])

  // Auto-rotate project card images
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

  const categories = [
    { value: 'all', label: 'All Projects' },
    { value: 'research', label: 'Research Work & Papers' },
    { value: 'personal', label: 'Personal Projects' },
    { value: 'hackathon', label: 'Hackathons' },
    { value: 'work', label: 'Work Experiences' },
  ]

  const filteredProjects = selectedCategory === 'all' 
    ? data.projects 
    : data.projects.filter(p => p.category === selectedCategory)

  // Group projects by category
  const groupedProjects = categories
    .filter(cat => cat.value !== 'all')
    .map(cat => ({
      category: cat,
      projects: data.projects.filter(p => p.category === cat.value)
    }))
    .filter(group => group.projects.length > 0)

  const openProjectDialog = (project: ProjectData) => {
    setSelectedProject(project)
    setCurrentImageIndex(0)
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden'
  }

  const closeProjectDialog = () => {
    setSelectedProject(null)
    setCurrentImageIndex(0)
    // Re-enable body scroll when modal is closed
    document.body.style.overflow = 'unset'
  }

  const nextImage = useCallback(() => {
    if (selectedProject?.images && selectedProject.images.length > 0) {
      setCurrentImageIndex(prev => 
        prev < selectedProject.images!.length - 1 ? prev + 1 : 0
      )
    }
  }, [selectedProject?.images])

  const prevImage = useCallback(() => {
    if (selectedProject?.images && selectedProject.images.length > 0) {
      setCurrentImageIndex(prev => 
        prev > 0 ? prev - 1 : selectedProject.images!.length - 1
      )
    }
  }, [selectedProject?.images])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!selectedProject) return
      
      switch (e.key) {
        case 'Escape':
          closeProjectDialog()
          break
        case 'ArrowLeft':
          if (selectedProject.images && selectedProject.images.length > 1) prevImage()
          break
        case 'ArrowRight':
          if (selectedProject.images && selectedProject.images.length > 1) nextImage()
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [selectedProject, nextImage, prevImage])

  return (
    <div className="min-h-screen text-white">
      {/* Animated Background */}
      <div className="animated-bg">
        <div className="orb orb1"></div>
        <div className="orb orb2"></div>
        <div className="orb orb3"></div>
      </div>

      <Navbar resumeUrl={data.resumeURL} />
      
      <main className="relative z-10 pt-32 px-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent font-mono tracking-tight">All Projects</h1>
            <div className="w-24 h-1 bg-gradient-to-r from-purple-600 to-purple-400 mx-auto"></div>
            <p className="text-gray-400 mt-6 text-lg max-w-2xl mx-auto">
              Explore my complete portfolio of projects showcasing various technologies and solutions.
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-3 mb-16">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                  selectedCategory === cat.value
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/50'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Projects by Category */}
          {selectedCategory === 'all' ? (
            // Show grouped by category
            <div className="space-y-20">
              {groupedProjects.map((group, idx) => (
                <div key={idx}>
                  <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">
                    {group.category.label}
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {group.projects.map((project) => (
                      <ProjectCard 
                        key={project._id} 
                        project={project} 
                        onOpen={openProjectDialog}
                        imageIndex={projectImageIndices[project._id] || 0}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Show filtered projects
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {filteredProjects.map((project) => (
                <ProjectCard 
                  key={project._id} 
                  project={project} 
                  onOpen={openProjectDialog}
                  imageIndex={projectImageIndices[project._id] || 0}
                />
              ))}
            </div>
          )}

          {/* Back to Home */}
          <div className="text-center mt-16 mb-8">
            <Link 
              href="/#projects"
              className="inline-block px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/20 hover:border-purple-400/50 transition-all duration-300 backdrop-blur-sm"
            >
              ← Back to Home
            </Link>
          </div>

        </div>
      </main>

      <Footer 
        authorName={data.about?.name} 
        email={data.about?.email}
        socialLinks={data.about?.profileLinks}
      />

      {/* Project Detail Dialog */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="relative max-w-5xl w-full bg-[#0d1117] rounded-lg overflow-hidden shadow-2xl border border-[#21262d]">
            {/* Dark Terminal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#161b22] border-b border-[#21262d]">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
                </div>
                <span className="text-[#8b949e] text-sm font-mono">{selectedProject.title}</span>
                {selectedProject.images && selectedProject.images.length > 1 && (
                  <span className="text-[#8b949e] text-xs bg-[#21262d] px-2 py-1 rounded">
                    {currentImageIndex + 1} / {selectedProject.images.length}
                  </span>
                )}
              </div>
              <button
                onClick={closeProjectDialog}
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
                {selectedProject.images && selectedProject.images.length > 0 ? (
                  <>
                    <Image
                      src={selectedProject.images[currentImageIndex]?.asset?.url || '/placeholder.png'}
                      alt={selectedProject.images[currentImageIndex]?.alt || selectedProject.title}
                      width={800}
                      height={600}
                      className="max-w-full max-h-full object-contain rounded-lg"
                    />
                    {selectedProject.images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#21262d] hover:bg-[#30363d] rounded-full flex items-center justify-center transition-colors border border-[#30363d]"
                        >
                          <span className="text-[#c9d1d9] text-xl">‹</span>
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#21262d] hover:bg-[#30363d] rounded-full flex items-center justify-center transition-colors border border-[#30363d]"
                        >
                          <span className="text-[#c9d1d9] text-xl">›</span>
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="text-[#8b949e] text-center">
                    <div className="text-4xl mb-2">📁</div>
                    <p>No images available</p>
                  </div>
                )}
              </div>

              {/* Right Side - Details Panel */}
              <div className="bg-[#0d1117] p-6 overflow-y-auto">
                {/* Project Info */}
                <div className="mb-6">
                  <h3 className="text-[#c9d1d9] text-xl font-bold mb-2">{selectedProject.title}</h3>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-[#8b949e] text-sm bg-[#161b22] px-3 py-1 rounded border border-[#21262d]">
                      {selectedProject.year}
                    </span>
                    <span className="text-purple-400 text-sm bg-purple-900/20 px-3 py-1 rounded border border-purple-700/50 capitalize">
                      {categories.find(c => c.value === selectedProject.category)?.label || selectedProject.category}
                    </span>
                  </div>
                  {selectedProject.description && (
                    <div className="text-[#8b949e] text-sm prose prose-invert prose-sm max-w-none mb-4">
                      <PortableText value={selectedProject.description} />
                    </div>
                  )}
                </div>

                {/* Tech Stack */}
                {selectedProject.techStack && selectedProject.techStack.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-[#c9d1d9] text-sm font-semibold mb-3 flex items-center gap-2">
                      <span className="text-purple-400">⚡</span> Technologies
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProject.techStack.map((tech: string, index: number) => (
                        <span 
                          key={index} 
                          className="text-xs text-[#c9d1d9] bg-[#161b22] px-3 py-1.5 rounded border border-[#21262d] hover:border-purple-500/50 transition-colors"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Links */}
                <div className="space-y-3">
                  {selectedProject.projectLink && (
                    <a
                      href={selectedProject.projectLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between w-full px-4 py-3 bg-[#161b22] hover:bg-[#21262d] rounded-lg border border-[#21262d] hover:border-purple-500/50 transition-all group"
                    >
                      <span className="text-[#c9d1d9] text-sm font-medium">View Live Demo</span>
                      <span className="text-purple-400 group-hover:translate-x-1 transition-transform">→</span>
                    </a>
                  )}
                  {selectedProject.docsLink && (
                    <a
                      href={selectedProject.docsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between w-full px-4 py-3 bg-[#161b22] hover:bg-[#21262d] rounded-lg border border-[#21262d] hover:border-purple-500/50 transition-all group"
                    >
                      <span className="text-[#c9d1d9] text-sm font-medium">View Documentation</span>
                      <span className="text-purple-400 group-hover:translate-x-1 transition-transform">→</span>
                    </a>
                  )}
                  {selectedProject.githubLink && (
                    <a
                      href={selectedProject.githubLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between w-full px-4 py-3 bg-[#161b22] hover:bg-[#21262d] rounded-lg border border-[#21262d] hover:border-purple-500/50 transition-all group"
                    >
                      <span className="text-[#c9d1d9] text-sm font-medium">View GitHub</span>
                      <span className="text-purple-400 group-hover:translate-x-1 transition-transform">→</span>
                    </a>
                  )}
                </div>

                {/* Image Navigation Thumbnails */}
                {selectedProject.images && selectedProject.images.length > 1 && (
                  <div className="mt-6 pt-6 border-t border-[#21262d]">
                    <h4 className="text-[#8b949e] text-xs uppercase tracking-wider mb-3">Gallery</h4>
                    <div className="grid grid-cols-4 gap-2">
                      {selectedProject.images.map((img, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={`relative aspect-square rounded overflow-hidden border-2 transition-all ${
                            idx === currentImageIndex
                              ? 'border-purple-500'
                              : 'border-[#21262d] hover:border-[#30363d]'
                          }`}
                        >
                          <Image
                            src={img.asset?.url || '/placeholder.png'}
                            alt={img.alt || `Image ${idx + 1}`}
                            fill
                            className="object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Keyboard Shortcuts Hint */}
                <div className="mt-6 p-3 bg-[#161b22] rounded border border-[#21262d]">
                  <p className="text-[#8b949e] text-xs">
                    <span className="text-[#c9d1d9] font-mono">ESC</span> to close • 
                    <span className="text-[#c9d1d9] font-mono"> ←→</span> to navigate
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

// Project Card Component
function ProjectCard({ project, onOpen, imageIndex }: { project: ProjectData; onOpen: (project: ProjectData) => void; imageIndex: number }) {
  const currentImageIndex = imageIndex || 0
  const thumbnailUrl = project.images?.[currentImageIndex]?.asset?.url

  return (
    <div 
      onClick={() => onOpen(project)}
      className="glass-card group relative overflow-hidden cursor-pointer h-[440px] flex flex-col hover:shadow-[0_20px_60px_rgba(147,51,234,0.4)] transition-all duration-300"
    >
      {/* Thumbnail */}
      <div className="relative h-60 overflow-hidden bg-gradient-to-br from-[#161b22] to-[#0d1117]">
        {thumbnailUrl ? (
          <>
            <Image
              src={thumbnailUrl}
              alt={project.images?.[currentImageIndex]?.alt || project.title}
              fill
              className="object-cover group-hover:scale-110 transition-all duration-500 animate-fadeIn"
              key={currentImageIndex}
              style={{
                animation: 'fadeIn 0.5s ease-in-out'
              }}
            />
            {/* Animated overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
            
            {/* Decorative gradient orbs */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-700"></div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/20 to-purple-600/10 relative">
            <div className="absolute inset-0">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-radial from-purple-600/30 to-transparent rounded-full animate-pulse"></div>
            </div>
            <span className="text-6xl opacity-30 relative z-10">📁</span>
          </div>
        )}
        
        {/* Image Count Badge */}
        {project.images && project.images.length > 1 && (
          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs text-white flex items-center gap-2 border border-purple-500/30">
            <span>{currentImageIndex + 1} / {project.images.length}</span>
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute top-3 left-3 bg-purple-600/30 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs text-purple-300 border border-purple-500/50 font-semibold">
          {project.year}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex-1 flex flex-col bg-gradient-to-b from-transparent to-purple-950/5">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors flex-1 leading-tight">
            {project.title}
          </h3>
        </div>

        {/* Tech Stack Preview */}
        {project.techStack && project.techStack.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {project.techStack.slice(0, 3).map((tech: string, idx: number) => (
                <span key={idx} className="text-xs bg-purple-900/20 text-purple-300 px-2 py-1 rounded border border-purple-700/30">
                  {tech}
                </span>
              ))}
              {project.techStack.length > 3 && (
                <span className="text-xs bg-white/5 text-gray-400 px-2 py-1 rounded border border-white/10">
                  +{project.techStack.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Spacer to push links to bottom */}
        <div className="flex-1"></div>

        {/* Links */}
        <div className="flex gap-3 pt-4 border-t border-white/10">
          {project.projectLink && (
            <div className="flex-1 text-center px-3 py-2 bg-gradient-to-r from-purple-600/30 to-purple-700/30 border border-purple-500/50 rounded text-purple-300 text-sm font-medium hover:from-purple-600/40 hover:to-purple-700/40 transition-all">
              View Live
            </div>
          )}
          {project.docsLink && (
            <div className="flex-1 text-center px-3 py-2 bg-gradient-to-r from-purple-600/30 to-purple-700/30 border border-purple-500/50 rounded text-purple-300 text-sm font-medium hover:from-purple-600/40 hover:to-purple-700/40 transition-all">
              View Docs
            </div>
          )}
          {!project.projectLink && !project.docsLink && project.githubLink && (
            <div className="flex-1 text-center px-3 py-2 bg-gradient-to-r from-purple-600/30 to-purple-700/30 border border-purple-500/50 rounded text-purple-300 text-sm font-medium hover:from-purple-600/40 hover:to-purple-700/40 transition-all">
              View GitHub
            </div>
          )}
        </div>
      </div>
    </div>
  )
}