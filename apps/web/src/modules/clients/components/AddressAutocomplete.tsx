import { useState, useRef, useEffect, useCallback } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { searchAddresses, type GeocodeResult } from '@/shared/lib/geocode'
import { Popover, PopoverAnchor, PopoverContent } from '@/shared/ui/popover'

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect?: (result: GeocodeResult) => void
  city?: string
  placeholder?: string
  className?: string
  id?: string
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  city,
  placeholder,
  className,
  id,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)
  const suppressSearchRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const fetchSuggestions = useCallback(
    (query: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)

      if (query.trim().length < 3) {
        setSuggestions([])
        setOpen(false)
        return
      }

      debounceRef.current = setTimeout(async () => {
        setLoading(true)
        const results = await searchAddresses(query, city)
        setSuggestions(results)
        setOpen(results.length > 0)
        setActiveIndex(-1)
        setLoading(false)
      }, 400)
    },
    [city],
  )

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value
    onChange(newValue)

    if (suppressSearchRef.current) {
      suppressSearchRef.current = false
      return
    }

    fetchSuggestions(newValue)
  }

  function handleSelect(result: GeocodeResult) {
    suppressSearchRef.current = true
    // Extract short address from display_name (first 2-3 parts before region)
    const parts = result.displayName.split(', ')
    const shortAddress = parts.slice(0, Math.min(3, parts.length)).join(', ')
    onChange(shortAddress)
    setSuggestions([])
    setOpen(false)
    setActiveIndex(-1)
    onSelect?.(result)
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1))
    } else if (e.key === 'Enter' && activeIndex >= 0 && suggestions[activeIndex]) {
      e.preventDefault()
      handleSelect(suggestions[activeIndex])
    } else if (e.key === 'Escape') {
      setOpen(false)
      setActiveIndex(-1)
    }
  }

  function handleBlur() {
    // Delay to allow click on suggestion
    setTimeout(() => setOpen(false), 200)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="relative">
          <input
            ref={inputRef}
            id={id}
            type="text"
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onFocus={() => {
              if (suggestions.length > 0) setOpen(true)
            }}
            placeholder={placeholder}
            className={className}
            autoComplete="off"
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
            aria-activedescendant={activeIndex >= 0 ? `address-option-${activeIndex}` : undefined}
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
      </PopoverAnchor>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-1"
        align="start"
        sideOffset={4}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <ul role="listbox" className="space-y-0.5">
          {suggestions.map((result, index) => (
            <li
              key={`${result.lat}-${result.lng}`}
              id={`address-option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              className={`flex cursor-pointer items-start gap-2 rounded-sm px-2 py-2 text-sm transition-colors ${
                index === activeIndex
                  ? 'bg-accent text-accent-foreground'
                  : 'text-foreground hover:bg-accent/50'
              }`}
              onMouseDown={(e) => {
                e.preventDefault()
                handleSelect(result)
              }}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <span className="line-clamp-2">{result.displayName}</span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
