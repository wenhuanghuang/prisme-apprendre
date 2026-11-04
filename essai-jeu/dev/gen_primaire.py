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

# ---------------- Encore des savoirs du primaire (catégories, associations) ----------------
def pairs_gen(gid, subject, levels, sid, slabel, label, desc, chapters, prompt, pairs, left, right, count=5):
    if sid not in {s['id'] for s in skills}: skill(sid, subject, slabel, levels[0])
    add({'id': gid, 'label': label, 'subject': subject, 'levels': levels, 'skill': sid, 'kind': 'match', 'chapters': chapters, 'description': desc,
         'data': {'prompt': prompt, 'count': count, 'leftTitle': left, 'rightTitle': right, 'pairs': [{'left': a, 'right': b} for a, b in pairs]}})
def cat2(gid, subject, levels, sid, slabel, label, desc, chapters, prompt, categories, items, count=8):
    if sid in {s['id'] for s in skills}:
        add({'id': gid, 'label': label, 'subject': subject, 'levels': levels, 'skill': sid, 'kind': 'categorize', 'chapters': chapters, 'description': desc,
             'data': {'prompt': prompt, 'count': count, 'categories': [{'id': i, 'label': l} for i, l in categories], 'items': [{'label': a, 'category': c, **({'feedback': f} if f else {})} for a, c, f in items]}})
    else:
        cat(gid, subject, levels, sid, slabel, label, desc, chapters, prompt, categories, items, count)

# Météo
INSTR = [('Le thermomètre', 'la température de l’air'), ('Le pluviomètre', 'la quantité de pluie tombée'), ('L’anémomètre', 'la vitesse du vent'),
         ('La girouette', 'la direction d’où vient le vent'), ('Le baromètre', 'la pression de l’air'), ('L’hygromètre', 'l’humidité de l’air')]
pairs_gen('st-p-meteo', 'sciences-techno', ['cm1', 'cm2'], 'sciences-techno.p.meteo', 'Mesurer le temps qu’il fait : instruments de la météorologie', 'Les instruments de la météo',
          'Associer chaque instrument à ce qu’il mesure.', ['cm1-st-meteo', 'cm2-st-meteo-climat'], 'Associe chaque instrument à ce qu’il mesure.', INSTR, 'Instrument', 'Il mesure', 4)
MC = [('Demain, il pleuvra à Lille.', 'meteo', None), ('Ce matin, il fait 3 °C.', 'meteo', None), ('Un orage est annoncé ce soir.', 'meteo', None), ('Cette semaine, le vent soufflera fort.', 'meteo', None), ('Il a neigé hier en montagne.', 'meteo', None),
      ('À Marseille, les étés sont en général chauds et secs.', 'climat', 'on parle de ce qui se passe d’habitude, sur de nombreuses années'), ('Dans les régions polaires, il fait froid toute l’année.', 'climat', None),
      ('En Bretagne, il pleut souvent, mais les hivers sont doux.', 'climat', None), ('Dans le désert du Sahara, il pleut très rarement.', 'climat', None), ('Près de l’équateur, il fait chaud et humide toute l’année.', 'climat', None)]
cat2('st-p-meteo-climat', 'sciences-techno', ['cm2'], 'sciences-techno.p.meteo', '', 'Météo ou climat ?', 'Distinguer le temps qu’il fait un jour donné (météo) du temps habituel d’une région (climat).',
     ['cm2-st-meteo-climat'], 'La phrase parle-t-elle de la météo (le temps d’un jour) ou du climat (le temps habituel, sur des années) ?', [('meteo', 'Météo'), ('climat', 'Climat')], MC, 6)

# Planète active
TERRE = [('Un séisme', 'un tremblement de terre : le sol se met à trembler'), ('L’épicentre', 'l’endroit de la surface où le séisme est le plus fort'), ('Le magma', 'la roche fondue, très chaude, sous la surface'),
         ('La lave', 'le magma qui sort d’un volcan et s’écoule'), ('Le cratère', 'l’ouverture au sommet du volcan'), ('Une éruption', 'la sortie de lave, de cendres et de gaz par un volcan'),
         ('Un tsunami', 'une vague géante provoquée par un séisme sous la mer'), ('Un sismographe', 'l’appareil qui enregistre les secousses du sol')]
pairs_gen('st-p-terre-active', 'sciences-techno', ['cm2'], 'sciences-techno.p.terre-active', 'Connaître le vocabulaire des séismes et des volcans', 'Séismes et volcans',
          'Associer chaque mot à sa définition : séisme, épicentre, magma, lave, cratère, éruption, tsunami.', ['cm2-st-terre-active'], 'Associe chaque mot à sa définition.', TERRE, 'Mot', 'Définition', 4)

# Groupes d'aliments (CM2)
GROUPES = [('Les pâtes', 'feculents', None), ('Le riz', 'feculents', None), ('Le pain', 'feculents', None), ('Les lentilles', 'feculents', 'les légumes secs sont rangés avec les féculents'), ('Les pommes de terre', 'feculents', None),
           ('Une pomme', 'fruits-legumes', None), ('Les carottes', 'fruits-legumes', None), ('Les haricots verts', 'fruits-legumes', 'frais et verts, ce sont des légumes ; secs, des féculents'), ('Une banane', 'fruits-legumes', None),
           ('Le yaourt', 'laitiers', None), ('Le fromage', 'laitiers', None), ('Le lait', 'laitiers', None),
           ('Le poulet', 'vpo', None), ('La sardine', 'vpo', None), ('Un œuf', 'vpo', None),
           ('Le beurre', 'gras', None), ('L’huile d’olive', 'gras', None),
           ('Les bonbons', 'sucres', None), ('La confiture', 'sucres', None), ('Un soda', 'sucres', 'à boire seulement de temps en temps : il contient beaucoup de sucre')]
cat2('st-p-groupes-aliments', 'sciences-techno', ['cm2'], 'sciences-techno.p.digestion', '', 'Les familles d’aliments',
     'Ranger les aliments dans leur famille : féculents, fruits et légumes, produits laitiers, viandes-poissons-œufs, matières grasses, produits sucrés.', ['cm2-st-nutrition'],
     'Range chaque aliment dans sa famille.', [('feculents', 'Féculents'), ('fruits-legumes', 'Fruits et légumes'), ('laitiers', 'Produits laitiers'), ('vpo', 'Viandes, poissons, œufs'), ('gras', 'Matières grasses'), ('sucres', 'Produits sucrés')], GROUPES, 7)

# Producteurs, consommateurs, décomposeurs
ROLES = [('L’herbe', 'producteur', 'un végétal : il fabrique sa matière grâce à la lumière'), ('Le chêne', 'producteur', None), ('Les algues', 'producteur', None), ('Le blé', 'producteur', None),
         ('Le lapin', 'herbivore', None), ('La vache', 'herbivore', None), ('La chenille', 'herbivore', None), ('Le criquet', 'herbivore', None), ('Le cerf', 'herbivore', None),
         ('Le loup', 'carnivore', None), ('La chouette', 'carnivore', None), ('La coccinelle', 'carnivore', 'elle mange des pucerons'), ('L’araignée', 'carnivore', None),
         ('Le sanglier', 'omnivore', None), ('L’ours brun', 'omnivore', 'il mange des baies, des racines, du miel, mais aussi des poissons'), ('L’être humain', 'omnivore', None),
         ('Le ver de terre', 'decomposeur', 'il se nourrit des feuilles mortes et enrichit le sol'), ('Les champignons du sol', 'decomposeur', None), ('Le cloporte', 'decomposeur', None)]
cat2('st-p-roles-ecosysteme', 'sciences-techno', ['cm1', 'cm2'], 'sciences-techno.p.chaines', '', 'Qui mange quoi ? Producteurs, consommateurs, décomposeurs',
     'Ranger les êtres vivants selon leur rôle dans un écosystème.', ['cm1-st-ecosysteme', 'cm2-st-ecosystemes'], 'Range chaque être vivant selon ce qu’il fait dans l’écosystème.',
     [('producteur', 'Producteur (végétal)'), ('herbivore', 'Mange des végétaux'), ('carnivore', 'Mange des animaux'), ('omnivore', 'Mange de tout'), ('decomposeur', 'Décomposeur')], ROLES, 7)

# Trajectoires
TRAJ = [('Une voiture sur une route toute droite', 'rectiligne', None), ('Une pomme qui tombe d’un arbre', 'rectiligne', 'elle tombe tout droit vers le sol'), ('Un ascenseur', 'rectiligne', None),
        ('Un enfant sur un toboggan droit', 'rectiligne', None), ('Une boule de bowling lancée tout droit', 'rectiligne', None), ('Un tapis roulant', 'rectiligne', None),
        ('Une nacelle de grande roue', 'circulaire', None), ('Le bout de l’aiguille d’une horloge', 'circulaire', None), ('Un cheval de manège', 'circulaire', None),
        ('Le bout d’une pale d’éolienne', 'circulaire', None), ('Un satellite autour de la Terre', 'circulaire', 'presque un cercle'), ('La Terre autour du Soleil', 'circulaire', 'presque un cercle')]
cat2('st-p-trajectoires', 'sciences-techno', ['cm1', 'cm2'], 'sciences-techno.p.vitesse', '', 'Mouvement rectiligne ou circulaire ?', 'Reconnaître une trajectoire en ligne droite ou en cercle.',
     ['cm1-st-mouvement', 'cm2-st-mouvements'], 'Le mouvement suit-il une ligne droite ou un cercle ?', [('rectiligne', 'Rectiligne (ligne droite)'), ('circulaire', 'Circulaire (cercle)')], TRAJ, 6)

# Objets techniques
OBJ = [('Une chaise', 'fabrique', None), ('Une paire de ciseaux', 'fabrique', None), ('Un vélo', 'fabrique', None), ('Une tasse', 'fabrique', None), ('Un crayon', 'fabrique', 'fabriqué avec du bois et du graphite'), ('Une lampe', 'fabrique', None), ('Un ballon', 'fabrique', None),
       ('Un caillou', 'naturel', None), ('Une feuille d’arbre', 'naturel', None), ('Un coquillage', 'naturel', None), ('Une plume d’oiseau', 'naturel', None), ('Une pomme de pin', 'naturel', None), ('Du sable', 'naturel', None), ('Une branche', 'naturel', None)]
for gid, subject, levels, chapters in [('st-p-objets-cp', 'sciences-techno', ['cp'], ['cp-st-objets']), ('qlm-p-objets', 'qlm', ['ce1'], ['ce1-qlm-objets', 'ce1-qlm-fabriquer'])]:
    cat2(gid, subject, levels, f'{subject}.p.objets', 'Distinguer un objet fabriqué par l’être humain d’un élément naturel', 'Objet fabriqué ou élément naturel ?',
         'Les objets techniques sont fabriqués par les êtres humains pour répondre à un besoin.', chapters, 'Range : objet fabriqué par l’être humain, ou élément de la nature ?',
         [('fabrique', 'Fabriqué par l’être humain'), ('naturel', 'Naturel')], OBJ, 6)
BESOINS = [('Un parapluie', 'se protéger de la pluie'), ('Une lampe', 's’éclairer'), ('Un réfrigérateur', 'garder les aliments au frais'), ('Un vélo', 'se déplacer'), ('Une montre', 'savoir l’heure'),
           ('Un téléphone', 'communiquer à distance'), ('Une échelle', 'atteindre un endroit en hauteur'), ('Une loupe', 'voir les petits détails en plus grand'), ('Un thermomètre', 'mesurer la température'), ('Un sac à dos', 'transporter ses affaires')]
for gid, subject, levels, chapters in [('qlm-p-besoins', 'qlm', ['ce1', 'ce2'], ['ce1-qlm-objets', 'ce2-qlm-objets']), ('st-p-besoins', 'sciences-techno', ['cm1', 'cm2'], ['cm1-st-objets-besoins', 'cm1-st-fonctionnement', 'cm2-st-objets-besoins', 'cm2-st-fonctionnement'])]:
    pairs_gen(gid, subject, levels, f'{subject}.p.besoins', 'Associer un objet technique au besoin auquel il répond', 'À quoi sert cet objet ?', 'Associer chaque objet technique au besoin auquel il répond.',
              chapters, 'Associe chaque objet au besoin auquel il répond.', BESOINS, 'Objet', 'Il sert à…', 5)
HIER = [('La lampe à huile', 'L’ampoule électrique'), ('La plume et l’encrier', 'Le stylo à bille'), ('Le lavoir', 'La machine à laver'), ('Le téléphone à cadran', 'Le smartphone'),
        ('La diligence tirée par des chevaux', 'La voiture'), ('La glacière à pain de glace', 'Le réfrigérateur'), ('La machine à écrire', 'L’ordinateur'), ('L’appareil photo à pellicule', 'L’appareil photo numérique'), ('Le fer à repasser chauffé sur le poêle', 'Le fer à repasser électrique')]
for gid, subject, levels, chapters in [('qlm-p-hier', 'qlm', ['ce2'], ['ce2-qlm-objets']), ('st-p-hier', 'sciences-techno', ['cm1', 'cm2'], ['cm1-st-objets-besoins', 'cm2-st-objets-besoins'])]:
    pairs_gen(gid, subject, levels, f'{subject}.p.hier', 'Relier un objet d’autrefois à l’objet qui répond au même besoin aujourd’hui', 'Objets d’hier et d’aujourd’hui',
              'Retrouver, pour chaque objet d’autrefois, l’objet d’aujourd’hui qui répond au même besoin.', chapters, 'Associe chaque objet d’autrefois à celui qui le remplace aujourd’hui.', HIER, 'Autrefois', 'Aujourd’hui', 5)

# Le corps en mouvement
ARTIC = [('Je plie le bras grâce au…', 'coude'), ('Je plie la jambe grâce au…', 'genou'), ('Je tourne la main grâce au…', 'poignet'), ('Je tourne le pied grâce à la…', 'cheville'),
         ('Je lève le bras grâce à l’…', 'épaule'), ('Je tourne la tête grâce au…', 'cou')]
for gid, subject, levels, chapters in [('st-p-corps-cp', 'sciences-techno', ['cp'], ['cp-st-corps']), ('qlm-p-corps', 'qlm', ['ce1'], ['ce1-qlm-mouvement'])]:
    pairs_gen(gid, subject, levels, f'{subject}.p.corps', 'Nommer les articulations qui permettent les mouvements', 'Mon corps bouge : les articulations',
              'Associer chaque mouvement à l’articulation qui le permet.', chapters, 'Associe chaque mouvement à son articulation.', ARTIC, 'Mouvement', 'Articulation', 4)
OSM = [('Le crâne', 'os', 'il protège le cerveau'), ('Les côtes', 'os', 'elles protègent le cœur et les poumons'), ('Le fémur, dans la cuisse', 'os', 'le plus long os du corps'), ('La colonne vertébrale', 'os', None),
       ('Le genou', 'articulation', None), ('Le coude', 'articulation', None), ('L’épaule', 'articulation', None), ('La cheville', 'articulation', None), ('Le poignet', 'articulation', None),
       ('Le biceps, dans le bras', 'muscle', 'il se contracte pour plier le bras'), ('Le mollet', 'muscle', None), ('Les abdominaux', 'muscle', None), ('Le cœur', 'muscle', 'un muscle qui ne s’arrête jamais')]
cat2('qlm-p-os-muscles', 'qlm', ['ce1'], 'qlm.p.corps', '', 'Os, articulations et muscles', 'Les os forment le squelette, les articulations permettent de plier, les muscles font bouger les os.',
     ['ce1-qlm-mouvement'], 'Range : est-ce un os, une articulation ou un muscle ?', [('os', 'Os'), ('articulation', 'Articulation'), ('muscle', 'Muscle')], OSM, 7)

# Les cinq sens
SENS = [('La vue', 'les yeux'), ('L’ouïe', 'les oreilles'), ('L’odorat', 'le nez'), ('Le goût', 'la langue'), ('Le toucher', 'la peau')]
pairs_gen('st-p-sens', 'sciences-techno', ['cm1'], 'sciences-techno.p.cerveau', '', 'Les cinq sens', 'Associer chaque sens à son organe.', ['cm1-st-cerveau'], 'Associe chaque sens à son organe.', SENS, 'Sens', 'Organe', 5)

# Santé : bouger, dormir
SANTE = [('Dormir environ dix heures par nuit', 'bon', None), ('Jouer dehors et bouger chaque jour', 'bon', None), ('Boire de l’eau quand on a soif', 'bon', None), ('Se laver les mains avant de manger', 'bon', None),
         ('Prendre un petit-déjeuner', 'bon', None), ('Porter un casque à vélo', 'bon', None), ('Se brosser les dents matin et soir', 'bon', None),
         ('Regarder un écran juste avant de dormir', 'mauvais', 'la lumière des écrans retarde l’endormissement'), ('Grignoter des bonbons toute la journée', 'mauvais', None), ('Rester assis toute la journée sans bouger', 'mauvais', None),
         ('Se coucher très tard un jour d’école', 'mauvais', None), ('Sauter le petit-déjeuner', 'mauvais', None)]
cat2('qlm-p-sante', 'qlm', ['ce2'], 'qlm.p.sante', 'Adopter des habitudes bonnes pour la santé : bouger, dormir, manger', 'Bon pour ma santé ?', 'Activité physique, sommeil, hygiène : ce qui aide le corps et le cerveau.',
     ['ce2-qlm-activite'], 'Range : est-ce bon pour ta santé, ou pas ?', [('bon', 'Bon pour ma santé'), ('mauvais', 'À éviter')], SANTE, 6)

# Environnement : tri, gestes
TRI = [('Une bouteille en plastique', 'tri', None), ('Un journal', 'tri', None), ('Une boîte de conserve', 'tri', None), ('Une brique de lait', 'tri', None), ('Un carton de céréales', 'tri', None),
       ('Une bouteille en verre', 'verre', None), ('Un pot de confiture en verre', 'verre', 'sans son couvercle, qui va dans le bac de tri'),
       ('Des épluchures de carottes', 'compost', None), ('Un trognon de pomme', 'compost', None), ('Du marc de café', 'compost', None), ('Des coquilles d’œufs', 'compost', None),
       ('Une pile usagée', 'collecte', 'les piles contiennent des métaux polluants : on les rapporte en magasin'), ('Une vieille ampoule', 'collecte', None), ('Un vieux téléphone', 'collecte', None)]
GESTES = [('Éteindre la lumière en sortant d’une pièce', 'bon', None), ('Prendre une gourde plutôt qu’une bouteille jetable', 'bon', None), ('Aller à l’école à pied ou à vélo', 'bon', None), ('Écrire au recto et au verso des feuilles', 'bon', None),
          ('Fermer le robinet pendant qu’on se brosse les dents', 'bon', None), ('Trier ses déchets', 'bon', None),
          ('Laisser couler l’eau en se brossant les dents', 'mauvais', None), ('Jeter ses papiers par terre', 'mauvais', None), ('Laisser la télévision en veille toute la nuit', 'mauvais', None), ('Jeter le pain dur', 'mauvais', 'on peut en faire du pain perdu ou de la chapelure'), ('Chauffer avec les fenêtres ouvertes', 'mauvais', None)]
for gid, subject, levels, chapters in [('st-p-tri', 'sciences-techno', ['cp', 'cm2'], ['cp-st-proteger', 'cm2-st-environnement']), ('qlm-p-tri', 'qlm', ['ce2'], ['ce2-qlm-ecole']), ('hg-p-tri', 'hg', ['cm2'], ['cm2-hg-mieux-habiter'])]:
    cat2(gid, subject, levels, f'{subject}.p.tri', 'Trier ses déchets pour qu’ils soient recyclés', 'Où va ce déchet ?', 'Bac de tri, conteneur à verre, compost ou point de collecte (les consignes peuvent varier un peu selon la commune).',
         chapters, 'Où jettes-tu ce déchet ? (Les consignes peuvent varier un peu selon ta commune.)', [('tri', 'Bac de tri (emballages, papiers)'), ('verre', 'Conteneur à verre'), ('compost', 'Compost'), ('collecte', 'À rapporter en magasin ou en déchèterie')], TRI, 7)
    cat2(gid.replace('-tri', '-gestes'), subject, levels, f'{subject}.p.tri', '', 'Les bons gestes pour la planète', 'Ce qui économise l’eau, l’énergie et les ressources, et ce qui les gaspille.',
         chapters, 'Ce geste aide-t-il à protéger la planète ?', [('bon', 'Il protège la planète'), ('mauvais', 'Il gaspille ou pollue')], GESTES, 6)

# Histoire-géographie : paysages, milieux, ville, transports, Internet, industrie, cultures
PAYS = [('Une plage', 'littoral', None), ('Une falaise au bord de la mer', 'littoral', None), ('Un port de pêche', 'littoral', None), ('Un phare', 'littoral', None),
        ('Un sommet enneigé', 'montagne', None), ('Un téléphérique', 'montagne', None), ('Un glacier', 'montagne', None), ('Une station de ski', 'montagne', None),
        ('Un champ de blé', 'campagne', None), ('Une ferme', 'campagne', None), ('Un tracteur dans un pré', 'campagne', None), ('Un petit village entouré de champs', 'campagne', None),
        ('Des immeubles', 'ville', None), ('Une station de métro', 'ville', None), ('Des rues pleines de magasins', 'ville', None), ('Une grande gare', 'ville', None)]
cat2('hg-p-paysages', 'hg', ['ce1', 'ce2'], 'hg.p.paysages', 'Reconnaître les grands types de paysages de France', 'Les paysages de France', 'Littoral, montagne, campagne, ville : à quel paysage appartient chaque élément ?',
     ['ce1-hg-paysages', 'ce1-hg-habiter-circuler', 'ce2-hg-paysages-hier'], 'Dans quel paysage trouve-t-on surtout cela ?', [('littoral', 'Littoral'), ('montagne', 'Montagne'), ('campagne', 'Campagne'), ('ville', 'Ville')], PAYS, 8)
MILIEUX = [('Des dunes de sable à perte de vue', 'desert', None), ('Le dromadaire', 'desert', None), ('Une oasis avec des palmiers', 'desert', None), ('Presque jamais de pluie', 'desert', None),
           ('La banquise', 'polaire', None), ('L’ours blanc', 'polaire', None), ('Des nuits de plusieurs semaines en hiver', 'polaire', None), ('Le manchot empereur', 'polaire', 'il vit en Antarctique, au pôle Sud'),
           ('Des arbres immenses toujours verts', 'equatorial', None), ('Des pluies presque tous les jours', 'equatorial', None), ('Des singes dans les arbres', 'equatorial', None), ('Une pirogue sur un grand fleuve', 'equatorial', None),
           ('Des sommets très hauts et enneigés', 'montagne', None), ('Le yack', 'montagne', 'il vit dans les hautes montagnes d’Asie, comme l’Himalaya'), ('Des cultures en terrasses sur les pentes', 'montagne', None), ('Un air froid et léger en altitude', 'montagne', None)]
cat2('hg-p-milieux', 'hg', ['ce2'], 'hg.p.milieux', 'Caractériser quelques grands milieux de la planète', 'Les grands milieux de la planète',
     'Désert chaud, milieu polaire, forêt équatoriale, haute montagne : leurs paysages, leurs animaux, la vie des habitants.', ['ce2-hg-milieux', 'ce2-hg-vivre-ailleurs'],
     'À quel milieu appartient chaque élément ?', [('desert', 'Désert chaud'), ('polaire', 'Milieu polaire'), ('equatorial', 'Forêt équatoriale'), ('montagne', 'Haute montagne')], MILIEUX, 8)
LIEUX = [('La mairie', 'on s’y marie, on y déclare les naissances ; le maire y travaille'), ('L’hôpital', 'on y soigne les malades et les blessés'), ('La caserne des pompiers', 'on y part secourir les gens et éteindre les incendies'),
         ('La médiathèque', 'on y emprunte des livres, des films, de la musique'), ('La gare', 'on y prend le train'), ('La poste', 'on y envoie des lettres et des colis'), ('Le stade', 'on y fait du sport et on y regarde des matchs'),
         ('L’école', 'on y apprend à lire, écrire, compter'), ('La boulangerie', 'on y achète du pain'), ('Le commissariat', 'la police y travaille')]
for gid, levels, chapters in [('hg-p-lieux', ['cp', 'ce1', 'ce2'], ['cp-hg-quartier', 'ce1-hg-quartier', 'ce2-hg-ville']), ('hg-p-lieux-cm', ['cm2'], ['cm2-hg-mieux-habiter'])]:
    pairs_gen(gid, 'hg', levels, 'hg.p.lieux', 'Connaître les lieux et les services d’une commune', 'Les lieux de ma commune', 'Associer chaque lieu au service qu’il rend aux habitants.',
              chapters, 'Associe chaque lieu à ce qu’on y fait.', LIEUX, 'Lieu', 'On y…', 5)
TRANS = [('Le train', 'la gare'), ('L’avion', 'l’aéroport'), ('Le bateau', 'le port'), ('Le métro', 'la station de métro'), ('Le vélo', 'la piste cyclable'), ('Le bus', 'l’arrêt de bus'), ('La voiture', 'le parking')]
pairs_gen('hg-p-transports', 'hg', ['cm1', 'cm2'], 'hg.p.deplacer', 'Se déplacer : moyens de transport et infrastructures', 'Moyens de transport et lieux pour les prendre',
          'Associer chaque moyen de transport au lieu où on le prend ou à la voie qu’il utilise.', ['cm1-hg-se-deplacer', 'cm2-hg-deplacer-quotidien', 'cm2-hg-ville-a-ville'], 'Associe chaque moyen de transport à son lieu.', TRANS, 'Transport', 'Lieu', 5)
MODES = [('Marcher', 'doux', None), ('Le vélo', 'doux', None), ('La trottinette', 'doux', None), ('Le bus', 'commun', None), ('Le tramway', 'commun', None), ('Le métro', 'commun', None), ('Le train', 'commun', None),
         ('La voiture', 'individuel', 'souvent une seule personne à bord : beaucoup de pollution par voyageur'), ('La moto', 'individuel', None), ('Le scooter', 'individuel', None)]
cat2('hg-p-modes', 'hg', ['cm1', 'cm2'], 'hg.p.deplacer', '', 'Modes de déplacement', 'Déplacements doux, transports en commun, véhicules individuels à moteur : pour comparer leur effet sur l’environnement.',
     ['cm1-hg-se-deplacer', 'cm2-hg-deplacer-quotidien', 'cm2-hg-ville-a-ville'], 'Range chaque façon de se déplacer.', [('doux', 'Déplacement doux (sans moteur)'), ('commun', 'Transport en commun'), ('individuel', 'Véhicule individuel à moteur')], MODES, 6)
NET = [('Garder son mot de passe secret', 'bon', None), ('Demander à un adulte quand un message paraît bizarre', 'bon', None), ('Vérifier une information sur plusieurs sites', 'bon', None),
       ('Se déconnecter d’un ordinateur partagé', 'bon', None), ('Parler à un adulte de confiance en cas de moquerie en ligne', 'bon', None), ('Demander avant de publier la photo de quelqu’un', 'bon', None),
       ('Donner son adresse à un inconnu rencontré en ligne', 'eviter', None), ('Cliquer sur toutes les publicités', 'eviter', None), ('Utiliser le même mot de passe partout', 'eviter', None), ('Croire tout ce qu’on lit sur Internet', 'eviter', None), ('Publier la photo d’un camarade sans lui demander', 'eviter', None)]
cat2('hg-p-internet', 'hg', ['cm1', 'cm2'], 'hg.p.internet', 'Utiliser Internet de façon sûre et responsable', 'Bien se servir d’Internet', 'Les bons réflexes pour se protéger et respecter les autres en ligne.',
     ['cm1-hg-internet', 'cm2-hg-internet'], 'Est-ce un bon réflexe sur Internet ?', [('bon', 'Bon réflexe'), ('eviter', 'À éviter')], NET, 6)
NETV = [('Un navigateur', 'le logiciel qui permet d’aller sur les sites'), ('Un moteur de recherche', 'l’outil qui aide à trouver des pages sur un sujet'), ('Un courriel', 'un message envoyé par Internet'),
        ('Un mot de passe', 'le code secret qui protège un compte'), ('Une adresse de site (URL)', 'ce qu’on tape pour aller sur un site précis'), ('Une pièce jointe', 'un fichier envoyé avec un courriel'), ('Un réseau', 'des ordinateurs reliés entre eux')]
pairs_gen('hg-p-internet-mots', 'hg', ['cm1', 'cm2'], 'hg.p.internet', '', 'Les mots d’Internet', 'Associer chaque mot d’Internet à sa définition.', ['cm1-hg-internet', 'cm2-hg-internet'],
          'Associe chaque mot à sa définition.', NETV, 'Mot', 'Définition', 4)
INDUS = [('La machine à vapeur', 'elle fait tourner les machines des usines et avancer les locomotives'), ('La mine', 'on y extrait le charbon, sous la terre'), ('Le mineur', 'il travaille au fond de la mine'),
         ('L’usine', 'de nombreux ouvriers y fabriquent des objets en grande quantité avec des machines'), ('Le grand magasin', 'un magasin sur plusieurs étages qui vend de tout'), ('L’exode rural', 'le départ des habitants des campagnes vers les villes'),
         ('Le chemin de fer', 'le réseau de voies ferrées qui relie les villes')]
pairs_gen('hg-p-industrie', 'hg', ['cm2'], 'hg.p.industrie', 'Connaître le vocabulaire de l’âge industriel', 'Travailler et vivre à l’âge industriel', 'Machines à vapeur, mines, usines, grands magasins, exode rural : associer chaque mot à son explication.',
          ['cm2-hg-travail-industriel', 'cm2-hg-energies-machines'], 'Associe chaque mot à son explication.', INDUS, 'Mot', 'Explication', 4)
CULT = [('Le blé', 'tempere', None), ('La betterave à sucre', 'tempere', None), ('La pomme', 'tempere', None), ('La vigne', 'tempere', None), ('Le colza', 'tempere', None),
        ('Le cacao', 'tropical', 'la Côte d’Ivoire en est le premier producteur mondial'), ('Le café', 'tropical', None), ('La banane', 'tropical', None), ('La canne à sucre', 'tropical', None), ('L’ananas', 'tropical', None)]
cat2('hg-p-cultures', 'hg', ['cm1'], 'hg.p.nourrir', 'Se nourrir dans le monde : cultures des régions tempérées et tropicales', 'Où pousse ce que je mange ?',
     'Des cultures des régions tempérées, comme la France, et des cultures des régions tropicales, chaudes toute l’année.', ['cm1-hg-se-nourrir'], 'Où pousse surtout cette culture ?',
     [('tempere', 'Régions tempérées (comme la France)'), ('tropical', 'Régions tropicales (chaudes toute l’année)')], CULT, 6)

# Français : contes, fables, héros, phrase simple ou complexe
CONTES = [('Une pantoufle de verre', 'Cendrillon'), ('Une pomme empoisonnée', 'Blanche-Neige'), ('Des petits cailloux blancs', 'Le Petit Poucet'), ('Une maison en pain d’épices', 'Hansel et Gretel'),
          ('Un fuseau qui pique le doigt', 'La Belle au bois dormant'), ('Une galette et un petit pot de beurre', 'Le Petit Chaperon rouge'), ('Un chat malin chaussé de bottes', 'Le Chat botté'),
          ('Un haricot qui pousse jusqu’au ciel', 'Jack et le haricot magique'), ('Un petit pois sous vingt matelas', 'La Princesse au petit pois'), ('Une lampe d’où sort un génie', 'Aladin'),
          ('Des maisons de paille, de bois et de briques', 'Les Trois Petits Cochons'), ('Une très longue chevelure pour grimper dans la tour', 'Raiponce')]
pairs_gen('fr-p-contes', 'francais', ['ce2', 'cm1', 'cm2'], 'fp.litterature', 'Connaître des contes, des fables et des héros de la littérature', 'Les contes merveilleux',
          'Retrouver le conte de chaque objet magique ou de chaque détail célèbre.', ['ce2-f-lecteur', 'cm1-f-merveilleux', 'cm2-f-merveilleux'], 'Associe chaque détail au conte d’où il vient.', CONTES, 'Détail', 'Conte', 5)
FABLES = [('Le Corbeau et le Renard', '« Tout flatteur vit aux dépens de celui qui l’écoute. »'), ('Le Lièvre et la Tortue', '« Rien ne sert de courir ; il faut partir à point. »'),
          ('Le Lion et le Rat', '« On a souvent besoin d’un plus petit que soi. »'), ('Le Loup et l’Agneau', '« La raison du plus fort est toujours la meilleure. »'),
          ('Le Renard et la Cigogne', '« Trompeurs, c’est pour vous que j’écris : attendez-vous à la pareille. »'), ('Le Rat de ville et le Rat des champs', '« Fi du plaisir que la crainte peut corrompre. »'),
          ('Le Laboureur et ses Enfants', '« Travaillez, prenez de la peine : c’est le fonds qui manque le moins. »')]
pairs_gen('fr-p-fables', 'francais', ['cm1', 'cm2'], 'fp.litterature', '', 'Les fables de La Fontaine et leur morale', 'Associer des fables de Jean de La Fontaine à leur morale.',
          ['cm1-f-morale', 'cm2-f-morale'], 'Associe chaque fable de La Fontaine à sa morale.', FABLES, 'Fable', 'Morale', 4)
HEROS = [('Hercule', 'accomplit douze travaux'), ('Ulysse', 'met dix ans à rentrer chez lui, à Ithaque, après la guerre de Troie'), ('Thésée', 'affronte le Minotaure dans le labyrinthe'),
         ('Persée', 'coupe la tête de Méduse sans la regarder'), ('Jason', 'part chercher la Toison d’or'), ('Robin des Bois', 'vole aux riches pour donner aux pauvres'),
         ('Pinocchio', 'est une marionnette de bois dont le nez s’allonge quand il ment'), ('Peter Pan', 'ne veut pas grandir et vit au Pays imaginaire')]
pairs_gen('fr-p-heros', 'francais', ['cm1', 'cm2'], 'fp.litterature', '', 'Héroïnes et héros', 'Des héros des mythes et des livres, et leurs exploits.', ['cm1-f-heros', 'cm2-f-heros', 'cm1-f-autres-vies', 'cm2-f-autres-vies'],
          'Associe chaque héros à son aventure.', HEROS, 'Héros', 'Aventure', 4)
AUTEURS = [('Le Petit Prince', 'Antoine de Saint-Exupéry'), ('Alice au pays des merveilles', 'Lewis Carroll'), ('Le Livre de la jungle', 'Rudyard Kipling'), ('Fifi Brindacier', 'Astrid Lindgren'),
           ('Charlie et la chocolaterie', 'Roald Dahl'), ('Le Petit Nicolas', 'René Goscinny et Jean-Jacques Sempé'), ('Les Aventures de Tom Sawyer', 'Mark Twain'), ('Pinocchio', 'Carlo Collodi'),
           ('Robinson Crusoé', 'Daniel Defoe'), ('Les contes de Cendrillon et du Petit Poucet', 'Charles Perrault'), ('Le Corbeau et le Renard', 'Jean de La Fontaine'), ('L’Odyssée', 'Homère')]
pairs_gen('fr-p-auteurs', 'francais', ['cm1', 'cm2'], 'fp.litterature', '', 'Des livres et leurs auteurs', 'Associer des œuvres célèbres de la littérature de jeunesse à leur auteur.',
          ['cm1-f-heros', 'cm2-f-heros', 'cm1-f-soi', 'cm2-f-soi'], 'Associe chaque livre à son auteur.', AUTEURS, 'Livre', 'Auteur', 4)
COMPLEXE = [('Le chat dort.', 'simple', None), ('Les enfants jouent dans la cour pendant la récréation.', 'simple', None), ('Mon frère lit une bande dessinée.', 'simple', None),
            ('Pendant les vacances d’été, toute la famille part à la mer.', 'simple', None), ('Au fond du jardin pousse un grand cerisier.', 'simple', None), ('Ma grand-mère prépare une tarte aux pommes.', 'simple', None),
            ('Le chat dort et le chien joue.', 'complexe', 'deux verbes conjugués : dort, joue'), ('Quand il pleut, nous restons à la maison.', 'complexe', 'deux verbes conjugués : pleut, restons'),
            ('Je pense que tu as raison.', 'complexe', None), ('Elle ouvre la porte, entre et s’assoit.', 'complexe', 'trois verbes conjugués'), ('Le film que nous avons vu était drôle.', 'complexe', None),
            ('Il faisait nuit quand le train est arrivé.', 'complexe', None)]
cat2('fr-p-phrase-complexe', 'francais', ['cm2'], 'fp.phrase-complexe', 'Distinguer phrase simple et phrase complexe', 'Phrase simple ou phrase complexe ?',
     'Une phrase simple a un seul verbe conjugué ; une phrase complexe en a plusieurs.', ['cm2-f-phrase-complexe'], 'Compte les verbes conjugués : la phrase est-elle simple ou complexe ?',
     [('simple', 'Phrase simple (un verbe conjugué)'), ('complexe', 'Phrase complexe (plusieurs verbes conjugués)')], COMPLEXE, 6)
RIMES = [('bateau', 'gâteau'), ('ballon', 'mouton'), ('lapin', 'sapin'), ('souris', 'tapis'), ('chaussette', 'trompette'), ('hibou', 'genou'), ('soleil', 'abeille'), ('étoile', 'voile'),
         ('fleur', 'couleur'), ('grenouille', 'citrouille'), ('lune', 'prune'), ('carotte', 'marmotte'), ('tortue', 'statue'), ('neige', 'manège')]
pairs_gen('fr-p-rimes', 'francais', ['cp', 'ce1', 'cm1', 'cm2'], 'fp.rimes', 'Reconnaître des mots qui riment', 'Les mots qui riment', 'Associer deux mots qui se terminent par le même son : pour jouer avec les mots, en poésie.',
          ['cp-f-code-1', 'ce1-f-decodage', 'cm1-f-poesie', 'cm2-f-poesie'], 'Associe chaque mot au mot qui rime avec lui.', RIMES, 'Mot', 'Rime avec', 5)

TTX = [('Enregistrer', 'garder son texte pour le retrouver plus tard'), ('Annuler', 'revenir en arrière après une erreur'), ('Copier puis coller', 'recopier un morceau de texte ailleurs sans le retaper'),
       ('Mettre en gras', 'rendre des lettres plus épaisses pour les faire ressortir'), ('Imprimer', 'sortir son texte sur une feuille de papier'), ('La touche Majuscule', 'écrire une lettre capitale'),
       ('La barre d’espace', 'séparer deux mots'), ('La touche Entrée', 'aller à la ligne'), ('La touche Retour arrière', 'effacer la lettre à gauche du curseur')]
pairs_gen('qlm-p-traitement-texte', 'qlm', ['ce1', 'ce2'], 'qlm.p.numerique', 'Utiliser un traitement de texte : saisir, mettre en forme, enregistrer', 'Le traitement de texte',
          'Les commandes et les touches utiles pour écrire à l’ordinateur.', ['ce1-qlm-numerique', 'ce2-qlm-numerique'], 'Associe chaque commande ou touche à ce qu’elle permet de faire.', TTX, 'Commande', 'Elle sert à…', 5)

# ---------------- Lycée : frises chronologiques ----------------
chrono('hg-l-chrono-2nde', ['2nde'], 'hg.l.chronologie-2nde', 'Situer des repères de l’Empire romain aux Lumières', 'Repères d’histoire de seconde : de Rome aux Lumières',
       'Des dates sûres de l’Antiquité tardive au XVIIIe siècle : les ranger sur une frise, ou retrouver l’année.',
       ['2nde-hg-h0-periodisation', '2nde-hg-h1-antiquite', '2nde-hg-h1-moyen-age', '2nde-hg-h2-atlantique', '2nde-hg-h2-renaissance', '2nde-hg-h3-france', '2nde-hg-h3-angleterre', '2nde-hg-h4-lumieres'], [
    ('L’édit de Caracalla donne la citoyenneté romaine à presque tous les hommes libres de l’Empire', 212, 'IIIe siècle'),
    ('Fin de l’Empire romain d’Occident', 476, 'fin du Ve siècle'),
    ('Les croisés prennent Jérusalem', 1099, 'fin du XIe siècle'),
    ('Les Ottomans prennent Constantinople', 1453, 'milieu du XVe siècle'),
    ('Premier voyage de Christophe Colomb vers l’Amérique', 1492, 'fin du XVe siècle'),
    ('Traité de Tordesillas entre l’Espagne et le Portugal', 1494, 'deux ans après le voyage de Colomb'),
    ('Martin Luther publie ses 95 thèses', 1517, 'début du XVIe siècle'),
    ('Fin du premier tour du monde, commencé par Magellan', 1522, 'début du XVIe siècle'),
    ('Édit de Nantes', 1598, 'fin du XVIe siècle'),
    ('Début du règne personnel de Louis XIV', 1661, 'XVIIe siècle'),
    ('Habeas Corpus en Angleterre', 1679, 'fin du XVIIe siècle'),
    ('Newton publie les Principia', 1687, 'fin du XVIIe siècle'),
    ('Bill of Rights en Angleterre', 1689, 'fin du XVIIe siècle'),
    ('Premier volume de l’Encyclopédie de Diderot et d’Alembert', 1751, 'milieu du XVIIIe siècle'),
])
chrono('hg-l-chrono-1re', ['1re'], 'hg.l.chronologie-1re', 'Situer des repères de 1789 à 1919', 'Repères d’histoire de première : de 1789 à 1919',
       'De la Révolution à la sortie de la Première Guerre mondiale : les ranger sur une frise, ou retrouver l’année.',
       ['1re-hg-h1-revolution', '1re-hg-h1-restauration', '1re-hg-h2-democratie', '1re-hg-h2-nouveaux-etats', '1re-hg-h3-republique', '1re-hg-h3-societe', '1re-hg-h3-colonies', '1re-hg-h4-embrasement', '1re-hg-h4-societes', '1re-hg-h4-sortir'], [
    ('Prise de la Bastille', 1789, 'fin du XVIIIe siècle'),
    ('Proclamation de la Première République', 1792, 'trois ans après la prise de la Bastille'),
    ('Sacre de Napoléon Ier', 1804, 'début du XIXe siècle'),
    ('Bataille de Waterloo', 1815, 'fin de l’Empire'),
    ('Les Trois Glorieuses à Paris', 1830, 'XIXe siècle'),
    ('Abolition de l’esclavage dans les colonies françaises et suffrage universel masculin', 1848, 'Deuxième République'),
    ('Début du Second Empire', 1852, 'milieu du XIXe siècle'),
    ('Proclamation du royaume d’Italie', 1861, 'milieu du XIXe siècle'),
    ('Proclamation de la Troisième République', 1870, 'guerre contre la Prusse'),
    ('Commune de Paris', 1871, 'juste après la guerre de 1870'),
    ('Loi Ferry rendant l’école primaire obligatoire', 1882, 'années 1880'),
    ('Début de l’affaire Dreyfus', 1894, 'fin du XIXe siècle'),
    ('Loi de séparation des Églises et de l’État', 1905, 'début du XXe siècle'),
    ('Début de la Première Guerre mondiale', 1914, 'début du XXe siècle'),
    ('Bataille de Verdun', 1916, 'au milieu de la guerre'),
    ('Armistice de la Première Guerre mondiale', 1918, 'fin de la guerre'),
    ('Traité de Versailles', 1919, 'l’année après l’armistice'),
])
chrono('hg-l-chrono-tle', ['tle'], 'hg.l.chronologie-tle', 'Situer des repères de 1929 à nos jours', 'Repères d’histoire de terminale : de 1929 à nos jours',
       'De la crise de 1929 à l’Union européenne : les ranger sur une frise, ou retrouver l’année.',
       ['tle-hg-h1-crise-1929', 'tle-hg-h1-totalitarismes', 'tle-hg-h1-guerre', 'tle-hg-h2-ordre-mondial', 'tle-hg-h2-bipolarisation', 'tle-hg-h2-france', 'tle-hg-h3-equilibres', 'tle-hg-h3-france', 'tle-hg-h4-puissances', 'tle-hg-h4-europe', 'tle-hg-h4-republique'], [
    ('Krach de Wall Street', 1929, 'entre-deux-guerres'),
    ('Hitler devient chancelier', 1933, 'années 1930'),
    ('Victoire du Front populaire', 1936, 'années 1930'),
    ('Début de la Seconde Guerre mondiale', 1939, 'fin des années 1930'),
    ('Appel du 18 Juin du général de Gaulle', 1940, 'début de la guerre'),
    ('Débarquement en Normandie ; droit de vote des femmes en France', 1944, 'fin de la guerre'),
    ('Création de l’ONU', 1945, 'fin de la guerre'),
    ('Doctrine Truman : début de la guerre froide', 1947, 'après-guerre'),
    ('Création de l’OTAN', 1949, 'fin des années 1940'),
    ('Traité de Rome', 1957, 'années 1950'),
    ('Naissance de la Cinquième République', 1958, 'fin des années 1950'),
    ('Construction du mur de Berlin', 1961, 'années 1960'),
    ('Indépendance de l’Algérie', 1962, 'années 1960'),
    ('Mai 68', 1968, 'fin des années 1960'),
    ('Premier choc pétrolier', 1973, 'années 1970'),
    ('Loi Veil sur l’interruption volontaire de grossesse', 1975, 'années 1970'),
    ('Abolition de la peine de mort en France', 1981, 'années 1980'),
    ('Chute du mur de Berlin', 1989, 'fin des années 1980'),
    ('Disparition de l’URSS', 1991, 'début des années 1990'),
    ('Traité de Maastricht', 1992, 'début des années 1990'),
    ('Attentats du 11 septembre aux États-Unis', 2001, 'début du XXIe siècle'),
    ('Pièces et billets en euros', 2002, 'début du XXIe siècle'),
])

# ---------------- Lycée : associations (quêtes et jeu de mémoire) ----------------
UNITES = [('Une force', 'le newton (N)'), ('Une énergie', 'le joule (J)'), ('Une puissance', 'le watt (W)'), ('Une pression', 'le pascal (Pa)'), ('Une charge électrique', 'le coulomb (C)'),
          ('Une tension électrique', 'le volt (V)'), ('Une intensité électrique', 'l’ampère (A)'), ('Une fréquence', 'le hertz (Hz)'), ('Une résistance', 'l’ohm (Ω)'), ('Une quantité de matière', 'la mole (mol)')]
pairs_gen('pc-l-unites', 'pc', ['2nde', '1re', 'tle'], 'pc.l.unites', 'Associer une grandeur physique à son unité du Système international', 'Grandeurs et unités',
          'Associer chaque grandeur à son unité du Système international.', ['2nde-pc-electricite', '2nde-pc-forces', '1re-pc-energie-electrique', '1re-pc-fluides', 'tle-pc-circuit-rc', 'tle-pc-newton'],
          'Associe chaque grandeur à son unité.', UNITES, 'Grandeur', 'Unité', 5)
ORGANITES = [('Le noyau', 'contient l’ADN'), ('La mitochondrie', 'siège de la respiration cellulaire'), ('Le chloroplaste', 'siège de la photosynthèse'), ('Le ribosome', 'fabrique les protéines'),
             ('La membrane plasmique', 'contrôle les échanges avec l’extérieur'), ('La paroi', 'rigidifie la cellule végétale'), ('La vacuole', 'stocke de l’eau et des substances')]
pairs_gen('svt-l-organites', 'svt', ['2nde'], 'svt.l.organites', 'Associer les éléments de la cellule à leur rôle', 'La cellule et ses organites',
          'Associer chaque élément de la cellule à son rôle.', ['2nde-svt-cellules', '2nde-svt-metabolisme'], 'Associe chaque élément de la cellule à son rôle.', ORGANITES, 'Élément', 'Rôle', 5)
DERIVEES = [('x²', '2x'), ('x³', '3x²'), ('x⁴', '4x³'), ('1/x', '−1/x²'), ('√x', '1/(2√x)'), ('e^(2x)', '2e^(2x)'), ('5x + 3', '5'), ('7 (une constante)', '0')]
pairs_gen('maths-l-derivees', 'maths', ['1re', 'tle'], 'maths.l.derivees', 'Connaître les dérivées des fonctions usuelles', 'Fonctions et dérivées',
          'Associer chaque fonction à sa fonction dérivée.', ['1re-m-fonction-derivee', 'tle-m-derivation'], 'Associe chaque fonction à sa dérivée.', DERIVEES, 'Fonction', 'Dérivée', 5)
CAPITALES = [('La Chine', 'Pékin'), ('L’Inde', 'New Delhi'), ('Le Brésil', 'Brasília'), ('Les États-Unis', 'Washington'), ('Le Canada', 'Ottawa'), ('L’Australie', 'Canberra'), ('Le Japon', 'Tokyo'),
             ('La Russie', 'Moscou'), ('Le Nigeria', 'Abuja'), ('L’Égypte', 'Le Caire'), ('Le Mexique', 'Mexico'), ('L’Argentine', 'Buenos Aires'), ('La Turquie', 'Ankara'), ('Le Maroc', 'Rabat')]
pairs_gen('hg-l-capitales', 'hg', ['2nde', '1re', 'tle'], 'hg.l.capitales', 'Connaître les capitales de grands pays du monde', 'Grands pays du monde et leur capitale',
          'Associer de grands pays du monde à leur capitale (souvent différente de la plus grande ville).', ['2nde-hg-g2-developpement', '2nde-hg-g3-migrations', '2nde-hg-g3-tourisme', '1re-hg-g1-metropoles', 'tle-hg-g2-integration'],
          'Associe chaque pays à sa capitale.', CAPITALES, 'Pays', 'Capitale', 5)
PHILO_A = [('Platon', 'La République'), ('Aristote', 'Éthique à Nicomaque'), ('Descartes', 'Discours de la méthode'), ('Pascal', 'Pensées'), ('Spinoza', 'Éthique'), ('Hobbes', 'Léviathan'),
           ('Rousseau', 'Du contrat social'), ('Kant', 'Critique de la raison pure'), ('Montesquieu', 'De l’esprit des lois'), ('Nietzsche', 'Ainsi parlait Zarathoustra'), ('Sartre', 'L’existentialisme est un humanisme'), ('Simone de Beauvoir', 'Le Deuxième Sexe')]
pairs_gen('philo-l-auteurs', 'philo', ['tle'], 'philo.l.auteurs', 'Associer des philosophes à leurs œuvres', 'Philosophes et œuvres',
          'Associer chaque philosophe à l’une de ses œuvres majeures.', ['philo-tle-2019-notions', 'philo-tle-2019-perspectives'], 'Associe chaque philosophe à son œuvre.', PHILO_A, 'Philosophe', 'Œuvre', 5)

# ---------------- Frises : CE2, 6e, 3e (quête de l'année, frise chronologique, jeu de mémoire) ----------------
def chrono_approx(gid, levels, sid, slabel, label, desc, chapters, events):
    """Frise aux dates parfois approximatives (Préhistoire) : seulement « ranger sur une frise », jamais « retrouver l'année »."""
    skill(sid, 'hg', slabel, levels[0])
    add({'id': gid, 'label': label, 'subject': 'hg', 'levels': levels, 'skill': sid, 'kind': 'chronologie', 'chapters': chapters, 'description': desc,
         'options': [{'id': 'mode', 'label': 'Exercice', 'values': [{'id': 'frise', 'label': 'Ranger sur une frise'}]}],
         'data': {'mode': 'frise', 'events': [dict(label=l, year=y, hint=h, **(dict(circa=True) if c else dict())) for l, y, c, h in events]}})
chrono_approx('hg-p-chrono-ce2', ['ce2'], 'hg.p.chronologie-ce2', 'Situer des événements et des personnages sur une frise, de la Préhistoire à nos jours', 'Grandes périodes : de la Préhistoire à nos jours',
       'De Lascaux aux premiers pas sur la Lune : ranger des événements dans l’ordre du temps.',
       ['ce2-hg-frise', 'ce2-hg-periodes', 'ce2-hg-personnages', 'ce2-hg-vivre-autrefois'], [
    ('Des artistes de la Préhistoire peignent la grotte de Lascaux', -15000, True, 'Préhistoire : il y a environ 17 000 ans.'),
    ('Invention de l’écriture en Mésopotamie', -3300, True, 'La fin de la Préhistoire et le début de l’Antiquité.'),
    ('Construction de la grande pyramide de Khéops, en Égypte', -2560, True, 'Antiquité : il y a plus de 4 500 ans.'),
    ('Jules César gagne la bataille d’Alésia contre Vercingétorix', -52, False, 'Antiquité, avant la naissance de Jésus-Christ (« avant J.-C. »).'),
    ('Fin de l’Empire romain d’Occident : début du Moyen Âge', 476, False, 'Fin du Ve siècle.'),
    ('Charlemagne est couronné empereur', 800, False, 'Une année toute ronde, au Moyen Âge.'),
    ('Jeanne d’Arc délivre Orléans', 1429, False, 'Moyen Âge, pendant la guerre de Cent Ans.'),
    ('Christophe Colomb arrive en Amérique', 1492, False, 'Fin du Moyen Âge, début des Temps modernes.'),
    ('Louis XIV devient roi', 1643, False, 'Temps modernes, XVIIe siècle.'),
    ('La prise de la Bastille, début de la Révolution française', 1789, False, 'Le début de l’époque contemporaine.'),
    ('Napoléon Ier est sacré empereur', 1804, False, 'Début du XIXe siècle.'),
    ('Graham Bell invente le téléphone', 1876, False, 'XIXe siècle.'),
    ('Premier vol d’un avion à moteur, par les frères Wright', 1903, False, 'Début du XXe siècle.'),
    ('Les premiers humains marchent sur la Lune', 1969, False, 'Deuxième moitié du XXe siècle.'),
    ('Les pièces et billets en euros arrivent en France', 2002, False, 'Début du XXIe siècle.')])
chrono_approx('hg6-chronologie', ['6e'], 'hg.6e.chronologie', 'Situer les grands repères de la Préhistoire et de l’Antiquité', 'Repères de 6e : de la Préhistoire à la fin de l’Antiquité',
       'Des premiers outils à la fin de l’Empire romain : ranger les repères dans l’ordre du temps.',
       ['6e-hg-debuts-humanite', '6e-hg-neolithique', '6e-hg-premiers-etats', '6e-hg-cites-grecques', '6e-hg-rome', '6e-hg-monotheisme', '6e-hg-empire-romain', '6e-hg-chretiens', '6e-hg-route-soie'], [
    ('Premiers outils de pierre taillée, en Afrique', -3300000, True, 'Il y a plus de 3 millions d’années.'),
    ('Les humains maîtrisent le feu', -400000, True, 'Il y a environ 400 000 ans.'),
    ('Premiers Homo sapiens, en Afrique', -300000, True, 'Il y a environ 300 000 ans (fossiles du Djebel Irhoud, au Maroc).'),
    ('Peintures de la grotte Chauvet', -34000, True, 'Il y a environ 36 000 ans.'),
    ('Début du Néolithique au Proche-Orient : premiers villages d’agriculteurs', -10000, True, 'Il y a environ 12 000 ans.'),
    ('Invention de l’écriture en Mésopotamie', -3300, True, 'IVe millénaire av. J.-C.'),
    ('Code de Hammurabi, roi de Babylone', -1750, True, 'XVIIIe siècle av. J.-C.'),
    ('Premiers Jeux olympiques à Olympie, selon la tradition', -776, False, 'VIIIe siècle av. J.-C.'),
    ('Fondation de Rome, selon la légende', -753, False, 'VIIIe siècle av. J.-C. : Romulus et Remus.'),
    ('Clisthène fonde la démocratie à Athènes', -508, False, 'Fin du VIe siècle av. J.-C.'),
    ('Début de la construction du Parthénon, sous Périclès', -447, False, 'Ve siècle av. J.-C.'),
    ('Mort d’Alexandre le Grand à Babylone', -323, False, 'IVe siècle av. J.-C.'),
    ('Ouverture de la route de la soie sous la dynastie Han', -130, True, 'IIe siècle av. J.-C.'),
    ('Jules César remporte la bataille d’Alésia', -52, False, 'Ier siècle av. J.-C.'),
    ('Auguste devient le premier empereur romain', -27, False, 'Fin du Ier siècle av. J.-C.'),
    ('Les Romains détruisent le Temple de Jérusalem', 70, False, 'Ier siècle apr. J.-C.'),
    ('Édit de Caracalla : presque tous les hommes libres de l’Empire deviennent citoyens romains', 212, False, 'IIIe siècle.'),
    ('Édit de Milan : Constantin autorise le christianisme', 313, False, 'Début du IVe siècle.'),
    ('Le christianisme devient la religion officielle de l’Empire romain', 380, False, 'Fin du IVe siècle, sous Théodose.'),
    ('Fin de l’Empire romain d’Occident', 476, False, 'Fin du Ve siècle : début du Moyen Âge.')])
chrono('hg3-chronologie', ['3e'], 'hg.3e.chronologie', 'Situer les grands repères de 1914 à nos jours', 'Repères de 3e : de 1914 à nos jours',
       'De la Grande Guerre à l’euro : ranger les repères, ou retrouver l’année.',
       ['3e-hg-h1-1914', '3e-hg-h1-entre-deux-guerres', '3e-hg-h1-1939', '3e-hg-h1-vichy', '3e-hg-h2-independances', '3e-hg-h2-guerre-froide', '3e-hg-h2-europe', '3e-hg-h2-apres-1989', '3e-hg-h3-refonder', '3e-hg-h3-ve-republique', '3e-hg-h3-societe'], [
    ('Début de la Première Guerre mondiale', 1914, 'Le 28 juillet en Europe ; la France entre en guerre début août.'),
    ('Bataille de Verdun', 1916, 'Au milieu de la Grande Guerre.'), ('Révolution bolchevique en Russie', 1917, 'Lénine prend le pouvoir en octobre.'),
    ('Armistice de la Première Guerre mondiale', 1918, 'Le 11 novembre.'), ('Krach de la Bourse de New York', 1929, 'Le « jeudi noir », en octobre.'),
    ('Hitler devient chancelier en Allemagne', 1933, 'Quatre ans après le krach.'), ('Le Front populaire au pouvoir en France', 1936, 'Les premiers congés payés.'),
    ('Début de la Seconde Guerre mondiale', 1939, 'Le 1er septembre, l’Allemagne envahit la Pologne.'), ('Appel du général de Gaulle, le 18 juin', 1940, 'L’année de la défaite française.'),
    ('Débarquement allié en Normandie', 1944, 'Le 6 juin.'), ('Capitulation de l’Allemagne nazie', 1945, 'Le 8 mai.'),
    ('Indépendance de l’Inde', 1947, 'Deux ans après la fin de la guerre.'), ('Traité de Rome : naissance de la Communauté économique européenne', 1957, 'Un an avant la Ve République.'),
    ('Naissance de la Ve République', 1958, 'La Constitution est adoptée en octobre.'), ('Construction du mur de Berlin', 1961, 'En pleine guerre froide.'),
    ('Fin de la guerre d’Algérie (accords d’Évian)', 1962, 'Au début des années 1960.'), ('La majorité passe de 21 à 18 ans en France', 1974, 'Milieu des années 1970.'),
    ('Abolition de la peine de mort en France', 1981, 'Début des années 1980.'), ('Chute du mur de Berlin', 1989, 'Le 9 novembre, deux cents ans après la Révolution française.'),
    ('Fin de l’URSS', 1991, 'En décembre.'), ('Traité de Maastricht : naissance de l’Union européenne', 1992, 'Signé en février.'),
    ('Attentats du 11 septembre aux États-Unis', 2001, 'Début du XXIe siècle.'), ('L’euro devient la monnaie de tous les jours', 2002, 'Pièces et billets, le 1er janvier.')])

# ---------------- Frise des inventions (CM2 en histoire, technologie au collège) ----------------
INVENTIONS = [
    ('Gutenberg imprime des livres avec des caractères mobiles', 1450, True, 'Milieu du XVe siècle.'),
    ('Blaise Pascal invente une machine à calculer, la Pascaline', 1642, False, 'XVIIe siècle.'),
    ('James Watt perfectionne la machine à vapeur', 1769, False, 'Fin du XVIIIe siècle : le début de la révolution industrielle.'),
    ('Premier vol habité en montgolfière', 1783, False, 'Quelques années avant la Révolution française.'),
    ('Edward Jenner met au point le premier vaccin, contre la variole', 1796, False, 'Fin du XVIIIe siècle.'),
    ('Alessandro Volta invente la pile électrique', 1800, False, 'Une année toute ronde.'),
    ('Nicéphore Niépce réalise la première photographie', 1827, True, 'Début du XIXe siècle.'),
    ('Premier message télégraphique en code Morse', 1844, False, 'Milieu du XIXe siècle.'),
    ('Graham Bell dépose le brevet du téléphone', 1876, False, 'XIXe siècle.'),
    ('Thomas Edison présente une ampoule électrique durable', 1879, False, 'Fin du XIXe siècle.'),
    ('Carl Benz construit une automobile à moteur à essence', 1886, False, 'Fin du XIXe siècle.'),
    ('Les frères Lumière présentent le cinématographe', 1895, False, 'Fin du XIXe siècle.'),
    ('Premier vol d’un avion à moteur, par les frères Wright', 1903, False, 'Début du XXe siècle.'),
    ('Mise en service de l’ordinateur électronique ENIAC', 1946, False, 'Juste après la Seconde Guerre mondiale.'),
    ('Invention du transistor', 1947, False, 'Il remplace les lampes et permet de miniaturiser l’électronique.'),
    ('Lancement de Spoutnik, le premier satellite artificiel', 1957, False, 'En pleine guerre froide.'),
    ('Les premiers humains marchent sur la Lune', 1969, False, 'Fin des années 1960.'),
    ('Premier microprocesseur', 1971, False, 'Début des années 1970.'),
    ('Premier appel avec un téléphone portable', 1973, False, 'Années 1970.'),
    ('Tim Berners-Lee propose le World Wide Web au CERN', 1989, False, 'Fin des années 1980.'),
    ('Le premier iPhone popularise le smartphone à écran tactile', 2007, False, 'Début du XXIe siècle.'),
]
def chrono_subject(gid, subject, levels, sid, slabel, label, desc, chapters, events):
    skill(sid, subject, slabel, levels[0])
    add({'id': gid, 'label': label, 'subject': subject, 'levels': levels, 'skill': sid, 'kind': 'chronologie', 'chapters': chapters, 'description': desc,
         'options': [{'id': 'mode', 'label': 'Exercice', 'values': [{'id': 'frise', 'label': 'Ranger sur une frise'}, {'id': 'date', 'label': 'Retrouver l’année'}]}],
         'data': {'events': [dict(label=l, year=y, hint=h, **(dict(circa=True) if c else dict())) for l, y, c, h in events]}})
chrono_subject('hg-p-inventions', 'hg', ['cm2'], 'hg.p.inventions', 'Situer de grandes inventions dans le temps', 'Inventions et découvertes : de l’imprimerie au smartphone',
       'De Gutenberg à Internet : ranger les grandes inventions dans l’ordre du temps.', ['cm2-hg-energies-machines'], INVENTIONS)
chrono_subject('tc-inventions', 'techno', ['5e', '4e', '3e'], 'tc.inventions', 'Situer l’évolution des objets techniques dans le temps', 'Inventions et objets techniques : une frise',
       'L’évolution des objets techniques, de l’imprimerie au smartphone : ranger les inventions, ou retrouver l’année.',
       ['t5-ch-evolution', 't4-ch-evolution', 'techno-c4-2024-theme-1'], INVENTIONS)

# ---------------- Frises : histoire des arts (collège), histoire des sciences (3e, enseignement scientifique) ----------------
ARTS = [
    ('Des artistes de la Préhistoire peignent la grotte de Lascaux', -15000, True, 'Il y a environ 17 000 ans.'),
    ('Construction de la grande pyramide de Khéops, à Gizeh', -2560, True, 'Égypte ancienne.'),
    ('Début de la construction du Parthénon, à Athènes', -447, False, 'Ve siècle av. J.-C.'),
    ('Broderie de la tapisserie de Bayeux', 1070, True, 'XIe siècle, après la conquête de l’Angleterre.'),
    ('Début de la construction de Notre-Dame de Paris', 1163, False, 'XIIe siècle : l’art gothique.'),
    ('Giotto peint les fresques de la chapelle des Scrovegni, à Padoue', 1305, True, 'Début du XIVe siècle.'),
    ('Léonard de Vinci commence La Joconde', 1503, False, 'Renaissance, début du XVIe siècle.'),
    ('Michel-Ange achève le plafond de la chapelle Sixtine', 1512, False, 'Renaissance.'),
    ('Vermeer peint La Jeune Fille à la perle', 1665, True, 'XVIIe siècle.'),
    ('Louis XIV installe la cour au château de Versailles', 1682, False, 'Fin du XVIIe siècle.'),
    ('Delacroix peint La Liberté guidant le peuple', 1830, False, 'L’année d’une révolution à Paris.'),
    ('Monet peint Impression, soleil levant, qui donne son nom à l’impressionnisme', 1872, False, 'Fin du XIXe siècle.'),
    ('Van Gogh peint ses Tournesols', 1888, False, 'Un an avant l’inauguration de la tour Eiffel.'),
    ('Inauguration de la tour Eiffel', 1889, False, 'Pour l’Exposition universelle.'),
    ('Picasso peint Les Demoiselles d’Avignon, aux débuts du cubisme', 1907, False, 'Début du XXe siècle.'),
    ('Marcel Duchamp présente Fontaine, un ready-made', 1917, False, 'Pendant la Première Guerre mondiale.'),
    ('Picasso peint Guernica', 1937, False, 'Pendant la guerre d’Espagne.'),
    ('Andy Warhol crée ses portraits de Marilyn (pop art)', 1962, False, 'Années 1960.'),
    ('Inauguration du Centre Pompidou, à Paris', 1977, False, 'Fin des années 1970.'),
    ('Christo emballe le Pont-Neuf, à Paris', 1985, False, 'Années 1980.'),
    ('Inauguration de la pyramide du Louvre', 1989, False, 'Deux cents ans après la Révolution.'),
]
chrono_subject('arts-frise', 'arts-plastiques', ['5e', '4e', '3e'], 'arts.frise', 'Situer des œuvres et des monuments dans l’histoire des arts', 'Histoire des arts : de Lascaux à la pyramide du Louvre',
       'Des œuvres et des monuments célèbres à ranger dans l’ordre du temps.', ['arts-plastiques-2020-cycle-4', 'arts5-ch-narration', 'arts4-ch-images', 'arts4-ch-statut-objet', 'arts4-ch-metissages'], ARTS)
SCIENCES = [
    ('Ératosthène estime la circonférence de la Terre', -240, True, 'IIIe siècle av. J.-C.'),
    ('Copernic affirme que la Terre tourne autour du Soleil', 1543, False, 'Renaissance.'),
    ('Galilée observe le ciel avec une lunette', 1609, False, 'Début du XVIIe siècle.'),
    ('Newton publie la loi de la gravitation universelle', 1687, False, 'Fin du XVIIe siècle.'),
    ('Lavoisier publie son Traité élémentaire de chimie : « rien ne se perd, rien ne se crée »', 1789, False, 'L’année de la Révolution française.'),
    ('Jenner met au point le premier vaccin, contre la variole', 1796, False, 'Fin du XVIIIe siècle.'),
    ('Volta invente la pile électrique', 1800, False, 'Une année toute ronde.'),
    ('Darwin publie L’Origine des espèces', 1859, False, 'Milieu du XIXe siècle.'),
    ('Mendeleïev publie sa classification périodique des éléments', 1869, False, 'Fin des années 1860.'),
    ('Pasteur réussit la première vaccination contre la rage', 1885, False, 'Fin du XIXe siècle.'),
    ('Marie et Pierre Curie découvrent le radium', 1898, False, 'Fin du XIXe siècle.'),
    ('Einstein publie la relativité restreinte', 1905, False, 'Début du XXe siècle.'),
    ('Rutherford découvre le noyau de l’atome', 1911, False, 'Début du XXe siècle.'),
    ('Wegener propose la dérive des continents', 1912, False, 'Un an après la découverte du noyau atomique.'),
    ('Fleming découvre la pénicilline', 1928, False, 'Fin des années 1920.'),
    ('La structure en double hélice de l’ADN est décrite', 1953, False, 'Grâce notamment aux travaux de Rosalind Franklin.'),
    ('Youri Gagarine, premier humain dans l’espace', 1961, False, 'En pleine guerre froide.'),
    ('Le génome humain est entièrement séquencé', 2003, False, 'Début du XXIe siècle.'),
    ('Découverte du boson de Higgs au CERN', 2012, False, 'Début des années 2010.'),
    ('Première détection d’ondes gravitationnelles', 2015, False, 'Cent ans après la relativité générale.'),
    ('Première image d’un trou noir', 2019, False, 'Fin des années 2010.'),
]
chrono_subject('pc-sciences-frise', 'pc', ['3e'], 'pc.histoire-sciences', 'Situer de grandes découvertes scientifiques dans le temps', 'Histoire des sciences : d’Ératosthène aux trous noirs',
       'De grandes découvertes à ranger dans l’ordre du temps, ou à dater.', ['pc3-atome', 'pc3-poids'], SCIENCES)
chrono_subject('enssci-frise', 'ens-sci', ['1re', 'tle'], 'enssci.histoire', 'Situer de grandes découvertes scientifiques dans le temps', 'Histoire des sciences : d’Ératosthène aux trous noirs',
       'De grandes découvertes à ranger dans l’ordre du temps, ou à dater.', ['ens-sci-2023-1re', 'ens-sci-2023-tle'], SCIENCES)

# ---------------- Anglais : vocabulaire du lycée (environnement, numérique, société, travail, santé, voyage, arts) ----------------
ENL = []
ENL_THEMES = [('environnement', 'L’environnement'), ('numerique', 'Le numérique'), ('societe', 'La société et la citoyenneté'), ('travail', 'Le travail et les études'),
              ('sante', 'La santé'), ('voyage', 'Les voyages'), ('arts', 'Les arts et la culture')]
ENL_LABEL = dict(ENL_THEMES)
def enl(theme, fr, ans, note=''):
    hint = f"Thème : {ENL_LABEL[theme].lower()}. En anglais, l'article est facultatif ; en français, écris le nom avec son article.{(' ' + note) if note else ''}"
    ENL.append({'q': fr, 'a': ans if isinstance(ans, list) else [ans], 'theme': theme, 'hint': hint})
for fr, a in [('le réchauffement climatique', 'global warming'), ('le changement climatique', 'climate change'), ('l’effet de serre', ['greenhouse effect', 'the greenhouse effect']),
              ('les énergies renouvelables', ['renewable energy', 'renewable energies', 'renewables']), ('la pollution', 'pollution'), ('les déchets', ['waste', 'rubbish', 'trash', 'garbage']),
              ('le recyclage', 'recycling'), ('la sécheresse', ['drought', 'a drought', 'the drought']), ('l’inondation', ['flood', 'a flood', 'the flood', 'flooding']),
              ('la biodiversité', 'biodiversity'), ('l’espèce menacée', ['endangered species', 'an endangered species']), ('l’empreinte carbone', ['carbon footprint', 'the carbon footprint', 'a carbon footprint'])]:
    enl('environnement', fr, a)
for fr, a in [('l’écran', ['screen', 'a screen', 'the screen']), ('les réseaux sociaux', ['social media', 'social networks']), ('le mot de passe', ['password', 'a password', 'the password']),
              ('le logiciel', ['software', 'program', 'a program']), ('télécharger', ['download', 'to download']), ('l’ordinateur portable', ['laptop', 'a laptop', 'the laptop']),
              ('l’intelligence artificielle', ['artificial intelligence', 'AI']), ('la fausse information', ['fake news', 'misinformation']), ('l’application', ['app', 'an app', 'application', 'an application']),
              ('la vie privée', 'privacy')]:
    enl('numerique', fr, a)
for fr, a in [('l’égalité', 'equality'), ('les droits de l’homme', 'human rights'), ('le citoyen', ['citizen', 'a citizen', 'the citizen']), ('l’élection', ['election', 'an election', 'the election']),
              ('le gouvernement', ['government', 'the government']), ('la manifestation', ['demonstration', 'a demonstration', 'protest', 'a protest']), ('la pauvreté', 'poverty'),
              ('l’immigré', ['immigrant', 'an immigrant']), ('la liberté d’expression', ['freedom of speech', 'free speech', 'freedom of expression']), ('le bénévole', ['volunteer', 'a volunteer'])]:
    enl('societe', fr, a)
for fr, a, n in [('l’emploi', ['job', 'a job', 'the job'], ''), ('le chômage', 'unemployment', ''), ('le salaire', ['salary', 'a salary', 'wage', 'a wage', 'wages'], ''),
                 ('l’entretien d’embauche', ['job interview', 'a job interview', 'interview', 'an interview'], ''), ('le stage', ['internship', 'an internship', 'work placement', 'a work placement'], 'Attention : « stage » en anglais désigne une scène de théâtre.'),
                 ('l’entreprise', ['company', 'a company', 'firm', 'a firm', 'business', 'a business'], ''), ('le collègue', ['colleague', 'a colleague', 'coworker', 'a coworker'], ''),
                 ('l’université', ['university', 'the university', 'college'], '')]:
    enl('travail', fr, a, n)
for fr, a in [('la santé', 'health'), ('le médecin', ['doctor', 'a doctor', 'the doctor']), ('le médicament', ['medicine', 'a medicine', 'drug', 'a drug', 'medication']),
              ('l’hôpital', ['hospital', 'a hospital', 'the hospital']), ('le sommeil', 'sleep'), ('le stress', 'stress'), ('la maladie', ['disease', 'a disease', 'illness', 'an illness']),
              ('le vaccin', ['vaccine', 'a vaccine', 'the vaccine'])]:
    enl('sante', fr, a)
for fr, a in [('le voyage', ['trip', 'a trip', 'journey', 'a journey', 'travel']), ('le billet', ['ticket', 'a ticket', 'the ticket']), ('l’aéroport', ['airport', 'the airport', 'an airport']),
              ('le passeport', ['passport', 'a passport', 'the passport']), ('le pays', ['country', 'a country', 'the country']), ('la frontière', ['border', 'a border', 'the border']),
              ('les bagages', ['luggage', 'baggage']), ('à l’étranger', 'abroad')]:
    enl('voyage', fr, a)
for fr, a, n in [('le tableau (une peinture)', ['painting', 'a painting', 'the painting'], ''), ('le roman', ['novel', 'a novel', 'the novel'], 'Faux ami : « romance » veut dire une histoire d’amour.'),
                 ('l’écrivain', ['writer', 'a writer', 'author', 'an author'], ''), ('la pièce de théâtre', ['play', 'a play', 'the play'], ''), ('le film', ['film', 'a film', 'movie', 'a movie'], ''),
                 ('le chanteur', ['singer', 'a singer', 'the singer'], ''), ('le musée', ['museum', 'a museum', 'the museum'], ''), ('l’exposition', ['exhibition', 'an exhibition', 'the exhibition'], ''),
                 ('le spectacle', ['show', 'a show', 'the show', 'performance', 'a performance'], '')]:
    enl('arts', fr, a, n)
skill('lv.l.anglais-lexique', 'lv', 'Anglais au lycée : vocabulaire des axes culturels (environnement, numérique, société, travail, santé, voyages, arts)', '2nde')
add({'id': 'en-l-vocabulary', 'label': 'Anglais : vocabulaire du lycée', 'subject': 'lv', 'levels': ['2nde', '1re', 'tle'], 'skill': 'lv.l.anglais-lexique', 'kind': 'vocab', 'difficulty': 2,
     'chapters': ['lv-c4-lycee-2025-axes-2nde', 'lv-c4-lycee-2025-axes-1re', 'lv-c4-lycee-2025-axes-tle', 'lv-c4-lycee-2025-activites'],
     'description': 'Environnement, numérique, société, travail et études, santé, voyages, arts : les mots des axes culturels du lycée, dans les deux sens, avec écoute en anglais.',
     'options': [{'id': 'theme', 'label': 'Thème', 'values': [{'id': 'tous', 'label': 'Tous les thèmes'}] + [{'id': t, 'label': l} for t, l in ENL_THEMES]},
                 {'id': 'direction', 'label': 'Sens', 'values': [{'id': 'normal', 'label': 'Français → anglais'}, {'id': 'inverse', 'label': 'Anglais → français'}, {'id': 'mixte', 'label': 'Les deux, au hasard'}]}],
     'data': {'pairs': ENL, 'lang': 'en-GB', 'fromLabel': 'français', 'toLabel': 'anglais'}})

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
