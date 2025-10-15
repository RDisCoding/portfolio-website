import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'cocurricular',
  title: 'Co-Curriculars',
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
      name: 'activity',
      title: 'Activity / Achievement',
      type: 'string',
      description: "e.g., 'Basketball Team Captain', 'Hackathon Winner'",
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
      of: [{type: 'block'}],
    }),
    defineField({
      name: 'images',
      title: 'Activity Images',
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
      description: 'Upload multiple images for this activity. First image will be used as thumbnail.',
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          {title: 'Sports', value: 'sports'},
          {title: 'Hobbies', value: 'hobbies'},
          {title: 'Achievements', value: 'achievement'},
          {title: 'Leadership', value: 'leadership'},
          {title: 'Volunteering', value: 'volunteering'},
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'link',
      title: 'External Link',
      type: 'url',
      description: 'Link to certificate, news article, or related content',
    }),
  ],
  preview: {
    select: {
      title: 'activity',
      subtitle: 'category',
    },
  },
})
