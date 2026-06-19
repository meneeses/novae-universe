import { PlanetCard } from './PlanetCard'

export function CelestialDetailsPanel({ object, onClose }) {
  return <PlanetCard object={object} onClose={onClose} />
}
