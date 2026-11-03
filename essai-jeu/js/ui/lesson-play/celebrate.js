/**
 * Petites célébrations (étoiles qui jaillissent, confettis de fin de leçon).
 * Rien ne s'anime si l'utilisateur a demandé moins d'animations.
 */
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const COLORS = ['#ffb703', '#3b4cca', '#0f7b7d', '#c2410c', '#2e7d32', '#7a4cc2', '#e11d74'];

function layer(host) {
  const l = document.createElement('div');
  l.className = 'fx-layer';
  l.setAttribute('aria-hidden', 'true');
  host.append(l);
  setTimeout(() => l.remove(), 2600);
  return l;
}

/** Étoiles qui jaillissent du haut d'un élément (2 ou 3 étoiles gagnées). */
export function burstStars(host, n = 3) {
  if (reduced() || !host || !host.isConnected) return;
  const l = layer(host);
  for (let k = 0; k < 6 + n * 3; k++) {
    const st = document.createElement('span');
    st.className = 'fx-star';
    st.textContent = '★';
    st.style.left = `${50 + (Math.random() - 0.5) * 30}%`;
    st.style.setProperty('--dx', `${(Math.random() - 0.5) * 260}px`);
    st.style.setProperty('--dy', `${-60 - Math.random() * 120}px`);
    st.style.setProperty('--rot', `${(Math.random() - 0.5) * 360}deg`);
    st.style.animationDelay = `${Math.random() * 0.15}s`;
    st.style.color = COLORS[k % 2 === 0 ? 0 : (k % COLORS.length)];
    l.append(st);
  }
}

/** Pluie de confettis sur toute la largeur d'un élément. */
export function confetti(host, count = 70) {
  if (reduced() || !host || !host.isConnected) return;
  const l = layer(host);
  l.classList.add('fx-layer--rain');
  for (let k = 0; k < count; k++) {
    const c = document.createElement('i');
    c.className = 'fx-confetti';
    c.style.left = `${Math.random() * 100}%`;
    c.style.background = COLORS[k % COLORS.length];
    c.style.setProperty('--dx', `${(Math.random() - 0.5) * 160}px`);
    c.style.setProperty('--rot', `${360 + Math.random() * 720}deg`);
    c.style.animationDelay = `${Math.random() * 0.6}s`;
    c.style.animationDuration = `${1.4 + Math.random() * 0.9}s`;
    l.append(c);
  }
}
