
class PhysicsHandler {
  static resolvePassiveCollision(a, b) {
    const dx = b.position.x - a.position.x;
    const dy = b.position.y - a.position.y;
    const distSq = dx * dx + dy * dy;
    const minDist = a.type.hitSize + b.type.hitSize;

    if (distSq < minDist * minDist && distSq > 0) {
        const dist = Math.sqrt(distSq);
        const overlap = minDist - dist;
        
        // The "Strength" of the push. 
        // Lower = more "liquid/soft" units. Higher = more "solid".
        const force = 0.0005 * Global.delta; 
        
        const nx = (dx / dist) * overlap * force;
        const ny = (dy / dist) * overlap * force;

        // Apply directly to velocity or position gently
        a.velocity.x -= nx;
        a.velocity.y -= ny;
        b.velocity.x += nx;
        b.velocity.y += ny;
    }
}

  static resolveBallCollision(a, b) {
    
  const dx = b.position.x - a.position.x;
  const dy = b.position.y - a.position.y;

  const dist = Math.hypot(dx, dy);

  const minDist = a.type.hitSize + b.type.hitSize;

  if (dist === 0 || dist >= minDist) return;

  // --- Normal ---
  const nx = dx / dist;
  const ny = dy / dist;

  // --- Mass ---
  const ma = a.mass ?? a.type.hitSize * a.type.hitSize;
  const mb = b.mass ?? b.type.hitSize * b.type.hitSize;

  // --- Positional correction (IMPORTANT) ---
  const penetration = (minDist - dist) * Global.delta;
  const totalMass = ma + mb;

  a.position.x -= nx * penetration * (mb / totalMass);
  a.position.y -= ny * penetration * (mb / totalMass);
  b.position.x += nx * penetration * (ma / totalMass);
  b.position.y += ny * penetration * (ma / totalMass);

  // --- Relative velocity ---
  const rvx = b.velocity.x - a.velocity.x;
  const rvy = b.velocity.y - a.velocity.y;

  const velAlongNormal = rvx * nx + rvy * ny;
  if (velAlongNormal > 0.01) return;

  const restitution = 1;

  const impulse =
    -(1 + restitution) * velAlongNormal /
    (1 / ma + 1 / mb);

  const ix = impulse * nx;
  const iy = impulse * ny;

  a.velocity.x -= ix / ma;
  a.velocity.y -= iy / ma;
  b.velocity.x += ix / mb;
  b.velocity.y += iy / mb;
}

}
