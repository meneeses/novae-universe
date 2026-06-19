import { useEffect, useRef, useState } from 'react'

function isEditableTarget(target) {
  return target instanceof HTMLElement && (
    target.isContentEditable ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT'
  )
}

export function useNovaeControls() {
  const [, forceUpdate] = useState(0)
  const controlsRef = useRef({
    up: false,
    down: false,
    left: false,
    right: false,
    boost: false,
    fire: false,
    space: false,
    engineEnabled: true,
    fireSequence: 0
  })
  const spaceHandled = useRef(false)

  useEffect(() => {
    const keys = controlsRef.current

    function sync() {
      forceUpdate((value) => value + 1)
    }

    function handleKeyDown(event) {
      if (isEditableTarget(event.target)) return
      if (event.key === ' ' || event.key.startsWith('Arrow')) event.preventDefault()

      if (event.key === 'w' || event.key === 'W' || event.key === 'ArrowUp') keys.up = true
      if (event.key === 's' || event.key === 'S' || event.key === 'ArrowDown') keys.down = true
      if (event.key === 'a' || event.key === 'A' || event.key === 'ArrowLeft') keys.left = true
      if (event.key === 'd' || event.key === 'D' || event.key === 'ArrowRight') keys.right = true
      if (event.key === 'Shift') keys.boost = true

      if ((event.key === 'f' || event.key === 'F') && !keys.fire) {
        keys.fire = true
        keys.fireSequence += 1
      }

      if (event.key === ' ' && !spaceHandled.current) {
        keys.space = true
        spaceHandled.current = true
        keys.engineEnabled = !keys.engineEnabled
      }

      sync()
    }

    function handleKeyUp(event) {
      if (isEditableTarget(event.target)) return
      if (event.key === ' ' || event.key.startsWith('Arrow')) event.preventDefault()

      if (event.key === 'w' || event.key === 'W' || event.key === 'ArrowUp') keys.up = false
      if (event.key === 's' || event.key === 'S' || event.key === 'ArrowDown') keys.down = false
      if (event.key === 'a' || event.key === 'A' || event.key === 'ArrowLeft') keys.left = false
      if (event.key === 'd' || event.key === 'D' || event.key === 'ArrowRight') keys.right = false
      if (event.key === 'Shift') keys.boost = false
      if (event.key === 'f' || event.key === 'F') keys.fire = false
      if (event.key === ' ') {
        keys.space = false
        spaceHandled.current = false
      }

      sync()
    }

    function handleBlur() {
      keys.up = false
      keys.down = false
      keys.left = false
      keys.right = false
      keys.boost = false
      keys.fire = false
      keys.space = false
      spaceHandled.current = false
      sync()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleBlur)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
    }
  }, [])

  return controlsRef.current
}
