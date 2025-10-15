'use server'

import { createClient } from 'next-sanity'
import { Resend } from 'resend'

// --- Initialize Resend for emails ---
const resend = new Resend(process.env.RESEND_API_KEY)
const myEmail = process.env.PERSONAL_EMAIL

// --- Create a dedicated Sanity client for WRITE operations ---
// This client uses the secure, server-only token
const writeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN, // The important part!
});


// Action to handle the contact form submission
export async function handleContactForm(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const message = formData.get('message') as string

  if (!name || !email || !message || !myEmail) {
    return { success: false, error: 'Missing required fields.' }
  }

  try {
    await resend.emails.send({
      from: 'Portfolio Contact Form <onboarding@resend.dev>',
      to: myEmail,
      subject: `New message from ${name}`,
      replyTo: email,
      html: `<p>You received a new message from your portfolio contact form.</p>
             <p><strong>Name:</strong> ${name}</p>
             <p><strong>Email:</strong> ${email}</p>
             <p><strong>Message:</strong></p>
             <p>${message}</p>`,
    })
    return { success: true }
  } catch (error) {
    console.error('Resend error:', error)
    return { success: false, error: 'Failed to send message.' }
  }
}

// Action to handle the testimonial form submission
export async function handleTestimonialForm(formData: FormData) {
  const name = formData.get('name') as string
  const company = formData.get('company') as string
  const role = formData.get('role') as string
  const rating = Number(formData.get('rating'))
  const testimonial = formData.get('testimonial') as string

  if (!name || !role || !rating || !testimonial) {
    return { success: false, error: 'Missing required fields.' }
  }

  try {
    // Use the dedicated 'writeClient' to create the document
    await writeClient.create({
      _type: 'testimonial',
      name,
      company,
      role,
      rating,
      testimonial,
      approved: false, // Default to not approved
    })
    return { success: true }
  } catch (error) {
    console.error('Sanity error:', error)
    return { success: false, error: 'Failed to submit testimonial.' }
  }
}

