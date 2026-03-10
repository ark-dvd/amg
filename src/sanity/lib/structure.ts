import type { StructureResolver } from 'sanity/structure'

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Singletons')
        .child(
          S.list()
            .title('Singletons')
            .items([
              S.listItem()
                .title('Hero')
                .child(
                  S.document()
                    .schemaType('hero')
                    .documentId('singleton.hero')
                    .title('Hero')
                ),
              S.listItem()
                .title('About')
                .child(
                  S.document()
                    .schemaType('about')
                    .documentId('singleton.about')
                    .title('About')
                ),
              S.listItem()
                .title('Site Settings')
                .child(
                  S.document()
                    .schemaType('siteSettings')
                    .documentId('singleton.siteSettings')
                    .title('Site Settings')
                ),
            ])
        ),
      S.listItem()
        .title('Collections')
        .child(
          S.list()
            .title('Collections')
            .items([
              S.documentTypeListItem('service').title('Services'),
              S.documentTypeListItem('project').title('Projects'),
              S.documentTypeListItem('testimonial').title('Testimonials'),
              S.documentTypeListItem('article').title('Articles'),
            ])
        ),
    ])
