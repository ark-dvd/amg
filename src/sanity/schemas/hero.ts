import { defineField, defineType } from 'sanity'

export const hero = defineType({
  name: 'hero',
  title: 'Hero',
  type: 'document',
  fields: [
    defineField({
      name: 'mediaType',
      title: 'Media Type',
      type: 'string',
      options: {
        list: [
          { title: 'Image', value: 'image' },
          { title: 'Video', value: 'video' },
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
      hidden: ({ document }) => document?.mediaType !== 'image',
      validation: (rule) =>
        rule.custom((value, context) => {
          const doc = context.document
          if (doc?.mediaType === 'image' && !value) {
            return 'Image is required when media type is "image"'
          }
          return true
        }),
    }),
    defineField({
      name: 'videoUrl',
      title: 'Video URL',
      type: 'url',
      hidden: ({ document }) => document?.mediaType !== 'video',
      validation: (rule) =>
        rule.custom((value, context) => {
          const doc = context.document
          if (doc?.mediaType === 'video' && !value) {
            return 'Video URL is required when media type is "video"'
          }
          return true
        }),
    }),
    defineField({
      name: 'videoPoster',
      title: 'Video Poster',
      type: 'image',
      options: { hotspot: true },
      hidden: ({ document }) => document?.mediaType !== 'video',
      description: 'Fallback image displayed before video loads',
    }),
    defineField({
      name: 'headline',
      title: 'Headline',
      type: 'string',
      validation: (rule) => rule.required().max(100),
    }),
    defineField({
      name: 'subheadline',
      title: 'Subheadline',
      type: 'string',
      validation: (rule) => rule.max(250),
    }),
    defineField({
      name: 'ctaLabel',
      title: 'CTA Label',
      type: 'string',
      validation: (rule) => rule.required().max(50),
    }),
    defineField({
      name: 'ctaUrl',
      title: 'CTA URL',
      type: 'string',
      description: 'Internal path or external URL',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'overlayOpacity',
      title: 'Overlay Opacity',
      type: 'number',
      description: '0–100. Default: 40',
      initialValue: 40,
      validation: (rule) => rule.min(0).max(100),
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
    select: { title: 'headline' },
  },
})
