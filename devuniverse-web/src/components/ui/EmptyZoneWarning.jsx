import { useEffect } from 'react'
import { useUniverseStore } from '../../store/universeStore'

export function EmptyZoneWarning({ onStay, onReturn }) {
  const countdown = useUniverseStore((state) => state.emptyZoneCountdown)
  const setCountdown = useUniverseStore((state) => state.setEmptyZoneCountdown)

  useEffect(() => {
    const interval = window.setInterval(() => {
      const current = useUniverseStore.getState().emptyZoneCountdown
      if (current <= 1) {
        window.clearInterval(interval)
        onReturn()
      } else {
        setCountdown(current - 1)
      }
    }, 1000)
    return () => window.clearInterval(interval)
  }, [onReturn, setCountdown])

  return (
    <aside className="empty-zone-warning">
      <h2>⚠&nbsp; Nothing out here.</h2>
      <p>
        Returning to Solar System in
        <strong className={countdown <= 2 ? 'empty-zone-countdown--urgent' : ''}>{countdown}</strong>
      </p>
      <div>
        <button type="button" onClick={onStay}>Stay here</button>
        <button type="button" onClick={onReturn}>Return now</button>
      </div>
    </aside>
  )
}
