import { sanityClient } from '@/lib/sanity.client'
import { groq } from 'next-sanity'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'
import ContactForm from '@/app/components/ContactForm'
import type { AboutData } from '@/types'

const query = groq`{
  "about": *[_type == "about"][0],
  "resumeURL": *[_type == "resume"][0].resumeFile.asset->url
}`

interface ContactData {
  about: AboutData | null;
  resumeURL: string | null;
}

export default async function ContactPage() {
  const data: ContactData = await sanityClient.fetch(query)

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
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent font-mono tracking-tight">Get In Touch</h1>
            <div className="w-24 h-1 bg-gradient-to-r from-purple-600 to-purple-400 mx-auto"></div>
            <p className="text-gray-400 mt-6 text-lg max-w-2xl mx-auto">
              I&apos;m always open to discussing new opportunities, collaborations, or just having a chat about technology and innovation.
            </p>
          </div>

          {/* Contact Form - Centered */}
          <div className="glass-card p-10">
            <h2 className="text-2xl font-semibold mb-8 bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent text-center">Send Me a Message</h2>
            <ContactForm />
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