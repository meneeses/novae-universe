import { useEffect, useRef } from 'react'

const FADE_IN = 0.6
const HOLD = 1.6
const FADE_OUT = 0.6
const TOTAL_TEXT_DURATION = FADE_IN + HOLD + FADE_OUT

const introTexts = [
  { text: 'In a universe built from code...', startTime: 0.5 },
  { text: 'Every developer is a Novae Star.', startTime: 3.5 },
  { text: 'Every repository, a Novae World.', startTime: 6.5 },
  { text: 'Your universe is waiting.', startTime: 10.5 },
  { text: 'Find your star.', startTime: 13.5 }
]

function getTextOpacity(elapsed, startTime) {
  const local = elapsed - startTime
  if (local < 0 || local >= TOTAL_TEXT_DURATION) return 0
  if (local < FADE_IN) return local / FADE_IN
  if (local < FADE_IN + HOLD) return 1
  return 1 - (local - FADE_IN - HOLD) / FADE_OUT
}

export function NovaeIntroTexts({ timelineRef, exitProgressRef }) {
  const refs = useRef([])

  useEffect(() => {
    let frameId

    const update = () => {
      const elapsed = timelineRef.current
      const exitOpacity = 1 - exitProgressRef.current

      introTexts.forEach((item, index) => {
        const element = refs.current[index]
        if (!element) return
        const opacity = getTextOpacity(elapsed, item.startTime) * exitOpacity
        element.style.opacity = String(opacity)
        element.style.transform = `translateY(${(1 - opacity) * 8}px)`
      })

      frameId = window.requestAnimationFrame(update)
    }

    frameId = window.requestAnimationFrame(update)
    return () => window.cancelAnimationFrame(frameId)
  }, [exitProgressRef, timelineRef])

  return (
    <div className="novae-intro-texts" aria-live="polite">
      {introTexts.map((item, index) => (
        <p
          key={item.text}
          ref={(element) => { refs.current[index] = element }}
          className="novae-intro-text"
        >
          {item.text}
        </p>
      ))}
    </div>
  )
}
