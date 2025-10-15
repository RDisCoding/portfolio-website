import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'testimonial',
  title: 'Testimonials',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      description: "The person's full name.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'company',
      title: 'Company',
      type: 'string',
      description: "e.g., 'Google', 'University of AI'",
    }),
    defineField({
      name: 'role',
      title: 'Role',
      type: 'string',
      description: "e.g., 'Senior Developer', 'Professor'",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
        name: 'testimonial',
        title: 'Testimonial Text / Comment',
        type: 'text',
        validation: (Rule) => Rule.required(),
    }),
    defineField({
        name: 'rating',
        title: 'Rating',
        type: 'number',
        description: 'A rating from 1 to 5.',
        validation: (Rule) => Rule.min(1).max(5).integer(),
    }),
    defineField({
      name: 'approved',
      title: 'Approved to Show?',
      type: 'boolean',
      description: 'Toggle this ON to make the testimonial appear on the live site.',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'company',
      approved: 'approved',
    },
    prepare({title, subtitle, approved}) {
      return {
        title: `${title} (${approved ? 'Approved' : 'Pending'})`,
        subtitle: subtitle,
      }
    },
  },
})

