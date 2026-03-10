'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import Blockquote from '@tiptap/extension-blockquote'
import { useEffect, useCallback } from 'react'
import {
  Bold, Italic, Underline as UnderlineIcon,
  Heading2, Heading3, List, ListOrdered,
  Quote, Link as LinkIcon,
} from 'lucide-react'
import type { PortableTextContent } from '@/types/sanity'

interface PortableTextEditorProps {
  value: PortableTextContent
  onChange: (value: PortableTextContent) => void
  id?: string
}

function tiptapToPortableText(json: Record<string, unknown>): PortableTextContent {
  const content = (json.content ?? []) as Array<Record<string, unknown>>
  const blocks: PortableTextContent = []

  for (const node of content) {
    const key = crypto.randomUUID().slice(0, 8)

    if (node.type === 'heading') {
      const level = node.attrs ? (node.attrs as Record<string, unknown>).level : 2
      blocks.push({
        _type: 'block',
        _key: key,
        style: `h${level}`,
        children: convertInlineContent(node.content as Array<Record<string, unknown>> | undefined),
        markDefs: extractMarkDefs(node.content as Array<Record<string, unknown>> | undefined),
      })
    } else if (node.type === 'bulletList') {
      const items = (node.content ?? []) as Array<Record<string, unknown>>
      for (const item of items) {
        const listContent = (item.content ?? []) as Array<Record<string, unknown>>
        const paragraph = listContent[0]
        blocks.push({
          _type: 'block',
          _key: crypto.randomUUID().slice(0, 8),
          style: 'normal',
          listItem: 'bullet',
          level: 1,
          children: convertInlineContent(paragraph?.content as Array<Record<string, unknown>> | undefined),
          markDefs: extractMarkDefs(paragraph?.content as Array<Record<string, unknown>> | undefined),
        })
      }
    } else if (node.type === 'orderedList') {
      const items = (node.content ?? []) as Array<Record<string, unknown>>
      for (const item of items) {
        const listContent = (item.content ?? []) as Array<Record<string, unknown>>
        const paragraph = listContent[0]
        blocks.push({
          _type: 'block',
          _key: crypto.randomUUID().slice(0, 8),
          style: 'normal',
          listItem: 'number',
          level: 1,
          children: convertInlineContent(paragraph?.content as Array<Record<string, unknown>> | undefined),
          markDefs: extractMarkDefs(paragraph?.content as Array<Record<string, unknown>> | undefined),
        })
      }
    } else if (node.type === 'blockquote') {
      const quoteContent = (node.content ?? []) as Array<Record<string, unknown>>
      for (const p of quoteContent) {
        blocks.push({
          _type: 'block',
          _key: crypto.randomUUID().slice(0, 8),
          style: 'blockquote',
          children: convertInlineContent(p.content as Array<Record<string, unknown>> | undefined),
          markDefs: extractMarkDefs(p.content as Array<Record<string, unknown>> | undefined),
        })
      }
    } else {
      blocks.push({
        _type: 'block',
        _key: key,
        style: 'normal',
        children: convertInlineContent(node.content as Array<Record<string, unknown>> | undefined),
        markDefs: extractMarkDefs(node.content as Array<Record<string, unknown>> | undefined),
      })
    }
  }

  return blocks
}

function convertInlineContent(content: Array<Record<string, unknown>> | undefined): Array<Record<string, unknown>> {
  if (!content || content.length === 0) {
    return [{ _type: 'span', _key: crypto.randomUUID().slice(0, 8), text: '', marks: [] }]
  }

  return content.map((node) => {
    const marks: string[] = []
    const nodeMarks = (node.marks ?? []) as Array<Record<string, unknown>>

    for (const mark of nodeMarks) {
      if (mark.type === 'bold') marks.push('strong')
      else if (mark.type === 'italic') marks.push('em')
      else if (mark.type === 'underline') marks.push('underline')
      else if (mark.type === 'link') {
        const href = (mark.attrs as Record<string, unknown> | undefined)?.href as string | undefined
        if (href) marks.push(`link:${href}`)
      }
    }

    return {
      _type: 'span',
      _key: crypto.randomUUID().slice(0, 8),
      text: (node.text as string) ?? '',
      marks: marks.filter((m) => !m.startsWith('link:')),
    }
  })
}

function extractMarkDefs(content: Array<Record<string, unknown>> | undefined): Array<Record<string, unknown>> {
  if (!content) return []
  const defs: Array<Record<string, unknown>> = []

  for (const node of content) {
    const nodeMarks = (node.marks ?? []) as Array<Record<string, unknown>>
    for (const mark of nodeMarks) {
      if (mark.type === 'link') {
        const href = (mark.attrs as Record<string, unknown> | undefined)?.href as string | undefined
        if (href) {
          defs.push({
            _type: 'link',
            _key: crypto.randomUUID().slice(0, 8),
            href,
          })
        }
      }
    }
  }

  return defs
}

function portableTextToTiptap(blocks: PortableTextContent): Record<string, unknown> {
  const content: Array<Record<string, unknown>> = []

  let i = 0
  while (i < blocks.length) {
    const block = blocks[i]!
    const style = block.style as string | undefined

    if (style === 'h2' || style === 'h3') {
      content.push({
        type: 'heading',
        attrs: { level: style === 'h2' ? 2 : 3 },
        content: convertSpansToTiptap(block),
      })
    } else if (block.listItem === 'bullet') {
      const items: Array<Record<string, unknown>> = []
      while (i < blocks.length && blocks[i]?.listItem === 'bullet') {
        items.push({
          type: 'listItem',
          content: [{ type: 'paragraph', content: convertSpansToTiptap(blocks[i]!) }],
        })
        i++
      }
      content.push({ type: 'bulletList', content: items })
      continue
    } else if (block.listItem === 'number') {
      const items: Array<Record<string, unknown>> = []
      while (i < blocks.length && blocks[i]?.listItem === 'number') {
        items.push({
          type: 'listItem',
          content: [{ type: 'paragraph', content: convertSpansToTiptap(blocks[i]!) }],
        })
        i++
      }
      content.push({ type: 'orderedList', content: items })
      continue
    } else if (style === 'blockquote') {
      content.push({
        type: 'blockquote',
        content: [{ type: 'paragraph', content: convertSpansToTiptap(block) }],
      })
    } else {
      content.push({
        type: 'paragraph',
        content: convertSpansToTiptap(block),
      })
    }
    i++
  }

  return { type: 'doc', content }
}

function convertSpansToTiptap(block: Record<string, unknown>): Array<Record<string, unknown>> {
  const children = (block.children ?? []) as Array<Record<string, unknown>>
  const markDefs = (block.markDefs ?? []) as Array<Record<string, unknown>>

  if (children.length === 0) {
    return [{ type: 'text', text: '' }]
  }

  return children.map((child) => {
    const marks: Array<Record<string, unknown>> = []
    const childMarks = (child.marks ?? []) as string[]

    for (const m of childMarks) {
      if (m === 'strong') marks.push({ type: 'bold' })
      else if (m === 'em') marks.push({ type: 'italic' })
      else if (m === 'underline') marks.push({ type: 'underline' })
      else {
        const def = markDefs.find((d) => d._key === m)
        if (def && def._type === 'link') {
          marks.push({ type: 'link', attrs: { href: def.href, target: '_blank', rel: 'noopener noreferrer' } })
        }
      }
    }

    const text = (child.text as string) ?? ''
    if (!text && marks.length === 0) return { type: 'text', text: ' ' }

    return {
      type: 'text',
      text,
      ...(marks.length > 0 ? { marks } : {}),
    }
  })
}

function ToolbarButton({
  active,
  onClick,
  children,
  title,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  title: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`
        min-w-[36px] min-h-[36px] flex items-center justify-center rounded
        ${active ? 'bg-gray-200 text-charcoal' : 'text-gray-500 hover:bg-gray-100 hover:text-charcoal'}
      `}
    >
      {children}
    </button>
  )
}

export function PortableTextEditor({ value, onChange, id }: PortableTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        blockquote: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
      }),
      Underline,
      Blockquote,
    ],
    content: portableTextToTiptap(value),
    onUpdate: ({ editor: ed }) => {
      const json = ed.getJSON()
      onChange(tiptapToPortableText(json as Record<string, unknown>))
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none p-3 min-h-[200px] focus:outline-none',
        ...(id ? { id } : {}),
      },
    },
  })

  const setLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Enter URL:', previousUrl ?? 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  useEffect(() => {
    if (editor && value.length === 0) {
      editor.commands.setContent({ type: 'doc', content: [{ type: 'paragraph' }] })
    }
  }, [editor, value.length])

  if (!editor) return null

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-gold focus-within:ring-offset-2">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 bg-gray-50">
        <ToolbarButton active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2">
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3">
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>
        <div className="w-px bg-gray-300 mx-1" />
        <ToolbarButton active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold">
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic">
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline">
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>
        <div className="w-px bg-gray-300 mx-1" />
        <ToolbarButton active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet List">
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Ordered List">
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Blockquote">
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <div className="w-px bg-gray-300 mx-1" />
        <ToolbarButton active={editor.isActive('link')} onClick={setLink} title="Link">
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} />
    </div>
  )
}
