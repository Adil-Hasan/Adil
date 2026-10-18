const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function createPoster({ x, y, size, vx = 0, vy = 0, angle = 0, spin = 0, scale = 1 }) {
  return { x, y, vx, vy, angle, spin, halfWidth: size / 2, halfHeight: size * .625,
    age: 0, quiet: 0, asleep: false, touching: false, mode: 'loose', scale, initialScale: scale, opacity: 1 };
}

export function posterExtents(poster) {
  const cosine = Math.abs(Math.cos(poster.angle));
  const sine = Math.abs(Math.sin(poster.angle));
  return { x: (cosine * poster.halfWidth + sine * poster.halfHeight) * poster.scale,
    y: (sine * poster.halfWidth + cosine * poster.halfHeight) * poster.scale };
}

export function posterOverlap(a, b) {
  let overlap = Infinity;
  let normal;
  for (const angle of [a.angle, a.angle + Math.PI / 2, b.angle, b.angle + Math.PI / 2]) {
    const x = Math.cos(angle);
    const y = Math.sin(angle);
    const radius = (poster) => (poster.halfWidth * Math.abs(Math.cos(poster.angle - angle))
      + poster.halfHeight * Math.abs(Math.sin(poster.angle - angle))) * poster.scale;
    const separation = (a.x - b.x) * x + (a.y - b.y) * y;
    const penetration = radius(a) + radius(b) - Math.abs(separation);
    if (penetration <= 0) return null;
    if (penetration < overlap) {
      overlap = penetration;
      const direction = separation >= 0 ? 1 : -1;
      normal = { x: x * direction, y: y * direction, overlap };
    }
  }
  return normal;
}

function bounce(poster, nx, ny, surfaceX = 0, surfaceY = 0) {
  const approach = (poster.vx - surfaceX) * nx + (poster.vy - surfaceY) * ny;
  if (approach >= 0) return;
  const restitution = Math.abs(approach) > 90 ? .28 : 0;
  poster.vx -= (1 + restitution) * approach * nx;
  poster.vy -= (1 + restitution) * approach * ny;
  poster.spin *= .6;
}

function containPoster(poster, { width, height }, dt) {
  const extent = posterExtents(poster);
  if (poster.x < extent.x) {
    poster.x = extent.x;
    bounce(poster, 1, 0);
  } else if (poster.x > width - extent.x) {
    poster.x = width - extent.x;
    bounce(poster, -1, 0);
  }
  if (poster.y > height - extent.y) {
    poster.y = height - extent.y;
    poster.touching = true;
    bounce(poster, 0, -1);
    poster.vx *= Math.exp(-dt * 9);
    poster.spin *= Math.exp(-dt * 12);
  }
  // Posters may rise above the viewport, but must always fall back into reach.
  if (poster.y < -extent.y * 2) {
    poster.y = -extent.y * 2;
    poster.vy = Math.max(0, poster.vy);
  }
}

function collideWithSurface(poster, surface, dt, bounds) {
  const extent = posterExtents(poster);
  if (poster.x + extent.x <= surface.left || poster.x - extent.x >= surface.right
    || poster.y + extent.y <= surface.top || poster.y - extent.y >= surface.bottom) return false;

  const edges = [
    { depth: poster.y + extent.y - surface.top, x: 0, y: -1 },
    { depth: surface.bottom - poster.y + extent.y, x: 0, y: 1 },
    { depth: poster.x + extent.x - surface.left, x: -1, y: 0 },
    { depth: surface.right - poster.x + extent.x, x: 1, y: 0 },
  ];
  let edge = edges.reduce((nearest, candidate) => candidate.depth < nearest.depth ? candidate : nearest);
  if (surface.vy < -1 && poster.previousY + extent.y <= surface.previousTop + 2) edge = edges[0];
  poster.x += edge.x * (edge.depth + .1);
  poster.y += edge.y * (edge.depth + .1);
  poster.touching = true;
  if (surface.vx || surface.vy) { poster.asleep = false; poster.quiet = 0; }
  bounce(poster, edge.x, edge.y, surface.vx, surface.vy);
  if (edge.y < 0) {
    poster.vx *= Math.exp(-dt * 7);
    poster.spin *= Math.exp(-dt * 10);
    const leftSpace = surface.left;
    const rightSpace = bounds.width - surface.right;
    const rollLeft = leftSpace >= extent.x * 2
      && (rightSpace < extent.x * 2 || poster.x - surface.left < surface.right - poster.x);
    const direction = rollLeft ? -1 : 1;
    poster.vx += direction * 560 * dt;
    poster.spin += direction * 2 * dt;
    poster.asleep = false;
    poster.quiet = 0;
  }
  return true;
}

function collidePosters(posters) {
  const cells = new Map();
  const cellSize = 160;
  for (let index = 0; index < posters.length; index++) {
    const poster = posters[index];
    if (!['loose', 'dragging'].includes(poster.mode)) continue;
    const cellX = Math.floor(poster.x / cellSize);
    const cellY = Math.floor(poster.y / cellSize);
    for (let x = cellX - 1; x <= cellX + 1; x++) {
      for (let y = cellY - 1; y <= cellY + 1; y++) {
        for (const other of cells.get(`${x},${y}`) || []) {
          if (poster.asleep && other.asleep) continue;
          const contact = posterOverlap(poster, other);
          if (!contact) continue;
          poster.touching = other.touching = true;
          const approach = (poster.vx - other.vx) * contact.x + (poster.vy - other.vy) * contact.y;
          if (approach < -24) {
            poster.asleep = other.asleep = false;
            poster.quiet = other.quiet = 0;
          }
          const weightA = poster.asleep || poster.mode === 'dragging' ? 0 : 1;
          const weightB = other.asleep || other.mode === 'dragging' ? 0 : 1;
          const total = weightA + weightB;
          if (!total) continue;
          const correction = Math.max(0, contact.overlap - .15) * .85 / total;
          poster.x += contact.x * correction * weightA;
          poster.y += contact.y * correction * weightA;
          other.x -= contact.x * correction * weightB;
          other.y -= contact.y * correction * weightB;
          if (approach < 0) {
            const impulse = -approach * (approach < -90 ? 1.2 : 1) / total;
            poster.vx += contact.x * impulse * weightA;
            poster.vy += contact.y * impulse * weightA;
            other.vx -= contact.x * impulse * weightB;
            other.vy -= contact.y * impulse * weightB;
            const tangent = (poster.vx - other.vx) * -contact.y + (poster.vy - other.vy) * contact.x;
            const friction = clamp(-tangent / total, -impulse * .6, impulse * .6);
            poster.vx -= contact.y * friction * weightA;
            poster.vy += contact.x * friction * weightA;
            other.vx += contact.y * friction * weightB;
            other.vy -= contact.x * friction * weightB;
            poster.spin *= .9;
            other.spin *= .9;
          }
        }
      }
    }
    const key = `${cellX},${cellY}`;
    if (!cells.has(key)) cells.set(key, []);
    cells.get(key).push(poster);
  }
}

export function stepPosters(posters, { dt, bounds, obstacles = [], vacuum = null, gravity = 980 }) {
  dt = Math.min(dt, 1 / 30);
  let impacts = 0;
  for (const poster of posters) {
    if (poster.mode === 'removed') continue;
    poster.age += dt;
    if (poster.mode === 'dragging') { poster.scale = 1.08; poster.opacity = 1; continue; }
    if (vacuum && poster.mode === 'loose'
      && Math.hypot(poster.x - vacuum.x, poster.y - vacuum.y) <= vacuum.radius + poster.halfWidth) {
      poster.mode = 'sucking';
      poster.captureTime = 0;
    }
    if (poster.mode === 'sucking') {
      if (!vacuum) { poster.mode = 'loose'; poster.asleep = false; continue; }
      if (vacuum.instant) { poster.mode = 'removed'; continue; }
      poster.captureTime += dt;
      const pull = 1 - Math.exp(-dt * (10 + poster.captureTime * 18));
      poster.x += (vacuum.x - poster.x) * pull;
      poster.y += (vacuum.y - poster.y) * pull;
      poster.angle += dt * 12;
      poster.scale = Math.max(0, 1 - poster.captureTime / .42);
      poster.opacity = Math.min(1, poster.scale * 2);
      if (Math.hypot(poster.x - vacuum.x, poster.y - vacuum.y) < 6 || poster.captureTime >= .42) poster.mode = 'removed';
      continue;
    }
    // Grow the visible card and its collision shape together, with no timed handoff.
    const growth = Math.min(1, poster.age / .12);
    const easedGrowth = growth * growth * (3 - 2 * growth);
    poster.scale = poster.initialScale + (1 - poster.initialScale) * easedGrowth;
    poster.opacity = 1;
    poster.touching = false;
    poster.previousY = poster.y;
    if (!poster.asleep) {
      poster.vy += gravity * dt;
      const drag = Math.exp(-dt * .3);
      poster.vx *= drag;
      poster.vy *= drag;
      poster.x += poster.vx * dt;
      poster.y += poster.vy * dt;
      poster.angle += poster.spin * dt;
    }
  }
  for (let pass = 0; pass < 4; pass++) {
    collidePosters(posters);
    for (const poster of posters) {
      if (poster.mode !== 'loose') continue;
      containPoster(poster, bounds, dt / 4);
      for (const surface of obstacles) {
        if (collideWithSurface(poster, surface, dt / 4, bounds)) impacts++;
      }
      containPoster(poster, bounds, dt / 4);
    }
  }
  for (const poster of posters) {
    if (poster.mode !== 'loose' || poster.asleep) continue;
    if (poster.touching && Math.hypot(poster.vx, poster.vy) < 12 && Math.abs(poster.spin) < .12) {
      poster.quiet += dt;
      if (poster.quiet > .4) { poster.asleep = true; poster.vx = poster.vy = poster.spin = 0; }
    } else poster.quiet = 0;
  }
  return { impacts, moving: posters.some(poster => ['sucking', 'dragging'].includes(poster.mode) || (poster.mode === 'loose' && !poster.asleep)) };
}
