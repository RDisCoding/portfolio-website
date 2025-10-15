'use client'

import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'

// Import all our new schema types
import about from './src/sanity/schemas/about'
import academics from './src/sanity/schemas/academics'
import project from './src/sanity/schemas/projects'
import cocurricular from './src/sanity/schemas/cocurricular'
import testimonial from './src/sanity/schemas/testimonial'
import resume from './src/sanity/schemas/resume'

export default defineConfig({
  basePath: '/studio',

  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,

  // Add all the new schemas to the array of types
  schema: {
    types: [about, academics, project, cocurricular, testimonial, resume],
  },

  plugins: [
    structureTool(),
    visionTool(),
  ],
})

