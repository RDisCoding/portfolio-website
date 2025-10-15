import { sanityClient } from '@/lib/sanity.client'
import { groq } from 'next-sanity'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'
import TestimonialForm from '@/app/components/TestimonialForm'

const query = groq`{
  "about": *[_type == "about"][0],
  "testimonials": *[_type == "testimonial" && approved == true] | order(_createdAt desc),
  "resumeURL": *[_type == "resume"][0].resumeFile.asset->url
}`

interface TestimonialsData {
  about: any;
  testimonials: any[];
  resumeURL: string | null;
}

export default async function TestimonialsPage() {
  const data: TestimonialsData = await sanityClient.fetch(query)

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
        <div className="max-w-4xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent font-mono tracking-tight">Add Your Testimonial</h1>
            <div className="w-24 h-1 bg-gradient-to-r from-purple-600 to-purple-400 mx-auto"></div>
            <p className="text-gray-400 mt-6 text-lg max-w-2xl mx-auto">
              Share your experience working with me. Your feedback helps others understand my work style and capabilities.
            </p>
          </div>

          {/* Testimonial Form */}
          <div className="glass-card p-10">
            <TestimonialForm />
          </div>

        </div>
      </main>

      <Footer 
        authorName={data.about?.name}
        email={data.about?.email}
        socialLinks={data.about?.profileLinks}
      />
    </div>
  )
}

export const revalidate = 10;