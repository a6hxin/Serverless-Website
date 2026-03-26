/* ============================================
   NEXUS — Serverless Future
   js/main.js
   Three.js 3D scene + cursor + terminal animation
============================================ */

// ===== CUSTOM CURSOR =====
const cursor    = document.getElementById('cursor');
const cursorDot = document.getElementById('cursor-dot');

let mouseX = 0, mouseY = 0;
let dotX = 0, dotY = 0;

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  cursorDot.style.left = mouseX + 'px';
  cursorDot.style.top  = mouseY + 'px';
});

(function animateCursor() {
  dotX += (mouseX - dotX) * 0.12;
  dotY += (mouseY - dotY) * 0.12;
  cursor.style.left = dotX + 'px';
  cursor.style.top  = dotY + 'px';
  requestAnimationFrame(animateCursor);
})();


// ===== THREE.JS 3D BACKGROUND =====
(function initThree() {
  const canvas   = document.getElementById('bg-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 0, 40);

  // ── Particle field ──
  const particleCount = 1200;
  const positions = new Float32Array(particleCount * 3);
  const colors    = new Float32Array(particleCount * 3);
  const sizes     = new Float32Array(particleCount);

  const c1 = new THREE.Color('#f5c518');
  const c2 = new THREE.Color('#ff6b2b');
  const c3 = new THREE.Color('#a0a090');
  const palette = [c1, c2, c3];

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 120;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 80;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 80;

    const col = palette[Math.floor(Math.random() * 3)];
    colors[i * 3]     = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;

    sizes[i] = Math.random() * 1.2 + 0.2;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.PointsMaterial({
    size: 0.25,
    vertexColors: true,
    transparent: true,
    opacity: 0.65,
    sizeAttenuation: true,
  });

  const particles = new THREE.Points(geo, mat);
  scene.add(particles);

  // ── Wire grid (floating hex nodes) ──
  const nodeGroup = new THREE.Group();
  const nodeGeo   = new THREE.SphereGeometry(0.18, 6, 6);

  for (let i = 0; i < 40; i++) {
    const nodeMat = new THREE.MeshBasicMaterial({
      color: Math.random() > 0.5 ? 0xf5c518 : 0xff6b2b,
      transparent: true,
      opacity: 0.4,
    });
    const node = new THREE.Mesh(nodeGeo, nodeMat);
    node.position.set(
      (Math.random() - 0.5) * 90,
      (Math.random() - 0.5) * 60,
      (Math.random() - 0.5) * 40
    );
    nodeGroup.add(node);
  }
  scene.add(nodeGroup);

  // ── Floating connection lines ──
  const lineGroup = new THREE.Group();
  const nodes     = nodeGroup.children;
  for (let i = 0; i < 30; i++) {
    const a = nodes[Math.floor(Math.random() * nodes.length)];
    const b = nodes[Math.floor(Math.random() * nodes.length)];
    if (a === b) continue;
    const dist = a.position.distanceTo(b.position);
    if (dist > 28) continue;
    const lineGeo = new THREE.BufferGeometry().setFromPoints([a.position, b.position]);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xf5c518, transparent: true, opacity: 0.06
    });
    lineGroup.add(new THREE.Line(lineGeo, lineMat));
  }
  scene.add(lineGroup);

  // ── Slow rotating torus ring ──
  const torusGeo = new THREE.TorusGeometry(18, 0.04, 8, 120);
  const torusMat = new THREE.MeshBasicMaterial({
    color: 0xf5c518, transparent: true, opacity: 0.07
  });
  const torus = new THREE.Mesh(torusGeo, torusMat);
  torus.rotation.x = Math.PI / 2.5;
  scene.add(torus);

  const torus2 = new THREE.Mesh(
    new THREE.TorusGeometry(26, 0.03, 8, 120),
    new THREE.MeshBasicMaterial({ color: 0xa09080, transparent: true, opacity: 0.04 })
  );
  torus2.rotation.x = Math.PI / 3;
  torus2.rotation.y = Math.PI / 6;
  scene.add(torus2);

  // ── Mouse parallax ──
  let targetRotX = 0, targetRotY = 0;
  let currentRotX = 0, currentRotY = 0;

  document.addEventListener('mousemove', (e) => {
    targetRotY = ((e.clientX / window.innerWidth)  - 0.5) * 0.3;
    targetRotX = ((e.clientY / window.innerHeight) - 0.5) * 0.15;
  });

  // ── Resize ──
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ── Animate ──
  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.004;

    currentRotX += (targetRotX - currentRotX) * 0.05;
    currentRotY += (targetRotY - currentRotY) * 0.05;

    particles.rotation.y  = t * 0.04 + currentRotY;
    particles.rotation.x  = currentRotX * 0.5;
    nodeGroup.rotation.y  = t * 0.06 + currentRotY;
    lineGroup.rotation.y  = t * 0.06 + currentRotY;
    torus.rotation.z      = t * 0.08;
    torus2.rotation.z     = -t * 0.05;
    torus2.rotation.y     = t * 0.03;

    // Pulse node sizes
    nodes.forEach((node, i) => {
      const s = 1 + 0.25 * Math.sin(t * 1.5 + i * 0.5);
      node.scale.setScalar(s);
    });

    renderer.render(scene, camera);
  }
  animate();
})();


// ===== COUNTER ANIMATION =====
function animateCounters() {
  const stats = document.querySelectorAll('.stat-num[data-target]');
  stats.forEach((el) => {
    const target = parseFloat(el.dataset.target);
    if (isNaN(target)) return;
    let start = null;
    const duration = 1800;
    function step(ts) {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const val = (target * ease).toFixed(target % 1 !== 0 ? 1 : 0);
      el.textContent = val + (target === 99.9 ? '' : target === 10 ? '' : '');
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
}

// Trigger counters when hero is visible
const heroObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { animateCounters(); heroObserver.disconnect(); } });
}, { threshold: 0.3 });
const hero = document.getElementById('hero');
if (hero) heroObserver.observe(hero);


// ===== TERMINAL TYPEWRITER =====
function runTerminal() {
  const cmd   = document.getElementById('typed-cmd');
  const out1  = document.getElementById('t-out-1');
  const out2  = document.getElementById('t-out-2');
  const out3  = document.getElementById('t-out-3');
  if (!cmd) return;

  const text  = 'npx create-nexus-app my-future-app';
  let i = 0;

  function typeChar() {
    if (i < text.length) {
      cmd.textContent += text[i++];
      setTimeout(typeChar, 55 + Math.random() * 40);
    } else {
      setTimeout(() => { out1.textContent = '→ Scaffolding project...'; }, 400);
      setTimeout(() => { out2.textContent = '→ Installing dependencies (0.3s)...'; }, 900);
      setTimeout(() => { out3.textContent = '✓ Ready. Navigate to /my-future-app and deploy.'; }, 1600);
    }
  }

  setTimeout(typeChar, 600);
}

const ctaObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { runTerminal(); ctaObserver.disconnect(); } });
}, { threshold: 0.4 });
const cta = document.getElementById('cta');
if (cta) ctaObserver.observe(cta);


// ===== SCROLL REVEAL =====
const revealEls = document.querySelectorAll('.feature-card, .stack-category, .flow-step');
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach((e, idx) => {
    if (e.isIntersecting) {
      setTimeout(() => {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
      }, idx * 60);
      revealObs.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });

revealEls.forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(28px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  revealObs.observe(el);
});