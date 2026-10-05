/**
 * Lecture à voix haute par la synthèse vocale du navigateur, avec les seules voix installées sur
 * l'ordinateur (localService) : aucun texte n'est envoyé à un service en ligne.
 * Sert aux dictées, à la compréhension de l'oral en langue étrangère et à la lecture des énoncés.
 */
import { h } from './dom.js';

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
let generation = 0;

/** Voix disponibles ; une liste vide n'est pas gardée (certains navigateurs les chargent tard). */
function loadVoices() {
  if (!synth) return Promise.resolve([]);
  const now = synth.getVoices();
  if (now.length) return Promise.resolve(now);
  return new Promise((resolve) => {
    const done = () => resolve(synth.getVoices());
    synth.addEventListener('voiceschanged', done, { once: true });
    setTimeout(done, 1500); // certains navigateurs ne déclenchent jamais l'événement
  });
}

/** Meilleure voix locale pour une langue (« en-GB », « es-ES », « fr-FR ») ; repli sur la même langue d'une autre région. */
export async function voiceFor(lang) {
  const voices = (await loadVoices()).filter((v) => v.localService !== false);
  const want = String(lang || 'fr-FR').toLowerCase();
  const base = want.split('-')[0];
  const code = (v) => v.lang.toLowerCase().replace('_', '-');
  return voices.find((v) => code(v) === want) || voices.find((v) => code(v).startsWith(base)) || null;
}

export function speechAvailable() { return Boolean(synth); }

/** Arrête toute lecture, y compris une lecture encore en attente des voix (changement de page). */
export function stopSpeaking() {
  generation++;
  if (synth) synth.cancel();
}

/** Lit un texte. Renvoie false si aucune voix locale n'existe pour cette langue. */
export async function speak(text, { lang = 'fr-FR', rate = 1 } = {}) {
  if (!synth || !text) return false;
  const ticket = ++generation;
  synth.cancel();
  const voice = await voiceFor(lang);
  if (!voice) return false;
  if (ticket !== generation) return true; // une autre lecture (ou un arrêt) a eu lieu entre-temps
  const u = new SpeechSynthesisUtterance(String(text));
  u.voice = voice; u.lang = voice.lang; u.rate = rate;
  synth.speak(u);
  return true;
}

const LANG_NAMES = { fr: 'française', en: 'anglaise', es: 'espagnole', de: 'allemande', it: 'italienne' };

/** Texte lisible à voix haute : sans balises de mise en forme, symboles mathématiques dits en mots. */
export function plainForSpeech(s) {
  return String(s || '')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '$1') // lien : seulement son texte
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\$([^$]*)\$/g, '$1')
    .replace(/\^\(?(-|−)?(\d+)\)?/g, (m, neg, n) => ` puissance ${neg ? 'moins ' : ''}${n}`)
    .replace(/²/g, ' au carré').replace(/³/g, ' au cube')
    .replace(/√/g, ' racine de ')
    .replace(/×/g, ' fois ').replace(/÷/g, ' divisé par ')
    .replace(/(\d)\s*\/\s*(\d)/g, '$1 sur $2')
    .replace(/−/g, ' moins ')
    .replace(/\*\*|__|`|#+\s|^>\s?/gm, '').replace(/\*([^*]+)\*/g, '$1')
    .replace(/[[\]]/g, '')
    .replace(/\s+/g, ' ').trim();
}

/**
 * Boutons « Écouter » et « Lentement ». Si aucune voix n'est installée pour la langue,
 * un message l'explique au lieu de rester muet.
 */
export function listenButtons({ text, lang = 'fr-FR', label = 'Écouter', slow = true } = {}) {
  const status = h('span', { class: 'listen-status small muted', 'aria-live': 'polite' });
  const play = async (rate) => {
    status.textContent = '';
    const ok = await speak(text, { lang, rate });
    if (!ok) status.textContent = speechAvailable()
      ? `Aucune voix ${LANG_NAMES[String(lang).slice(0, 2)] || `« ${lang} »`} n'est installée sur cet ordinateur. Un adulte peut en ajouter une : Paramètres Windows › Heure et langue › Voix › Ajouter des voix.`
      : 'La lecture à voix haute n’est pas disponible dans ce navigateur.';
  };
  return h('div', { class: 'listen', role: 'group', 'aria-label': 'Écoute' },
    h('button', { type: 'button', class: 'btn btn--small listen-btn', dataset: { keepEnabled: '1' }, onclick: () => play(1) }, h('span', { 'aria-hidden': 'true' }, '▶ '), label),
    slow ? h('button', { type: 'button', class: 'btn btn--small btn--ghost', dataset: { keepEnabled: '1' }, onclick: () => play(0.7) }, 'Lentement') : null,
    status);
}
