'use client'

import { useEffect, useRef, useState } from 'react'

export interface ComboboxOption {
  id: string
  name: string
}

interface Props {
  value: string[]
  onChange: (ids: string[]) => void
  options: ComboboxOption[]
  onCreateNew: (name: string) => Promise<ComboboxOption>
  placeholder?: string
}

export function ComboboxSelect({
  value,
  onChange,
  options,
  onCreateNew,
  placeholder = 'Поиск или создать...',
}: Props) {
  const [input, setInput] = useState('')
  const [open, setOpen] = useState(false)
  const [focusedIdx, setFocusedIdx] = useState(-1)
  const [creating, setCreating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedOptions = options.filter(o => value.includes(o.id))
  const filtered = options.filter(o => o.name.toLowerCase().includes(input.toLowerCase()))
  const unselected = filtered.filter(o => !value.includes(o.id))
  const selected = filtered.filter(o => value.includes(o.id))
  const items = [...unselected, ...selected]

  const hasExact = options.some(o => o.name.toLowerCase() === input.trim().toLowerCase())
  const showCreate = input.trim().length > 0 && !hasExact
  const createIdx = items.length
  const total = createIdx + (showCreate ? 1 : 0)

  useEffect(() => { setFocusedIdx(-1) }, [input])

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setInput('')
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  function select(opt: ComboboxOption) {
    if (value.includes(opt.id)) return
    onChange([...value, opt.id])
    setInput('')
    inputRef.current?.focus()
  }

  function remove(id: string) {
    onChange(value.filter(v => v !== id))
  }

  async function handleCreate() {
    const name = input.trim()
    if (!name || creating) return
    setCreating(true)
    try {
      const created = await onCreateNew(name)
      onChange([...value, created.id])
      setInput('')
    } catch (err) {
      console.error('[ComboboxSelect] create failed', err)
    } finally {
      setCreating(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIdx(i => Math.min(i + 1, total - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIdx(i => Math.max(i - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (focusedIdx === createIdx && showCreate) handleCreate()
        else if (focusedIdx >= 0 && focusedIdx < items.length) {
          if (!value.includes(items[focusedIdx].id)) select(items[focusedIdx])
        } else if (showCreate) handleCreate()
        break
      case 'Escape':
        setOpen(false)
        setInput('')
        break
      case 'Backspace':
        if (input === '') onChange(value.slice(0, -1))
        break
    }
  }

  const dropdownVisible = open && total > 0

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Input box with chips */}
      <div
        onClick={() => { inputRef.current?.focus(); setOpen(true) }}
        style={{
          display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center',
          minHeight: 38, padding: '5px 8px', cursor: 'text',
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${open ? 'rgba(255,59,48,0.5)' : 'rgba(255,255,255,0.12)'}`,
          transition: 'border-color 0.15s',
        }}
      >
        {selectedOptions.map(opt => (
          <span
            key={opt.id}
            className="font-nav font-bold text-[10px] tracking-[0.05em] uppercase"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '3px 7px',
              background: 'rgba(255,59,48,0.14)',
              border: '1px solid rgba(255,59,48,0.4)',
              color: '#ff5a4a',
            }}
          >
            {opt.name}
            <span
              onMouseDown={e => { e.preventDefault(); e.stopPropagation(); remove(opt.id) }}
              style={{ cursor: 'pointer', opacity: 0.7, lineHeight: 1 }}
            >
              ×
            </span>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          placeholder={selectedOptions.length === 0 ? placeholder : ''}
          onChange={e => { setInput(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className="font-body font-light"
          style={{
            flex: 1, minWidth: 80, background: 'transparent', border: 'none',
            outline: 'none', color: '#fff', fontSize: 13, padding: '2px 0',
          }}
        />
      </div>

      {/* Dropdown */}
      {dropdownVisible && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          background: '#0e0a0b', border: '1px solid rgba(255,255,255,0.12)',
          borderTop: 'none', maxHeight: 200, overflowY: 'auto',
        }}>
          {items.map((opt, i) => {
            const isSelected = value.includes(opt.id)
            const isFocused = focusedIdx === i
            return (
              <div
                key={opt.id}
                onMouseDown={e => { e.preventDefault(); if (!isSelected) select(opt) }}
                onMouseEnter={() => setFocusedIdx(i)}
                className="font-body font-light text-[13px]"
                style={{
                  padding: '8px 12px', cursor: isSelected ? 'default' : 'pointer',
                  background: isFocused ? 'rgba(255,255,255,0.06)' : 'transparent',
                  color: isSelected ? 'rgba(255,255,255,0.35)' : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}
              >
                {opt.name}
                {isSelected && (
                  <span style={{ fontSize: 10, color: '#ff5a4a' }}>✓</span>
                )}
              </div>
            )
          })}

          {showCreate && (
            <div
              onMouseDown={e => { e.preventDefault(); handleCreate() }}
              onMouseEnter={() => setFocusedIdx(createIdx)}
              className="font-nav font-bold text-[11px] tracking-[0.05em] uppercase"
              style={{
                padding: '9px 12px', cursor: creating ? 'wait' : 'pointer',
                background: focusedIdx === createIdx ? 'rgba(255,59,48,0.1)' : 'transparent',
                color: creating ? 'rgba(255,255,255,0.4)' : '#ff5a4a',
                borderTop: items.length > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}
            >
              {creating ? `Создание «${input.trim()}»...` : `+ Создать «${input.trim()}»`}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
