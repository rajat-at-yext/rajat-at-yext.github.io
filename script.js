const canvas = document.getElementById('water-canvas');
const ctx = canvas.getContext('2d');

let width, height;
let dots = [];
let ripples = [];

const DOT_SPACING = 32; // Distance between white dots
const BASE_DOT_RADIUS = 1.4;

// Initialize and resize canvas
function initCanvas() {
  const dpr = window.devicePixelRatio || 1;
  width = window.innerWidth;
  height = window.innerHeight;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  dots = [];
  for (let x = DOT_SPACING / 2; x < width; x += DOT_SPACING) {
    for (let y = DOT_SPACING / 2; y < height; y += DOT_SPACING) {
      dots.push({ baseX: x, baseY: y });
    }
  }
}

// Trigger a stone-in-water ripple anywhere the user clicks
window.addEventListener('pointerdown', (e) => {
  ripples.push({
    x: e.clientX,
    y: e.clientY,
    radius: 0,
    maxRadius: Math.max(width, height) * 0.75,
    speed: 3,
    wavelength: 75,
    amplitude: 14,
    alpha: 1
  });
});

function animate() {
  ctx.clearRect(0, 0, width, height);

  // Update active ripples and draw subtle expanding water rings
  for (let i = ripples.length - 1; i >= 0; i--) {
    const r = ripples[i];
    r.radius += r.speed;
    r.alpha = Math.max(0, 1 - r.radius / r.maxRadius);

    // Draw 2 concentric glowing rings per click
    for (let ring = 0; ring < 2; ring++) {
      const ringRadius = r.radius - ring * 35;
      if (ringRadius > 0) {
        ctx.beginPath();
        ctx.arc(r.x, r.y, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(125, 211, 252, ${r.alpha * (0.28 - ring * 0.1)})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    if (r.radius >= r.maxRadius) {
      ripples.splice(i, 1);
    }
  }

  // Draw white dots and displace them when a water wave passes through
  for (let i = 0; i < dots.length; i++) {
    const dot = dots[i];
    let offsetX = 0;
    let offsetY = 0;
    let radiusBoost = 0;
    let opacityBoost = 0;

    for (let j = 0; j < ripples.length; j++) {
      const r = ripples[j];
      const dx = dot.baseX - r.x;
      const dy = dot.baseY - r.y;
      const dist = Math.hypot(dx, dy);

      // Distance from the moving wave front
      const diff = dist - r.radius;

      // Create a multi-crest water wave packet around the ripple edge
      if (Math.abs(diff) < r.wavelength * 1.8 && dist > 0) {
        const envelope = Math.cos((diff / (r.wavelength * 1.8)) * (Math.PI / 2));
        const wave = Math.sin((diff / r.wavelength) * Math.PI * 2) * envelope * r.alpha;

        const angle = Math.atan2(dy, dx);
        offsetX += Math.cos(angle) * wave * r.amplitude;
        offsetY += Math.sin(angle) * wave * r.amplitude;

        const intensity = Math.max(0, wave);
        radiusBoost += intensity * 2.2;
        opacityBoost += intensity * 0.65;
      }
    }

    const finalX = dot.baseX + offsetX;
    const finalY = dot.baseY + offsetY;
    const finalRadius = BASE_DOT_RADIUS + radiusBoost;
    const finalOpacity = Math.min(1, 0.22 + opacityBoost);

    ctx.beginPath();
    ctx.arc(finalX, finalY, finalRadius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${finalOpacity})`;
    ctx.fill();
  }

  requestAnimationFrame(animate);
}

window.addEventListener('resize', initCanvas);
initCanvas();
animate();