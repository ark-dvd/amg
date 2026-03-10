import { defineField, defineType } from 'sanity'

export const testimonial = defineType({
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  fields: [
    defineField({
      name: 'authorName',
      title: 'Author Name',
      type: 'string',
      validation: (rule) => rule.required().max(100),
    }),
    defineField({
      name: 'authorRole',
      title: 'Author Role',
      type: 'string',
      validation: (rule) => rule.max(100),
    }),
    defineField({
      name: 'authorCompany',
      title: 'Author Company',
      type: 'string',
      validation: (rule) => rule.max(100),
    }),
    defineField({
      name: 'authorPhoto',
      title: 'Author Photo',
      type: 'image',
    }),
    defineField({
      name: 'quote',
      title: 'Quote',
      type: 'text',
      validation: (rule) => rule.required().max(600),
    }),
    defineField({
      name: 'projectRef',
      title: 'Project',
      type: 'reference',
      to: [{ type: 'project' }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'featuredOnPortfolio',
      title: 'Featured On Portfolio',
      type: 'boolean',
      initialValue: false,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      validation: (rule) => rule.required().min(0).integer(),
    }),
    defineField({
      name: 'isArchived',
      title: 'Is Archived',
      type: 'boolean',
      initialValue: false,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'archivedAt',
      title: 'Archived At',
      type: 'datetime',
      readOnly: true,
      description: 'Set by API when archiving.',
    }),
    defineField({
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      readOnly: true,
      description: 'Set by API on creation. Immutable.',
    }),
    defineField({
      name: 'updatedAt',
      title: 'Updated At',
      type: 'datetime',
      readOnly: true,
      description: 'Set by API on every mutation',
    }),
  ],
  preview: {
    select: {
      title: 'authorName',
      subtitle: 'quote',
    },
  },
})
