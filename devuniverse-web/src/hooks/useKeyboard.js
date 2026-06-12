import { useEffect, useState } from 'react'

const TRACKED_KEYS = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'w',
  'a',
  's',
  'd'
])

function toControls(keys) {
  return {
    up: keys.has('ArrowUp') || keys.has('w'),
    down: keys.has('ArrowDown') || keys.has('s'),
    left: keys.has('ArrowLeft') || keys.has('a'),
    right: keys.has('ArrowRight') || keys.has('d')
  }
}

export function useKeyboard() {
  const [keys, setKeys] = useState(() => new Set())

  useEffect(() => {
    function updateKey(event, isPressed) {
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
      if (!TRACKED_KEYS.has(key)) return

      event.preventDefault()
      setKeys((current) => {
        const next = new Set(current)
        if (isPressed) next.add(key)
        else next.delete(key)
        return next
      })
    }

    const handleKeyDown = (event) => updateKey(event, true)
    const handleKeyUp = (event) => updateKey(event, false)
    const handleBlur = () => setKeys(new Set())

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleBlur)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
    }
  }, [])

  return toControls(keys)
}
