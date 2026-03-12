import { defineArrayMember, defineField, defineType } from 'sanity'
import { isUniqueSlug } from '../lib/isUniqueSlug'

export const project = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required().max(150),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'Slug cannot be changed after creation.',
      options: {
        source: 'title',
        isUnique: isUniqueSlug,
      },
      validation: (rule) =>
        rule.required().custom((slug) => {
          const current = slug?.current
          if (!current) return 'Slug is required'
          if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(current)) {
            return 'Slug must contain only lowercase letters, numbers, and hyphens'
          }
          return true
        }),
    }),
    defineField({
      name: 'clientName',
      title: 'Client Name',
      type: 'string',
      validation: (rule) => rule.max(150),
    }),
    defineField({
      name: 'shortDescription',
      title: 'Short Description',
      type: 'string',
      validation: (rule) => rule.required().max(250),
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'H2', value: 'h2' },
            { title: 'H3', value: 'h3' },
            { title: 'H4', value: 'h4' },
            { title: 'Quote', value: 'blockquote' },
          ],
          lists: [
            { title: 'Bullet', value: 'bullet' },
            { title: 'Numbered', value: 'number' },
          ],
          marks: {
            decorators: [
              { title: 'Bold', value: 'strong' },
              { title: 'Italic', value: 'em' },
              { title: 'Underline', value: 'underline' },
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [
                  defineField({
                    name: 'href',
                    type: 'url',
                    title: 'URL',
                    validation: (rule) =>
                      rule.uri({ allowRelative: true, scheme: ['http', 'https', 'mailto'] }),
                  }),
                ],
              },
            ],
          },
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'projectType',
      title: 'Project Type',
      type: 'string',
      validation: (rule) => rule.max(80),
    }),
    defineField({
      name: 'technologies',
      title: 'Technologies',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'string',
          validation: (rule) => rule.max(50),
        }),
      ],
      validation: (rule) =>
        rule.custom((value) => {
          if (!value) return true
          if (value.length < 1 || value.length > 20) {
            return 'Must have between 1 and 20 technologies if provided'
          }
          return true
        }),
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: { hotspot: true },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'screenshots',
      title: 'Screenshots',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
        }),
      ],
      validation: (rule) => rule.max(9),
      description: 'Up to 9 additional images. First image is shown as the gallery opener.',
    }),
    defineField({
      name: 'completedAt',
      title: 'Completed At',
      type: 'date',
    }),
    defineField({
      name: 'isActive',
      title: 'Is Active',
      type: 'boolean',
      initialValue: false,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'featuredOnHomepage',
      title: 'Featured On Homepage',
      type: 'boolean',
      initialValue: false,
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
      description: 'Set by API when archiving. Cleared on restore.',
    }),
    defineField({
      name: 'seoTitle',
      title: 'SEO Title',
      type: 'string',
      validation: (rule) => rule.max(70),
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO Description',
      type: 'string',
      validation: (rule) => rule.max(160),
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
      title: 'title',
      subtitle: 'clientName',
      media: 'coverImage',
    },
  },
})
