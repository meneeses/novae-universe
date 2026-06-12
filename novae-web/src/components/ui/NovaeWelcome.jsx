import { useEffect, useState } from 'react'

export function NovaeWelcome({ onLogin }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const show = window.setTimeout(() => setVisible(true), 50)
    const hide = window.setTimeout(() => setVisible(false), 6000)
    return () => {
      window.clearTimeout(show)
      window.clearTimeout(hide)
    }
  }, [])

  return (
    <aside className={`welcome-banner${visible ? ' welcome-banner--visible' : ''}`}>
      <strong>Welcome to Novae Universe</strong>
      <span>You're near Earth. Novae Galaxy awaits.</span>
      <span>Enter your GitHub username to find your Novae Star, or explore freely.</span>
      <button type="button" onClick={onLogin}>Login</button>
    </aside>
  )
}
