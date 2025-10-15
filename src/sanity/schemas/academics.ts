import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'academics',
  title: 'Academic Journey',
  type: 'document',
  fields: [
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Use this to manually order the academic records. Lower numbers appear first.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: "e.g., 'B.Tech in Artificial Intelligence', 'Class 12 Board Exam'",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'institution',
      title: 'Institution',
      type: 'string',
      description: "e.g., 'University of AI', 'City High School'",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'year',
      title: 'Year',
      type: 'string',
      description: "e.g., '2021-2025', '2021'",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'score',
      title: 'Score',
      type: 'string',
      description: "e.g., '9.2 CGPA', '95%'",
    }),
    defineField({
      name: 'semester',
      title: 'Semester Number',
      type: 'number',
      description: 'Semester number for timeline ordering (e.g., 1, 2, 3...)',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'Description for this academic period/semester. Shown in the popup.',
    }),
    defineField({
      name: 'semesterImages',
      title: 'Semester Documents/Images',
      type: 'array',
      of: [
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Alt Text',
              description: 'Alternative text for the image/document.'
            }
          ]
        }
      ],
      description: 'Upload all relevant marksheets, certificates, or documents for this semester.',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'institution',
    },
  },
})
