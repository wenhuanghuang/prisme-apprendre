/**
 * Lecture à voix haute par la synthèse vocale du navigateur.
 * Par défaut, voix installées sur l'ordinateur seulement : rien ne quitte l'appareil. Un parent peut permettre
 * les voix « naturelles » en ligne (voix neuronales d'Edge) dans l'espace parents ; seul le texte lu (énoncés,
 * explications, dictées) part alors vers le service vocal du navigateur, jamais une donnée de l'enfant.
 * Les voix améliorées d'Apple, installées sur l'appareil, sont toujours préférées aux voix ordinaires.
 * Le texte est lu phrase par phrase : pauses plus naturelles, et pas de coupure des voix en ligne sur un long texte.
 */
import { h } from './dom.js';

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
const PREF_KEY = 'prisme.voix-naturelles';
let generation = 0;
let onlineFailed = false; // une voix en ligne a échoué (hors connexion) : voix de l'ordinateur jusqu'au rechargement

/** Les voix en ligne sont-elles permises ? Seulement si un parent l'a choisi dans l'espace parents. */
export function naturalVoicesAllowed() {
  try { return localStorage.getItem(PREF_KEY) === 'oui'; } catch { return false; }
}

export function setNaturalVoicesAllowed(on) {
  try { localStorage.setItem(PREF_KEY, on ? 'oui' : 'non'); } catch { /* stockage indisponible : réglage non retenu */ }
  onlineFailed = false;
}

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

// voix réputées les plus agréables, par langue (Edge, puis macOS / iOS, puis Chrome)
const FAVOURITES = {
  fr: ['denise', 'vivienne', 'henri', 'rémy', 'remy', 'amélie', 'audrey', 'thomas', 'google', 'julie'],
  en: ['sonia', 'libby', 'ryan', 'ava', 'andrew', 'daniel', 'serena', 'google'],
  es: ['elvira', 'alvaro', 'ximena', 'mónica', 'jorge', 'google'],
  de: ['katja', 'conrad', 'seraphina', 'anna', 'google'],
  it: ['elsa', 'diego', 'isabella', 'alice', 'google'],
};

/** Qualité d'une voix : 3 neuronale, 2 améliorée, 1 autre voix en ligne, 0 voix classique de l'ordinateur. */
function quality(v) {
  if (/natural|neural|naturelle/i.test(v.name)) return 3;
  if (/premium|enhanced|améliorée|siri/i.test(v.name)) return 2;
  return v.localService === false ? 1 : 0;
}

/**
 * Meilleure voix pour une langue (« en-GB », « es-ES », « fr-FR »), parmi une liste de voix.
 * Même région d'abord, puis même langue ; à langue égale, la plus naturelle. Sans `online`, voix locales seulement.
 */
export function pickVoice(voices, lang, { online = true } = {}) {
  const want = String(lang || 'fr-FR').toLowerCase().replace('_', '-');
  const base = want.split('-')[0];
  const fav = FAVOURITES[base] || [];
  const code = (v) => String(v.lang || '').toLowerCase().replace('_', '-');
  const score = (v) => {
    const region = code(v) === want ? 100 : 0;
    const rank = fav.findIndex((n) => v.name.toLowerCase().includes(n));
    return region + quality(v) * 10 + (rank < 0 ? 0 : (fav.length - rank) / fav.length);
  };
  const usable = (voices || []).filter((v) => code(v).split('-')[0] === base && (online || v.localService !== false));
  return usable.reduce((best, v) => (!best || score(v) > score(best) ? v : best), null);
}

/** Meilleure voix utilisable maintenant pour une langue (voix en ligne seulement si permises et joignables). */
export async function voiceFor(lang, { localOnly = false } = {}) {
  const online = !localOnly && !onlineFailed && naturalVoicesAllowed() && !(typeof navigator !== 'undefined' && navigator.onLine === false);
  return pickVoice(await loadVoices(), lang, { online });
}

export function speechAvailable() { return Boolean(synth); }

/** Arrête toute lecture, y compris une lecture encore en attente des voix (changement de page). */
export function stopSpeaking() {
  generation++;
  // une lecture mise en pause (expérience) ne doit pas laisser la synthèse vocale en pause pour la suite
  if (synth) { synth.cancel(); synth.resume(); }
}

// fin de phrase : . ! ? … suivi d'une majuscule, d'un chiffre ou d'un guillemet, mais pas après une abréviation
// (« 490 av. J.-C. », « M. Dupont », « J. Ferry ») ; « J.-C. et les Athéniens » ne finit pas la phrase
const SENTENCE_END = /(?<=[.!?…])(?<!\b(?:av|apr|env|ex|cf|p|pp|M|Mme|Mlle|Dr|St|Ste|vol|chap|fig|art|n°|\p{Lu})\.)\s+(?=[«"“(\p{Lu}\d])/u;

/** Regroupe des morceaux en blocs d'au plus `max` caractères. */
function pack(pieces, max) {
  const out = [];
  let cur = '';
  for (const piece of pieces) {
    if (cur && (cur + ' ' + piece).length > max) { out.push(cur); cur = piece; } else cur = cur ? `${cur} ${piece}` : piece;
  }
  if (cur) out.push(cur);
  return out;
}

/** Coupe une phrase trop longue : après « ; » ou « : », puis après une virgule suivie d'une espace (jamais dans « 3,5 »), en dernier recours entre deux mots. */
function splitLong(s, max) {
  if (s.length <= max) return [s];
  for (const sep of [/(?<=[;:])\s+/, /(?<=,)\s+/]) {
    const pieces = s.split(sep);
    if (pieces.length > 1) return pack(pieces.flatMap((p) => splitLong(p, max)), max);
  }
  return pack(s.split(' '), max);
}

/** Découpe un texte en phrases à lire l'une après l'autre (au plus ~220 caractères chacune). */
export function speechChunks(text, max = 220) {
  const sentences = String(text || '').replace(/\s+/g, ' ').trim().split(SENTENCE_END);
  const out = sentences.flatMap((s) => splitLong(s, max));
  // une phrase très courte (« Prévois ! ») est lue avec la suivante, sans silence entre les deux
  return out.reduce((acc, s) => {
    const last = acc[acc.length - 1];
    if (last !== undefined && last.length < 25 && (last + ' ' + s).length <= max) acc[acc.length - 1] = `${last} ${s}`;
    else acc.push(s);
    return acc;
  }, []).filter((s) => /[\p{L}\p{N}]/u.test(s));
}

// erreurs qui montrent que la voix en ligne est injoignable (et non une lecture annulée ou refusée par le navigateur)
const UNREACHABLE = new Set(['network', 'synthesis-unavailable', 'synthesis-failed', 'voice-unavailable', 'language-unavailable']);
const ONLINE_START_DELAY = 6000; // une voix en ligne qui ne commence pas dans ce délai est jugée injoignable

/** Met en file les phrases ; si la voix en ligne est injoignable, reprend avec une voix de l'ordinateur. */
function queue(chunks, voice, rate, ticket, lang) {
  const state = { failed: false, started: false, spoken: 0 };
  const fallBack = async () => {
    if (state.failed || ticket !== generation) return;
    state.failed = true;
    onlineFailed = true;
    synth.cancel();
    const local = await voiceFor(lang, { localOnly: true });
    if (local && ticket === generation) queue(chunks.slice(state.spoken), local, rate, ticket, lang);
  };
  chunks.forEach((chunk, i) => {
    const u = new SpeechSynthesisUtterance(chunk);
    u.voice = voice; u.lang = voice.lang; u.rate = rate;
    u.onstart = () => { state.started = true; state.spoken = i; };
    if (voice.localService === false) u.onerror = (e) => { if (UNREACHABLE.has(e.error)) fallBack(); };
    synth.speak(u);
  });
  // une voix en ligne peut aussi rester muette sans signaler d'erreur : on n'attend pas indéfiniment
  if (voice.localService === false && chunks.length) {
    setTimeout(() => { if (!state.started && !synth.paused) fallBack(); }, ONLINE_START_DELAY);
  }
}

/** Lit un texte. Renvoie false si aucune voix n'existe pour cette langue. */
export async function speak(text, { lang = 'fr-FR', rate = 1 } = {}) {
  if (!synth || !text) return false;
  const ticket = ++generation;
  synth.cancel();
  synth.resume();
  const voice = await voiceFor(lang);
  if (!voice) return false;
  if (ticket !== generation) return true; // une autre lecture (ou un arrêt) a eu lieu entre-temps
  // les voix classiques de l'ordinateur sont plus intelligibles un peu moins vite
  queue(speechChunks(text), voice, quality(voice) ? rate : rate * 0.95, ticket, lang);
  return true;
}

const LANG_NAMES = { fr: 'française', en: 'anglaise', es: 'espagnole', de: 'allemande', it: 'italienne' };

// unités composées lues en toutes lettres (après un nombre ou seules : « en m/s », « par km² »)
const UNITS = [
  [/\bkm\s?\/\s?h\b/g, 'kilomètres par heure'], [/\bkm\s?\/\s?s\b/g, 'kilomètres par seconde'],
  [/\bm\s?\/\s?s\b/g, 'mètres par seconde'], [/\bN\s?\/\s?kg\b/g, 'newtons par kilogramme'],
  [/\bg\s?\/\s?cm³/g, 'grammes par centimètre cube'], [/\bkg\s?\/\s?m³/g, 'kilogrammes par mètre cube'],
  [/\bmg\s?\/\s?L\b/g, 'milligrammes par litre'], [/\bg\s?\/\s?L\b/g, 'grammes par litre'],
  [/(\d)\s?cm³/g, '$1 centimètres cubes'], [/(\d)\s?dm³/g, '$1 décimètres cubes'], [/(\d)\s?m³/g, '$1 mètres cubes'],
  [/(\d)\s?cm²/g, '$1 centimètres carrés'], [/(\d)\s?km²/g, '$1 kilomètres carrés'], [/(\d)\s?m²/g, '$1 mètres carrés'],
  [/\bcm³/g, 'centimètre cube'], [/\bdm³/g, 'décimètre cube'], [/\bm³/g, 'mètre cube'],
  [/\bcm²/g, 'centimètre carré'], [/\bkm²/g, 'kilomètre carré'], [/\bm²/g, 'mètre carré'],
  [/°\s?C\b/g, ' degrés Celsius'], [/(\d)\s?°/g, '$1 degrés'],
];
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const SUP_VALUE = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', 'ⁿ': 'n', '⁻': 'moins ' };
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const subscriptNumber = (s) => [...s].map((c) => c.charCodeAt(0) - 0x2080).join('');

/** Une flèche se lit « donne » dans une équation de réaction (indices, charges ou « + »), sinon c'est une pause. */
function readArrows(t) {
  return t.replace(/\s?→\s?/g, (m, at, all) => {
    const start = Math.max(...['.', ';', ':', '\n'].map((c) => all.lastIndexOf(c, at)));
    const ends = ['.', ';', ':', '\n'].map((c) => all.indexOf(c, at)).filter((x) => x >= 0);
    const clause = all.slice(start + 1, ends.length ? Math.min(...ends) : all.length);
    return /[₀-₉⁺⁻]|\s\+\s/.test(clause) ? ' donne ' : ', ';
  });
}

/** Texte lisible à voix haute : sans balises de mise en forme, symboles mathématiques et scientifiques dits en mots. */
export function plainForSpeech(s) {
  let t = String(s || '')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '$1') // lien : seulement son texte
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\$([^$]*)\$/g, '$1')
    .replace(/_{3,}/g, ' … ') // mot à compléter : une pause
    .replace(/\s?[↔⇔]\s?/g, ', ').replace(/\s?[➡⇒]\s?/g, ', donc ') // avant de retirer les émojis (↔ en est un)
    .replace(/\p{Extended_Pictographic}️?/gu, '') // les voix naturelles liraient le nom de l'émoji
    .replace(/\*\*|__|`|#+\s|^>\s?/gm, '').replace(/\*([^*]+)\*/g, '$1')
    .replace(/(\d[^→\d₀-₉⁺⁻]{0,12})\s?→\s?(?=\d)/g, '$1 à '); // 1848 → 1895, 10 g → 6,3 g
  t = readArrows(t)
    // ions : H⁺, Cl⁻, Cu²⁺ (« Cu 2 plus »), SO₄²⁻
    .replace(new RegExp(`([A-Za-z₀-₉])([${SUP}]?)([⁺⁻])(?![${SUP}])`, 'g'), (m, el, n, sign) => `${el} ${n ? `${SUP_VALUE[n]} ` : ''}${sign === '⁺' ? 'plus' : 'moins'}`)
    .replace(/[₀-₉]+/g, (n) => ` ${subscriptNumber(n)} `) // H₂O : « H 2 O », C₄H₁₀ : « C 4 H 10 »
    .replace(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g, (m, d, mo, y) => (MONTHS[mo - 1] ? `${Number(d)} ${MONTHS[mo - 1]} ${y}` : m)); // 22/09/2026
  for (const [re, words] of UNITS) t = t.replace(re, words);
  return t
    // puissances : 10⁻¹⁰, (−3)⁴, 10ⁿ ; un ² ou un ³ seul se lit « au carré », « au cube »
    .replace(new RegExp(`⁻?[${SUP}ⁿ]+`, 'g'), (sup) => (sup === '²' || sup === '³' ? sup : ` puissance ${[...sup].map((c) => SUP_VALUE[c]).join('')}`))
    .replace(/\^\(([^()]+)\)/g, ' puissance $1 ') // a^(n+p)
    .replace(/\^(-|−)?(\d+|[A-Za-z])/g, (m, neg, n) => ` puissance ${neg ? 'moins ' : ''}${n}`)
    .replace(/²/g, ' au carré').replace(/³/g, ' au cube')
    .replace(/√/g, ' racine de ')
    .replace(/×/g, ' fois ').replace(/÷/g, ' divisé par ')
    .replace(/(\d)\s*\/\s*(\d)/g, '$1 sur $2')
    // « U / I » est une division ; « jolie / Avec » (vers), « might / may » (choix) : une simple pause
    .replace(/(^|[\s(=])([A-Za-z]|\d+(?:,\d+)?|\))\s\/\s(?=(?:[A-Za-z]|\d|\()(?:[\s),.;]|$))/g, '$1$2 divisé par ')
    .replace(/\s\/\s/g, ', ')
    .replace(/≈/g, ' environ ').replace(/≠/g, ' différent de ')
    .replace(/≤/g, ' inférieur ou égal à ').replace(/≥/g, ' supérieur ou égal à ')
    .replace(/\s>\s/g, ' supérieur à ').replace(/\s<\s/g, ' inférieur à ')
    .replace(/\s=\s/g, ' égale ')
    .replace(/Δ/g, 'delta ').replace(/ρ/g, 'rho')
    .replace(/−/g, ' moins ')
    .replace(/[•[\]]/g, ' ')
    .replace(/([!?])\s*\.(?!\.)/g, '$1') // « Prévois !. » (titre suivi d'un point)
    .replace(/\s+([,.])/g, '$1')
    .replace(/\s+/g, ' ').trim();
}

/**
 * Boutons « Écouter » et « Lentement ». Si aucune voix n'est disponible pour la langue,
 * un message l'explique au lieu de rester muet.
 */
export function listenButtons({ text, lang = 'fr-FR', label = 'Écouter', slow = true } = {}) {
  const status = h('span', { class: 'listen-status small muted', 'aria-live': 'polite' });
  const play = async (rate) => {
    status.textContent = '';
    const ok = await speak(text, { lang, rate });
    if (!ok) status.textContent = speechAvailable()
      ? `Aucune voix ${LANG_NAMES[String(lang).slice(0, 2)] || `« ${lang} »`} n'est disponible. Dans Microsoft Edge, connecté à Internet, les voix naturelles le sont sans rien installer (si l'espace parents les permet) ; sinon, un adulte peut en ajouter une : Paramètres Windows › Heure et langue › Voix › Ajouter des voix.`
      : 'La lecture à voix haute n’est pas disponible dans ce navigateur.';
  };
  return h('div', { class: 'listen', role: 'group', 'aria-label': 'Écoute' },
    h('button', { type: 'button', class: 'btn btn--small listen-btn', dataset: { keepEnabled: '1' }, onclick: () => play(1) }, h('span', { 'aria-hidden': 'true' }, '▶ '), label),
    slow ? h('button', { type: 'button', class: 'btn btn--small btn--ghost', dataset: { keepEnabled: '1' }, onclick: () => play(0.7) }, 'Lentement') : null,
    status);
}
