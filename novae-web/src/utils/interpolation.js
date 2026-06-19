import * as THREE from 'three'

export function interpolatePlayer(player, now) {
  const duration = Math.max(1, player.receivedAt - player.prevTime)
  const elapsed = (now - player.prevTime) / duration
  const t = Math.min(elapsed, 1.2)
  const position = new THREE.Vector3().lerpVectors(
    player.prevPosition,
    player.position,
    Math.min(t, 1)
  )

  if (t > 1) {
    const direction = new THREE.Vector3(
      -Math.sin(player.yaw),
      0,
      -Math.cos(player.yaw)
    )
    position.addScaledVector(direction, player.speed * (t - 1) * 6)
  }

  let yawDelta = player.yaw - player.prevYaw
  if (yawDelta > Math.PI) yawDelta -= Math.PI * 2
  if (yawDelta < -Math.PI) yawDelta += Math.PI * 2
  const yaw = player.prevYaw + yawDelta * Math.min(t, 1)

  return { position, yaw }
}

export function lerpAngle(current, target, factor) {
  let diff = target - current
  if (diff > Math.PI) diff -= Math.PI * 2
  if (diff < -Math.PI) diff += Math.PI * 2
  return current + diff * factor
}
