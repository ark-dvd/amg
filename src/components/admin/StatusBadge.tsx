interface StatusBadgeProps {
  type: 'active' | 'inactive' | 'draft' | 'published' | 'archived'
}

const variants: Record<StatusBadgeProps['type'], { bg: string; text: string; label: string }> = {
  active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
  inactive: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Inactive' },
  draft: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Draft' },
  published: { bg: 'bg-green-100', text: 'text-green-800', label: 'Published' },
  archived: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Archived' },
}

export function StatusBadge({ type }: StatusBadgeProps) {
  const v = variants[type]
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${v.bg} ${v.text}`}>
      {v.label}
    </span>
  )
}
