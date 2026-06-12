import { useEffect, useState } from 'react'

const TRACKED_CODES = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
  'KeyQ',
  'KeyE',
  'Space',
  'ShiftLeft',
  'ShiftRight'
])

function toControls(codes) {
  return {
    forward: codes.has('KeyW') || codes.has('ArrowUp'),
    backward: codes.has('KeyS') || codes.has('ArrowDown'),
    left: codes.has('KeyA') || codes.has('ArrowLeft'),
    right: codes.has('KeyD') || codes.has('ArrowRight'),
    up: codes.has('KeyQ'),
    down: codes.has('KeyE'),
    brake: codes.has('Space'),
    boost: codes.has('ShiftLeft') || codes.has('ShiftRight')
  }
}

function isEditableTarget(target) {
  return target instanceof HTMLElement && (
    target.isContentEditable ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT'
  )
}

export function useNovaeControls() {
  const [codes, setCodes] = useState(() => new Set())

  useEffect(() => {
    function updateKey(event, isPressed) {
      if (!TRACKED_CODES.has(event.code)) return
      if (isEditableTarget(event.target)) return

      if (event.code === 'Space' || event.code.startsWith('Arrow')) event.preventDefault()
      setCodes((current) => {
        if (current.has(event.code) === isPressed) return current
        const next = new Set(current)
        if (isPressed) next.add(event.code)
        else next.delete(event.code)
        return next
      })
    }

    const handleKeyDown = (event) => updateKey(event, true)
    const handleKeyUp = (event) => updateKey(event, false)
    const handleBlur = () => setCodes(new Set())

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleBlur)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
    }
  }, [])

  return toControls(codes)
}
