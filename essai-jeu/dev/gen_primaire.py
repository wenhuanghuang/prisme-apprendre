#!/usr/bin/env python3
"""Fabrique les générateurs de données du primaire (content/generators/p-*.json), leurs notions et leurs entrées d'index.
Les conjugaisons régulières sont calculées ; les verbes irréguliers sont écrits à la main."""
import json, sys, os

OUT = sys.argv[1]  # dossier de l'application (live)
GEN_DIR = os.path.join(OUT, 'content', 'generators')
TRACKS = ['classe', 'approfondissement', 'expert']
gens = []
skills = []

def skill(sid, subject, label, level):
    skills.append({'subject': subject, 'id': sid, 'label': label, 'level': level, 'track': 'classe', 'status': 'programme', 'domain': 'primaire', 'prereqs': [], 'editorialLevel': True})

def add(g):
    gens.append(g)

PRON = ["je (j')", 'tu', 'il / elle / on', 'nous', 'vous', 'ils / elles']

def er(stem):
    """Verbe du 1er groupe régulier (chanter, jouer, parler…)."""
    inf = stem + 'er'
    return {
        'present': [stem + 'e', stem + 'es', stem + 'e', stem + 'ons', stem + 'ez', stem + 'ent'],
        'imparfait': [stem + 'ais', stem + 'ais', stem + 'ait', stem + 'ions', stem + 'iez', stem + 'aient'],
        'futur': [inf + 'ai', inf + 'as', inf + 'a', inf + 'ons', inf + 'ez', inf + 'ont'],
        'passe-compose': [f'{a} {stem}é' for a in ['ai', 'as', 'a', 'avons', 'avez', 'ont']],
        'passe-simple': [stem + 'ai', stem + 'as', stem + 'a', stem + 'âmes', stem + 'âtes', stem + 'èrent'],
        'plus-que-parfait': [f'{a} {stem}é' for a in ['avais', 'avais', 'avait', 'avions', 'aviez', 'avaient']],
    }

def avoir_pc(pp):
    return [f'{a} {pp}' for a in ['ai', 'as', 'a', 'avons', 'avez', 'ont']]
def avoir_pqp(pp):
    return [f'{a} {pp}' for a in ['avais', 'avais', 'avait', 'avions', 'aviez', 'avaient']]
def etre_pc(pp, aux=('suis', 'es', 'est', 'sommes', 'êtes', 'sont')):
    out = []
    for i, a in enumerate(aux):
        if i < 3: out.append(f'{a} {pp}|{a} {pp}e')
        elif i == 4: out.append(f'{a} {pp}s|{a} {pp}es|{a} {pp}|{a} {pp}e')
        else: out.append(f'{a} {pp}s|{a} {pp}es')
    return out

V = {
    'être': {
        'present': ['suis', 'es', 'est', 'sommes', 'êtes', 'sont'],
        'imparfait': ['étais', 'étais', 'était', 'étions', 'étiez', 'étaient'],
        'futur': ['serai', 'seras', 'sera', 'serons', 'serez', 'seront'],
        'passe-compose': avoir_pc('été'), 'passe-simple': ['fus', 'fus', 'fut', 'fûmes', 'fûtes', 'furent'], 'plus-que-parfait': avoir_pqp('été'),
    },
    'avoir': {
        'present': ['ai', 'as', 'a', 'avons', 'avez', 'ont'],
        'imparfait': ['avais', 'avais', 'avait', 'avions', 'aviez', 'avaient'],
        'futur': ['aurai', 'auras', 'aura', 'aurons', 'aurez', 'auront'],
        'passe-compose': avoir_pc('eu'), 'passe-simple': ['eus', 'eus', 'eut', 'eûmes', 'eûtes', 'eurent'], 'plus-que-parfait': avoir_pqp('eu'),
    },
    'aller': {
        'present': ['vais', 'vas', 'va', 'allons', 'allez', 'vont'],
        'imparfait': ['allais', 'allais', 'allait', 'allions', 'alliez', 'allaient'],
        'futur': ['irai', 'iras', 'ira', 'irons', 'irez', 'iront'],
        'passe-compose': etre_pc('allé'), 'passe-simple': ['allai', 'allas', 'alla', 'allâmes', 'allâtes', 'allèrent'],
        'plus-que-parfait': etre_pc('allé', ('étais', 'étais', 'était', 'étions', 'étiez', 'étaient')),
    },
    'faire': {
        'present': ['fais', 'fais', 'fait', 'faisons', 'faites', 'font'],
        'imparfait': ['faisais', 'faisais', 'faisait', 'faisions', 'faisiez', 'faisaient'],
        'futur': ['ferai', 'feras', 'fera', 'ferons', 'ferez', 'feront'],
        'passe-compose': avoir_pc('fait'), 'passe-simple': ['fis', 'fis', 'fit', 'fîmes', 'fîtes', 'firent'], 'plus-que-parfait': avoir_pqp('fait'),
    },
    'dire': {
        'present': ['dis', 'dis', 'dit', 'disons', 'dites', 'disent'],
        'imparfait': ['disais', 'disais', 'disait', 'disions', 'disiez', 'disaient'],
        'futur': ['dirai', 'diras', 'dira', 'dirons', 'direz', 'diront'],
        'passe-compose': avoir_pc('dit'), 'passe-simple': ['dis', 'dis', 'dit', 'dîmes', 'dîtes', 'dirent'], 'plus-que-parfait': avoir_pqp('dit'),
    },
    'venir': {
        'present': ['viens', 'viens', 'vient', 'venons', 'venez', 'viennent'],
        'imparfait': ['venais', 'venais', 'venait', 'venions', 'veniez', 'venaient'],
        'futur': ['viendrai', 'viendras', 'viendra', 'viendrons', 'viendrez', 'viendront'],
        'passe-compose': etre_pc('venu'), 'passe-simple': ['vins', 'vins', 'vint', 'vînmes', 'vîntes', 'vinrent'],
        'plus-que-parfait': etre_pc('venu', ('étais', 'étais', 'était', 'étions', 'étiez', 'étaient')),
    },
    'prendre': {
        'present': ['prends', 'prends', 'prend', 'prenons', 'prenez', 'prennent'],
        'imparfait': ['prenais', 'prenais', 'prenait', 'prenions', 'preniez', 'prenaient'],
        'futur': ['prendrai', 'prendras', 'prendra', 'prendrons', 'prendrez', 'prendront'],
        'passe-compose': avoir_pc('pris'), 'passe-simple': ['pris', 'pris', 'prit', 'prîmes', 'prîtes', 'prirent'], 'plus-que-parfait': avoir_pqp('pris'),
    },
    'pouvoir': {
        'present': ['peux', 'peux', 'peut', 'pouvons', 'pouvez', 'peuvent'],
        'imparfait': ['pouvais', 'pouvais', 'pouvait', 'pouvions', 'pouviez', 'pouvaient'],
        'futur': ['pourrai', 'pourras', 'pourra', 'pourrons', 'pourrez', 'pourront'],
        'passe-compose': avoir_pc('pu'), 'passe-simple': ['pus', 'pus', 'put', 'pûmes', 'pûtes', 'purent'], 'plus-que-parfait': avoir_pqp('pu'),
    },
    'voir': {
        'present': ['vois', 'vois', 'voit', 'voyons', 'voyez', 'voient'],
        'imparfait': ['voyais', 'voyais', 'voyait', 'voyions', 'voyiez', 'voyaient'],
        'futur': ['verrai', 'verras', 'verra', 'verrons', 'verrez', 'verront'],
        'passe-compose': avoir_pc('vu'), 'passe-simple': ['vis', 'vis', 'vit', 'vîmes', 'vîtes', 'virent'], 'plus-que-parfait': avoir_pqp('vu'),
    },
    'vouloir': {
        'present': ['veux', 'veux', 'veut', 'voulons', 'voulez', 'veulent'],
        'imparfait': ['voulais', 'voulais', 'voulait', 'voulions', 'vouliez', 'voulaient'],
        'futur': ['voudrai', 'voudras', 'voudra', 'voudrons', 'voudrez', 'voudront'],
        'passe-compose': avoir_pc('voulu'), 'passe-simple': ['voulus', 'voulus', 'voulut', 'voulûmes', 'voulûtes', 'voulurent'], 'plus-que-parfait': avoir_pqp('voulu'),
    },
    'finir': {
        'present': ['finis', 'finis', 'finit', 'finissons', 'finissez', 'finissent'],
        'imparfait': ['finissais', 'finissais', 'finissait', 'finissions', 'finissiez', 'finissaient'],
        'futur': ['finirai', 'finiras', 'finira', 'finirons', 'finirez', 'finiront'],
        'passe-compose': avoir_pc('fini'), 'passe-simple': ['finis', 'finis', 'finit', 'finîmes', 'finîtes', 'finirent'], 'plus-que-parfait': avoir_pqp('fini'),
    },
}
for stem in ['chant', 'jou', 'parl', 'march', 'aim', 'regard', 'dans', 'trouv']:
    V[stem + 'er'] = er(stem)

TENSES = {'present': 'présent', 'imparfait': 'imparfait', 'futur': 'futur', 'passe-compose': 'passé composé', 'passe-simple': 'passé simple', 'plus-que-parfait': 'plus-que-parfait'}
HINTS = {
    'present': 'Présent : les verbes en -er se terminent par -e, -es, -e, -ons, -ez, -ent. Être, avoir, aller, faire… sont à connaître par cœur.',
    'imparfait': 'Imparfait : toujours -ais, -ais, -ait, -ions, -iez, -aient.',
    'futur': 'Futur : -ai, -as, -a, -ons, -ez, -ont, ajoutés le plus souvent à l’infinitif (chanter → je chanterai).',
    'passe-compose': 'Passé composé : l’auxiliaire avoir ou être au présent, puis le participe passé (j’ai chanté, je suis allé).',
    'passe-simple': 'Passé simple : verbes en -er : -ai, -as, -a, -âmes, -âtes, -èrent ; beaucoup d’autres : -is, -is, -it… ou -us, -us, -ut…',
    'plus-que-parfait': 'Plus-que-parfait : l’auxiliaire avoir ou être à l’imparfait, puis le participe passé (j’avais chanté, j’étais allé).',
}

def conj(gid, label, levels, verbs, tenses, chapters, desc):
    sid = f'fp.conjugaison.{gid.split("-")[-1]}'
    skill(sid, 'francais', f'Conjuguer les verbes usuels ({", ".join(TENSES[t] for t in tenses)})', levels[0])
    add({'id': gid, 'label': label, 'description': desc, 'subject': 'francais', 'levels': levels, 'skill': sid, 'kind': 'conjugaison',
         'chapters': chapters,
         'options': [{'id': 'tense', 'label': 'Temps', 'values': [{'id': 'tous', 'label': 'Tous les temps'}] + [{'id': t, 'label': TENSES[t].capitalize()} for t in tenses]}],
         'data': {'pronouns': PRON, 'tenses': {t: TENSES[t] for t in tenses}, 'hints': {t: HINTS[t] for t in tenses},
                  'verbs': {v: {'forms': {t: V[v][t] for t in tenses}} for v in verbs}}})

conj('fr-p-conj-cp', 'Être et avoir au présent', ['cp'], ['être', 'avoir'], ['present'], ['cp-f-sujet-verbe'],
     'Les verbes être et avoir au présent, à toutes les personnes.')
conj('fr-p-conj-ce1', 'Conjugaison : présent, imparfait, futur, passé composé (être, avoir, aller, verbes en -er)', ['ce1'],
     ['être', 'avoir', 'aller', 'chanter', 'jouer', 'parler', 'marcher', 'aimer'], ['present', 'imparfait', 'futur', 'passe-compose'],
     ['ce1-f-present', 'ce1-f-radical', 'ce1-f-imparfait-futur', 'ce1-f-passe-compose'],
     'Une forme à écrire ; une confusion de temps ou de personne est expliquée.')
conj('fr-p-conj-ce2', 'Conjugaison : les verbes du 3e groupe au présent, à l’imparfait, au futur, au passé composé', ['ce2', 'cm1'],
     ['être', 'avoir', 'aller', 'faire', 'dire', 'venir', 'prendre', 'pouvoir', 'voir', 'vouloir', 'finir', 'chanter', 'regarder', 'danser'],
     ['present', 'imparfait', 'futur', 'passe-compose'],
     ['ce2-f-present', 'ce2-f-radical', 'ce2-f-imparfait-futur', 'ce2-f-passe-compose', 'cm1-f-present', 'cm1-f-imparfait-futur', 'cm1-f-passe-compose'],
     'Quatorze verbes usuels des trois groupes ; les confusions de temps et de personne sont expliquées.')
conj('fr-p-conj-cm2', 'Conjugaison : passé simple, plus-que-parfait et temps usuels', ['cm2'],
     ['être', 'avoir', 'aller', 'faire', 'dire', 'venir', 'prendre', 'pouvoir', 'voir', 'vouloir', 'finir', 'chanter', 'trouver'],
     ['present', 'imparfait', 'futur', 'passe-compose', 'passe-simple', 'plus-que-parfait'],
     ['cm2-f-verbe', 'cm2-f-passe-simple', 'cm2-f-temps-composes'],
     'Le passé simple et le plus-que-parfait, avec les temps déjà connus : chaque confusion est expliquée.')

# ---------------- Homophones ----------------
def mc(answer, mid, feedback):
    return {'answer': answer, 'id': mid, 'error': 'notion', 'feedback': feedback}
H = []
def hom(sentence, good, bad, mid, fb, hint, rule):
    H.append({'sentence': sentence, 'accept': [good], 'misconceptions': [mc(b, mid, fb) for b in bad], 'hint': hint, 'rule': rule})
A_HINT = 'Remplace par « avait » : si la phrase garde un sens, écris « a ».'
hom('Léa ___ un nouveau vélo. (a / à)', 'a', ['à'], 'mc:homophone-a-a', '« Léa avait un nouveau vélo » : c’est le verbe avoir.', A_HINT, 'a = verbe avoir (avait).')
hom('Nous allons ___ la piscine. (a / à)', 'à', ['a'], 'mc:homophone-a-a', '« Nous allons avait la piscine » ne veut rien dire : c’est « à ».', A_HINT, 'à = petit mot qui ne change pas (préposition).')
hom('Mon chat ___ faim. (a / à)', 'a', ['à'], 'mc:homophone-a-a', '« Mon chat avait faim » : c’est le verbe avoir.', A_HINT, 'a = verbe avoir (avait).')
hom('Il habite ___ côté de l’école. (a / à)', 'à', ['a'], 'mc:homophone-a-a', 'On ne peut pas dire « avait côté » : c’est « à ».', A_HINT, 'à = préposition.')
E_HINT = 'Remplace par « était » : si la phrase garde un sens, écris « est ».'
hom('Le ciel ___ tout bleu. (et / est)', 'est', ['et'], 'mc:homophone-et-est', '« Le ciel était tout bleu » : c’est le verbe être.', E_HINT, 'est = verbe être (était).')
hom('J’ai un frère ___ une sœur. (et / est)', 'et', ['est'], 'mc:homophone-et-est', '« un frère était une sœur » ne veut rien dire : « et » relie deux mots, on peut dire « et puis ».', E_HINT, 'et = et puis (il relie).')
hom('Ma tante ___ vétérinaire. (et / est)', 'est', ['et'], 'mc:homophone-et-est', '« Ma tante était vétérinaire » : c’est le verbe être.', E_HINT, 'est = verbe être (était).')
hom('Il mange une pomme ___ une banane. (et / est)', 'et', ['est'], 'mc:homophone-et-est', 'On peut dire « et puis une banane » : c’est « et ».', E_HINT, 'et = et puis.')
S_HINT = 'Remplace par « étaient » : si la phrase garde un sens, écris « sont » ; sinon, par « mon » ou « ton » : c’est « son ».'
hom('Les enfants ___ dans la cour. (son / sont)', 'sont', ['son'], 'mc:homophone-son-sont', '« Les enfants étaient dans la cour » : c’est le verbe être.', S_HINT, 'sont = verbe être (étaient).')
hom('Tom a perdu ___ écharpe. (son / sont)', 'son', ['sont'], 'mc:homophone-son-sont', 'On peut dire « mon écharpe » : c’est « son », un déterminant.', S_HINT, 'son = mon, ton (déterminant).')
hom('Mes cousins ___ très gentils. (son / sont)', 'sont', ['son'], 'mc:homophone-son-sont', '« Mes cousins étaient très gentils » : c’est le verbe être.', S_HINT, 'sont = étaient.')
hom('Elle range ___ cartable. (son / sont)', 'son', ['sont'], 'mc:homophone-son-sont', '« Elle range mon cartable » fonctionne : c’est « son ».', S_HINT, 'son = mon, ton.')
O_HINT = 'Remplace par « avaient » : si ça marche, écris « ont » ; si l’on peut dire « il », écris « on ».'
hom('Mes parents ___ une voiture rouge. (on / ont)', 'ont', ['on'], 'mc:homophone-on-ont', '« Mes parents avaient une voiture rouge » : c’est le verbe avoir.', O_HINT, 'ont = avaient.')
hom('___ part en promenade cet après-midi. (On / Ont)', 'On', ['Ont'], 'mc:homophone-on-ont', '« Il part en promenade » fonctionne : c’est « on », qui remplace une ou plusieurs personnes.', O_HINT, 'on = il (pronom).')
hom('Les élèves ___ fini leurs exercices. (on / ont)', 'ont', ['on'], 'mc:homophone-on-ont', '« Les élèves avaient fini » : c’est le verbe avoir.', O_HINT, 'ont = avaient.')
hom('Le soir, ___ regarde les étoiles. (on / ont)', 'on', ['ont'], 'mc:homophone-on-ont', '« Le soir, il regarde les étoiles » : c’est « on ».', O_HINT, 'on = il.')
C_HINT = '« ses » : les siens, à lui ou à elle (son, sa → ses). « ces » : ceux-là, que l’on montre (ce, cette → ces).'
hom('Lina prête ___ crayons à son voisin. (ces / ses)', 'ses', ['ces'], 'mc:homophone-ces-ses', 'Ce sont les crayons de Lina (les siens) : au singulier, ce serait « son crayon ».', C_HINT, 'ses = les siens.')
hom('Regarde ___ beaux nuages là-bas ! (ces / ses)', 'ces', ['ses'], 'mc:homophone-ces-ses', 'On montre les nuages : au singulier, ce serait « ce nuage ».', C_HINT, 'ces = ceux-là.')
hom('Le chien ronge ___ os. (ces / ses)', 'ses', ['ces'], 'mc:homophone-ces-ses', 'Ce sont les os du chien : au singulier, « son os ».', C_HINT, 'ses = les siens.')
OU_HINT = '« où » indique un lieu ou un moment ; « ou » veut dire « ou bien ».'
hom('Veux-tu de l’eau ___ du jus ? (ou / où)', 'ou', ['où'], 'mc:homophone-ou-ou', 'On peut dire « ou bien du jus » : c’est « ou », sans accent.', OU_HINT, 'ou = ou bien.')
hom('___ as-tu rangé tes chaussures ? (Ou / Où)', 'Où', ['Ou'], 'mc:homophone-ou-ou', 'La question porte sur un lieu : c’est « où », avec un accent.', OU_HINT, 'où = le lieu.')
hom('La maison ___ j’habite est près du parc. (ou / où)', 'où', ['ou'], 'mc:homophone-ou-ou', '« où » désigne le lieu où l’on habite.', OU_HINT, 'où = le lieu.')
hom('Tu prends le bus ___ le vélo ? (ou / où)', 'ou', ['où'], 'mc:homophone-ou-ou', 'On peut dire « ou bien le vélo » : c’est « ou ».', OU_HINT, 'ou = ou bien.')
skill('fp.homophones', 'francais', 'Choisir le bon homophone : a/à, et/est, son/sont, on/ont, ces/ses, ou/où', 'ce2')
add({'id': 'fr-p-homophones', 'label': 'Homophones : a/à, et/est, son/sont, on/ont, ces/ses, ou/où', 'subject': 'francais', 'levels': ['ce2', 'cm1', 'cm2'],
     'skill': 'fp.homophones', 'kind': 'cloze', 'chapters': ['ce2-f-orthographe', 'ce2-f-dictee', 'cm1-f-nature', 'cm2-f-nature'],
     'description': 'Une phrase à compléter ; chaque confusion est expliquée avec le test de remplacement.',
     'data': {'prompt': 'Complète avec le bon mot :', 'hint': 'Essaie de remplacer le mot : avait, était, étaient, avaient, mon, il, ou bien…', 'items': H}})

# ---------------- Pluriels ----------------
P = []
def plur(sing, pl, art_s='un', wrong=None, mid='mc:pluriel', fb=None, rule=None):
    item = {'sentence': f'{art_s[0].upper()}{art_s[1:]} {sing}, des ___.', 'accept': [pl], 'misconceptions': [], 'hint': rule or 'Au pluriel, on ajoute le plus souvent un -s.', 'rule': rule or 'pluriel en -s'}
    if wrong and wrong != pl: item['misconceptions'].append(mc(wrong, mid, fb or f'Ce mot fait son pluriel autrement : des {pl}.'))
    P.append(item)
AL = 'Les noms en -al font leur pluriel en -aux (un cheval, des chevaux), sauf quelques-uns : bal, carnaval, festival, chacal, récital, régal.'
for s_, p_ in [('cheval', 'chevaux'), ('journal', 'journaux'), ('animal', 'animaux'), ('hôpital', 'hôpitaux'), ('canal', 'canaux')]:
    plur(s_, p_, 'un', s_ + 's', 'mc:pluriel-al', f'Les noms en -al font leur pluriel en -aux : des {p_}.', AL)
plur('festival', 'festivals', 'un', 'festivaux', 'mc:pluriel-al-exception', '« festival » fait partie des exceptions : des festivals.', AL)
plur('bal', 'bals', 'un', 'baux', 'mc:pluriel-al-exception', '« bal » fait partie des exceptions : des bals.', AL)
OU = 'Les noms en -ou prennent un -s, sauf sept qui prennent un -x : bijou, caillou, chou, genou, hibou, joujou, pou.'
for s_ in ['bijou', 'caillou', 'chou', 'genou', 'hibou', 'pou']:
    plur(s_, s_ + 'x', 'un', s_ + 's', 'mc:pluriel-ou', f'« {s_} » fait partie des sept noms en -ou qui prennent un -x.', OU)
for s_ in ['clou', 'trou', 'kangourou', 'sou']:
    plur(s_, s_ + 's', 'un', s_ + 'x', 'mc:pluriel-ou', f'« {s_} » n’est pas un des sept noms en -oux : il prend un -s.', OU)
EAU = 'Les noms en -eau, -au et -eu prennent un -x (sauf landau, sarrau, bleu, pneu).'
for s_, a in [('bateau', 'un'), ('château', 'un'), ('oiseau', 'un'), ('gâteau', 'un'), ('jeu', 'un'), ('cheveu', 'un'), ('tuyau', 'un'), ('feu', 'un')]:
    plur(s_, s_ + 'x', a, s_ + 's', 'mc:pluriel-eau', f'Les noms en -eau, -au, -eu prennent un -x : des {s_}x.', EAU)
plur('pneu', 'pneus', 'un', 'pneux', 'mc:pluriel-eau', '« pneu » est une exception : il prend un -s.', EAU)
SXZ = 'Un nom terminé par -s, -x ou -z ne change pas au pluriel.'
for s_, a in [('souris', 'une'), ('noix', 'une'), ('nez', 'un'), ('prix', 'un'), ('bras', 'un')]:
    plur(s_, s_, a, None, rule=SXZ)
plur('œil', 'yeux', 'un', 'œils', 'mc:pluriel-irregulier', '« œil » a un pluriel très irrégulier : des yeux.', 'Quelques pluriels sont à connaître par cœur : un œil, des yeux ; un travail, des travaux.')
plur('travail', 'travaux', 'un', 'travails', 'mc:pluriel-irregulier', '« travail » fait son pluriel en -aux : des travaux.', 'Quelques noms en -ail font -aux : travail, corail, émail, vitrail.')
skill('fp.pluriel', 'francais', 'Écrire le pluriel des noms (-s, -x, -aux, noms invariables)', 'ce1')
add({'id': 'fr-p-pluriel', 'label': 'Le pluriel des noms', 'subject': 'francais', 'levels': ['ce1', 'ce2', 'cm1', 'cm2'], 'skill': 'fp.pluriel', 'kind': 'cloze',
     'chapters': ['ce1-f-gn', 'ce2-f-gn', 'cm1-f-gn', 'cm2-f-gn', 'ce1-f-orthographe', 'ce2-f-dictee'],
     'description': 'Des noms à mettre au pluriel : -s, -x, -aux, et les exceptions à retenir.',
     'data': {'prompt': 'Écris le nom au pluriel :', 'hint': 'Au pluriel, on ajoute le plus souvent un -s ; certaines familles de mots prennent un -x.', 'items': P}})

PCP = []
for s_, a in [('chat', 'un'), ('fleur', 'une'), ('ami', 'un'), ('livre', 'un'), ('table', 'une'), ('pomme', 'une'), ('lapin', 'un'), ('voiture', 'une'), ('arbre', 'un'), ('maison', 'une'), ('crayon', 'un'), ('étoile', 'une')]:
    PCP.append({'sentence': f'{a[0].upper()}{a[1:]} {s_}, des ___.', 'accept': [s_ + 's'], 'misconceptions': [mc(s_, 'mc:pluriel-s', 'Avec « des », le nom est au pluriel : on ajoute un -s (qu’on n’entend pas).')], 'hint': 'Avec « des », on ajoute un -s à la fin du nom.', 'rule': 'pluriel : -s'})
skill('fp.pluriel-cp', 'francais', 'Singulier et pluriel : le -s du pluriel', 'cp')
add({'id': 'fr-p-pluriel-cp', 'label': 'Singulier, pluriel : le -s qu’on n’entend pas', 'subject': 'francais', 'levels': ['cp'], 'skill': 'fp.pluriel-cp', 'kind': 'cloze',
     'chapters': ['cp-f-genre-nombre', 'cp-f-orthographe'], 'description': 'Un nom à écrire au pluriel, après « des ».',
     'data': {'prompt': 'Écris le mot au pluriel :', 'hint': 'Au pluriel, on ajoute un -s.', 'items': PCP}})

# ---------------- Féminins ----------------
F = []
def fem(masc, femi, wrong, fb, rule, kind='nom'):
    if kind == 'nom': sentence = f'Un {masc}, une ___.'
    else: sentence = f'Un garçon {masc}, une fille ___.'
    F.append({'sentence': sentence, 'accept': [femi], 'misconceptions': [mc(w, 'mc:feminin', fb) for w in wrong if w != femi], 'hint': rule, 'rule': rule})
fem('boulanger', 'boulangère', ['boulangere', 'boulangeuse'], 'Les noms en -er font leur féminin en -ère (avec un accent grave).', '-er → -ère')
fem('chanteur', 'chanteuse', ['chanteure', 'chantrice'], 'Ici, -eur devient -euse : une chanteuse.', '-eur → -euse (chanteur, danseur, vendeur)')
fem('acteur', 'actrice', ['acteuse', 'acteure'], 'Les noms en -teur font souvent -trice : une actrice.', '-teur → -trice (acteur, directeur, agriculteur)')
fem('directeur', 'directrice', ['directeuse'], 'Les noms en -teur font souvent -trice : une directrice.', '-teur → -trice')
fem('lion', 'lionne', ['lione'], 'Les noms en -on doublent le n : une lionne.', '-on → -onne')
fem('chat', 'chatte', ['chate'], 'On double le t : une chatte.', 'chat → chatte')
fem('cousin', 'cousine', ['cousinne'], 'On ajoute simplement un -e : une cousine.', 'on ajoute -e')
fem('loup', 'louve', ['loupe'], 'Le féminin de loup est louve.', 'loup → louve (à connaître)')
fem('gentil', 'gentille', ['gentile'], 'On double le l : gentille.', '-il → -ille', 'adj')
fem('heureux', 'heureuse', ['heureuxe', 'heureusse'], 'Les adjectifs en -eux font -euse : heureuse.', '-eux → -euse', 'adj')
fem('sportif', 'sportive', ['sportife'], 'Les adjectifs en -if font -ive : sportive.', '-if → -ive', 'adj')
fem('blanc', 'blanche', ['blance'], 'Le féminin de blanc est blanche.', 'blanc → blanche (à connaître)', 'adj')
fem('gros', 'grosse', ['grose'], 'On double le s : grosse.', 'gros → grosse', 'adj')
fem('beau', 'belle', ['beaue', 'bele'], 'Le féminin de beau est belle.', 'beau → belle (à connaître)', 'adj')
fem('fier', 'fière', ['fiere'], 'Les mots en -er font -ère : fière.', '-er → -ère', 'adj')
skill('fp.feminin', 'francais', 'Former le féminin des noms et des adjectifs', 'ce2')
add({'id': 'fr-p-feminin', 'label': 'Le féminin des noms et des adjectifs', 'subject': 'francais', 'levels': ['ce1', 'ce2', 'cm1', 'cm2'], 'skill': 'fp.feminin', 'kind': 'cloze',
     'chapters': ['ce1-f-gn', 'ce2-f-gn', 'cm1-f-gn', 'cm2-f-gn'], 'description': 'Des noms et des adjectifs à mettre au féminin : -e, -ère, -euse, -trice, -onne, -ive…',
     'data': {'prompt': 'Écris le mot au féminin :', 'hint': 'Le plus souvent on ajoute un -e ; certaines terminaisons changent (-er → -ère, -eux → -euse…).', 'items': F}})

# ---------------- Accord sujet-verbe ----------------
SV = []
def sv(sentence, good, wrong, fb):
    SV.append({'sentence': sentence, 'accept': [good], 'misconceptions': [mc(w, 'mc:accord-sujet-verbe', fb) for w in wrong if w != good], 'hint': 'Trouve le sujet (« Qui est-ce qui… ? »), puis accorde le verbe avec lui.', 'rule': 'Le verbe s’accorde avec son sujet.'})
sv('Les oiseaux (chanter) ___ dans le jardin.', 'chantent', ['chante', 'chantes'], 'Le sujet « les oiseaux » est au pluriel (ils) : chantent.')
sv('Le chat (dormir) ___ sur le canapé.', 'dort', ['dorment', 'dors'], 'Le sujet « le chat » est au singulier (il) : dort.')
sv('Mon frère et moi (jouer) ___ au ballon.', 'jouons', ['joue', 'jouent'], '« Mon frère et moi », c’est « nous » : jouons.')
sv('Tu (finir) ___ ton dessin.', 'finis', ['finit', 'fini'], 'Avec « tu », la terminaison est -s : tu finis.')
sv('Les fleurs (pousser) ___ au printemps.', 'poussent', ['pousse'], 'Le sujet « les fleurs » est au pluriel (elles) : poussent.')
sv('Ma sœur et toi (parler) ___ trop vite.', 'parlez', ['parle', 'parlent'], '« Ma sœur et toi », c’est « vous » : parlez.')
sv('Les enfants de la classe (aller) ___ au musée.', 'vont', ['va'], 'Le sujet est « les enfants » (ils), pas « la classe » : vont.')
sv('Le maître des élèves (lire) ___ une histoire.', 'lit', ['lisent'], 'Le sujet est « le maître » (il), pas « les élèves » : lit.')
sv('Nous (être) ___ en vacances.', 'sommes', ['est', 'sont'], 'Avec « nous », être fait « sommes ».')
sv('Mes amis (avoir) ___ un chien.', 'ont', ['a', 'as'], 'Le sujet « mes amis » est au pluriel (ils) : ont.')
sv('Vous (faire) ___ du vélo le dimanche.', 'faites', ['faisez', 'fait'], 'Avec « vous », faire fait « faites » (et non « faisez »).')
sv('Dans la forêt (vivre) ___ des cerfs.', 'vivent', ['vit'], 'Le sujet est placé après le verbe : « des cerfs » (ils) vivent dans la forêt.')
sv('Les élèves (écouter) ___ la maîtresse.', 'écoutent', ['écoute'], 'Le sujet « les élèves » est au pluriel : écoutent.')
sv('Je (prendre) ___ le train demain.', 'prends', ['prend'], 'Avec « je », prendre fait « prends ».')
skill('fp.accord-sv', 'francais', 'Accorder le verbe avec son sujet', 'ce1')
add({'id': 'fr-p-accord-sv', 'label': 'Accorder le verbe avec son sujet', 'subject': 'francais', 'levels': ['ce1', 'ce2', 'cm1', 'cm2'], 'skill': 'fp.accord-sv', 'kind': 'cloze',
     'chapters': ['ce1-f-sujet-verbe', 'ce2-f-sujet-verbe', 'cm1-f-sujet-verbe', 'cm2-f-accords', 'ce1-f-phrase', 'ce2-f-phrase'],
     'description': 'Conjuguer le verbe au présent en trouvant son sujet, même éloigné ou placé après le verbe.',
     'data': {'prompt': 'Conjugue le verbe au présent :', 'hint': 'Qui est-ce qui fait l’action ? C’est le sujet : le verbe s’accorde avec lui.', 'items': SV}})

# ---------------- Classes de mots ----------------
CL = [('maison', 'nom'), ('chat', 'nom'), ('école', 'nom'), ('arbre', 'nom'), ('voiture', 'nom'), ('livre', 'nom'), ('soleil', 'nom'), ('princesse', 'nom'),
      ('courir', 'verbe'), ('manger', 'verbe'), ('chanter', 'verbe'), ('dormir', 'verbe'), ('lire', 'verbe'), ('sauter', 'verbe'), ('écrire', 'verbe'), ('partir', 'verbe'),
      ('joli', 'adjectif'), ('gentil', 'adjectif'), ('heureux', 'adjectif'), ('rapide', 'adjectif'), ('grand', 'adjectif'), ('petit', 'adjectif'), ('lourd', 'adjectif'), ('mignon', 'adjectif'),
      ('le', 'determinant'), ('la', 'determinant'), ('les', 'determinant'), ('un', 'determinant'), ('une', 'determinant'), ('des', 'determinant'), ('mon', 'determinant'), ('ces', 'determinant')]
FB = {'nom': 'un nom : on peut mettre « le », « la » ou « un » devant', 'verbe': 'un verbe à l’infinitif : on peut le conjuguer (je…, tu…)', 'adjectif': 'un adjectif : il dit comment est le nom', 'determinant': 'un déterminant : il se place devant le nom'}
skill('fp.classes', 'francais', 'Reconnaître les classes de mots : nom, verbe, adjectif, déterminant', 'cp')
add({'id': 'fr-p-classes', 'label': 'Classes de mots : nom, verbe, adjectif, déterminant', 'subject': 'francais', 'levels': ['cp', 'ce1', 'ce2', 'cm1', 'cm2'], 'skill': 'fp.classes', 'kind': 'categorize',
     'chapters': ['cp-f-classes', 'ce1-f-classes', 'ce2-f-classes', 'cm1-f-nature', 'cm2-f-nature'],
     'description': 'Ranger des mots selon leur classe ; chaque erreur rappelle le test qui permet de choisir.',
     'data': {'prompt': 'Range chaque mot dans sa classe.', 'count': 8,
              'categories': [{'id': 'nom', 'label': 'Nom'}, {'id': 'verbe', 'label': 'Verbe'}, {'id': 'adjectif', 'label': 'Adjectif'}, {'id': 'determinant', 'label': 'Déterminant'}],
              'items': [{'label': w, 'category': c, 'feedback': FB[c]} for w, c in CL]}})

# ---------------- Types de phrases ----------------
TP = [('Il pleut depuis ce matin.', 'declarative'), ('Le train part à huit heures.', 'declarative'), ('Mon frère adore les dinosaures.', 'declarative'), ('Nous irons à la plage demain.', 'declarative'), ('Les feuilles tombent en automne.', 'declarative'),
      ('As-tu fini tes devoirs ?', 'interrogative'), ('Où as-tu mis mon livre ?', 'interrogative'), ('Est-ce que tu viens avec nous ?', 'interrogative'), ('Quelle heure est-il ?', 'interrogative'), ('Pourquoi le ciel est-il bleu ?', 'interrogative'),
      ('Quelle belle journée !', 'exclamative'), ('Comme ce gâteau est bon !', 'exclamative'), ('Que tu as grandi !', 'exclamative'), ('Quel froid il fait ce matin !', 'exclamative'),
      ('Range ta chambre.', 'imperative'), ('Ferme la porte, s’il te plaît.', 'imperative'), ('Prenez vos cahiers.', 'imperative'), ('Lave-toi les mains avant de manger.', 'imperative'), ('Écoutez bien la consigne.', 'imperative')]
FBT = {'declarative': 'phrase déclarative : elle donne une information et se termine par un point', 'interrogative': 'phrase interrogative : elle pose une question (point d’interrogation)',
       'exclamative': 'phrase exclamative : elle exprime une émotion (point d’exclamation)', 'imperative': 'phrase impérative : elle donne un ordre ou un conseil, le verbe est sans sujet'}
skill('fp.types-phrases', 'francais', 'Reconnaître les types de phrases', 'ce1')
add({'id': 'fr-p-types-phrases', 'label': 'Les types de phrases', 'subject': 'francais', 'levels': ['cp', 'ce1', 'ce2', 'cm1', 'cm2'], 'skill': 'fp.types-phrases', 'kind': 'categorize',
     'chapters': ['cp-f-phrase', 'ce1-f-types', 'ce2-f-types', 'cm1-f-types'],
     'description': 'Déclarative, interrogative, exclamative ou impérative : la ponctuation et le sens aident à choisir.',
     'data': {'prompt': 'Range chaque phrase selon son type.', 'count': 6,
              'categories': [{'id': 'declarative', 'label': 'Déclarative'}, {'id': 'interrogative', 'label': 'Interrogative'}, {'id': 'exclamative', 'label': 'Exclamative'}, {'id': 'imperative', 'label': 'Impérative'}],
              'items': [{'label': s_, 'category': c, 'feedback': FBT[c]} for s_, c in TP]}})

# ---------------- Contraires ----------------
CT = [('grand', 'petit'), ('chaud', 'froid'), ('rapide', 'lent'), ('le jour', 'la nuit'), ('ouvrir', 'fermer'), ('gagner', 'perdre'), ('monter', 'descendre'), ('propre', 'sale'),
      ('heureux', 'triste'), ('lourd', 'léger'), ('vide', 'plein'), ('toujours', 'jamais'), ('facile', 'difficile'), ('jeune', 'vieux'), ('dedans', 'dehors'), ('allumer', 'éteindre'),
      ('acheter', 'vendre'), ("l’entrée", 'la sortie'), ('se lever', 's’asseoir'), ('large', 'étroit')]
skill('fp.contraires', 'francais', 'Trouver le contraire d’un mot', 'ce1')
add({'id': 'fr-p-contraires', 'label': 'Vocabulaire : les contraires', 'subject': 'francais', 'levels': ['cp', 'ce1', 'ce2', 'cm1', 'cm2'], 'skill': 'fp.contraires', 'kind': 'match',
     'chapters': ['cp-f-vocabulaire', 'ce1-f-vocabulaire', 'ce2-f-vocabulaire', 'cm1-f-vocabulaire', 'cm2-f-vocabulaire'],
     'description': 'Associer chaque mot à son contraire (antonyme).',
     'data': {'prompt': 'Associe chaque mot à son contraire.', 'count': 5, 'leftTitle': 'Mot', 'rightTitle': 'Contraire', 'pairs': [{'left': a, 'right': b} for a, b in CT]}})

# ---------------- Sciences ----------------
def cat(gid, subject, levels, sid, slabel, label, desc, chapters, prompt, categories, items, count=8):
    skill(sid, subject, slabel, levels[0])
    add({'id': gid, 'label': label, 'subject': subject, 'levels': levels, 'skill': sid, 'kind': 'categorize', 'chapters': chapters, 'description': desc,
         'data': {'prompt': prompt, 'count': count, 'categories': [{'id': i, 'label': l} for i, l in categories], 'items': [{'label': a, 'category': c, **({'feedback': f} if f else {})} for a, c, f in items]}})

VIVANT = [('Un chat', 'vivant', None), ('Un arbre', 'vivant', 'un végétal : il naît, grandit, se nourrit et meurt'), ('Un champignon', 'vivant', None), ('Une fourmi', 'vivant', None), ('Une fleur', 'vivant', None), ('Un poisson', 'vivant', None),
          ('Un caillou', 'non-vivant', 'un minéral : il ne naît pas, ne grandit pas, ne se nourrit pas'), ('Le sable', 'non-vivant', None), ('L’eau', 'non-vivant', None), ('Un nuage', 'non-vivant', None), ('Le métal d’une clé', 'non-vivant', None),
          ('Le miel', 'produit', 'fabriqué par les abeilles'), ('La laine', 'produit', 'vient des moutons'), ('Une feuille de papier', 'produit', 'fabriquée avec le bois des arbres'), ('La soie', 'produit', 'fabriquée par le ver à soie'), ('Le lait', 'produit', 'produit par la vache')]
for gid, subj, lvs, chs in [('st-p-vivant-cp', 'sciences-techno', ['cp'], ['cp-st-vivant', 'cp-st-environnement']), ('qlm-p-vivant', 'qlm', ['ce1'], ['ce1-qlm-vivant'])]:
    cat(gid, subj, lvs, f'{subj}.p.vivant', 'Distinguer le vivant, le non-vivant et ce qui est produit par des êtres vivants', 'Vivant, non vivant ou produit par un être vivant ?',
        'Ranger des êtres et des objets selon qu’ils sont vivants, non vivants (minéraux) ou produits par des êtres vivants.', chs,
        'Range chaque élément.', [('vivant', 'Vivant'), ('non-vivant', 'Non vivant (minéral)'), ('produit', 'Produit par un être vivant')], VIVANT, 7)

REGIMES = [('La vache', 'herbivore', None), ('Le cheval', 'herbivore', None), ('Le lapin', 'herbivore', None), ('La girafe', 'herbivore', None), ('Le mouton', 'herbivore', None), ('L’éléphant', 'herbivore', None), ('Le zèbre', 'herbivore', None),
           ('Le lion', 'carnivore', None), ('Le loup', 'carnivore', None), ('Le requin', 'carnivore', None), ('L’aigle', 'carnivore', None), ('Le tigre', 'carnivore', None), ('Le crocodile', 'carnivore', None),
           ('Le cochon', 'omnivore', 'il mange des végétaux et des animaux (vers, insectes)'), ('L’ours brun', 'omnivore', 'il mange des baies, du miel et des poissons'), ('La poule', 'omnivore', 'elle mange des graines et des vers'), ('Le sanglier', 'omnivore', None), ('L’être humain', 'omnivore', None)]
cat('qlm-p-regimes', 'qlm', ['ce1', 'ce2'], 'qlm.p.regimes', 'Connaître les régimes alimentaires des animaux', 'Que mangent les animaux ?',
    'Herbivore, carnivore ou omnivore : ranger des animaux selon ce qu’ils mangent.', ['ce1-qlm-regimes', 'ce2-qlm-chaines', 'ce2-qlm-milieu'],
    'Range chaque animal selon son régime alimentaire.', [('herbivore', 'Herbivore (végétaux)'), ('carnivore', 'Carnivore (animaux)'), ('omnivore', 'Omnivore (les deux)')], REGIMES, 7)

ETATS = [('Un glaçon', 'solide', None), ('Une pierre', 'solide', None), ('Le sable', 'solide', 'chaque grain est solide, même si le sable coule'), ('Le sel', 'solide', None), ('Une règle en bois', 'solide', None), ('La farine', 'solide', 'c’est une poudre : de minuscules grains solides'),
         ('L’eau du robinet', 'liquide', None), ('Le lait', 'liquide', None), ('L’huile', 'liquide', None), ('Le jus d’orange', 'liquide', None), ('Le miel', 'liquide', 'il coule lentement, mais il prend la forme du récipient'),
         ('L’air', 'gaz', 'invisible, mais il existe : il gonfle un ballon'), ('La vapeur d’eau', 'gaz', 'invisible (la buée que l’on voit est faite de gouttelettes)'), ('Le gaz d’un ballon de baudruche', 'gaz', None), ('Le dioxyde de carbone des bulles de soda', 'gaz', None)]
for gid, subj, lvs, chs in [('qlm-p-etats', 'qlm', ['ce2'], ['ce2-qlm-etats-matiere', 'ce2-qlm-air', 'ce2-qlm-eau-nature']), ('st-p-etats', 'sciences-techno', ['cm1', 'cm2'], ['cm2-st-matiere', 'cm1-st-melanges', 'cm2-st-melanges'])]:
    cat(gid, subj, lvs, f'{subj}.p.etats', 'Reconnaître les états de la matière : solide, liquide, gaz', 'Solide, liquide ou gaz ?', 'Ranger des matières selon leur état, à température ordinaire.', chs,
        'Range chaque matière selon son état, à température ordinaire.', [('solide', 'Solide'), ('liquide', 'Liquide'), ('gaz', 'Gaz')], ETATS, 7)

ALIM = [('Une pomme', 'fruits-legumes', None), ('Une carotte', 'fruits-legumes', None), ('Des haricots verts', 'fruits-legumes', None), ('Une banane', 'fruits-legumes', None),
        ('Des pâtes', 'feculents', None), ('Du pain', 'feculents', None), ('Du riz', 'feculents', None), ('Des pommes de terre', 'feculents', 'malgré son nom, la pomme de terre est un féculent'),
        ('Du lait', 'laitiers', None), ('Un yaourt', 'laitiers', None), ('Du fromage', 'laitiers', None),
        ('Du poulet', 'vpo', None), ('Un œuf', 'vpo', None), ('Du poisson', 'vpo', None), ('Du jambon', 'vpo', None),
        ('Des bonbons', 'sucres', None), ('Un gâteau', 'sucres', None), ('Du soda', 'sucres', None)]
for gid, subj, lvs, chs in [('st-p-aliments-cp', 'sciences-techno', ['cp'], ['cp-st-aliments', 'cp-st-hygiene']), ('qlm-p-aliments', 'qlm', ['ce1', 'ce2'], ['ce1-qlm-aliments', 'ce2-qlm-equilibre', 'ce1-qlm-hygiene'])]:
    cat(gid, subj, lvs, f'{subj}.p.aliments', 'Classer les aliments en familles', 'Les familles d’aliments', 'Ranger des aliments dans leur famille pour composer des repas équilibrés.', chs,
        'Range chaque aliment dans sa famille.', [('fruits-legumes', 'Fruits et légumes'), ('feculents', 'Féculents'), ('laitiers', 'Produits laitiers'), ('vpo', 'Viande, poisson, œufs'), ('sucres', 'Produits sucrés')], ALIM, 7)

COND = [('Un clou en fer', 'conducteur', None), ('Un fil de cuivre', 'conducteur', None), ('Du papier d’aluminium', 'conducteur', None), ('Une pièce de monnaie', 'conducteur', None), ('Une cuillère en métal', 'conducteur', None), ('La mine d’un crayon (graphite)', 'conducteur', 'surprise : le graphite laisse passer le courant'),
        ('Une règle en plastique', 'isolant', None), ('Un crayon en bois (sans la mine)', 'isolant', None), ('Un verre', 'isolant', None), ('Une gomme', 'isolant', None), ('Une feuille de papier', 'isolant', None), ('Un élastique en caoutchouc', 'isolant', None), ('Un bouchon en liège', 'isolant', None)]
for gid, subj, lvs, chs in [('qlm-p-conducteurs', 'qlm', ['ce2'], ['ce2-qlm-conducteurs', 'ce2-qlm-circuit']), ('st-p-conducteurs', 'sciences-techno', ['cm2'], ['cm2-st-electricite'])]:
    cat(gid, subj, lvs, f'{subj}.p.conducteurs', 'Distinguer conducteurs et isolants électriques', 'Conducteur ou isolant ?', 'Ranger des objets selon qu’ils laissent passer le courant électrique (testés avec une pile et une lampe).', chs,
        'Dans un circuit avec une pile et une lampe, cet objet laisse-t-il passer le courant ?', [('conducteur', 'Conducteur (la lampe brille)'), ('isolant', 'Isolant (la lampe reste éteinte)')], COND, 7)

REPRO = [('La poule', 'ovipare', None), ('La tortue', 'ovipare', None), ('La grenouille', 'ovipare', None), ('Le crocodile', 'ovipare', None), ('Le poisson rouge', 'ovipare', None), ('Le papillon', 'ovipare', None), ('L’ornithorynque', 'ovipare', 'un mammifère… qui pond des œufs !'),
         ('Le chat', 'vivipare', None), ('La vache', 'vivipare', None), ('Le dauphin', 'vivipare', 'un mammifère marin : le petit naît vivant'), ('La chauve-souris', 'vivipare', None), ('L’être humain', 'vivipare', None), ('Le cheval', 'vivipare', None)]
cat('st-p-reproduction', 'sciences-techno', ['cm1', 'cm2'], 'sciences-techno.p.reproduction', 'Distinguer animaux ovipares et vivipares', 'Ovipare ou vivipare ?', 'Ranger des animaux selon que leurs petits naissent d’un œuf pondu ou vivants.', ['cm1-st-reproduction', 'cm2-st-vivant'],
    'Range chaque animal : ses petits naissent-ils d’un œuf pondu (ovipare) ou du ventre de la mère (vivipare) ?', [('ovipare', 'Ovipare'), ('vivipare', 'Vivipare')], REPRO, 7)

LUM = [('Le Soleil', 'source', None), ('Une lampe allumée', 'source', None), ('La flamme d’une bougie', 'source', None), ('Une étoile', 'source', None), ('Un écran allumé', 'source', None), ('Une luciole', 'source', 'elle produit sa propre lumière'),
       ('La Lune', 'eclaire', 'elle renvoie la lumière du Soleil : ce n’est pas une source'), ('Un miroir', 'eclaire', 'il renvoie la lumière, il n’en produit pas'), ('Un livre', 'eclaire', None), ('Un mur blanc', 'eclaire', None), ('La planète Vénus', 'eclaire', 'brillante dans le ciel, mais éclairée par le Soleil'), ('Un vélo', 'eclaire', None)]
cat('st-p-lumiere', 'sciences-techno', ['cm1', 'cm2'], 'sciences-techno.p.lumiere', 'Distinguer source de lumière et objet éclairé', 'Source de lumière ou objet éclairé ?', 'Ranger des objets selon qu’ils produisent leur propre lumière ou qu’ils renvoient celle qu’ils reçoivent.', ['cm1-st-lumiere-ombres', 'cm2-st-lumiere', 'cm1-st-lune'],
    'Range chaque objet : produit-il sa propre lumière, ou renvoie-t-il celle qu’il reçoit ?', [('source', 'Source de lumière'), ('eclaire', 'Objet éclairé')], LUM, 7)

ENER = [('Le vent', 'renouvelable', None), ('Le Soleil', 'renouvelable', None), ('L’eau des rivières et des barrages', 'renouvelable', None), ('La chaleur de la Terre (géothermie)', 'renouvelable', None), ('Le bois des forêts gérées', 'renouvelable', 'renouvelable si l’on replante autant d’arbres qu’on en coupe'),
        ('Le pétrole', 'non-renouvelable', 'il a mis des millions d’années à se former'), ('Le charbon', 'non-renouvelable', None), ('Le gaz naturel', 'non-renouvelable', None), ('L’uranium des centrales nucléaires', 'non-renouvelable', 'un minerai extrait du sol, en quantité limitée')]
cat('st-p-energie', 'sciences-techno', ['cm2'], 'sciences-techno.p.energie', 'Distinguer sources d’énergie renouvelables et non renouvelables', 'Énergies renouvelables ou non ?', 'Ranger des sources d’énergie selon qu’elles se renouvellent rapidement ou s’épuisent.', ['cm2-st-energie'],
    'Range chaque source d’énergie.', [('renouvelable', 'Renouvelable'), ('non-renouvelable', 'Non renouvelable (stock limité)')], ENER, 6)

CLA = [('Le chat', 'mammifere', None), ('Le dauphin', 'mammifere', 'il respire de l’air et allaite ses petits'), ('La baleine', 'mammifere', None), ('La chauve-souris', 'mammifere', 'un mammifère qui vole'), ('La vache', 'mammifere', None),
       ('Le manchot', 'oiseau', 'il a des plumes, même s’il ne vole pas'), ('L’autruche', 'oiseau', None), ('La poule', 'oiseau', None), ('L’aigle', 'oiseau', None),
       ('Le requin', 'poisson', None), ('Le saumon', 'poisson', None), ('L’hippocampe', 'poisson', 'malgré sa forme, c’est un poisson'), ('La truite', 'poisson', None),
       ('Le lézard', 'reptile', None), ('La tortue', 'reptile', None), ('Le crocodile', 'reptile', None), ('La couleuvre', 'reptile', None),
       ('La grenouille', 'amphibien', None), ('Le crapaud', 'amphibien', None), ('La salamandre', 'amphibien', 'peau nue et humide : un amphibien, pas un reptile'), ('Le triton', 'amphibien', None)]
cat('st-p-classification', 'sciences-techno', ['cm1', 'cm2'], 'sciences-techno.p.classification', 'Classer les vertébrés : mammifères, oiseaux, poissons, reptiles, amphibiens', 'Classer les vertébrés', 'Ranger des animaux dans leur groupe d’après leurs caractères (poils, plumes, écailles, peau nue…).', ['cm1-st-classification', 'cm1-st-especes', 'cm2-st-vivant', 'cm2-st-biodiversite'],
    'Range chaque animal dans son groupe.', [('mammifere', 'Mammifère (poils, allaite)'), ('oiseau', 'Oiseau (plumes)'), ('poisson', 'Poisson (nageoires, branchies)'), ('reptile', 'Reptile (écailles)'), ('amphibien', 'Amphibien (peau nue)')], CLA, 7)

# ---------------- Histoire-géographie ----------------
def chrono(gid, levels, sid, slabel, label, desc, chapters, events):
    skill(sid, 'hg', slabel, levels[0])
    add({'id': gid, 'label': label, 'subject': 'hg', 'levels': levels, 'skill': sid, 'kind': 'chronologie', 'chapters': chapters, 'description': desc,
         'options': [{'id': 'mode', 'label': 'Exercice', 'values': [{'id': 'frise', 'label': 'Ranger sur une frise'}, {'id': 'date', 'label': 'Retrouver l’année'}]}],
         'data': {'events': [{'label': l, 'year': y, 'hint': h} for l, y, h in events]}})
chrono('hg-p-chrono-cm1', ['cm1'], 'hg.p.chronologie-cm1', 'Situer des repères historiques du Moyen Âge à la Révolution', 'Repères d’histoire : du Moyen Âge à 1789',
       'Des dates sûres, de Charlemagne à la prise de la Bastille : les ranger, ou retrouver l’année.',
       ['cm1-hg-seigneurie', 'cm1-hg-eglise-villes', 'cm1-hg-renaissance', 'cm1-hg-louis-xiv', 'cm1-hg-explorations', 'cm1-hg-1789'], [
    ('Charlemagne est couronné empereur', 800, 'Une année toute ronde, au début du IXe siècle.'), ('Hugues Capet devient roi des Francs', 987, 'Fin du Xe siècle.'),
    ('Guillaume le Conquérant gagne la bataille d’Hastings', 1066, 'XIe siècle.'), ('Le pape Urbain II appelle à la première croisade', 1095, 'Fin du XIe siècle.'),
    ('Début de la construction de Notre-Dame de Paris', 1163, 'XIIe siècle.'), ('Jeanne d’Arc délivre Orléans', 1429, 'XVe siècle, pendant la guerre de Cent Ans.'),
    ('Christophe Colomb arrive en Amérique', 1492, 'Fin du XVe siècle.'), ('François Ier gagne la bataille de Marignan', 1515, 'Un nombre facile à retenir : 15-15.'),
    ('L’ordonnance de Villers-Cotterêts impose le français dans les actes officiels', 1539, 'XVIe siècle, sous François Ier.'), ('Le massacre de la Saint-Barthélemy', 1572, 'XVIe siècle, pendant les guerres de religion.'),
    ('Henri IV signe l’édit de Nantes', 1598, 'Fin du XVIe siècle.'), ('Louis XIV devient roi', 1643, 'XVIIe siècle.'),
    ('Louis XIV installe la cour à Versailles', 1682, 'Fin du XVIIe siècle.'), ('La prise de la Bastille', 1789, 'Fin du XVIIIe siècle.')])
chrono('hg-p-chrono-cm2', ['cm2'], 'hg.p.chronologie-cm2', 'Situer des repères historiques de 1789 à nos jours', 'Repères d’histoire : de 1789 à nos jours',
       'Des dates sûres, de la Révolution à l’euro : les ranger, ou retrouver l’année.',
       ['cm2-hg-republique-1892', 'cm2-hg-ecole-ferry', 'cm2-hg-energies-machines', 'cm2-hg-premiere-guerre', 'cm2-hg-seconde-guerre', 'cm2-hg-europe', 'cm2-hg-libertes'], [
    ('La prise de la Bastille', 1789, 'Le début de la Révolution française.'), ('Proclamation de la Ire République', 1792, 'Trois ans après le début de la Révolution.'),
    ('Napoléon Bonaparte est sacré empereur', 1804, 'Début du XIXe siècle.'), ('Abolition définitive de l’esclavage en France', 1848, 'Milieu du XIXe siècle.'),
    ('L’école primaire devient obligatoire et laïque (lois Ferry)', 1882, 'Fin du XIXe siècle.'), ('Inauguration de la tour Eiffel', 1889, 'Pour l’Exposition universelle, cent ans après 1789.'),
    ('Loi de séparation des Églises et de l’État', 1905, 'Début du XXe siècle.'), ('Début de la Première Guerre mondiale', 1914, 'Début du XXe siècle.'),
    ('Armistice de la Première Guerre mondiale', 1918, 'Le 11 novembre.'), ('Début de la Seconde Guerre mondiale', 1939, 'Vingt et un ans après 1918.'),
    ('Appel du général de Gaulle à la Résistance', 1940, 'Le 18 juin.'), ('Les femmes votent pour la première fois en France', 1945, 'Le droit de vote leur a été accordé en 1944.'),
    ('Traité de Rome : naissance de la Communauté économique européenne', 1957, 'Milieu du XXe siècle.'), ('Premiers pas sur la Lune', 1969, 'Fin des années 1960.'),
    ('Les pièces et billets en euros entrent en circulation', 2002, 'Début du XXIe siècle.')])

PER = [('Les peintures de la grotte de Lascaux', 'prehistoire', None), ('Les outils en silex taillé', 'prehistoire', None), ('Les premiers agriculteurs et éleveurs', 'prehistoire', 'le Néolithique, à la fin de la Préhistoire'), ('La maîtrise du feu', 'prehistoire', None),
       ('Les pyramides d’Égypte', 'antiquite', None), ('Jules César conquiert la Gaule', 'antiquite', None), ('Les Jeux olympiques de la Grèce antique', 'antiquite', None), ('Les gladiateurs de Rome', 'antiquite', None),
       ('Charlemagne, empereur', 'moyen-age', None), ('Les châteaux forts', 'moyen-age', None), ('Jeanne d’Arc', 'moyen-age', None), ('Les cathédrales gothiques', 'moyen-age', None), ('Les croisades', 'moyen-age', None),
       ('Christophe Colomb arrive en Amérique', 'temps-modernes', 'en 1492 : c’est le début des Temps modernes'), ('François Ier et la Renaissance', 'temps-modernes', None), ('Louis XIV à Versailles', 'temps-modernes', None), ('Léonard de Vinci peint la Joconde', 'temps-modernes', None),
       ('La Révolution française', 'contemporaine', 'en 1789 : c’est le début de l’époque contemporaine'), ('Napoléon, empereur', 'contemporaine', None), ('La Première Guerre mondiale', 'contemporaine', None), ('Les premiers pas sur la Lune', 'contemporaine', None), ('L’invention d’Internet', 'contemporaine', None)]
cat('hg-p-periodes', 'hg', ['ce2', 'cm1', 'cm2'], 'hg.p.periodes', 'Situer des faits dans les grandes périodes de l’histoire', 'Les grandes périodes de l’histoire', 'Ranger des faits et des personnages dans leur période : Préhistoire, Antiquité, Moyen Âge, Temps modernes, époque contemporaine.',
    ['ce2-hg-periodes', 'ce2-hg-frise', 'ce2-hg-personnages', 'ce2-hg-vivre-autrefois'], 'Range chaque fait dans sa période.',
    [('prehistoire', 'Préhistoire'), ('antiquite', 'Antiquité'), ('moyen-age', 'Moyen Âge'), ('temps-modernes', 'Temps modernes'), ('contemporaine', 'Époque contemporaine')], PER, 7)

CONT = [('L’Afrique', 'continent', None), ('L’Asie', 'continent', None), ('L’Europe', 'continent', None), ('L’Amérique', 'continent', None), ('L’Océanie', 'continent', None), ('L’Antarctique', 'continent', 'le continent glacé du pôle Sud'),
        ('L’océan Atlantique', 'ocean', None), ('L’océan Pacifique', 'ocean', 'le plus grand océan'), ('L’océan Indien', 'ocean', None), ('L’océan Arctique', 'ocean', 'l’océan du pôle Nord')]
cat('hg-p-continents', 'hg', ['cp', 'ce1', 'ce2'], 'hg.p.continents', 'Nommer les continents et les océans', 'Continents et océans', 'Distinguer les continents (terres) et les océans sur le globe et le planisphère.',
    ['cp-hg-globe-planisphere', 'ce1-hg-globe', 'ce2-hg-globe', 'cp-hg-monde-peuple'], 'Range chaque nom : est-ce un continent ou un océan ?', [('continent', 'Continent'), ('ocean', 'Océan')], CONT, 6)

CAP = [('L’Allemagne', 'Berlin'), ('L’Espagne', 'Madrid'), ('L’Italie', 'Rome'), ('La Belgique', 'Bruxelles'), ('Le Portugal', 'Lisbonne'), ('Les Pays-Bas', 'Amsterdam'), ('La Grèce', 'Athènes'),
       ('La Pologne', 'Varsovie'), ('L’Irlande', 'Dublin'), ('L’Autriche', 'Vienne'), ('La Suède', 'Stockholm'), ('Le Danemark', 'Copenhague'), ('La France', 'Paris'), ('Le Luxembourg', 'Luxembourg')]
skill('hg.p.capitales', 'hg', 'Connaître des pays de l’Union européenne et leur capitale', 'cm2')
add({'id': 'hg-p-capitales', 'label': 'Pays de l’Union européenne et capitales', 'subject': 'hg', 'levels': ['cm2'], 'skill': 'hg.p.capitales', 'kind': 'match', 'chapters': ['cm2-hg-europe'],
     'description': 'Associer des pays de l’Union européenne à leur capitale.',
     'data': {'prompt': 'Associe chaque pays à sa capitale.', 'count': 5, 'leftTitle': 'Pays', 'rightTitle': 'Capitale', 'pairs': [{'left': a, 'right': b} for a, b in CAP]}})

# ---------------- Anglais ----------------
EN = []
def en(fr, ans, theme, hint=None):
    EN.append({'q': fr, 'a': ans if isinstance(ans, list) else [ans], 'theme': theme, **({'hint': hint} if hint else {})})
for fr, a in [('rouge', 'red'), ('bleu', 'blue'), ('vert', 'green'), ('jaune', 'yellow'), ('noir', 'black'), ('blanc', 'white'), ('orange', 'orange'), ('rose', 'pink'), ('violet', ['purple', 'violet']), ('marron', 'brown'), ('gris', ['grey', 'gray'])]:
    en(fr, a, 'couleurs')
for fr, a in [('un', 'one'), ('deux', 'two'), ('trois', 'three'), ('quatre', 'four'), ('cinq', 'five'), ('six', 'six'), ('sept', 'seven'), ('huit', 'eight'), ('neuf', 'nine'), ('dix', 'ten'), ('onze', 'eleven'), ('douze', 'twelve'), ('vingt', 'twenty')]:
    en(fr, a, 'nombres')
for fr, a in [('le chat', ['cat', 'a cat', 'the cat']), ('le chien', ['dog', 'a dog', 'the dog']), ('le cheval', ['horse', 'a horse', 'the horse']), ('l’oiseau', ['bird', 'a bird', 'the bird']), ('le poisson', ['fish', 'a fish', 'the fish']), ('la souris', ['mouse', 'a mouse', 'the mouse']), ('le lapin', ['rabbit', 'a rabbit', 'the rabbit']), ('la vache', ['cow', 'a cow', 'the cow']), ('le lion', ['lion', 'a lion', 'the lion'])]:
    en(fr, a, 'animaux')
for fr, a in [('la mère', ['mother', 'mum', 'mom', 'the mother']), ('le père', ['father', 'dad', 'the father']), ('la sœur', ['sister', 'the sister', 'a sister']), ('le frère', ['brother', 'the brother', 'a brother']), ('la grand-mère', ['grandmother', 'grandma', 'granny']), ('le grand-père', ['grandfather', 'grandpa'])]:
    en(fr, a, 'famille')
for fr, a in [('lundi', 'Monday'), ('mardi', 'Tuesday'), ('mercredi', 'Wednesday'), ('jeudi', 'Thursday'), ('vendredi', 'Friday'), ('samedi', 'Saturday'), ('dimanche', 'Sunday')]:
    en(fr, a, 'jours', 'En anglais, les jours prennent une majuscule.')
for fr, a in [('la tête', ['head', 'the head']), ('la main', ['hand', 'the hand']), ('le pied', ['foot', 'the foot']), ('l’œil', ['eye', 'the eye']), ('la bouche', ['mouth', 'the mouth']), ('le nez', ['nose', 'the nose']), ('l’oreille', ['ear', 'the ear'])]:
    en(fr, a, 'corps')
for fr, a in [('bonjour', ['hello', 'hi', 'good morning']), ('au revoir', ['goodbye', 'bye', 'bye-bye']), ('merci', ['thank you', 'thanks']), ('s’il te plaît', 'please'), ('oui', 'yes'), ('non', 'no')]:
    en(fr, a, 'politesse')
skill('lv.p.anglais-lexique', 'lv', 'Anglais : premiers mots (couleurs, nombres, animaux, famille, jours, corps, politesse)', 'cp')
add({'id': 'en-p-vocabulaire', 'label': 'Anglais : mes premiers mots', 'subject': 'lv', 'levels': ['cp', 'ce1', 'ce2', 'cm1', 'cm2'], 'skill': 'lv.p.anglais-lexique', 'kind': 'vocab', 'difficulty': 1,
     'chapters': ['lv-c2c3-2026-ce', 'lv-c2c3-2026-co', 'lv-2020-activites'],
     'description': 'Couleurs, nombres, animaux, famille, jours de la semaine, corps et politesse, avec écoute en anglais.',
     'options': [{'id': 'theme', 'label': 'Thème', 'values': [{'id': 'tous', 'label': 'Tous les thèmes'}] + [{'id': t, 'label': l} for t, l in [('couleurs', 'Les couleurs'), ('nombres', 'Les nombres'), ('animaux', 'Les animaux'), ('famille', 'La famille'), ('jours', 'Les jours'), ('corps', 'Le corps'), ('politesse', 'Dire bonjour, merci…')]]},
                 {'id': 'direction', 'label': 'Sens', 'values': [{'id': 'normal', 'label': 'Français → anglais'}, {'id': 'inverse', 'label': 'Anglais → français'}, {'id': 'mixte', 'label': 'Les deux, au hasard'}]}],
     'data': {'pairs': EN, 'lang': 'en-GB', 'fromLabel': 'français', 'toLabel': 'anglais'}})

# ---------------- EMC ----------------
SYM = [('La devise de la République', 'Liberté, Égalité, Fraternité'), ('L’hymne national', 'La Marseillaise'), ('La fête nationale', 'Le 14 Juillet'), ('Les couleurs du drapeau', 'Bleu, blanc, rouge'),
       ('La figure qui représente la République', 'Marianne'), ('La durée du mandat du président de la République', 'Cinq ans'), ('Le lieu où siègent les députés', 'L’Assemblée nationale'), ('L’âge à partir duquel on peut voter', '18 ans'),
       ('Le principe qui sépare les religions et l’État', 'La laïcité'), ('Le texte de 1789 qui proclame les droits de tous', 'La Déclaration des droits de l’homme et du citoyen')]
skill('emc.p.symboles', 'emc', 'Connaître les symboles et les principes de la République', 'cp')
add({'id': 'emc-p-symboles', 'label': 'Les symboles de la République', 'subject': 'emc', 'levels': ['cp', 'ce1', 'ce2', 'cm1', 'cm2'], 'skill': 'emc.p.symboles', 'kind': 'match', 'chapters': [],
     'description': 'Associer les symboles et les principes de la République : devise, hymne, fête nationale, drapeau, Marianne, laïcité…',
     'data': {'prompt': 'Associe chaque élément à ce qui lui correspond.', 'count': 5, 'leftTitle': 'Question', 'rightTitle': 'Réponse', 'pairs': [{'left': a, 'right': b} for a, b in SYM]}})

# ---------------- Écriture ----------------
os.makedirs(GEN_DIR, exist_ok=True)
for g in gens:
    with open(os.path.join(GEN_DIR, g['id'] + '.json'), 'w', encoding='utf-8') as f:
        json.dump(g, f, ensure_ascii=False, indent=1)
        f.write('\n')
with open(os.path.join(OUT, 'content', 'skills', 'primaire-donnees.json'), 'w', encoding='utf-8') as f:
    json.dump({'subject': 'mixte', 'note': 'Notions de l’école primaire travaillées par les générateurs de données (content/generators/*-p-*.json).', 'skills': skills}, f, ensure_ascii=False, indent=1)
    f.write('\n')
ix_path = os.path.join(OUT, 'content', 'index.json')
ix = json.load(open(ix_path, encoding='utf-8'))
ids = {g['id'] for g in gens}
ix['generators'] = [g for g in ix['generators'] if g['id'] not in ids] + [{k: v for k, v in g.items() if k != 'data'} | {'track': 'classe', 'tracks': TRACKS} for g in gens]
have = {s['id'] for s in ix['skills']}
ix['skills'] += [s for s in skills if s['id'] not in have]
json.dump(ix, open(ix_path, 'w', encoding='utf-8'), ensure_ascii=False)
print(len(gens), 'générateurs,', len(skills), 'notions')
for g in gens:
    n = len(g['data'].get('items') or g['data'].get('pairs') or g['data'].get('events') or g['data'].get('verbs') or [])
    print(f"  {g['id']:24} {g['kind']:12} {','.join(g['levels']):18} {n} éléments")
