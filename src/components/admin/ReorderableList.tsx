'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, ChevronUp, ChevronDown } from 'lucide-react'

export interface ReorderableItem {
  id: string
  order: number
}

interface ReorderableListProps<T extends ReorderableItem> {
  items: T[]
  renderItem: (item: T, actions: { moveUp: () => void; moveDown: () => void; isFirst: boolean; isLast: boolean }) => React.ReactNode
  onReorder: (newOrder: Array<{ id: string; order: number }>) => Promise<void>
  onReorderError?: () => void
}

function SortableRow<T extends ReorderableItem>({
  item,
  children,
}: {
  item: T
  children: React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 ${isDragging ? 'opacity-50 shadow-lg bg-white z-10 relative' : ''}`}
    >
      {/* Drag handle - desktop only */}
      <button
        type="button"
        className="hidden md:flex items-center justify-center min-w-[32px] min-h-[44px] cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <div className="flex-1">{children}</div>
    </div>
  )
}

export function ReorderableList<T extends ReorderableItem>({
  items: initialItems,
  renderItem,
  onReorder,
  onReorderError,
}: ReorderableListProps<T>) {
  const [items, setItems] = useState(initialItems)
  const [reordering, setReordering] = useState(false)

  // Sync when parent items change
  if (initialItems !== items && !reordering) {
    const initialIds = initialItems.map((i) => i.id).join(',')
    const currentIds = items.map((i) => i.id).join(',')
    if (initialIds !== currentIds || initialItems.length !== items.length) {
      setItems(initialItems)
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const performReorder = useCallback(async (newItems: T[]) => {
    const newOrder = newItems.map((item, index) => ({ id: item.id, order: index }))
    setReordering(true)
    try {
      await onReorder(newOrder)
    } catch {
      setItems(initialItems)
      onReorderError?.()
    } finally {
      setReordering(false)
    }
  }, [initialItems, onReorder, onReorderError])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((i) => i.id === active.id)
    const newIndex = items.findIndex((i) => i.id === over.id)
    const newItems = arrayMove(items, oldIndex, newIndex) as T[]
    setItems(newItems)
    performReorder(newItems)
  }

  function moveItem(index: number, direction: 'up' | 'down') {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= items.length) return
    const newItems = arrayMove(items, index, newIndex) as T[]
    setItems(newItems)
    performReorder(newItems)
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="divide-y divide-gray-100">
          {items.map((item, index) => (
            <SortableRow key={item.id} item={item}>
              <div className="flex items-center">
                <div className="flex-1">
                  {renderItem(item, {
                    moveUp: () => moveItem(index, 'up'),
                    moveDown: () => moveItem(index, 'down'),
                    isFirst: index === 0,
                    isLast: index === items.length - 1,
                  })}
                </div>
                {/* Mobile reorder arrows */}
                <div className="flex md:hidden flex-col gap-1 ml-2">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => moveItem(index, 'up')}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Move up"
                  >
                    <ChevronUp className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    disabled={index === items.length - 1}
                    onClick={() => moveItem(index, 'down')}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Move down"
                  >
                    <ChevronDown className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </SortableRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
