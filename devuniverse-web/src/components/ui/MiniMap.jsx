import { useEffect, useRef } from 'react'
import { PORTALS, SOLAR_SYSTEM } from '../../utils/solarSystem'

const SIZE = 140

export function MiniMap({ position, rotation, planets }) {
  const canvasRef = useRef()

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    const center = SIZE / 2
    const toMap = (x, z) => [center + x - position.x, center + z - position.z]

    context.clearRect(0, 0, SIZE, SIZE)
    context.fillStyle = 'rgba(0, 0, 0, 0.6)'
    context.fillRect(0, 0, SIZE, SIZE)
    context.font = '9px monospace'
    context.fillStyle = 'rgba(255,255,255,0.35)'
    context.fillText('MAP', 8, 13)

    const [sunX, sunY] = toMap(0, 0)
    context.fillStyle = '#FDB813'
    context.beginPath()
    context.arc(sunX, sunY, 3, 0, Math.PI * 2)
    context.fill()

    const elapsed = performance.now() / 1000
    SOLAR_SYSTEM.planets.forEach((planet) => {
      const initialAngle = planet.name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) * 0.1
      const angle = initialAngle + elapsed * planet.orbitSpeed * 0.3
      const [x, y] = toMap(Math.cos(angle) * planet.orbitRadius, Math.sin(angle) * planet.orbitRadius)
      context.fillStyle = planet.color
      context.beginPath()
      context.arc(x, y, 1.5, 0, Math.PI * 2)
      context.fill()
    })

    planets.forEach((planet) => {
      const [x, y] = toMap(planet.position[0], planet.position[2])
      context.fillStyle = planet.isMyPlanet ? '#00ffcc' : '#9b6dff'
      context.beginPath()
      context.arc(x, y, Math.min(3, Math.max(1, planet.planetProps.size)), 0, Math.PI * 2)
      context.fill()
    })

    PORTALS.forEach((portal) => {
      const [x, y] = toMap(portal.position[0], portal.position[2])
      context.strokeStyle = portal.color
      context.beginPath()
      context.arc(x, y, 3, 0, Math.PI * 2)
      context.stroke()
    })

    context.save()
    context.translate(center, center)
    context.rotate(-rotation)
    context.fillStyle = '#ffffff'
    context.beginPath()
    context.moveTo(0, -5)
    context.lineTo(3.5, 4)
    context.lineTo(-3.5, 4)
    context.closePath()
    context.fill()
    context.restore()
  }, [planets, position, rotation])

  return <canvas ref={canvasRef} className="mini-map" width={SIZE} height={SIZE} aria-label="Universe minimap" />
}
