'use client'

interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  disabled?: boolean
  id?: string
}

export function ToggleSwitch({ checked, onChange, label, disabled, id }: ToggleSwitchProps) {
  const switchId = id ?? `toggle-${label.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div className="flex items-center gap-3">
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
          transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          min-w-[44px] min-h-[44px] items-center
          ${checked ? 'bg-gold' : 'bg-gray-300'}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform
            transition duration-200 ease-in-out
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
      <label htmlFor={switchId} className="text-sm text-gray-700 cursor-pointer select-none">
        {checked ? 'On' : 'Off'} — {label}
      </label>
    </div>
  )
}
