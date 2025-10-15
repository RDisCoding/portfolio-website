import { defineField, defineType } from 'sanity'
import { UserIcon } from '@sanity/icons'

export default defineType({
  name: 'about',
  title: 'About',
  type: 'document',
  icon: UserIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (Rule) => Rule.email(),
    }),
    defineField({
        name: 'status',
        title: 'Current Status',
        type: 'string',
        description: 'e.g., "Open to new opportunities" or "Actively seeking internships"',
    }),
    defineField({
      name: 'biography',
      title: 'Biography',
      type: 'array',
      of: [{ type: 'block' }], // This allows for rich text editing (bold, italics, etc.)
    }),
    defineField({
        name: 'education',
        title: 'Education',
        type: 'string',
        description: 'e.g., "B.Tech in Artificial Intelligence, XYZ University"',
    }),
    defineField({
      name: 'skills',
      title: 'Skills',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Add your technical skills (e.g., Python, Next.js, PyTorch).',
      options: {
        layout: 'tags',
      },
    }),
    defineField({
        name: 'hobbies',
        title: 'Hobbies & Interests',
        type: 'array',
        of: [{ type: 'string' }],
        description: 'Add your hobbies (e.g., Chess, Reading, Hiking).',
        options: {
          layout: 'tags',
        },
      }),
    defineField({
      name: 'profileLinks',
      title: 'Profile Links',
      type: 'object',
      fields: [
        { name: 'github', title: 'GitHub', type: 'url' },
        { name: 'linkedin', title: 'LinkedIn', type: 'url' },
        { name: 'twitter', title: 'Twitter / X', type: 'url' },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'name',
    },
  },
})
