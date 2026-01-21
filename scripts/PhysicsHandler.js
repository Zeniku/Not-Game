class PhysicsHandler {
  static ballToBall(b1, b2) {
    const dx = b1.position.x - b2.position.x;
    const dy = b1.position.y - b2.position.y;

    const rSum = b1.type.hitSize + b2.type.hitSize;
    const distSq = dx * dx + dy * dy;

    if (distSq === 0 || distSq > rSum * rSum) return;

    const dist = Math.sqrt(distSq);
    const nx = dx / dist;
    const ny = dy / dist;

    // --- Push out (split between both balls) ---
    const penetration = rSum - dist;
    const half = penetration * 0.5;

    b1.position.x += nx * half;
    b1.position.y += ny * half;


    // --- Bounce using relative velocity ---
    const rvx = b1.velocity.x - b2.velocity.x;
    const rvy = b1.velocity.y - b2.velocity.y;
    const vn = rvx * nx + rvy * ny;

    // Only resolve if they are moving toward each other
    if (vn > 0) return;

    const restitution = 0; // 0 = no bounce, 1 = perfectly elastic
    const impulse = (1 + restitution) * vn;

    b1.velocity.x -= impulse * nx;
    b1.velocity.y -= impulse * ny;
    
  }
}
