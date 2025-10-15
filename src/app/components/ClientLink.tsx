'use client'

import { useRouter } from 'next/navigation'
import { useLoading } from './ClientWrapper'
import { ReactNode } from 'react'

interface ClientLinkProps {
  href: string
  children: ReactNode
  className?: string
}

export default function ClientLink({ href, children, className }: ClientLinkProps) {
  const router = useRouter()
  const { startPageTransition } = useLoading()

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    
    // Check if it's a hash link on the home page
    if (href.startsWith('/#')) {
      // Navigate to home page with hash - use router.push without loading for smooth transition
      router.push(href)
    } else if (href.startsWith('#')) {
      // Same page hash navigation - no loading needed
      const element = document.getElementById(href.substring(1))
      element?.scrollIntoView({ behavior: 'smooth' })
    } else {
      // Different page navigation - show loading
      startPageTransition()
      router.push(href)
    }
  }

  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  )
}
