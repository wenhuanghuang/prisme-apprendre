# Programmes officiels applicables en 2026-2027 (CP à Terminale) - synthèse de sources

Date de la recherche : 5 octobre 2026. Fichier compagnon : `programmes-catalogue.json` (54 programmes, structure machine). Aucune URL n'a été inventée ; chaque lien porte un indicateur de vérification dans le JSON (`verified`, `opened`, `verifiedHow`).

## 1. Comment lire cette synthèse, et limites de la vérification

- **Textes lus intégralement** (articles d'arrêté, dispositions d'application, sommaires de programmes) : BO n°41/2024, n°24/2024, n°6/2025, n°16/2025, n°10/2026, n°12/2026 (annexes LV), n°14/2026, n°22/2026 (annexes EPS et HG), n°24/2026, n°6/2026 (note numérique/IA), BO n°31/2020 et programmes consolidés Éduscol (cycles 3 et 4). Lecture faite sur les PDF des BO et sur les pages JORF de Légifrance.
- **Limite technique** : les pages HTML de education.gouv.fr, eduscol.education.gouv.fr (et la page d'accueil de Légifrance) répondent HTTP 403 (Cloudflare) aux clients automatiques. Les liens `bo/AAAA/HebdoNN/...` sont donc "vus dans l'index de recherche avec le titre officiel exact" (`verifiedHow: search-index-title-match`) mais non ouverts ; le contenu correspondant a été relu par le PDF du BO quand il est cité comme "lu".
- **Portée du programme** : `annual` = le texte officiel est rédigé classe par classe (l'ordre annuel est national) ; `cycle` = défini à l'échelle d'un cycle (l'ordre de progression d'une application est éditorial). Des repères annuels indicatifs (BO n°22 du 29-05-2019) existent pour français/maths/EMC des anciens programmes de cycles 2-3-4.
- **Statut** : `in-force` ; `legacy-in-force` (ancien programme encore applicable à certains niveaux en 2026-2027) ; `pending-not-in-force` (annoncé, non publié).

## 2. Les points calendrier les plus structurants pour 2026-2027

1. **Français et maths** : cycle 2 (2024) en 2e année pour CP-CE1-CE2 ; cycle 3 (2025) devient intégral avec le CM2 (CM1 et 6e depuis 2025) ; cycle 4 (arrêté du 18-02-2026, BO n°10 du 5-03-2026) : 5e uniquement en 2026-2027, 4e en 2027, 3e en 2028. La 4e et la 3e restent sur le programme 2020 (repères annuels 2019 indicatifs).
2. **Nouveaux programmes 2026 à application en deux temps** (CP et CM1 en 2026-2027 ; CE1, CE2, CM2, 6e en 2027-2028) : sciences et technologie (BO n°24 du 11-06-2026, supprime "Questionner le monde" vivant/matière/objets), EPS et histoire-géographie (BO n°22 du 28-05-2026), langues vivantes de l'élémentaire (BO n°12 du 19-03-2026). En 2026-2027, CE1/CE2/CM2/6e restent donc sur les programmes de 2020 (CM2 et 6e : sciences et technologie version 2023).
3. **EMC 2024** : dernier palier à la rentrée 2026 (CE2, 6e, 3e, terminale) ; tous les niveaux CP-terminale sont désormais sur le même programme annuel. **EVAR/EVARS** (arrêté du 3-02-2025) : en application depuis 2025-2026 pour tous les niveaux, au moins 3 séances par an.
4. **Lycée général et technologique** : nouveaux programmes de mathématiques (BO n°14 du 2-04-2026, 7 arrêtés du 26-02-2026) pour la 2nde et la 1re (spécialité, module intégré à l'enseignement scientifique, voie technologique) dès 2026-2027 ; terminale (spécialité, complémentaires, technologique) seulement à la rentrée 2027-2028. En terminale 2026-2027 : versions 2019. Les autres disciplines du lycée restent sur les textes de 2019 (enseignement scientifique : versions 2023). Langues vivantes : programmes 2025 (2nde depuis 2025 ; 1re et terminale à partir de 2026).
5. **IA et numérique** : pas de programme "IA" disciplinaire. Parcours Pix IA obligatoires en 4e, 2de et CAP1 (déploiement progressif sur 2025-2026 et 2026-2027) ; attestation Pix en 6e ; certification Pix en 3e et terminale ; cadre d'usage de l'IA (juin 2025). Refonte du programme de SNT (2h dont 1h d'IA) annoncée pour la rentrée 2027 (lettre de saisine du 20-07-2026, source relayée par l'académie de Normandie) : non en vigueur.

## 3. Tableaux niveau x matière : texte applicable en 2026-2027

Légende : **NOUVEAU 2026** = première année d'application en 2026-2027 ; **2020** = programme du BO n°31 du 30-07-2020 (arrêté du 17-07-2020) ; abréviations : QLM = Questionner le monde ; S&T = sciences et technologie ; Pix IA = parcours obligatoires.

### 3.1 École élémentaire et 6e

| Niveau | Français | Mathématiques | LV | Histoire-géographie | Sciences / technologie | EMC | EPS | Arts |
|---|---|---|---|---|---|---|---|---|
| CP | Cycle 2 (2024) 2e année | Cycle 2 (2024) 2e année | **NOUVEAU 2026** LV élémentaire (BO 12) | **NOUVEAU 2026** HG (BO 22) | **NOUVEAU 2026** S&T (BO 24) | EMC 2024 (depuis 2024) | **NOUVEAU 2026** EPS (BO 22) | 2020 |
| CE1 | Cycle 2 (2024) | Cycle 2 (2024) | 2020 (nouveau en 2027) | QLM 2020 "espace et temps" (nouveau en 2027) | QLM 2020 "vivant, matière, objets" (nouveau en 2027) | EMC 2024 (depuis 2025) | 2020 | 2020 |
| CE2 | Cycle 2 (2024) | Cycle 2 (2024) | 2020 | QLM 2020 | QLM 2020 | **NOUVEAU 2026** EMC 2024 | 2020 | 2020 |
| CM1 | Cycle 3 (2025) 2e année | Cycle 3 (2025) 2e année | **NOUVEAU 2026** LV élémentaire | **NOUVEAU 2026** HG | **NOUVEAU 2026** S&T | EMC 2024 (depuis 2024) | **NOUVEAU 2026** EPS | 2020 |
| CM2 | **NOUVEAU 2026** Cycle 3 (2025) | **NOUVEAU 2026** Cycle 3 (2025) | 2020 (nouveau en 2027) | HG cycle 3 2020 (nouveau en 2027) | S&T cycle 3 version 2023 (nouveau en 2027) | EMC 2024 (depuis 2025) | 2020 | 2020 |
| 6e | Cycle 3 (2025) 2e année | Cycle 3 (2025) 2e année | LV 2025 collège (depuis 2025) | HG cycle 3 2020 (nouveau en 2027) | S&T cycle 3 version 2023 (SVT/PC ; pas de technologie distincte) (nouveau en 2027) | **NOUVEAU 2026** EMC 2024 | 2020 (nouveau en 2027) | 2020 |

### 3.2 Collège cycle 4

| Niveau | Français | Mathématiques | LV | Histoire-géographie | PC / SVT | Technologie | EMC | Numérique / IA |
|---|---|---|---|---|---|---|---|---|
| 5e | **NOUVEAU 2026** (BO 10) | **NOUVEAU 2026** (BO 10) | **NOUVEAU 2026** LV 2025 (5e) | 2020 | 2020 | 2024 (depuis 2024) | EMC 2024 (depuis 2024) | CRCN ; (Pix IA : 4e et 2de) |
| 4e | 2020 + repères 2019 (nouveau en 2027) | 2020 + repères 2019 (nouveau en 2027) | 2020 (nouveau en 2027) | 2020 | 2020 | 2024 (depuis 2025) | EMC 2024 (depuis 2025) | Pix IA obligatoire |
| 3e | 2020 + repères 2019 (nouveau en 2028) | 2020 + repères 2019 (nouveau en 2028) | 2020 (nouveau en 2028) | 2020 | 2020 | **NOUVEAU 2026** (3e) | **NOUVEAU 2026** EMC 2024 | Certification Pix |

Arts plastiques, éducation musicale, EPS : programmes 2020. EVARS : programme 2025 pour tous les niveaux.

### 3.3 Lycée général et technologique

| Niveau | Mathématiques | Français / philosophie | LV | Histoire-géographie | Sciences et numérique | Sciences sociales / humanités | EMC |
|---|---|---|---|---|---|---|---|
| 2nde | **NOUVEAU 2026** (BO 14) | Français 2019 | LV 2025 (depuis 2025) | HG 2019 | PC, SVT 2019 ; SNT 2019 (refonte annoncée 2027) | SES 2019 | EMC 2024 (depuis 2024) ; Pix IA |
| 1re | **NOUVEAU 2026** spécialité / module enseignement scientifique / voie technologique (BO 14) ; EAM juin 2027 | Français 2019 | **NOUVEAU 2026** LV 2025 (1re) | HG 2019 | Enseignement scientifique 2023 ; spécialités PC, SVT, NSI, SI 2019 | SES, HGGSP, HLP, LLCER 2019 | EMC 2024 (depuis 2025) |
| Tle | Spécialité, complémentaires, expertes, techno : versions 2019 (nouveau en 2027, sauf expertes non documenté) | Philosophie 2019 | **NOUVEAU 2026** LV 2025 (Tle) | HG 2019 | Enseignement scientifique 2023 ; spécialités PC, SVT, NSI, SI 2019 | SES, HGGSP, HLP, LLCER 2019 | **NOUVEAU 2026** EMC 2024 ; certification Pix |

## 4. Catalogue détaillé (généré depuis le JSON)

Chaque entrée : texte officiel, niveaux concernés en 2026-2027, portée, confiance, liens principaux ("lu" = contenu ouvert ; sans mention = URL vue dans l'index de recherche, page non ouvrable par l'outil).

### Primaire et collège : français, maths

**`francais-c2-2024`** - Programme de français du cycle 2 (CP-CE1-CE2) - version 2024

- Texte : Arrêté du 22 octobre 2024 (NOR MENE2415135A, JO du 25-10-2024) fixant les programmes d'enseignement pour le développement et la structuration du langage oral et écrit et pour l'acquisition des premiers outils mathématiques de l'école maternelle (cycle 1) et de français et de mathématiques du cycle des apprentissages fondamentaux (cycle 2) ; publié au BO n°41 du 31 octobre 2024 (Annexe 3 = programme de français du cycle 2).
- Niveaux concernés en 2026-2027 : CP, CE1, CE2 - statut `in-force`
- Portée : `annual`. Programme rédigé classe par classe (CP / CE1 / CE2) pour chaque domaine, avec attendus et exemples de réussite. L'ordre des séquences à l'intérieur d'une année reste à la main des enseignants.
- Repères annuels : Oui, intégrés au programme lui-même (sections « Cours préparatoire », « Cours élémentaire première année », « Cours élémentaire deuxième année » dans chaque domaine, avec exemples de réussite). Les repères annuels 2019 (BO n°22 du 29-05-2019) portaient sur l'ancien programme ; une abrogation explicite de cette note de service n'a pas été vérifiée.
- Confiance : high ; origine des domaines : bo-text-read
- Liens : [BO](https://www.education.gouv.fr/bo/2024/Hebdo41/MENE2415135A) · [PDF lu](https://education.gouv.fr/sites/default/files/Bulletin_officiel_MENJS_2024_10_31_BO41-1734366107.pdf) · [Légifrance (lu)](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000050395251) · [Éduscol](https://eduscol.education.gouv.fr/4347/enseigner-au-cycle-2?mddtab=23251)

**`maths-c2-2024`** - Programme de mathématiques du cycle 2 (CP-CE1-CE2) - version 2024

- Texte : Arrêté du 22 octobre 2024 (NOR MENE2415135A, JO du 25-10-2024), BO n°41 du 31 octobre 2024 (Annexe 4 = programme de mathématiques du cycle 2).
- Niveaux concernés en 2026-2027 : CP, CE1, CE2 - statut `in-force`
- Portée : `annual`. Programme décliné par classe (CP / CE1 / CE2) dans chaque domaine ; le texte demande d'aborder dès le début de l'année les notions du niveau de la classe (ex. la centaine dès la 1re période du CE1).
- Repères annuels : Oui, intégrés (sous-sections par classe + attendus de fin d'année + repères d'acquisition). Même réserve que pour le français sur les repères 2019.
- Confiance : high ; origine des domaines : bo-text-read
- Liens : [BO](https://www.education.gouv.fr/bo/2024/Hebdo41/MENE2415135A) · [PDF lu](https://education.gouv.fr/sites/default/files/Bulletin_officiel_MENJS_2024_10_31_BO41-1734366107.pdf) · [Légifrance (lu)](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000050395251) · [Éduscol](https://eduscol.education.gouv.fr/4347/enseigner-au-cycle-2?mddtab=23251)

**`francais-c3-2025`** - Programme de français du cycle 3 (CM1-CM2-6e) - version 2025

- Texte : Arrêté du 10 avril 2025 (NOR MENE2504620A, JO du 16-04-2025) fixant les programmes d'enseignement de français et de mathématiques du cycle de consolidation (cycle 3) ; publié au BO n°16 du 17 avril 2025.
- Niveaux concernés en 2026-2027 : CM1, CM2, 6e - statut `in-force`
- Portée : `annual`. Chaque item du sommaire est étiqueté CM1 / CM2 / 6e ; la culture littéraire est donnée par bloc « Cours moyen première et deuxième années » puis spécifiquement pour la 6e (cinq entrées / projets d'apprentissage).
- Repères annuels : Oui, intégrés au texte (étiquettes de classe sur chaque compétence). Repères annuels 2019 (BO n°22 du 29-05-2019) : supplantés par cette structure, abrogation explicite non vérifiée.
- Confiance : high ; origine des domaines : bo-text-read
- Liens : [BO](https://www.education.gouv.fr/bo/2025/Hebdo16/MENE2504620A) · [PDF lu](https://www.education.gouv.fr/sites/default/files/boenjs-16-def-pdf-440034.pdf) · [Légifrance (lu)](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000051468918) · [Éduscol](https://eduscol.education.gouv.fr/4356/enseigner-au-cycle-3?mddtab=23251)

**`maths-c3-2025`** - Programme de mathématiques du cycle 3 (CM1-CM2-6e) - version 2025

- Texte : Arrêté du 10 avril 2025 (NOR MENE2504620A, JO du 16-04-2025), BO n°16 du 17 avril 2025 (programme de mathématiques pour le cycle 3).
- Niveaux concernés en 2026-2027 : CM1, CM2, 6e - statut `in-force`
- Portée : `annual`. Sommaire structuré en Cours moyen première année / deuxième année / Sixième pour chaque grand domaine.
- Repères annuels : Oui, intégrés (rubriques CM1 / CM2 / 6e). Les repères annuels 2019 sont supplantés (abrogation formelle non vérifiée).
- Confiance : high ; origine des domaines : bo-text-read
- Liens : [BO](https://www.education.gouv.fr/bo/2025/Hebdo16/MENE2504620A) · [PDF lu](https://www.education.gouv.fr/sites/default/files/boenjs-16-def-pdf-440034.pdf) · [Légifrance (lu)](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000051468918) · [Éduscol](https://eduscol.education.gouv.fr/4356/enseigner-au-cycle-3?mddtab=23251)

**`francais-c4-2026`** - Programme de français du cycle 4 (5e-4e-3e) - version 2026

- Texte : Arrêté du 18 février 2026 (NOR MENE2602912A, JO du 04-03-2026) fixant les programmes d'enseignement de français et de mathématiques du cycle des approfondissements (cycle 4) ; publié au BO n°10 du 5 mars 2026 (Annexe 1 = programme de français).
- Niveaux concernés en 2026-2027 : 5e - statut `in-force`
- Portée : `annual`. Items étiquetés 5e / 4e / 3e ; « Culture littéraire et artistique » définie par année avec une perspective annuelle et quatre entrées par classe.
- Repères annuels : Oui, intégrés : perspectives annuelles et entrées par classe + étiquettes 5e/4e/3e. Éduscol publie en plus des documents « Exemples pour la mise en œuvre des programmes 2026 ».
- Confiance : high ; origine des domaines : bo-text-read
- Liens : [BO](https://www.education.gouv.fr/bo/2026/Hebdo10/MENE2602912A) · [PDF lu](https://www.education.gouv.fr/sites/default/files/document/Bulletin%20officiel%20n%C2%B0%2010%20du%205%20mars%202026-480719.pdf) · [Légifrance (lu)](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000053613385) · [Éduscol](https://eduscol.education.gouv.fr/4362/enseigner-au-cycle-4)

**`maths-c4-2026`** - Programme de mathématiques du cycle 4 (5e-4e-3e) - version 2026

- Texte : Arrêté du 18 février 2026 (NOR MENE2602912A, JO du 04-03-2026), BO n°10 du 5 mars 2026 (Annexe 2 = programme de mathématiques pour le cycle 4).
- Niveaux concernés en 2026-2027 : 5e - statut `in-force`
- Portée : `annual`. Cinq thèmes, chacun décliné en sections Cinquième / Quatrième / Troisième.
- Repères annuels : Oui, intégrés au programme (sections par classe). Document d'accompagnement Éduscol « Exemples pour la mise en œuvre des programmes 2026 ».
- Confiance : high ; origine des domaines : bo-text-read
- Liens : [BO](https://www.education.gouv.fr/bo/2026/Hebdo10/MENE2602912A) · [PDF lu](https://www.education.gouv.fr/sites/default/files/document/Bulletin%20officiel%20n%C2%B0%2010%20du%205%20mars%202026-480719.pdf) · [Légifrance (lu)](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000053613385) · [Éduscol](https://eduscol.education.gouv.fr/4362/enseigner-au-cycle-4)

**`francais-c4-2020`** - Programme de français du cycle 4 - version 2020 (encore en vigueur pour la 4e et la 3e en 2026-2027)

- Texte : Arrêté du 17 juillet 2020 (NOR MENE2018714A, JO du 28-07-2020) modifiant l'arrêté du 9 novembre 2015 ; BO n°31 du 30 juillet 2020, annexe 3 (programme du cycle 4). Repères annuels et attendus de fin d'année : BO n°22 du 29 mai 2019 (NOR MENE1913283N).
- Niveaux concernés en 2026-2027 : 4e, 3e - statut `legacy-in-force`
- Portée : `cycle`. Programme défini à l'échelle du cycle 4 (attendus de fin de cycle) : l'ordre d'étude 5e/4e/3e n'est pas national dans le texte de 2020 ; il n'est qu'indiqué par les repères annuels 2019.
- Repères annuels : Oui mais indicatifs : « repères annuels de progression et attendus de fin d'année » (BO n°22 du 29-05-2019), non prescriptifs ; des sources académiques indiquent qu'ils restent la référence pour la 4e et la 3e en 2026-2027 (source secondaire).
- Confiance : high ; origine des domaines : bo-text-read
- Liens : [BO](https://www.education.gouv.fr/bo/20/Hebdo31/MENE2018714A.htm) · [PDF lu](https://www.education.gouv.fr/sites/default/files/imported_files/documents/BO_MENJS_31_1313155.pdf) · [Légifrance (lu)](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000042157717) · [Éduscol](https://eduscol.education.gouv.fr/sites/default/files/document/programme-d-enseignement-du-cycle-4-67722.pdf)

**`maths-c4-2020`** - Programme de mathématiques du cycle 4 - version 2020 (encore en vigueur pour la 4e et la 3e en 2026-2027)

- Texte : Arrêté du 17 juillet 2020 (NOR MENE2018714A) ; BO n°31 du 30 juillet 2020, annexe 3 ; repères annuels et attendus de fin d'année : BO n°22 du 29 mai 2019 (NOR MENE1913283N).
- Niveaux concernés en 2026-2027 : 4e, 3e - statut `legacy-in-force`
- Portée : `cycle`. Cinq thèmes définis sur l'ensemble du cycle 4 ; le découpage par année n'est qu'indicatif (repères annuels 2019).
- Repères annuels : Oui, indicatifs (BO n°22 du 29-05-2019) - voir francais-c4-2020.
- Confiance : high ; origine des domaines : bo-text-read
- Liens : [BO](https://www.education.gouv.fr/bo/20/Hebdo31/MENE2018714A.htm) · [PDF lu](https://www.education.gouv.fr/sites/default/files/imported_files/documents/BO_MENJS_31_1313155.pdf) · [Légifrance (lu)](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000042157717) · [Éduscol](https://eduscol.education.gouv.fr/sites/default/files/document/programme-d-enseignement-du-cycle-4-67722.pdf)

### Sciences, technologie, histoire-géographie, EPS (cycles 2-3-4)

**`sciences-techno-c2c3-2026`** - Programmes de sciences et technologie des cycles 2 et 3 - version 2026 (remplace « Questionner le monde » du vivant, de la matière et des objets)

- Texte : Arrêté du 5 juin 2026 (NOR MENE2611650A, JO du 09-06-2026) fixant les programmes de sciences et technologie du cycle 2 et du cycle 3 ; BO n°24 du 11 juin 2026 (annexe 1 : cycle 2 ; annexe 2 : cycle 3).
- Niveaux concernés en 2026-2027 : CP, CM1 - statut `in-force`
- Portée : `annual`. Programme structuré en quatre domaines, chacun décliné par classe (CP, CE1, CE2 ; CM1, CM2, 6e). En 6e, le domaine « objets techniques » est vide dans le sommaire (pas de contenu technologie 6e dans ce texte).
- Repères annuels : Oui, intégrés (sous-sections par classe dans chaque domaine).
- Confiance : high ; origine des domaines : bo-text-read
- Liens : [BO (lu)](https://www.education.gouv.fr/sites/default/files/document/bulletin-officiel-ndeg-24-du-11-juin-2026-519026.pdf) · [Légifrance](https://www.legifrance.gouv.fr/loda/id/JORFTEXT000054218988/) · [Éduscol](https://eduscol.education.gouv.fr/7055/ressources-d-accompagnement-pour-questionner-le-monde-du-vivant-de-la-matiere-et-des-objets-sciences-et-technologie-au-cycle-2)

**`sciences-techno-c3-2023`** - Programme de sciences et technologie du cycle 3 - version modifiée 2023 (encore en vigueur pour le CM2 et la 6e en 2026-2027)

- Texte : Arrêté du 15 juin 2023 (NOR MENE2314101A) modifiant l'arrêté du 9 novembre 2015 ; BO n°25 du 22 juin 2023 ; application depuis la rentrée 2023-2024. Version consolidée Éduscol « Programme du cycle 3 en vigueur à la rentrée 2023 » (d'après BOEN n°31 du 30-07-2020 et n°25 du 22-06-2023).
- Niveaux concernés en 2026-2027 : CM2, 6e - statut `legacy-in-force`
- Portée : `cycle`. Programme défini sur le cycle 3 (attendus de fin de cycle) avec « repères de progressivité » ; ordre d'étude CM1/CM2/6e non fixé nationalement.
- Repères annuels : Pas de repères annuels nationaux prescriptifs (les repères 2019 de BO n°22 ne couvraient que français, maths et EMC).
- Confiance : high ; origine des domaines : bo-text-read
- Liens : [BO](https://www.education.gouv.fr/bo/2023/Hebdo25/MENE2314101A) · [Légifrance (lu)](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000047704276) · [Éduscol](https://eduscol.education.gouv.fr/sites/default/files/document/programme-d-enseignement-du-cycle-3-2023-100806.pdf)

**`qlm-c2-2020`** - « Questionner le monde » (cycle 2) - version 2020 (encore en vigueur pour le CE1 et le CE2 en 2026-2027)

- Texte : Arrêté du 17 juillet 2020 (NOR MENE2018714A), BO n°31 du 30 juillet 2020, annexe 1 (programme du cycle 2) - partie « Questionner le monde ». Supprimée progressivement par l'arrêté du 5 juin 2026 (sciences et technologie) et celui du 22 avril 2026 (histoire-géographie).
- Niveaux concernés en 2026-2027 : CE1, CE2 - statut `legacy-in-force`
- Portée : `cycle`. Défini à l'échelle du cycle 2 (attendus de fin de cycle + « repères de progressivité » partiels, par ex. « le repérage des grandes périodes historiques se travaille au CE2 »).
- Repères annuels : Repères de progressivité indicatifs dans le texte ; pas de repères annuels 2019 (qui ne couvraient que français, maths, EMC).
- Confiance : high ; origine des domaines : bo-text-read
- Liens : [BO](https://www.education.gouv.fr/bo/20/Hebdo31/MENE2018714A.htm) · [PDF lu](https://www.education.gouv.fr/sites/default/files/imported_files/documents/BO_MENJS_31_1313155.pdf) · [Légifrance (lu)](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000042157717) · [Éduscol](https://eduscol.education.gouv.fr/4347/enseigner-au-cycle-2?mddtab=23251)

**`hg-c2c3-2026`** - Programmes d'histoire-géographie des cycles 2 et 3 - version 2026

- Texte : Arrêté du 22 avril 2026 (NOR MENE2608631A, JO du 08-05-2026) fixant les programmes d'enseignement d'éducation physique et sportive et d'histoire-géographie du cycle 2 et du cycle 3 ; BO n°22 du 28 mai 2026 (annexe 3 : HG cycle 2 ; annexe 4 : HG cycle 3).
- Niveaux concernés en 2026-2027 : CP, CM1 - statut `in-force`
- Portée : `annual`. Thèmes définis classe par classe (CP, CE1, CE2 ; CM1, CM2, 6e) avec indication de périodes (cycle 2) ou d'heures (6e : 45 h histoire + 45 h géographie).
- Repères annuels : Oui, intégrés (thèmes par classe, nombre de périodes ou d'heures).
- Confiance : high ; origine des domaines : bo-text-read
- Liens : [BO](https://www.education.gouv.fr/bo/2026/Hebdo22/MENE2608631A) · [PDF lu](https://www.education.gouv.fr/sites/default/files/document/annexe-3-programme-d-histoire-geographie-cycle-2-516776.pdf) · [Légifrance (lu)](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000054048160) · [Éduscol](https://eduscol.education.gouv.fr/4770/ressources-d-accompagnement-pour-questionner-l-espace-et-le-temps-histoire-geographie-au-cycle-2?mddtab=23251)

**`hg-c2c3-2020`** - Histoire et géographie du cycle 3 (2020) et « Questionner l'espace et le temps » du cycle 2 (2020) - encore en vigueur pour CM2 et 6e (et CE1/CE2 pour l'espace-temps) en 2026-2027

- Texte : Arrêté du 17 juillet 2020 (NOR MENE2018714A) ; BO n°31 du 30 juillet 2020 ; consolidé par Éduscol « Programme du cycle 3 en vigueur à la rentrée 2023 » (volet HG).
- Niveaux concernés en 2026-2027 : CE1, CE2, CM2, 6e - statut `legacy-in-force`
- Portée : `cycle`. Programme du cycle 3 à l'échelle du cycle, avec des thèmes et repères de programmation par classe pour l'histoire-géographie (CM1, CM2, 6e) ; plus fin que le simple « attendus de fin de cycle ». Cycle 2 : « Questionner l'espace et le temps » défini sur le cycle.
- Repères annuels : Repères de programmation par classe présents dans le texte lui-même pour l'histoire-géographie.
- Confiance : medium ; origine des domaines : non-detaille
- Liens : [BO](https://www.education.gouv.fr/bo/20/Hebdo31/MENE2018714A.htm) · [PDF lu](https://www.education.gouv.fr/sites/default/files/imported_files/documents/BO_MENJS_31_1313155.pdf) · [Légifrance (lu)](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000042157717) · [Éduscol](https://eduscol.education.gouv.fr/sites/default/files/document/programme-d-enseignement-du-cycle-3-2023-100806.pdf)

**`hg-c4-2020`** - Programme d'histoire et géographie du cycle 4 - version 2020 (en vigueur pour 5e, 4e, 3e en 2026-2027)

- Texte : Arrêté du 17 juillet 2020 (NOR MENE2018714A) ; BO n°31 du 30 juillet 2020, annexe 3. Aucun nouveau programme publié à la date du 05-10-2026 ; projets du CSP en consultation du 18-05-2026 au 19-06-2026.
- Niveaux concernés en 2026-2027 : 5e, 4e, 3e - statut `legacy-in-force`
- Portée : `annual`. Le programme d'HG du cycle 4 est rédigé par classe (colonne « Repères annuels de programmation » : thèmes de 5e, 4e, 3e) même si l'ensemble est un programme de cycle.
- Repères annuels : Oui : « Repères annuels de programmation » par classe dans le programme lui-même.
- Confiance : high ; origine des domaines : bo-text-read
- Liens : [BO](https://www.education.gouv.fr/bo/20/Hebdo31/MENE2018714A.htm) · [PDF lu](https://www.education.gouv.fr/sites/default/files/imported_files/documents/BO_MENJS_31_1313155.pdf) · [Éduscol](https://eduscol.education.gouv.fr/sites/default/files/document/programme-d-enseignement-du-cycle-4-67722.pdf) · [autre](https://www.education.gouv.fr/les-programmes-du-college-470408)

**`eps-c2c3-2026`** - Programmes d'éducation physique et sportive des cycles 2 et 3 - version 2026

- Texte : Arrêté du 22 avril 2026 (NOR MENE2608631A, JO du 08-05-2026) ; BO n°22 du 28 mai 2026 (annexe 1 : EPS cycle 2 ; annexe 2 : EPS cycle 3).
- Niveaux concernés en 2026-2027 : CP, CM1 - statut `in-force`
- Portée : `annual`. Cycle 2 : sections CP / CE1 / CE2 pour chaque domaine ; cycle 3 : bloc « Cours moyen » commun puis section Sixième avec quatre champs distincts.
- Repères annuels : Oui pour le cycle 2 (par classe) ; bloc CM commun puis 6e pour le cycle 3.
- Confiance : high ; origine des domaines : bo-text-read
- Liens : [BO](https://www.education.gouv.fr/bo/2026/Hebdo22/MENE2608631A) · [PDF lu](https://www.education.gouv.fr/sites/default/files/document/annexe-1-programme-d-education-physique-et-sportive-cycle-2-516770.pdf) · [Légifrance (lu)](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000054048160)

**`eps-2020`** - Programmes d'EPS cycles 2, 3 et 4 - version 2020 (encore en vigueur en 2026-2027 pour CE1, CE2, CM2, 6e, 5e, 4e, 3e)

- Texte : Arrêté du 17 juillet 2020 (NOR MENE2018714A) ; BO n°31 du 30 juillet 2020 (annexes 1, 2 et 3, volet EPS).
- Niveaux concernés en 2026-2027 : CE1, CE2, CM2, 6e, 5e, 4e, 3e - statut `legacy-in-force`
- Portée : `cycle`. Défini par cycle, avec quatre champs d'apprentissage et attendus de fin de cycle.
- Repères annuels : Non (programmation annuelle libre).
- Confiance : medium ; origine des domaines : bo-text-read
- Liens : [BO](https://www.education.gouv.fr/bo/20/Hebdo31/MENE2018714A.htm) · [PDF lu](https://www.education.gouv.fr/sites/default/files/imported_files/documents/BO_MENJS_31_1313155.pdf) · [Éduscol](https://eduscol.education.gouv.fr/sites/default/files/document/programme-d-enseignement-du-cycle-4-67722.pdf)

**`techno-c4-2024`** - Programme de technologie du cycle 4 (5e-4e-3e) - version 2024

- Texte : Arrêté du 9 février 2024 (NOR MENE2402802A, JO du 28-02-2024) modifiant l'arrêté du 9 novembre 2015 ; BO n°9 du 29 février 2024 (annexe : programme de technologie du cycle 4).
- Niveaux concernés en 2026-2027 : 5e, 4e, 3e - statut `in-force`
- Portée : `cycle`. Programme de cycle structuré en trois thèmes et neuf compétences de fin de cycle ; des « repères de progressivité annuels » fixent des attendus pour 5e, 4e, 3e.
- Repères annuels : Oui : « repères de progressivité annuels » par niveau (5e, 4e, 3e) dans l'annexe.
- Confiance : high ; origine des domaines : bo-text-read
- Liens : [BO](https://www.education.gouv.fr/bo/2024/Hebdo9/MENE2402802A) · [PDF lu](https://www.education.gouv.fr/sites/default/files/document/Annexe%20%E2%80%94%20Programme%20de%20technologie%20du%20cycle%204-368016.pdf) · [Légifrance (lu)](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000049205283) · [Éduscol](https://eduscol.education.gouv.fr/5745/ressources-d-accompagnement-du-programme-de-technologie-au-cycle-4)

**`pc-c4-2020`** - Programme de physique-chimie du cycle 4 - version 2020

- Texte : Arrêté du 17 juillet 2020 (NOR MENE2018714A) ; BO n°31 du 30 juillet 2020, annexe 3 ; programme consolidé Éduscol « Programme du cycle 4 en vigueur à la rentrée 2020 ».
- Niveaux concernés en 2026-2027 : 5e, 4e, 3e - statut `legacy-in-force`
- Portée : `cycle`. Programme à l'échelle du cycle 4, quatre thèmes « à traiter tout au long du cycle » ; progression annuelle librement construite.
- Repères annuels : Non (pas de repères annuels nationaux prescriptifs).
- Confiance : high ; origine des domaines : bo-text-read
- Liens : [BO](https://www.education.gouv.fr/bo/20/Hebdo31/MENE2018714A.htm) · [PDF lu](https://www.education.gouv.fr/sites/default/files/imported_files/documents/BO_MENJS_31_1313155.pdf) · [Éduscol](https://eduscol.education.gouv.fr/sites/default/files/document/programme-d-enseignement-du-cycle-4-67722.pdf) · [autre](https://www.education.gouv.fr/les-programmes-du-college-470408)

**`svt-c4-2020`** - Programme de sciences de la vie et de la Terre du cycle 4 - version 2020

- Texte : Arrêté du 17 juillet 2020 (NOR MENE2018714A) ; BO n°31 du 30 juillet 2020, annexe 3.
- Niveaux concernés en 2026-2027 : 5e, 4e, 3e - statut `legacy-in-force`
- Portée : `cycle`. Trois thèmes sur l'ensemble du cycle 4.
- Repères annuels : Non (progression annuelle libre).
- Confiance : high ; origine des domaines : bo-text-read
- Liens : [BO](https://www.education.gouv.fr/bo/20/Hebdo31/MENE2018714A.htm) · [PDF lu](https://www.education.gouv.fr/sites/default/files/imported_files/documents/BO_MENJS_31_1313155.pdf) · [Éduscol](https://eduscol.education.gouv.fr/sites/default/files/document/programme-d-enseignement-du-cycle-4-67722.pdf) · [autre](https://www.education.gouv.fr/les-programmes-du-college-470408)

### Langues vivantes

**`lv-c2c3-2026`** - Programmes de langues vivantes étrangères et régionales de l'école élémentaire (cycle 2 et CM) - version 2026

- Texte : Arrêté du 26 février 2026 (NOR MENE2602911A, JO du 07-03-2026) fixant les programmes d'enseignement de langues vivantes étrangères et régionales pour les classes de l'école élémentaire ; BO n°12 du 19 mars 2026 (annexe 1 : cycle 2 ; annexe 2 : classes de cours moyen).
- Niveaux concernés en 2026-2027 : CP, CM1 - statut `in-force`
- Portée : `annual`. Activités langagières déclinées par classe (étiquettes CP/CE1/CE2 et CM1/CM2) ; niveaux CECRL attendus fixés par année.
- Repères annuels : Oui : niveaux CECRL de fin d'année : CP pré-A1 (oral) ; CE1 pré-A1 (oral) ; CE2 pré-A1 consolidé (toutes activités), vers A1 à l'oral ; CM1 A1 (toutes activités) ; CM2 A1 consolidé (A1+ voire A2 en parcours renforcés/EMILE).
- Confiance : high ; origine des domaines : bo-text-read
- Liens : [BO](https://www.education.gouv.fr/bo/2026/Hebdo12/MENE2602911A) · [PDF lu](https://www.education.gouv.fr/sites/default/files/document/Annexe%201%20%E2%80%93%20Programme%20de%20langues%20vivantes%20%C3%A9trang%C3%A8res%20et%20r%C3%A9gionales%20pour%20le%20cycle%202%20-481187.pdf) · [Légifrance (lu)](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000053634775) · [autre](https://www.education.gouv.fr/les-langues-vivantes-etrangeres-et-regionales-11249)

**`lv-c4-lycee-2025`** - Programmes communs et optionnels de langues vivantes étrangères du collège et du lycée général et technologique - version 2025

- Texte : Arrêté du 5 mai 2025 (NOR MENE2504621A, JO du 28-05-2025) fixant les programmes d'enseignement communs et optionnels de langues vivantes étrangères pour les classes de collège et de lycée général et technologique ; BO n°22 du 29 mai 2025 (annexes par langue : allemand, anglais, arabe, chinois, espagnol, hébreu, italien, japonais, néerlandais, polonais, portugais, russe, cadre commun langues de faible diffusion).
- Niveaux concernés en 2026-2027 : 6e, 5e, Seconde, Première, Terminale - statut `in-force`
- Portée : `annual`. Niveaux de maîtrise CECRL fixés « à la fin de chaque année » ; axes culturels : 5 axes en 6e, 6 axes de la 5e à la terminale (5 sur 6 à traiter, dont obligatoirement l'axe 6 ; voie technologique : au moins 3 axes).
- Repères annuels : Oui : tableaux CECRL par année (lus dans l'annexe anglais lycée) - LVA : 6e A1+, 5e A2, 4e A2+, 3e B1, 2nde B1+, 1re B1+, Tle B2 ; LVB : 6e A1, 5e A1+, 4e A1+, 3e A2, 2nde A2+, 1re B1, Tle B1 ; LVC : 2nde A1+, 1re A2, Tle A2+/B1.
- Confiance : high ; origine des domaines : bo-text-partially-read
- Liens : [BO](https://www.education.gouv.fr/bo/2025/Hebdo22/MENE2504621A) · [PDF lu](https://www.education.gouv.fr/sites/default/files/annexe-4-programme-d-anglais-pour-les-classes-de-lyc-e-g-n-ral-et-technologique-440361.pdf) · [Légifrance (lu)](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000051666594) · [autre](https://www.education.gouv.fr/les-langues-vivantes-etrangeres-et-regionales-11249)

**`lv-2020`** - Langues vivantes (étrangères ou régionales) - programmes 2020 des cycles 2, 3 et 4 (encore en vigueur en 2026-2027 pour CE1, CE2, CM2, 4e et 3e)

- Texte : Arrêté du 17 juillet 2020 (NOR MENE2018714A), BO n°31 du 30 juillet 2020 (volet « Langues vivantes (étrangères ou régionales) » des annexes 1, 2, 3).
- Niveaux concernés en 2026-2027 : CE1, CE2, CM2, 4e, 3e - statut `legacy-in-force`
- Portée : `cycle`. Défini à l'échelle du cycle avec niveaux CECRL de fin de cycle ; des « repères annuels / attendus de fin d'année » pour les LV existent sur Éduscol (source académique secondaire pour le cycle 4).
- Repères annuels : Repères annuels LV : existence signalée par une page académique (Lille) pour les 4e/3e ; non vérifié sur Éduscol.
- Confiance : medium ; origine des domaines : non-detaille
- Liens : [BO](https://www.education.gouv.fr/bo/20/Hebdo31/MENE2018714A.htm) · [PDF lu](https://www.education.gouv.fr/sites/default/files/imported_files/documents/BO_MENJS_31_1313155.pdf) · [Éduscol](https://eduscol.education.gouv.fr/sites/default/files/document/programme-d-enseignement-du-cycle-4-67722.pdf) · [autre](https://www.education.gouv.fr/les-langues-vivantes-etrangeres-et-regionales-11249)

**`lv-regionales-2026`** - Programmes communs et optionnels de langues vivantes régionales du collège et du lycée général et technologique - 2026

- Texte : Arrêté du 23 avril 2026 (NOR MENE2602909A, JO du 08-05-2026) fixant les programmes d'enseignement communs et optionnels de langues vivantes régionales pour les classes de collège et de lycée général et technologique ; BO n°21 du 21 mai 2026.
- Niveaux concernés en 2026-2027 : 6e, 5e, Seconde - statut `in-force`
- Portée : `annual`. Même architecture que le programme LV étrangères 2025 (niveaux par année) ; détail non relu.
- Repères annuels : Probable (même cadre) - non vérifié sur le texte.
- Confiance : medium ; origine des domaines : non-lu
- Liens : [BO](https://www.education.gouv.fr/bo/2026/Hebdo21/MENE2602909A) · [Légifrance (lu)](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000054048169) · [autre](https://www.education.gouv.fr/les-langues-vivantes-etrangeres-et-regionales-11249)

### Transversaux : EMC, EVAR(S), arts, numérique et IA

**`emc-2024`** - Programme d'enseignement moral et civique du CP à la terminale (voies générale, technologique, professionnelle) - 2024

- Texte : Arrêté du 29 mai 2024 (NOR MENE2413934A, JO du 12-06-2024) fixant le programme d'enseignement moral et civique du cours préparatoire à la classe terminale des voies générale, technologique et professionnelle et des classes préparant au CAP ; publié au BO n°24 du 13 juin 2024. Modifié (rectification technique) par l'arrêté du 19 juin 2024 (NOR MENE2416160A).
- Niveaux concernés en 2026-2027 : CP, CE1, CE2, CM1, CM2, 6e, 5e, 4e, 3e, Seconde, Première, Terminale - statut `in-force`
- Portée : `annual`. Programme rédigé année par année (un titre et des thèmes par classe, du CP à la terminale).
- Repères annuels : Oui : une rubrique par classe (ex. « Cinquième : Égalité, fraternité et solidarité »), notions et contenus distincts pour chaque année (Préambule). La note de service de 2019 sur les repères annuels EMC portait sur l'ancien programme (abrogation formelle non vérifiée).
- Confiance : high ; origine des domaines : bo-text-read
- Liens : [BO](https://www.education.gouv.fr/bo/2024/Hebdo24/MENE2413934A) · [PDF lu](https://www.education.gouv.fr/sites/default/files/Bulletin_officiel_MENJS_2024_06_13_BO24-1718196134.pdf) · [Légifrance (lu)](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000049694961) · [Éduscol](https://eduscol.education.gouv.fr/5787/programmes-et-ressources-en-enseignement-moral-et-civique-voie-gt)

**`evar-evars-2025`** - Programme d'éducation à la vie affective et relationnelle (EVAR, école) et à la sexualité (EVARS, collège-lycée) - 2025

- Texte : Arrêté du 3 février 2025 (NOR MENE2503064A, JO du 05-02-2025) fixant le programme d'éducation à la sexualité : éduquer à la vie affective et relationnelle à l'école maternelle et élémentaire, éduquer à la vie affective et relationnelle, et à la sexualité au collège et au lycée ; BO n°6 du 6 février 2025. Circulaire de mise en œuvre du 4 février 2025 (NOR MENE2503565C).
- Niveaux concernés en 2026-2027 : CP, CE1, CE2, CM1, CM2, 6e, 5e, 4e, 3e, Seconde, Première, Terminale - statut `in-force`
- Portée : `annual`. Objectifs d'apprentissage détaillés par axe ET par niveau (maternelle par tranche d'âge ; CP, CE1, CE2, CM1, CM2 ; 6e-3e ; 2nde, 1re, Tle ; CAP).
- Repères annuels : Oui : tables des matières du programme par classe (« Objectifs d'apprentissage par axe du programme et par niveau »).
- Confiance : high ; origine des domaines : bo-text-read
- Liens : [BO](https://www.education.gouv.fr/bo/2025/Hebdo6/MENE2503064A) · [PDF lu](https://education.gouv.fr/sites/default/files/Bulletin_officiel_MENJS_2025_02_06_BO6-1738835410.pdf) · [Légifrance (lu)](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000051132259) · [Éduscol](https://eduscol.education.gouv.fr/sites/default/files/document/reperes-mise-en-oeuvre-du-programme-evarspdf-112863.pdf)

**`arts-plastiques-2020`** - Arts plastiques (cycles 2, 3, 4) - programmes 2020 ; projets de nouveaux programmes 2025-2026 non adoptés (à la date du 05-10-2026)

- Texte : Arrêté du 17 juillet 2020 (NOR MENE2018714A) ; BO n°31 du 30 juillet 2020. Projets du CSP : programmes des enseignements artistiques des cycles 2 et 3 (juillet 2025) ; consultation nationale du 09-02-2026 au 20-03-2026 (autre source : 13-03-2026).
- Niveaux concernés en 2026-2027 : CP, CE1, CE2, CM1, CM2, 6e, 5e, 4e, 3e - statut `legacy-in-force`
- Portée : `cycle`. Programmes par cycle (2, 3, 4), attendus de fin de cycle.
- Repères annuels : Non.
- Confiance : medium ; origine des domaines : bo-text-read
- Liens : [BO](https://www.education.gouv.fr/bo/20/Hebdo31/MENE2018714A.htm) · [PDF lu](https://www.education.gouv.fr/sites/default/files/imported_files/documents/BO_MENJS_31_1313155.pdf) · [Éduscol](https://eduscol.education.gouv.fr/sites/default/files/document/programme-d-enseignement-du-cycle-4-67722.pdf) · [autre](https://www.education.gouv.fr/le-conseil-superieur-des-programmes/projet-de-programmes-des-enseignements-artistiques-pour-le-cycle-2-469907)

**`musique-2020`** - Éducation musicale (cycles 2, 3, 4) - programmes 2020 ; projets de nouveaux programmes non adoptés (à la date du 05-10-2026)

- Texte : Arrêté du 17 juillet 2020 (NOR MENE2018714A) ; BO n°31 du 30 juillet 2020.
- Niveaux concernés en 2026-2027 : CP, CE1, CE2, CM1, CM2, 6e, 5e, 4e, 3e - statut `legacy-in-force`
- Portée : `cycle`. Programme par cycle ; « deux champs de compétences » au cycle 4.
- Repères annuels : Non.
- Confiance : medium ; origine des domaines : bo-text-read
- Liens : [BO](https://www.education.gouv.fr/bo/20/Hebdo31/MENE2018714A.htm) · [PDF lu](https://www.education.gouv.fr/sites/default/files/imported_files/documents/BO_MENJS_31_1313155.pdf) · [Éduscol](https://eduscol.education.gouv.fr/sites/default/files/document/programme-d-enseignement-du-cycle-4-67722.pdf)

**`ia-numerique-cadre-2026`** - Compétences numériques (CRCN, Pix), parcours Pix IA obligatoires et cadre d'usage de l'IA en éducation

- Texte : Décret n° 2019-919 du 30 août 2019 (CRCN) ; note de service du 23 janvier 2026 (NOR MENE2527173N) « Modalités de formation, d'évaluation et de certification des compétences numériques », publiée au BO n°6 du 5 février 2026 (abroge la note du 23-10-2024) ; article L. 312-9 du Code de l'éducation (loi n° 2024-449 du 21 mai 2024) ; cadre d'usage de l'IA en éducation (juin 2025).
- Niveaux concernés en 2026-2027 : CP, CE1, CE2, CM1, CM2, 6e, 5e, 4e, 3e, Seconde, Première, Terminale - statut `in-force`
- Portée : `cycle`. Cadre transversal, pas un programme disciplinaire : compétences travaillées dans toutes les disciplines (CRCN) ; pensée informatique dans les programmes de maths, sciences et technologie (cycles 2-3) et technologie (cycle 4).
- Repères annuels : Niveaux CRCN attendus : 3 en fin de 3e, 4 en terminale ; pas de programme annuel.
- Confiance : high ; origine des domaines : bo-text-read
- Liens : [BO (lu)](https://www.education.gouv.fr/sites/default/files/document/Bulletin%20officiel%20n%C2%B0%206%20du%205%20f%C3%A9vrier%202026-479588.pdf) · [Légifrance (lu)](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000039005162) · [autre](https://www.education.gouv.fr/cadre-d-usage-de-l-ia-en-education-450647)

### Lycée : mathématiques

**`maths-2nde-2026`** - Programme de mathématiques de la classe de seconde générale et technologique - version 2026

- Texte : Arrêté du 26 février 2026 (NOR MENE2602914A, JO du 27-03-2026) ; publié au BO n°14 du 2 avril 2026 (articles et sommaires lus dans le PDF complet du BO). L'annexe de l'arrêté du 17 janvier 2019 est remplacée par la nouvelle annexe (article 1).
- Niveaux concernés en 2026-2027 : Seconde - statut `in-force`
- Portée : `annual`. Programme d'une seule classe (2nde) ; pas de découpage par cycle.
- Repères annuels : Sans objet (programme annuel).
- Confiance : high ; origine des domaines : bo-text-read
- Liens : [BO](https://www.education.gouv.fr/bo/2026/Hebdo14/MENE2602914A) · [PDF lu](https://www.education.gouv.fr/sites/default/files/document/Bulletin%20officiel%20n%C2%B0%2014%20du%202%20avril%202026-515432.pdf) · [Légifrance](https://legifrance.gouv.fr/eli/arrete/2026/2/26/MENE2602914A/jo/texte) · [autre](https://www.dpernoux.net/2026/04/nouveaux-programmes-de-mathematiques-pour-le-lycee-bo-du-2-avril-2026.html)

**`maths-1re-spe-2026`** - Programme de spécialité de mathématiques de la classe de première de la voie générale - version 2026

- Texte : Arrêté du 26 février 2026 (NOR MENE2602917A, JO du 27-03-2026) ; publié au BO n°14 du 2 avril 2026 (articles et sommaires lus dans le PDF complet du BO). Remplace l'annexe de l'arrêté du 17 janvier 2019.
- Niveaux concernés en 2026-2027 : Première - statut `in-force`
- Portée : `annual`. Programme d'une seule classe.
- Repères annuels : Sans objet.
- Confiance : high ; origine des domaines : bo-text-read
- Liens : [BO](https://www.education.gouv.fr/bo/2026/Hebdo14/MENE2602917A) · [PDF lu](https://www.education.gouv.fr/sites/default/files/document/Bulletin%20officiel%20n%C2%B0%2014%20du%202%20avril%202026-515432.pdf) · [Légifrance](https://www.legifrance.gouv.fr/loda/id/JORFTEXT000053723235/) · [autre](https://www.dpernoux.net/2026/04/nouveaux-programmes-de-mathematiques-pour-le-lycee-bo-du-2-avril-2026.html)

**`maths-1re-ens-sci-2026`** - Programme de mathématiques intégré à l'enseignement scientifique en classe de première générale - version 2026

- Texte : Arrêté du 26 février 2026 (NOR MENE2602916A, JO du 27-03-2026) ; publié au BO n°14 du 2 avril 2026 (articles et sommaires lus dans le PDF complet du BO). Remplace l'annexe de l'arrêté du 6 juillet 2022 (version initiale du module).
- Niveaux concernés en 2026-2027 : Première - statut `in-force`
- Portée : `annual`. Module d'une seule classe.
- Repères annuels : Sans objet.
- Confiance : high ; origine des domaines : bo-text-read
- Liens : [BO (lu)](https://www.education.gouv.fr/sites/default/files/document/Bulletin%20officiel%20n%C2%B0%2014%20du%202%20avril%202026-515432.pdf) · [Légifrance](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000053723227) · [autre](https://www.dpernoux.net/2026/04/nouveaux-programmes-de-mathematiques-pour-le-lycee-bo-du-2-avril-2026.html)

**`maths-1re-techno-2026`** - Programme de mathématiques de la classe de première de la voie technologique - version 2026

- Texte : Arrêté du 26 février 2026 (NOR MENE2602918A, JO du 27-03-2026) ; publié au BO n°14 du 2 avril 2026 (articles et sommaires lus dans le PDF complet du BO). Remplace l'annexe de l'arrêté du 17 janvier 2019.
- Niveaux concernés en 2026-2027 : Première - statut `in-force`
- Portée : `annual`. Programme d'une seule classe, commun aux séries technologiques (avec parties spécifiques STD2A).
- Repères annuels : Sans objet.
- Confiance : high ; origine des domaines : bo-text-read
- Liens : [BO](https://www.education.gouv.fr/bo/2026/Hebdo14/MENE2602918A) · [PDF lu](https://www.education.gouv.fr/sites/default/files/document/Bulletin%20officiel%20n%C2%B0%2014%20du%202%20avril%202026-515432.pdf) · [autre](https://www.dpernoux.net/2026/04/nouveaux-programmes-de-mathematiques-pour-le-lycee-bo-du-2-avril-2026.html)

**`maths-tle-spe-2019`** - Programme de spécialité de mathématiques de la classe terminale de la voie générale - version 2019 (en vigueur en 2026-2027 ; nouvelle version 2026 applicable à la rentrée 2027-2028)

- Texte : Arrêté du 19 juillet 2019, BO spécial n°8 du 25 juillet 2019 (NOR MENE1921246A selon l'index de recherche). Version suivante : arrêté du 26 février 2026 (NOR MENE2602919A), BO n°14 du 2 avril 2026, application à la rentrée 2027-2028 (article 2).
- Niveaux concernés en 2026-2027 : Terminale - statut `legacy-in-force`
- Portée : `annual`. Programme d'une seule classe.
- Repères annuels : Sans objet.
- Confiance : medium ; origine des domaines : bo-text-read-2019-headings-2026-notions
- Liens : [BO](https://www.education.gouv.fr/bo/19/Special8/MENE1921246A.htm?cid_bo=144023) · [PDF lu](https://www.education.gouv.fr/sites/default/files/document/Bulletin%20officiel%20n%C2%B0%2014%20du%202%20avril%202026-515432.pdf) · [Légifrance](https://www.legifrance.gouv.fr/loda/id/JORFTEXT000053723251/2026-06-27)

**`maths-complementaires-tle-2019`** - Programme de l'enseignement optionnel de mathématiques complémentaires de la classe terminale de la voie générale - version 2019 (en vigueur en 2026-2027 ; nouvelle version 2027-2028)

- Texte : Arrêté du 19 juillet 2019 (NOR MENE1921265A), BO spécial n°8 du 25 juillet 2019. Version suivante : arrêté du 26 février 2026 (NOR imprimé « MENE2902920A » au sommaire du BO n°14 - probable coquille), application rentrée 2027-2028.
- Niveaux concernés en 2026-2027 : Terminale - statut `legacy-in-force`
- Portée : `annual`. Programme d'une classe.
- Repères annuels : Sans objet.
- Confiance : medium ; origine des domaines : bo-text-read-2026-version
- Liens : [BO](https://www.education.gouv.fr/bo/19/Special8/MENE1921265A.htm) · [PDF lu](https://www.education.gouv.fr/sites/default/files/document/Bulletin%20officiel%20n%C2%B0%2014%20du%202%20avril%202026-515432.pdf) · [Légifrance](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000053723259)

**`maths-expertes-tle-2019`** - Programme de l'enseignement optionnel de mathématiques expertes de la classe terminale de la voie générale - 2019 (aucune modification publiée au BO n°14 du 02-04-2026)

- Texte : Arrêté du 19 juillet 2019 (NOR MENE1921264A), BO spécial n°8 du 25 juillet 2019.
- Niveaux concernés en 2026-2027 : Terminale - statut `in-force`
- Portée : `annual`. Programme d'une classe.
- Repères annuels : Sans objet.
- Confiance : high ; origine des domaines : bo-text-read
- Liens : [BO](https://www.education.gouv.fr/bo/19/Special8/MENE1921264A.htm?cid_bo=144014) · [Légifrance (lu)](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000038799998)

**`maths-tle-techno-2019`** - Programme de mathématiques de la classe terminale de la voie technologique - version 2019 (en vigueur en 2026-2027 ; nouvelle version 2027-2028)

- Texte : Arrêté du 19 juillet 2019, BO spécial n°8 du 25 juillet 2019 (NOR de la version 2019 non vérifié). Version suivante : arrêté du 26 février 2026 (NOR MENE2602921A), BO n°14 du 2 avril 2026, application rentrée 2027-2028.
- Niveaux concernés en 2026-2027 : Terminale - statut `legacy-in-force`
- Portée : `annual`. Programme d'une classe, commun aux séries technologiques.
- Repères annuels : Sans objet.
- Confiance : medium ; origine des domaines : bo-text-read-2026-version
- Liens : [BO](https://www.education.gouv.fr/pid285/bulletin_officiel.html?pid_bo=39051) · [PDF lu](https://www.education.gouv.fr/sites/default/files/document/Bulletin%20officiel%20n%C2%B0%2014%20du%202%20avril%202026-515432.pdf)

### Lycée : autres disciplines

**`snt-2nde-2019`** - Programme de sciences numériques et technologie (SNT) de la classe de seconde générale et technologique - 2019

- Texte : Arrêté du 17 janvier 2019 (NOR MENE1901641A, JO du 20-01-2019), BO spécial n°1 du 22 janvier 2019.
- Niveaux concernés en 2026-2027 : Seconde - statut `in-force`
- Portée : `annual`. Programme d'une classe (sept thématiques).
- Repères annuels : Sans objet.
- Confiance : high ; origine des domaines : search-snippet
- Liens : [BO](https://www.education.gouv.fr/bo/19/Special1/MENE1901641A.htm) · [Éduscol](https://eduscol.education.gouv.fr/5841/programmes-et-ressources-en-sciences-numeriques-et-technologie-voie-gt) · [autre](https://nsi-snt.ac-normandie.fr/lettre-de-saisine-relative-a-la-revision-du-programme-de-snt)

**`snt-ia-2027`** - Refonte du programme de SNT avec enseignement de l'IA (projet) - rentrée 2027 (NON en vigueur en 2026-2027)

- Texte : Lettre de saisine du ministre de l'Éducation nationale au Conseil supérieur des programmes, 20 juillet 2026 (texte non consulté sur le site officiel ; relayé par l'académie de Normandie, publication du 30-08-2026).
- Niveaux concernés en 2026-2027 : aucun (non en vigueur) - statut `pending-not-in-force`
- Portée : `annual`. Projet.
- Repères annuels : Sans objet.
- Confiance : medium ; origine des domaines : non-applicable
- Liens : [autre](https://nsi-snt.ac-normandie.fr/lettre-de-saisine-relative-a-la-revision-du-programme-de-snt)

**`francais-lycee-2019`** - Programme de français de seconde GT et de première (voies générale et technologique) - 2019, modifié 2020

- Texte : Arrêté du 17 janvier 2019 (NOR MENE1901575A), BO spécial n°1 du 22 janvier 2019 ; modifications publiées au BO spécial n°6 du 31 juillet 2020 et au BO n°40 du 22 octobre 2020 (version Éduscol « modifiée »). Programme national d'œuvres renouvelé par quart chaque année (note de service ; ex. BO n°30 du 25-07-2024).
- Niveaux concernés en 2026-2027 : Seconde, Première - statut `in-force`
- Portée : `annual`. Programmes distincts pour la 2nde et la 1re ; en 1re : quatre objets d'étude (une œuvre + un parcours chacun ; quatre œuvres au total).
- Repères annuels : Sans objet ; le programme limitatif d'œuvres change chaque année.
- Confiance : medium ; origine des domaines : bo-text-partially-read
- Liens : [BO](https://www.education.gouv.fr/bo/19/Special1/MENE1901575A.htm) · [Éduscol](https://eduscol.education.gouv.fr/sites/default/files/document/04annexe2francais1egtbomodifiepdf-69837.pdf)

**`hg-lycee-2019`** - Programmes d'histoire-géographie de seconde GT, première (G et T) et terminale (G et T) - 2019

- Texte : Arrêté du 17 janvier 2019 (NOR MENE1901577A), BO spécial n°1 du 22 janvier 2019 (2nde et 1re) ; arrêté du 19 juillet 2019 (NOR MENE1921243A), BO spécial n°8 du 25 juillet 2019 (terminales générale et technologique).
- Niveaux concernés en 2026-2027 : Seconde, Première, Terminale - statut `in-force`
- Portée : `annual`. Un programme par classe, deux disciplines (histoire, géographie) à volumes égaux.
- Repères annuels : Sans objet.
- Confiance : medium ; origine des domaines : bo-text-partially-read
- Liens : [BO](https://www.education.gouv.fr/bo/19/Special1/MENE1901577A.htm) · [Éduscol](https://eduscol.education.gouv.fr/sites/default/files/document/spe577annexe1corr1063699pdf-83007.pdf)

**`philo-tle-2019`** - Programme de philosophie de la classe terminale (voies générale et technologique) - 2019

- Texte : Arrêté du 19 juillet 2019 (NOR MENE1921238A, JO du 23-07-2019), BO spécial n°8 du 25 juillet 2019 ; en vigueur à la rentrée 2020.
- Niveaux concernés en 2026-2027 : Terminale - statut `in-force`
- Portée : `annual`. Programme d'une seule classe, voies générale et technologique.
- Repères annuels : Sans objet.
- Confiance : high ; origine des domaines : bo-text-read-structure-notions-from-search-snippet
- Liens : [BO](https://www.education.gouv.fr/bo/19/Special8/MENE1921238A.htm) · [PDF lu](https://www.education.gouv.fr/sites/default/files/document/Programme%20de%20philosophie%20de%20terminale%20g%C3%A9n%C3%A9rale-289908.pdf) · [Légifrance (lu)](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000038799903)

**`ens-sci-2023`** - Programmes d'enseignement scientifique (tronc commun) de première générale et de terminale générale - versions modifiées 2023

- Texte : Arrêtés du 30 mai 2023 modifiant l'arrêté du 17 janvier 2019 (première ; JO du 17-06-2023 ; application rentrée 2023-2024) et l'arrêté du 19 juillet 2019 (terminale ; application rentrée 2024-2025) ; BO n°25 du 22 juin 2023.
- Niveaux concernés en 2026-2027 : Première, Terminale - statut `in-force`
- Portée : `annual`. Un programme par classe.
- Repères annuels : Sans objet.
- Confiance : high ; origine des domaines : bo-text-read
- Liens : [BO](https://www.education.gouv.fr/bo/2023/Hebdo25/MENE2312807A) · [PDF lu](https://www.education.gouv.fr/sites/default/files/document/Annexe%20%E2%80%93%20Programme%20d%E2%80%99enseignement%20scientifique%20de%20%20premi%C3%A8re%20g%C3%A9n%C3%A9rale-365055.pdf) · [Légifrance (lu)](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000047692661) · [Éduscol](https://eduscol.education.gouv.fr/5790/programmes-et-ressources-en-enseignement-scientifique-voie-g?mddtab=23251)

**`pc-2nde-2019`** - Programme de physique-chimie de la classe de seconde générale et technologique - 2019

- Texte : Arrêté du 17 janvier 2019 (NOR MENE1901634A), BO spécial n°1 du 22 janvier 2019.
- Niveaux concernés en 2026-2027 : Seconde - statut `in-force`
- Portée : `annual`. Programme d'une classe.
- Repères annuels : Sans objet.
- Confiance : high ; origine des domaines : bo-text-read
- Liens : [BO](https://www.education.gouv.fr/bo/19/Special1/MENE1901634A.htm) · [PDF lu](https://www.education.gouv.fr/sites/default/files/document/Programme%20de%20physique-chimie%20de%20seconde%20g%C3%A9n%C3%A9rale%20et%20technologique-253347.pdf) · [Légifrance](https://www.legifrance.gouv.fr/loda/id/JORFTEXT000038029507) · [Éduscol](https://eduscol.education.gouv.fr/5829/programmes-et-ressources-en-physique-chimie-voie-gt?mddtab=23139)

**`pc-spe-1re-tle-2019`** - Enseignement de spécialité de physique-chimie, première et terminale générales - 2019

- Texte : Arrêtés du 17 janvier 2019 (première, NOR MENE1901635A, BO spécial n°1 du 22-01-2019) et du 19 juillet 2019 (terminale, NOR MENE1921249A, BO spécial n°8 du 25-07-2019).
- Niveaux concernés en 2026-2027 : Première, Terminale - statut `in-force`
- Portée : `annual`. Programmes distincts 1re (4 h/sem.) et Tle (6 h/sem.).
- Repères annuels : Sans objet.
- Confiance : high ; origine des domaines : bo-text-read
- Liens : [BO](https://www.education.gouv.fr/bo/19/Special1/MENE1901635A.htm) · [PDF lu](https://www.education.gouv.fr/sites/default/files/document/Programme%20de%20physique-chimie%20de%20premi%C3%A8re%20g%C3%A9n%C3%A9rale-251859.pdf) · [Légifrance (lu)](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000038029512)

**`svt-2nde-2019`** - Programme de sciences de la vie et de la Terre de la classe de seconde générale et technologique - 2019

- Texte : Arrêté du 17 janvier 2019 (NOR MENE1901647A), BO spécial n°1 du 22 janvier 2019.
- Niveaux concernés en 2026-2027 : Seconde - statut `in-force`
- Portée : `annual`. Programme d'une classe.
- Repères annuels : Sans objet.
- Confiance : medium ; origine des domaines : search-snippet
- Liens : [BO](https://www.education.gouv.fr/bo/19/Special1/MENE1901647A.htm) · [Éduscol](https://eduscol.education.gouv.fr/5835/programmes-et-ressources-en-sciences-de-la-vie-et-de-la-terre-voie-gt)

**`svt-spe-1re-tle-2019`** - Enseignement de spécialité de sciences de la vie et de la Terre, première et terminale générales - 2019

- Texte : Arrêtés du 17 janvier 2019 (première, NOR MENE1901648A, BO spécial n°1) et du 19 juillet 2019 (terminale, NOR MENE1921252A, BO spécial n°8 du 25-07-2019).
- Niveaux concernés en 2026-2027 : Première, Terminale - statut `in-force`
- Portée : `annual`. Programmes distincts 1re et Tle.
- Repères annuels : Sans objet.
- Confiance : high ; origine des domaines : bo-text-read-terminale
- Liens : [BO](https://www.education.gouv.fr/bo/19/Special1/MENE1901648A.htm?cid_bo=138189) · [PDF lu](https://www.education.gouv.fr/sites/default/files/document/spe252_annexe_1159114.pdf-248268.pdf)

**`nsi-spe-1re-tle-2019`** - Enseignement de spécialité numérique et sciences informatiques (NSI), première et terminale générales - 2019

- Texte : Arrêté du 17 janvier 2019 (première, NOR MENE1901633A, BO spécial n°1) et arrêté du 19 juillet 2019 (terminale, NOR MENE1921247A, BO spécial n°8 du 25-07-2019).
- Niveaux concernés en 2026-2027 : Première, Terminale - statut `in-force`
- Portée : `annual`. Programmes distincts 1re (4 h) et Tle (6 h) ; au moins un quart des heures consacré à des projets.
- Repères annuels : Sans objet.
- Confiance : high ; origine des domaines : bo-text-partially-read
- Liens : [BO](https://www.education.gouv.fr/bo/19/Special8/MENE1921247A.htm?cid_bo=144028) · [PDF lu](https://www.education.gouv.fr/sites/default/files/document/Programme%20de%20num%C3%A9rique%20et%20sciences%20informatiques%20de%20premi%C3%A8re%20g%C3%A9n%C3%A9rale-248139.pdf) · [Légifrance (lu)](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000038029502) · [Éduscol](https://eduscol.education.gouv.fr/sites/default/files/document/spe247annexe1158933pdf-89502.pdf)

**`si-spe-1re-tle-2019`** - Enseignement de spécialité de sciences de l'ingénieur (SI), cycle terminal de la voie générale - 2019

- Texte : Arrêté du 17 janvier 2019 (NOR MENE1901640A), BO spécial n°1 du 22 janvier 2019 (programme commun 1re et Tle) ; application 2019 pour la première, 2020 pour la terminale.
- Niveaux concernés en 2026-2027 : Première, Terminale - statut `in-force`
- Portée : `cycle`. Programme unique du cycle terminal (1re et Tle) ; projet de 12 h en 1re, 48 h en Tle.
- Repères annuels : Non (programme de cycle terminal).
- Confiance : high ; origine des domaines : bo-text-read
- Liens : [BO](https://www.education.gouv.fr/bo/19/Special1/MENE1901640A.htm) · [PDF lu](https://www.education.gouv.fr/sites/default/files/document/Sciences%20de%20l%E2%80%99ing%C3%A9nieur-235884.pdf) · [Légifrance (lu)](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000038029537) · [Éduscol](https://eduscol.education.gouv.fr/5832/programmes-et-ressources-en-sciences-de-l-ingenieur-voie-gt)

**`ses-2nde-2019`** - Programme de sciences économiques et sociales de la classe de seconde générale et technologique - 2019

- Texte : Arrêté du 17 janvier 2019 (NOR MENE1901638A), BO spécial n°1 du 22 janvier 2019.
- Niveaux concernés en 2026-2027 : Seconde - statut `in-force`
- Portée : `annual`. Programme d'une classe.
- Repères annuels : Sans objet.
- Confiance : high ; origine des domaines : bo-text-read
- Liens : [BO](https://www.education.gouv.fr/bo/19/Special1/MENE1901638A.htm) · [PDF lu](https://cache.media.education.gouv.fr/file/SP1-MEN-22-1-2019/05/3/spe638_annexe_1063053.pdf)

**`ses-spe-1re-tle-2019`** - Enseignement de spécialité de sciences économiques et sociales, première et terminale générales - 2019

- Texte : Arrêtés du 17 janvier 2019 (première, NOR MENE1901639A, BO spécial n°1) et du 19 juillet 2019 (terminale, NOR MENE1921253A, BO spécial n°8).
- Niveaux concernés en 2026-2027 : Première, Terminale - statut `in-force`
- Portée : `annual`. Programmes distincts 1re et Tle, chacun en trois blocs (économie / sociologie et science politique / regards croisés).
- Repères annuels : Sans objet.
- Confiance : high ; origine des domaines : bo-text-read
- Liens : [BO](https://www.education.gouv.fr/bo/19/Special1/MENE1901639A.htm) · [Légifrance](https://www.legifrance.gouv.fr/loda/id/JORFTEXT000038029532) · [Éduscol](https://eduscol.education.gouv.fr/sites/default/files/document/spe639annexe1063544pdf-82752.pdf)

**`hggsp-spe-1re-tle-2019`** - Enseignement de spécialité histoire-géographie, géopolitique et sciences politiques (HGGSP), première et terminale générales - 2019

- Texte : Arrêtés du 17 janvier 2019 (première, NOR MENE1901576A, BO spécial n°1) et du 19 juillet 2019 (terminale, NOR MENE1921254A, BO spécial n°8).
- Niveaux concernés en 2026-2027 : Première, Terminale - statut `in-force`
- Portée : `annual`. Programmes distincts : 1re « Acquérir des clés de compréhension du monde contemporain » (5 thèmes) ; Tle « Analyser les grands enjeux du monde contemporain » (6 thèmes).
- Repères annuels : Sans objet.
- Confiance : medium ; origine des domaines : search-snippet
- Liens : [BO](https://www.education.gouv.fr/bo/19/Special1/MENE1901576A.htm) · [Éduscol](https://eduscol.education.gouv.fr/5802/programmes-et-ressources-en-histoire-geographie-geopolitique-et-sciences-politiques-voie-g)

**`hlp-spe-1re-tle-2019`** - Enseignement de spécialité humanités, littérature et philosophie (HLP), première et terminale générales - 2019

- Texte : Arrêtés du 17 janvier 2019 (première, NOR MENE1901578A, BO spécial n°1) et du 19 juillet 2019 (terminale, NOR MENE1921255A, BO spécial n°8).
- Niveaux concernés en 2026-2027 : Première, Terminale - statut `in-force`
- Portée : `annual`. Programmes distincts, chacun en deux semestres.
- Repères annuels : Sans objet.
- Confiance : high ; origine des domaines : bo-text-read-terminale
- Liens : [BO](https://www.education.gouv.fr/bo/19/Special1/MENE1901578A.htm) · [PDF lu](https://www.education.gouv.fr/sites/default/files/document/Humanit%C3%A9s,%20litt%C3%A9rature%20et%20philosophie-236001.pdf) · [Éduscol](https://eduscol.education.gouv.fr/5805/programmes-et-ressources-en-humanites-litterature-et-philosophie-voie-g?mddtab=23251)

**`llcer-spe-1re-tle-2019`** - Enseignement de spécialité langues, littératures et cultures étrangères et régionales (LLCER), première et terminale générales - 2019

- Texte : Arrêtés du 17 janvier 2019 (première, NOR MENE1901590A, BO spécial n°1) et du 19 juillet 2019 (terminale, NOR MENE1921256A, BO spécial n°8) ; programmes limitatifs d'œuvres renouvelés chaque année (ex. MENE2405569N pour 2024-2025 et 2025-2026).
- Niveaux concernés en 2026-2027 : Première, Terminale - statut `in-force`
- Portée : `annual`. Programmes distincts 1re et Tle.
- Repères annuels : Sans objet.
- Confiance : low ; origine des domaines : non-lu
- Liens : [BO](https://www.education.gouv.fr/bo/19/Special1/MENE1901590A.htm)

**`eps-lycee-2019`** - Programme d'éducation physique et sportive du lycée (enseignement commun et optionnel) - 2019

- Texte : Arrêté du 17 janvier 2019 (NOR MENE1901574A), BO spécial n°1 du 22 janvier 2019 (seconde GT, première et terminale G et T).
- Niveaux concernés en 2026-2027 : Seconde, Première, Terminale - statut `in-force`
- Portée : `cycle`. Programme du cycle lycée avec attendus par niveau de compétences.
- Repères annuels : Non vérifié.
- Confiance : medium ; origine des domaines : non-lu
- Liens : [BO](https://www.education.gouv.fr/bo/19/Special1/MENE1901574A.htm)

## 5. Changements récents de calendrier (réforme 2024-2026)

- 2024-02-29 : BO n°9 : programme de technologie du cycle 4 (arrêté du 9-02-2024) : 5e en 2024, 4e en 2025, 3e en 2026.
- 2024-06-13 : BO n°24 : programme EMC unique CP-terminale (arrêté du 29-05-2024), déploiement 2024 (CP, CM1, 5e, 2nde) / 2025 (CE1, CM2, 4e, 1re) / 2026 (CE2, 6e, 3e, Tle).
- 2024-10-31 : BO n°41 : nouveaux programmes cycle 1 (langage, premiers outils mathématiques) et cycle 2 (français, maths), arrêté du 22-10-2024 ; application rentrée 2025 (tout le cycle 2).
- 2025-02-06 : BO n°6 : programme d'éducation à la sexualité (EVAR école / EVARS collège-lycée), arrêté du 3-02-2025 ; application rentrée 2025.
- 2025-04-17 : BO n°16 : programmes de français et maths du cycle 3 (arrêté du 10-04-2025) : CM1 et 6e en 2025, CM2 en 2026.
- 2025-05-29 : BO n°22 : programmes de langues vivantes étrangères collège et lycée GT (arrêté du 5-05-2025) : 6e et 2nde en 2025 ; 5e, 1re, Tle en 2026 ; 4e en 2027 ; 3e en 2028.
- 2025-06-12 : BO n°24 : épreuve anticipée de mathématiques en première (arrêté du 10-06-2025) ; première passation le 12-06-2026 (date : sources secondaires).
- 2026-02-05 : BO n°6 : note de service du 23-01-2026 sur la formation et certification des compétences numériques ; parcours Pix IA obligatoires en 4e, 2de, CAP1 (progressif 2025-2026 et 2026-2027).
- 2026-03-05 : BO n°10 : programmes de français et maths du cycle 4 (arrêté du 18-02-2026) : 5e en 2026, 4e en 2027, 3e en 2028.
- 2026-03-19 : BO n°12 : programmes de LV étrangères et régionales pour l'école élémentaire (arrêté du 26-02-2026) : CP et CM1 en 2026 ; CE1, CE2, CM2 en 2027.
- 2026-04-02 : BO n°14 : nouveaux programmes de maths du lycée GT (7 arrêtés du 26-02-2026) : 2nde, 1re (spé, ens. sci., techno) en 2026 ; Tle (spé, complémentaires, techno) en 2027.
- 2026-05-21 : BO n°21 : programmes de LV régionales collège-lycée GT (arrêté du 23-04-2026) : 6e, 5e, 2nde en 2026 ; 4e, 1re en 2027 ; 3e, Tle en 2028.
- 2026-05-28 : BO n°22 : programmes d'EPS et d'histoire-géographie cycles 2-3 (arrêté du 22-04-2026) : CP et CM1 en 2026 ; CE1, CE2, CM2, 6e en 2027.
- 2026-06-11 : BO n°24 : programmes de sciences et technologie cycles 2-3 (arrêté du 5-06-2026) : CP et CM1 en 2026 ; CE1, CE2, CM2, 6e en 2027 ; supprime « Questionner le monde ».
- 2026-07-11 : JO : arrêté du 12-06-2026 modifiant les horaires de l'école élémentaire (NOR MENE2613249A) : CP en 2026, CE1-CE2 en 2027 (lecture non intégrale).
- 2026-07-20 : Lettre de saisine du ministre au CSP : refonte du programme de SNT avec 1 h d'IA, rentrée 2027, proposition attendue en décembre 2026 (relais académique).

### À venir (annoncé, à ne pas appliquer en 2026-2027)

- Rentrée 2027 : français, maths et LV en 4e (cycle 4) ; programmes lycée de mathématiques en terminale (spécialité, complémentaires, technologique) ; sciences et technologie, HG, EPS, LV pour CE1, CE2, CM2, 6e ; refonte SNT avec IA (annoncée) ; nouveaux programmes cycle 4 en HG, PC, SVT, technologie et arts : calendrier non publié (consultation du 18-05 au 19-06-2026).
- Rentrée 2028 : français, maths et LV en 3e.

## 6. Points d'incertitude (liste exhaustive)

- Accès aux sources : les pages HTML de education.gouv.fr, eduscol.education.gouv.fr et legifrance.gouv.fr (hors pages JORF /jorf/id/ ouvertes par WebFetch) répondent HTTP 403 (Cloudflare) aux clients automatiques. Les textes du BO ont été lus via les PDF complets des BO (WebFetch) et via les pages JORF de Légifrance ; les autres liens sont marqués verifiedHow = search-index-title-match (URL officielle observée dans l'index de recherche avec titre identique, contenu non ouvert).
- Une URL (consultation nationale Éduscol cycle 4, 2026) provient d'une réponse de recherche sans figurer dans une liste de résultats : verified=false.
- Cycle 4 hors français/maths/LV/technologie : aucun nouveau programme publié trouvé au 05-10-2026 (histoire-géographie, SVT, physique-chimie, arts, EMI en consultation du 18-05 au 19-06-2026). Statut attendu à la rentrée 2027 : non documenté.
- Arts plastiques et éducation musicale cycles 2-3 : projets CSP de juillet 2025, consultation du 09-02 au 20-03-2026 ; aucun arrêté publié trouvé au 05-10-2026 (sources consultées possiblement incomplètes pour les BO de juillet à octobre 2026).
- BO publiés après le 11-06-2026 (BO n°25 à n°36) : sommaires non ouverts ; un nouvel arrêté de programme y figure peut-être (non détecté par les recherches).
- Abrogation formelle de la note de service sur les repères annuels (BO n°22 du 29-05-2019) pour français/maths/EMC : non trouvée ; le statut « supplantés » pour cycles 2-3 et 5e est une déduction (programmes réécrits par année). Pour 4e et 3e, des sources académiques secondaires indiquent que les repères restent applicables en 2026-2027.
- Mathématiques de terminale en 2026-2027 : versions 2019 (BO spécial n°8 du 25-07-2019) ; fine contenus des versions 2019 de maths complémentaires et maths technologiques de terminale non relus (domaines pris dans les versions 2026). Évolution de mathématiques expertes : non documentée.
- Statut du programme LLCER après l'abrogation partielle de l'arrêté du 17-01-2019 par l'arrêté du 5-05-2025 : non vérifié.
- L'horaire annuel de l'école élémentaire (arrêté du 12-06-2026) : lecture non intégrale d'une page Légifrance ; ne pas utiliser sans vérification.
- Attestation de sensibilisation au numérique/IA en 6e : texte de loi (article L. 312-9, loi du 21-05-2024) cité par la note de service du 23-01-2026 ; date de première application non vérifiée.
- Voie technologique (séries STMG, ST2S, STI2D, STL, STD2A, S2TMD, STHR, STAV) et voie professionnelle : hors périmètre ; seuls les programmes communs (maths, philosophie, HG, LV, EMC, français) sont référencés.

## 7. Questions de départ du brief : verdict

| Point du brief | Verdict |
|---|---|
| Arrêté d'octobre 2024, BO n°41 du 31-10-2024 | Confirmé : l'arrêté est du **22 octobre 2024** (NOR MENE2415135A, JO du 25-10-2024) ; il couvre cycle 1 (langage, outils mathématiques) et cycle 2 (français, maths) ; application à la rentrée **2025** pour tout le cycle 2. |
| Calendrier cycle 3 | Arrêté du **10 avril 2025** (BO n°16 du 17-04-2025) : CM1 et 6e en 2025 ; **CM2 en 2026**. |
| Cycle 4 français/maths publiés ? | **Oui** : arrêté du **18 février 2026** (BO n°10 du 5-03-2026) ; **5e en 2026**, 4e en 2027, 3e en 2028. |
| Nouveau programme EMC | Arrêté du **29 mai 2024** (NOR MENE2413934A), **BO n°24 du 13-06-2024** ; calendrier 2024/2025/2026 vérifié sur l'article 3 (texte lu). |
| EVARS | Arrêté du **3 février 2025**, BO n°6 du 6-02-2025 ; circulaire du 4-02-2025 (NOR MENE2503565C) ; application rentrée 2025 ; au moins 3 séances annuelles. |
| Programmes consolidés BO n°31 du 30-07-2020 | Confirmé (arrêté du 17-07-2020). Toujours en vigueur pour : EPS, arts, HG cycles 2-3-4 (selon niveaux), PC/SVT cycle 4, LV 4e/3e + élémentaire CE1/CE2/CM2, français/maths 4e/3e. |
| Repères annuels et attendus (BO n°22 du 29-05-2019) | Existent pour français/maths/EMC cycles 2-3-4 ; indicatifs. Supplantés par la rédaction par année des nouveaux programmes (cycle 2, cycle 3, 5e) ; EMC : remplacé par le programme 2024 ; restent la référence indicative de la 4e et 3e en 2026-2027 (source secondaire). Abrogation formelle non trouvée. |
| Sciences et technologie en 6e depuis 2023 | Arrêté du 15-06-2023 (BO n°25 du 22-06-2023) : programme de cycle 3 remanié ; plus d'heure de technologie distincte en 6e ; nouveau programme S&T à partir de 2027-2028 pour la 6e. Technologie cycle 4 : arrêté du 9-02-2024, 5e en 2024, 4e en 2025, 3e en 2026. |
| Maths "intégré au tronc commun de 1re depuis 2025" | **Inexact** : module de maths intégré à l'**enseignement scientifique** depuis 2023-2024 (arrêté du 3-01-2023) ; nouvelle version en 2026-2027 ; **épreuve anticipée de mathématiques** créée par l'arrêté du 10-06-2025 (1re passation le 12-06-2026). |
| IA / numérique | Pas de programme IA disciplinaire ; Pix IA obligatoire 4e/2de/CAP1 ; attestation 6e ; certification Pix 3e/terminale ; cadre d'usage IA (juin 2025) ; SNT refonte annoncée 2027. |
| CECRL | Élémentaire : A1 minimum fin CM2 (niveaux par année) ; collège LVA : 6e A1+, 5e A2, 4e A2+, 3e B1 ; LVB : A1, A1+, A1+, A2 ; lycée LVA : 2nde B1+, 1re B1+, Tle B2 ; LVB : A2+, B1, B1. |

## 8. Recommandations d'usage pour l'application

- Utiliser le champ `levelsInForce2026_2027` (et non `levels`) pour décider du texte à citer à un élève donné ; les programmes `legacy-in-force` doivent rester disponibles pour les niveaux concernés.
- Pour les programmes `scope: cycle`, présenter l'ordre de progression comme **éditorial** (non national) ; pour `scope: annual`, l'ordre par année est celui du texte officiel (l'ordre intra-année reste libre).
- Ne pas générer de contenu libre pour EVARS/EVAR : sujet sensible encadré par séances spécifiques (circulaire du 4-02-2025).
- Pour les domaines marqués `search-snippet`, `non-lu`, `non-detaille` ou `bo-text-partially-read`, relire l'annexe officielle avant publication.
- Surveiller les BO n°25 à n°36 de 2026 et les suivants (non ouverts) ainsi que les arrêtés arts cycles 2-3 et cycle 4 (HG, PC, SVT, technologie).

