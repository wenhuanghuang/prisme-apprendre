/**
 * Lecteur d'expérience : l'expérience est MONTRÉE à l'élève, étape par étape, avec une explication
 * à chaque étape, des pauses quand il veut, et des questions « Que va-t-il se passer ? ».
 * Contrôles : lancer / pause, étape précédente / suivante, revoir l'étape, vitesse, voix, enchaînement.
 */
import { h, richText, inlineHTML, announce } from '../ui/dom.js';
import { speak, stopSpeaking, plainForSpeech } from '../ui/speech.js';
import { photon } from '../ui/photon.js';
import { initialState, stateAt, stepDuration, renderScene, isAnimated, DEFAULT_W, DEFAULT_H } from './scene.js';

const SPEEDS = [0.5, 1, 2];
let uidSeq = 0;
const prefs = { voice: false, auto: false, speed: 1 };
try { Object.assign(prefs, JSON.parse(localStorage.getItem('prisme.demo.prefs') || '{}')); } catch { /* stockage indisponible */ }
if (!SPEEDS.includes(prefs.speed)) prefs.speed = 1;
const savePrefs = () => { try { localStorage.setItem('prisme.demo.prefs', JSON.stringify(prefs)); } catch { /* ignoré */ } };
const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Temps de lecture estimé d'un texte (secondes), pour l'enchaînement automatique. */
const readingTime = (text) => Math.min(14, 2 + String(text || '').split(/\s+/).length / 2.6);

/**
 * @param {HTMLElement} container
 * @param {object} demo  { w, h, items, steps, conclusion, emoji }
 * @returns {Function} nettoyage
 */
export function mountDemo(container, demo) {
  const steps = demo.steps || [];
  if (!steps.length) return () => {};
  const uid = `dm${++uidSeq}`;
  const base = initialState(demo);
  const W = Number(demo.w) || DEFAULT_W; const H = Number(demo.h) || DEFAULT_H;
  const narrationOnly = !(demo.items || []).length;
  const still = reducedMotion(); // bulles, flammes, particules immobiles si l'on a demandé moins d'animations

  let k = 0; let t = 0; let clock = 0; let ambient = 0;
  let started = false; let paused = false; let finished = false;
  const answered = new Map(); // étape → instant de la réponse
  let raf = 0; let last = 0; let stepStartedAt = 0; let dirty = true;
  const durations = steps.map(stepDuration);

  /* ---------- interface ---------- */
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('class', 'demo-svg');
  svg.setAttribute('role', 'img');
  const bigEmoji = h('div', { class: 'demo-narration', 'aria-hidden': 'true' });
  const startBtn = h('button', { type: 'button', class: 'demo-start', onclick: () => start() }, h('span', { class: 'demo-start-icon', 'aria-hidden': 'true' }, '▶'), 'Lancer l’expérience');
  const pausedBadge = h('div', { class: 'demo-paused', hidden: true, 'aria-hidden': 'true' }, '⏸ En pause');
  const stage = h('div', { class: `demo-stage ${narrationOnly ? 'demo-stage--text' : ''}`, onclick: (e) => { if (started && !e.target.closest('button')) togglePause(); } }, narrationOnly ? bigEmoji : svg, pausedBadge, startBtn);

  const stepN = h('p', { class: 'demo-step-n' });
  const title = h('h3', { class: 'demo-title' });
  const text = h('div', { class: 'demo-text', 'aria-live': 'polite' });
  const askBox = h('div', { class: 'demo-ask' });
  const nextBig = h('button', { type: 'button', class: 'btn btn--primary demo-next', onclick: () => next() }, 'Étape suivante ▶');
  const panel = h('div', { class: 'demo-panel' }, h('div', { class: 'demo-guide' }, photon('curieux', 40), h('div', {}, stepN, title)), text, askBox, nextBig);

  const timeline = h('div', { class: 'demo-timeline', role: 'group', 'aria-label': 'Étapes de l’expérience' });
  const segs = steps.map((st, i) => {
    const fill = h('span', { class: 'demo-seg-fill' });
    const b = h('button', { type: 'button', class: 'demo-seg', title: `${i + 1}. ${st.title || ''}`, 'aria-label': `Aller à l’étape ${i + 1} : ${st.title || ''}`, onclick: () => goStep(i) }, fill, st.ask ? h('span', { class: 'demo-seg-q', 'aria-hidden': 'true' }, '?') : null);
    timeline.append(b);
    return { b, fill };
  });

  const btnPrev = h('button', { type: 'button', class: 'demo-ctl', 'aria-label': 'Étape précédente', title: 'Étape précédente (←)', onclick: () => goStep(k - 1) }, '⏮');
  const btnPlay = h('button', { type: 'button', class: 'demo-ctl demo-ctl--main', onclick: () => togglePause() }, '⏸');
  const btnNext = h('button', { type: 'button', class: 'demo-ctl', 'aria-label': 'Étape suivante', title: 'Étape suivante (→)', onclick: () => (started ? next() : start()) }, '⏭');
  const btnReplay = h('button', { type: 'button', class: 'demo-ctl', 'aria-label': 'Revoir cette étape', title: 'Revoir cette étape', onclick: () => goStep(k) }, '↺');
  const btnSpeed = h('button', { type: 'button', class: 'demo-ctl demo-ctl--text', title: 'Vitesse de l’animation', onclick: () => { prefs.speed = SPEEDS[(SPEEDS.indexOf(prefs.speed) + 1) % SPEEDS.length]; savePrefs(); paintControls(); } });
  const btnVoice = h('button', { type: 'button', class: 'demo-ctl', 'aria-label': 'Lire les explications à voix haute', title: 'Lire les explications à voix haute', onclick: () => { prefs.voice = !prefs.voice; savePrefs(); if (prefs.voice) say(); else stopSpeaking(); paintControls(); } }, '🔊');
  const btnAuto = h('button', { type: 'button', class: 'demo-ctl demo-ctl--text', title: 'Enchaîner les étapes sans attendre', onclick: () => { prefs.auto = !prefs.auto; savePrefs(); paintControls(); } }, 'Enchaîner');
  const controls = h('div', { class: 'demo-controls' }, btnPrev, btnPlay, btnNext, btnReplay, h('span', { class: 'demo-sep' }), btnSpeed, btnVoice, btnAuto);

  const conclusion = h('div', { class: 'demo-conclusion', hidden: true });
  const root = h('div', { class: 'demo', tabindex: '0', role: 'group', 'aria-label': 'Expérience animée. Espace : pause ou reprise ; flèches gauche et droite : étape précédente ou suivante.' },
    stage, h('div', { class: 'demo-side' }, panel, conclusion), timeline, controls);
  container.append(root);

  /* ---------- logique ---------- */
  const stepDone = () => t >= durations[k] - 1e-6;
  const askPending = () => Boolean(steps[k].ask) && !answered.has(k);

  /** Un bouton qui vient d'être désactivé ou masqué perd le focus : on le rend au lecteur (sinon les touches quittent l'expérience). */
  function keepFocus() {
    setTimeout(() => {
      const a = document.activeElement;
      if (!root.isConnected) return;
      if (!a || a === document.body || (root.contains(a) && (a.disabled || a.closest('[hidden]')))) root.focus({ preventScroll: true });
    }, 0);
  }

  function say() {
    if (!prefs.voice) return;
    const st = steps[k];
    speak(plainForSpeech(`${st.title || ''}. ${st.text || ''} ${st.ask ? st.ask.question : ''}`), { lang: 'fr-FR' }).then((ok) => {
      if (!ok) { prefs.voice = false; paintControls(); announce('Aucune voix française n’est installée sur cet ordinateur.'); }
    });
  }

  function paintAsk(st) {
    askBox.replaceChildren();
    if (!st.ask) return;
    const a = st.ask;
    const right = Number(a.answer);
    const fb = h('div', { class: 'demo-ask-fb', 'aria-live': 'polite' });
    const choices = h('div', { class: 'demo-choices' }, (a.choices || []).map((c, i) => h('button', {
      type: 'button', class: 'demo-choice', html: inlineHTML(c),
      onclick: () => {
        if (answered.has(k)) return;
        answered.set(k, clock);
        const ok = i === right;
        choices.querySelectorAll('button').forEach((b, j) => { b.disabled = true; if (j === right) b.classList.add('is-right'); else if (j === i) b.classList.add('is-wrong'); });
        fb.replaceChildren(h('p', { class: ok ? 'demo-ok' : 'demo-ko' }, ok ? 'Bien vu !' : 'Pas tout à fait… regarde la suite pour comprendre.'), a.explain ? richText(a.explain) : null);
        if (prefs.voice && a.explain) speak(plainForSpeech(a.explain), { lang: 'fr-FR' });
        paintControls();
        keepFocus();
      },
    })));
    askBox.append(h('p', { class: 'demo-ask-q' }, h('span', { class: 'demo-ask-tag' }, 'À toi de prévoir'), ' ', h('span', { html: inlineHTML(a.question) })), choices, fb);
    if (answered.has(k)) {
      choices.querySelectorAll('button').forEach((b, j) => { b.disabled = true; if (j === right) b.classList.add('is-right'); });
      if (a.explain) fb.append(richText(a.explain));
    }
  }

  function paintPanel() {
    const st = steps[k];
    stepN.textContent = `Étape ${k + 1} sur ${steps.length}`;
    title.textContent = st.title || '';
    text.replaceChildren(richText(st.text || ''));
    paintAsk(st);
    if (narrationOnly) bigEmoji.replaceChildren(h('span', { class: 'demo-narration-emoji' }, st.emoji || demo.emoji || '🧪'), h('span', { class: 'demo-narration-title' }, st.title || ''));
    svg.setAttribute('aria-label', plainForSpeech(`${st.title || ''} : ${st.text || ''}`));
  }

  function paintControls() {
    btnPrev.disabled = k === 0 && t === 0;
    const waiting = started && !paused && !finished && stepDone() && !askPending() && !prefs.auto;
    const showPlay = paused || !started || waiting || finished;
    btnPlay.textContent = showPlay ? '▶' : '⏸';
    const lab = !started ? 'Lancer l’expérience' : finished ? 'Revoir l’expérience' : paused ? 'Reprendre' : waiting ? 'Étape suivante' : 'Pause';
    btnPlay.setAttribute('aria-label', lab);
    btnPlay.title = `${lab} (espace)`;
    btnSpeed.textContent = `×${String(prefs.speed).replace('.', ',')}`;
    btnSpeed.setAttribute('aria-label', `Vitesse de l’animation : ${String(prefs.speed).replace('.', ',')}`);
    btnVoice.classList.toggle('is-on', prefs.voice);
    btnVoice.setAttribute('aria-pressed', String(prefs.voice));
    btnAuto.classList.toggle('is-on', prefs.auto);
    btnAuto.setAttribute('aria-pressed', String(prefs.auto));
    pausedBadge.hidden = !(started && paused);
    const canNext = started && stepDone() && !askPending();
    nextBig.hidden = !started || finished;
    nextBig.disabled = !canNext;
    nextBig.textContent = askPending() ? 'Réponds pour continuer' : !stepDone() ? 'Regarde…' : k < steps.length - 1 ? 'Étape suivante ▶' : 'Voir la conclusion ▶';
    nextBig.classList.toggle('is-pulse', canNext);
    btnNext.disabled = started && askPending();
    segs.forEach(({ b, fill }, i) => {
      const p = i < k || finished ? 1 : i === k ? (durations[k] ? Math.min(1, t / durations[k]) : (stepDone() ? 1 : 0)) : 0;
      fill.style.transform = `scaleX(${p})`;
      b.classList.toggle('is-current', i === k && !finished);
      b.classList.toggle('is-done', i < k || finished);
      if (i === k && !finished) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
  }

  function draw() {
    if (narrationOnly) return;
    const st = stateAt(demo, base, k, t);
    svg.innerHTML = renderScene(demo, st, ambient, steps[k].focus || [], uid).svg;
    dirty = !still && isAnimated(st);
  }

  function goStep(i, { speakIt = true } = {}) {
    if (i < 0 || i >= steps.length) return;
    if (!started) { started = true; startBtn.hidden = true; }
    k = i; t = 0; finished = false; stepStartedAt = clock;
    conclusion.hidden = true; panel.hidden = false;
    paused = false;
    paintPanel(); paintControls(); draw();
    if (speakIt) say(); else stopSpeaking();
    keepFocus();
  }

  function next() {
    if (askPending()) return;
    if (k < steps.length - 1) goStep(k + 1);
    else finish();
  }

  function finish() {
    finished = true;
    t = durations[k];
    panel.hidden = true;
    conclusion.hidden = false;
    conclusion.replaceChildren(
      h('div', { class: 'demo-guide' }, photon('bravo', 44), h('div', {}, h('p', { class: 'demo-step-n' }, 'Fin de l’expérience'), h('h3', { class: 'demo-title' }, 'Ce que l’on a observé'))),
      demo.conclusion ? richText(demo.conclusion) : h('p', {}, 'Relis les étapes pour bien retenir ce qui s’est passé.'),
      h('button', { type: 'button', class: 'btn btn--ghost btn--small', onclick: () => goStep(0) }, '↺ Revoir l’expérience depuis le début'));
    paintControls();
    keepFocus();
    if (prefs.voice && demo.conclusion) speak(plainForSpeech(`Ce que l'on a observé. ${demo.conclusion}`), { lang: 'fr-FR' });
  }

  function togglePause() {
    if (!started) { start(); return; }
    if (finished) { goStep(0); return; }
    if (!paused && stepDone() && !askPending() && !prefs.auto) { next(); return; }
    paused = !paused;
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    if (synth) { if (paused && synth.speaking) synth.pause(); else if (!paused) synth.resume(); }
    paintControls();
    announce(paused ? 'Expérience en pause' : 'Reprise de l’expérience');
  }

  function start() {
    goStep(0);
    root.focus({ preventScroll: true });
  }

  /** Enchaînement automatique : après l'animation, le temps de lire l'étape (et l'explication d'une question). */
  function autoReady() {
    if (!prefs.auto || !stepDone() || askPending()) return false;
    if (prefs.voice && window.speechSynthesis && window.speechSynthesis.speaking) return false;
    const st = steps[k];
    if (clock - stepStartedAt < Math.max(durations[k] / prefs.speed, readingTime(`${st.title || ''} ${st.text || ''}`)) + 0.8) return false;
    if (st.ask && clock - answered.get(k) < readingTime(st.ask.explain) + 0.8) return false;
    return true;
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    const dt = last ? Math.min(0.25, (now - last) / 1000) : 0;
    last = now;
    if (!root.isConnected) return;
    if (!started || paused) return;
    if (!still) ambient += dt;
    if (finished) { if (dirty) draw(); return; }
    clock += dt;
    let changed = dirty;
    if (!stepDone()) { t = Math.min(durations[k], t + dt * prefs.speed); changed = true; if (stepDone()) paintControls(); }
    if (changed) draw();
    if (Math.floor(now / 100) !== Math.floor((now - dt * 1000) / 100)) paintControls();
    if (autoReady()) next();
  }

  root.addEventListener('keydown', (e) => {
    if (e.target.closest('button') && (e.key === ' ' || e.key === 'Enter')) return; // bouton : action normale
    if (e.key === ' ') { e.preventDefault(); togglePause(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); if (started) next(); else start(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); goStep(Math.max(0, k - 1)); }
  });

  // accès pour les tests automatiques : afficher l'étape i à la fraction f de son animation
  root.demoSeek = (i, f = 1) => { goStep(i, { speakIt: false }); t = durations[k] * Math.max(0, Math.min(1, f)); paused = true; paintControls(); draw(); };

  paintPanel(); paintControls();
  // première image : l'état initial de la scène, avant le lancement
  if (!narrationOnly) svg.innerHTML = renderScene(demo, stateAt(demo, base, 0, 0), 0, [], uid).svg;
  raf = requestAnimationFrame(loop);

  return () => { cancelAnimationFrame(raf); stopSpeaking(); };
}
