export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 animate-pulse">
      <div className="h-4 w-1/4 bg-gray-200 rounded" />
      <div className="h-4 w-16 bg-gray-200 rounded" />
      <div className="h-4 w-12 bg-gray-200 rounded hidden md:block" />
      <div className="h-4 w-20 bg-gray-200 rounded hidden md:block" />
      <div className="ml-auto h-4 w-16 bg-gray-200 rounded" />
    </div>
  )
}

export function SkeletonForm() {
  return (
    <div className="space-y-6 animate-pulse p-6">
      <div className="h-4 w-24 bg-gray-200 rounded" />
      <div className="h-10 w-full bg-gray-200 rounded" />
      <div className="h-4 w-32 bg-gray-200 rounded" />
      <div className="h-24 w-full bg-gray-200 rounded" />
      <div className="h-4 w-20 bg-gray-200 rounded" />
      <div className="h-10 w-full bg-gray-200 rounded" />
      <div className="h-10 w-32 bg-gray-200 rounded" />
    </div>
  )
}
