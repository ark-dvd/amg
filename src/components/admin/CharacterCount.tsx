interface CharacterCountProps {
  current: number
  max: number
}

export function CharacterCount({ current, max }: CharacterCountProps) {
  const ratio = current / max
  const isNearLimit = ratio >= 0.9

  return (
    <span className={`text-xs ${isNearLimit ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
      {current}/{max}
    </span>
  )
}
