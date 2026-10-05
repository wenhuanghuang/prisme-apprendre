/**
 * Espace parents : tableau de bord pédagogique d'UN enfant à la fois (pas de classement),
 * validation des réponses rédigées, sauvegarde / restauration / effacement, code d'accès.
 */
import { h, tabs, pct, relDays, richText, fill } from '../dom.js';
import {
  store, profileData, validateSubmission, exportBackup, importBackup, deleteProfile, wipeEverything,
  hasParentPin, setParentPin, checkParentPin, removeParentPin, loadDemoProfiles,
} from '../../app/store.js';
import { computeDashboard } from '../../engine/dashboard.js';
import { LEVELS as MASTERY, DAY } from '../../engine/mastery.js';
import { validateBackup } from '../../storage/backup.js';
import { ERROR_FAMILIES } from '../../core/errors.js';
import { KIND_UI } from './today.js';

let unlocked = false;

function chart(series) {
  const W = 640; const H = 200; const pad = { l: 40, r: 12, t: 12, b: 28 };
  const n = series.length;
  const x = (i) => pad.l + (i / (n - 1)) * (W - pad.l - pad.r);
  const y = (v) => H - pad.b - v * (H - pad.t - pad.b);
  const maxA = Math.max(1, ...series.map((s) => s.attempts));
  const bars = series.map((s, i) => s.attempts ? `<rect x="${x(i) - 4}" y="${H - pad.b - (s.attempts / maxA) * 50}" width="8" height="${(s.attempts / maxA) * 50}" fill="var(--rule-2)" rx="2"><title>${s.attempts} exercice(s)</title></rect>` : '').join('');
  const pts = series.map((s, i) => (s.avg === null ? null : `${x(i).toFixed(1)},${y(s.avg).toFixed(1)}`)).filter(Boolean);
  const grid = [0, 0.5, 1].map((v) => `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y(v)}" y2="${y(v)}" class="axis"/><text x="${pad.l - 6}" y="${y(v) + 4}" text-anchor="end">${v * 100} %</text>`).join('');
  const first = new Date(series[0].day * DAY).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  const last = new Date(series[n - 1].day * DAY).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  const wrap = h('figure', { style: { margin: 0 } });
  wrap.innerHTML = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Maîtrise moyenne des notions travaillées sur 30 jours">${grid}${bars}
    ${pts.length > 1 ? `<polyline class="line" points="${pts.join(' ')}" stroke="var(--classe)"/>` : ''}
    ${pts.length ? `<circle cx="${pts[pts.length - 1].split(',')[0]}" cy="${pts[pts.length - 1].split(',')[1]}" r="4" fill="var(--classe)"/>` : ''}
    <text x="${pad.l}" y="${H - 8}">${first}</text><text x="${W - pad.r}" y="${H - 8}" text-anchor="end">${last}</text></svg>
    <figcaption class="small muted">Ligne : maîtrise moyenne estimée des notions travaillées. Barres : nombre d’exercices par jour.</figcaption>`;
  return wrap;
}

function levelTag(level) {
  return h('span', { class: `level-tag skill-pill lvl-${level}` }, MASTERY[level].label);
}

function skillRow(x) {
  const lessons = store.index.lessons.filter((l) => l.skills.includes(x.id));
  return h('tr', {},
    h('td', {}, x.meta.label, x.meta.status !== 'programme' ? h('span', { class: `chip chip--status-${x.meta.status}`, style: { marginLeft: '6px' } }, x.meta.status === 'hors-programme' ? 'hors programme' : 'approfondissement') : null),
    h('td', {}, levelTag(x.level)),
    h('td', {}, h('div', { class: 'bar', title: pct(x.st.pL) }, h('i', { style: { width: pct(x.st.pL).replace(' ', '') } }))),
    h('td', { class: 'small' }, `${x.st.n} ex. · ${x.st.autonomousSuccesses} seul · ${x.st.delayedSuccesses} différée(s)`),
    h('td', { class: 'small' }, x.st.due ? relDays(x.st.due, store.now()) : '—'),
    h('td', {}, lessons[0] ? h('a', { href: `#/lecon/${lessons[0].id}`, class: 'small' }, 'leçon') : null));
}

function skillTable(list, empty) {
  if (!list.length) return h('p', { class: 'muted' }, empty);
  return h('div', { class: 'tbl-wrap' }, h('table', { class: 'skill-table' },
    h('thead', {}, h('tr', {}, ['Compétence', 'Niveau', 'Maîtrise estimée', 'Traces', 'Révision', ''].map((t) => h('th', { scope: 'col' }, t)))),
    h('tbody', {}, list.map(skillRow))));
}

async function dashboardFor(container, profileId) {
  try {
    await renderDashboard(container, profileId);
  } catch (e) {
    fill(container, h('p', { class: 'card warn' }, `Le tableau de bord de ce profil n'a pas pu être affiché (${e.message}). Ses données sont peut-être abîmées : vous pouvez l'exporter, ou l'effacer plus bas.`));
  }
}

async function renderDashboard(container, profileId) {
  const data = await profileData(profileId);
  if (!data) return;
  const now = store.now();
  const d = computeDashboard(store.index, data, now);
  const pending = data.submissions.filter((s) => s.status === 'en-attente');
  const p = data.profile;
  fill(container, 
    p.demo ? h('p', { class: 'demo-banner' }, h('strong', {}, `${p.pseudo} est un profil fictif. `), p.story || '', ' Son historique a été simulé par le moteur réel : ce tableau de bord est exactement celui que vous verriez.') : null,
    h('div', { class: 'kpis' },
      h('div', { class: 'kpi kpi--ok' }, h('b', {}, String(d.mastered.length)), h('span', {}, 'compétences maîtrisées')),
      h('div', { class: 'kpi kpi--ko' }, h('b', {}, String(d.fragile.length)), h('span', {}, 'compétences fragiles')),
      h('div', { class: 'kpi kpi--pending' }, h('b', {}, String(d.toReview.length)), h('span', {}, 'notions à revoir')),
      h('div', { class: 'kpi' }, h('b', {}, d.totals.autonomyRate === null ? '—' : pct(d.totals.autonomyRate)), h('span', {}, 'réussites sans aide')),
      h('div', { class: 'kpi' }, h('b', {}, String(d.totals.delayed)), h('span', {}, 'réussites différées (mémoire)')),
      h('div', { class: 'kpi kpi--expert' }, h('b', {}, `${d.advanced.approfondissement.ok + d.advanced.expert.ok}`), h('span', {}, 'réussites facultatives ◆ ✦'))),
    h('section', { class: 'card' }, h('h2', {}, 'Exercices recommandés, et pourquoi'),
      d.recos.length ? h('ul', { class: 'err-list' }, d.recos.slice(0, 8).map((r) => h('li', {}, h('span', { class: 'chip chip--role' }, `${(KIND_UI[r.kind] || {}).icon || ''} ${(KIND_UI[r.kind] || {}).label || r.kind}`), h('span', {}, h('strong', {}, r.title), h('br'), h('span', { class: 'small muted' }, r.reasonParent))))) : h('p', { class: 'muted' }, 'Pas encore assez de traces.')),
    h('div', { class: 'grid grid--2' },
      h('section', { class: 'card' }, h('h2', {}, 'Erreurs récurrentes'),
        d.recurring.length ? h('ul', { class: 'err-list' }, d.recurring.slice(0, 8).map((e) => h('li', {}, h('span', { class: 'chip chip--err' }, `${e.count}×`), h('span', {}, h('strong', {}, e.typeLabel), ` — ${e.label}`, e.misconception ? h('span', { class: 'small muted' }, ` (idée fausse : ${e.misconception.replace('mc:', '')})`) : null, e.resolved ? h('span', { class: 'small', style: { color: 'var(--ok)' } }, ' · résolue depuis (3 réussites)') : null)))) : h('p', { class: 'muted' }, 'Aucune erreur répétée.'),
        Object.keys(d.families).length ? h('p', { class: 'small muted' }, 'Répartition des erreurs : ', Object.entries(d.families).map(([f, n]) => `${ERROR_FAMILIES[f] || f} ${n}`).join(' · ')) : null),
      h('section', { class: 'card' }, h('h2', {}, 'Prérequis manquants'),
        d.missingPrereqs.length ? h('ul', {}, d.missingPrereqs.map((m) => h('li', {}, h('strong', {}, (store.index.skills.get(m.skill) || {}).label || m.skill), h('br'), h('span', { class: 'small muted' }, m.reason)))) : h('p', { class: 'muted' }, 'Aucun prérequis manquant détecté.'))),
    h('section', { class: 'card' }, h('h2', {}, 'Progrès dans le temps'), chart(d.series)),
    h('section', { class: 'card' }, h('h2', {}, 'Compétences fragiles et à revoir'), skillTable([...d.fragile, ...d.toReview.filter((x) => !d.fragile.includes(x))], 'Aucune compétence fragile.')),
    h('section', { class: 'card' }, h('h2', {}, 'Programme scolaire'), h('p', { class: 'small muted' }, 'Compétences du programme officiel de la classe, comparées uniquement à la propre progression de l’enfant.'), skillTable(d.programme, 'Rien de travaillé pour l’instant.')),
    h('section', { class: 'card' }, h('h2', {}, 'Contenus facultatifs (approfondissement, expert)'),
      h('p', { class: 'small' }, `Approfondissement : ${d.advanced.approfondissement.ok} réussite(s) sur ${d.advanced.approfondissement.n} · Expert : ${d.advanced.expert.ok} réussite(s) sur ${d.advanced.expert.n}. Ces résultats ne modifient pas la progression du programme.`),
      skillTable(d.optional, 'Aucune notion facultative travaillée.')),
    pending.length ? h('section', { class: 'card' }, h('h2', {}, `Réponses rédigées à valider (${pending.length})`), ...pending.map((s) => pendingItem(s, () => dashboardFor(container, profileId)))) : null);
}

function pendingItem(sub, refresh) {
  const last = sub.versions[sub.versions.length - 1];
  const text = last.response && (last.response.text || last.response.justification || (last.response.parts || []).map((x) => x.text || x.justification).filter(Boolean).join('\n\n')) || '(réponse non textuelle)';
  const comment = h('textarea', { class: 'field-textarea small', rows: 2, placeholder: 'Commentaire pour l’enfant (facultatif)' });
  const checks = last.selfCheck ? Object.entries(last.selfCheck).filter(([, v]) => v).length : null;
  return h('div', { class: 'pending-item' },
    h('div', { class: 'small muted' }, `${(store.index.skills.get(sub.skill) || {}).label || sub.skill} · version ${sub.versions.length} · ${new Date(last.ts).toLocaleString('fr-FR')}`),
    richText(sub.prompt || ''),
    h('blockquote', {}, text),
    checks !== null ? h('p', { class: 'small' }, `Auto-évaluation : ${checks} critère(s) coché(s) par l’enfant.`) : null,
    comment,
    h('div', { class: 'btn-row' },
      h('button', { class: 'btn btn--primary btn--small', onclick: async () => { await validateSubmission(sub.id, 'valide', comment.value); refresh(); } }, 'Valider'),
      h('button', { class: 'btn btn--ghost btn--small', onclick: async () => { await validateSubmission(sub.id, 'a-retravailler', comment.value); refresh(); } }, 'À retravailler'),
      sub.lessonId ? h('a', { class: 'btn btn--quiet btn--small', href: `#/lecon/${sub.lessonId}` }, 'Voir la leçon et les exemples de bonnes réponses') : null));
}

function download(name, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 1)], { type: 'application/json' });
  const a = h('a', { href: URL.createObjectURL(blob), download: name });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

function dataSection(rerender) {
  const msg = h('p', { 'aria-live': 'polite', class: 'small' });
  const importZone = h('div', {});
  const fileInput = h('input', { type: 'file', class: 'sr-only', accept: 'application/json,.json', 'aria-label': 'Fichier de sauvegarde', onchange: async (e) => {
    const f = e.target.files[0]; if (!f) return;
    let obj;
    try { obj = JSON.parse(await f.text()); } catch { msg.textContent = 'Fichier illisible (JSON attendu).'; return; }
    const v = validateBackup(obj);
    if (!v.profiles.length) { msg.textContent = v.errors.join(' '); return; }
    const choices = {};
    fill(importZone, h('p', {}, `${v.profiles.length} profil(s) trouvé(s).${v.errors.length ? ' Avertissements : ' + v.errors.join(' ') : ''}`),
      ...v.profiles.map((p) => {
        const exists = store.profiles.some((x) => x.id === p.profile.id);
        choices[p.profile.id] = exists ? 'copie' : 'remplacer';
        return h('label', { class: 'field' }, h('span', {}, `${p.profile.pseudo} (${p.profile.level}, ${p.attempts.length} exercices)${exists ? ' — existe déjà ici' : ''}`),
          h('select', { class: 'field-input', onchange: (ev) => { choices[p.profile.id] = ev.target.value; } },
            h('option', { value: exists ? 'copie' : 'remplacer' }, exists ? 'Restaurer comme copie' : 'Restaurer'),
            exists ? h('option', { value: 'remplacer' }, 'Remplacer le profil existant') : null,
            h('option', { value: 'ignorer' }, 'Ignorer')));
      }),
      h('button', { class: 'btn btn--primary btn--small', onclick: async () => { const r = await importBackup(obj, choices); msg.textContent = `Restauré : ${r.restored.join(', ') || 'rien'}.`; importZone.replaceChildren(); rerender(); } }, 'Restaurer la sélection'));
  } });
  return h('section', { class: 'card' },
    h('h2', {}, 'Données et vie privée'),
    h('p', {}, 'Toutes les données restent dans ce navigateur, sur cet ordinateur. Aucune IA distante n’est utilisée dans cette version : toutes les corrections sont faites localement, et les réponses rédigées ne quittent jamais l’appareil. Si une correction par IA distante était ajoutée un jour, elle serait désactivée par défaut et demanderait votre accord explicite ici.'),
    h('div', { class: 'btn-row' },
      h('button', { class: 'btn btn--small', onclick: async () => { const b = await exportBackup(store.profiles.map((p) => p.id)); download(`prisme-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`, b); msg.textContent = 'Sauvegarde téléchargée (tous les profils).'; } }, 'Exporter une sauvegarde'),
      h('label', { class: 'btn btn--ghost btn--small' }, 'Restaurer une sauvegarde…', fileInput)),
    importZone,
    h('h3', { style: { marginTop: '18px' } }, 'Effacer'),
    h('div', { class: 'btn-row' },
      ...store.profiles.map((p) => h('button', { class: 'btn btn--danger btn--small', onclick: async () => { if (confirm(`Effacer définitivement le profil « ${p.pseudo} » et tout son historique ?`)) { await deleteProfile(p.id); rerender(); } } }, `Effacer « ${p.pseudo} »`)),
      h('button', { class: 'btn btn--danger btn--small', onclick: async () => { if (confirm('Effacer TOUTES les données de Prisme sur cet appareil ?')) { await wipeEverything(); unlocked = false; location.hash = '#/profils'; } } }, 'Tout effacer')),
    msg);
}

async function pinSection(rerender) {
  const has = await hasParentPin();
  const input = h('input', { class: 'field-input', type: 'password', inputmode: 'numeric', autocomplete: 'new-password', maxlength: 8, style: { maxWidth: '160px' }, 'aria-label': 'Nouveau code parent' });
  const msg = h('span', { class: 'small', 'aria-live': 'polite' });
  return h('section', { class: 'card' }, h('h2', {}, 'Code parent'),
    h('p', { class: 'small muted' }, 'Le code évite qu’un enfant ouvre l’espace parents par erreur. Il ne chiffre pas les données (elles restent lisibles par quelqu’un qui a accès à l’ordinateur).'),
    h('div', { class: 'btn-row' }, input,
      h('button', { class: 'btn btn--small', onclick: async () => { try { await setParentPin(input.value); msg.textContent = 'Code enregistré.'; input.value = ''; } catch (e) { msg.textContent = e.message; } } }, has ? 'Changer le code' : 'Définir un code'),
      has ? h('button', { class: 'btn btn--ghost btn--small', onclick: async () => { await removeParentPin(); rerender(); } }, 'Supprimer le code') : null, msg));
}

export async function render(root) {
  const rerender = () => { if (!root.isConnected) return; root.replaceChildren(); render(root); };
  if (!unlocked && await hasParentPin()) {
    const input = h('input', { class: 'field-input', type: 'password', inputmode: 'numeric', autocomplete: 'off', maxlength: 8, 'aria-label': 'Code parent' });
    const msg = h('p', { class: 'warn', 'aria-live': 'assertive' });
    root.append(h('form', { class: 'card', style: { maxWidth: '420px' }, onsubmit: async (e) => { e.preventDefault(); if (await checkParentPin(input.value)) { unlocked = true; rerender(); } else { msg.textContent = 'Code incorrect.'; input.value = ''; } } },
      h('h1', {}, 'Espace parents'), h('label', { class: 'field-label' }, 'Code parent'), input, msg, h('button', { class: 'btn btn--primary', type: 'submit' }, 'Entrer')));
    input.focus();
    return relock;
  }
  root.append(h('div', { class: 'page-head' }, h('div', {}, h('p', { class: 'eyebrow' }, 'Espace parents'), h('h1', {}, 'Tableau de bord pédagogique'),
    h('p', { class: 'lede' }, 'Un enfant à la fois, comparé uniquement à lui-même : ce qui est maîtrisé, ce qui est fragile, les erreurs qui reviennent, et ce que Prisme propose ensuite.'))));
  if (!store.profiles.length) {
    root.append(h('div', { class: 'card' }, h('p', {}, 'Aucun profil sur cet appareil.'), h('div', { class: 'btn-row' }, h('a', { class: 'btn', href: '#/profils' }, 'Créer un profil'), h('button', { class: 'btn btn--ghost', onclick: async () => { await loadDemoProfiles(); rerender(); } }, 'Charger les profils fictifs'))));
  } else {
    let current = (store.profile && store.profile.id) || store.profiles[0].id;
    const dash = h('div', { class: 'dash' });
    const tabBar = h('div', {});
    const drawTabs = () => tabBar.replaceChildren(tabs(store.profiles.map((p) => ({ id: p.id, label: `${p.pseudo}${p.demo ? ' (fictif)' : ''}`, icon: p.symbol })), current, (id) => { current = id; drawTabs(); dashboardFor(dash, id); }, 'Profils'));
    drawTabs();
    root.append(tabBar, dash);
    await dashboardFor(dash, current);
  }
  root.append(h('div', { class: 'grid', style: { marginTop: '24px' } }, dataSection(rerender), await pinSection(rerender)));
  return relock;
}

/** En quittant l'espace parents, le code est redemandé à la prochaine visite. */
function relock() { unlocked = false; }
