import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'project',
  title: 'Projects & Experience',
  type: 'document',
  fields: [
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Use this to manually order the items. Lower numbers appear first.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          {title: 'Personal Projects', value: 'personal'},
          {title: 'Work Experiences', value: 'work'},
          {title: 'Research Work & Papers', value: 'research'},
          {title: 'Hackathons', value: 'hackathon'},
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'year',
      title: 'Year',
      type: 'string',
      description: 'Year or date range (e.g., "2024" or "2023-2024")',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [{type: 'block'}], // This enables the rich text editor
    }),
    defineField({
      name: 'images',
      title: 'Project Images',
      type: 'array',
      of: [
        {
          type: 'image',
          options: {
            hotspot: true,
          },
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Alternative text',
              description: 'Important for SEO and accessibility',
            },
          ],
        },
      ],
      description: 'Upload multiple images for this project. First image will be used as thumbnail.',
    }),
    defineField({
      name: 'techStack',
      title: 'Tech Stack',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        layout: 'tags',
      },
    }),
    defineField({
      name: 'projectLink',
      title: 'Live Demo Link',
      type: 'url',
      description: 'Link to the live project or demo',
    }),
    defineField({
      name: 'docsLink',
      title: 'Documentation Link',
      type: 'url',
      description: 'Link to documentation, paper, or detailed write-up',
    }),
    defineField({
      name: 'githubLink',
      title: 'GitHub Link',
      type: 'url',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'category',
    },
  },
})
