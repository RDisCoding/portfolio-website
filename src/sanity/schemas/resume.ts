import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'resume',
  title: 'Resume',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: "e.g., 'Main Resume PDF'",
      initialValue: 'Main Resume PDF',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'resumeFile',
      title: 'Resume File',
      type: 'file',
      description: 'Upload your resume file here (PDF recommended).',
      options: {
        accept: '.pdf',
      },
      validation: (Rule) => Rule.required(),
    }),
  ],
})
