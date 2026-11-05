/**
 * Spécialités et options du lycée jusqu'ici sans exercices : HGGSP (première et terminale), HLP (première et
 * terminale), mathématiques expertes (nombres complexes, arithmétique, graphes et matrices) et mathématiques
 * complémentaires (qui reprennent des générateurs de première et de terminale de la spécialité, rattachés aux
 * chapitres de l'option). Rattachés aux chapitres des parcours de référence hggsp-*, hlp-*, maths-expertes-tle,
 * maths-complementaires-tle.
 */
import { pick, sample, ri, numeric, mc, gcd } from './gen-util.js';
import { qcm } from './primaire-savoirs.js';
import { LYCEE_MATHS_1T } from './lycee-maths-1t.js';

const GEN = [];
function add(g) {
  const { make, ...rest } = g;
  GEN.push({ tracks: ['classe', 'approfondissement'], options: [], ...rest, make(rand, o = {}, tier = 'classe') { return make(rand, tier !== 'classe'); } });
}
const num = (answer, o) => numeric(answer, { representation: 'symbolique', expectedSeconds: 60, ...o });

/* ------------------------------ HGGSP ------------------------------ */

const HGGSP_1 = [
  ['Dans la démocratie athénienne du Ve siècle av. J.-C., le droit de vote appartenait…', 'aux citoyens : des hommes libres, nés de parents athéniens', ['à tous les habitants, femmes et esclaves compris', 'au seul roi', 'aux étrangers seulement'], 'Femmes, esclaves et métèques (étrangers résidents) en étaient exclus.'],
  ['Pour Tocqueville (De la démocratie en Amérique), un danger de la démocratie est…', 'la « tyrannie de la majorité »', ['le retour de la monarchie absolue', 'l’absence d’élections', 'la disparition des villes'], 'La majorité risque d’imposer ses opinions et d’étouffer les minorités.'],
  ['Le « hard power » désigne une puissance fondée sur…', 'la contrainte : force militaire et pression économique', ['l’influence culturelle', 'le tourisme', 'l’attrait de sa langue'], 'Le « soft power », au contraire, repose sur l’attraction et l’influence.'],
  ['Le concept de « soft power » a été proposé vers 1990 par…', 'Joseph Nye', ['Karl Marx', 'Montesquieu', 'Clausewitz'], 'Ce politiste américain désigne ainsi la capacité d’influencer par l’attrait plutôt que par la force.'],
  ['Le mur de Berlin a coupé la ville en deux…', 'de 1961 à 1989', ['de 1945 à 1991', 'de 1914 à 1918', 'de 1989 à 2001'], 'Sa chute, le 9 novembre 1989, annonce la réunification allemande de 1990.'],
  ['La frontière entre les deux Corées suit à peu près…', 'le 38e parallèle', ['l’équateur', 'le méridien de Greenwich', 'le tropique du Cancer'], 'La zone démilitarisée date de l’armistice de 1953.'],
  ['La loi du 29 juillet 1881, en France, établit…', 'la liberté de la presse', ['l’école obligatoire', 'la séparation des Églises et de l’État', 'le droit de grève'], 'Elle en fixe aussi les limites : diffamation, injure.'],
  ['L’Agence France-Presse (AFP) est…', 'une agence de presse qui fournit des informations vérifiées aux médias', ['un réseau social', 'une chaîne de télévision', 'un parti politique'], 'Avec Reuters et Associated Press, c’est l’une des grandes agences mondiales.'],
  ['L’édit de Nantes (1598) accorde aux protestants…', 'la liberté de conscience et une liberté de culte limitée', ['le trône de France', 'l’interdiction du catholicisme', 'la séparation des Églises et de l’État'], 'Louis XIV le révoque en 1685 par l’édit de Fontainebleau.'],
  ['Le Concordat de 1801, signé par Bonaparte et le pape,…', 'reconnaît le catholicisme comme la religion de la majorité des Français', ['interdit toute religion', 'sépare les Églises et l’État', 'impose le protestantisme'], 'Il s’applique encore en Alsace-Moselle, allemande en 1905 lors de la loi de séparation.'],
  ['Une théocratie est un régime où…', 'le pouvoir politique se réclame directement de la religion', ['le peuple élit librement ses représentants', 'l’armée gouverne seule', 'il n’y a pas de lois'], 'L’Iran, depuis la révolution de 1979, en est un exemple.'],
  ['Une frontière « naturelle » est une idée qui consiste à…', 'faire suivre à une frontière un relief ou un fleuve', ['supprimer toutes les frontières', 'tracer une frontière en ligne droite', 'interdire les voyages'], 'Les frontières restent des constructions politiques, même quand elles suivent les Pyrénées ou le Rhin.'],
];
const HGGSP_T = [
  ['Le traité de l’espace de 1967 interdit…', 'toute appropriation nationale de la Lune et des corps célestes', ['les satellites', 'les vols habités', 'les télescopes'], 'L’espace y est déclaré « apanage de l’humanité tout entière ».'],
  ['Spoutnik 1, premier satellite artificiel, est lancé en 1957 par…', 'l’URSS', ['les États-Unis', 'la France', 'la Chine'], 'C’est le début de la course à l’espace de la guerre froide.'],
  ['Pour Clausewitz, la guerre est…', 'la continuation de la politique par d’autres moyens', ['un jeu sans règles', 'toujours une guerre de religion', 'une catastrophe naturelle'], 'De la guerre, publié en 1832.'],
  ['Les traités de Westphalie (1648) fondent…', 'un ordre européen fondé sur la souveraineté des États', ['l’Union européenne', 'l’ONU', 'un empire mondial'], 'Ils mettent fin à la guerre de Trente Ans ; l’équilibre des puissances doit garantir la paix.'],
  ['Le génocide des Tutsi au Rwanda a eu lieu en…', '1994', ['1945', '1962', '2011'], 'En une centaine de jours, environ 800 000 personnes ont été tuées.'],
  ['La loi Gayssot (1990) punit en France…', 'la négation des crimes contre l’humanité', ['le vol', 'la fraude fiscale', 'les excès de vitesse'], 'C’est l’une des lois dites « mémorielles ».'],
  ['La convention du patrimoine mondial de l’Unesco date de…', '1972', ['1789', '1945', '2005'], 'Plus de mille biens culturels et naturels y sont inscrits.'],
  ['Prosper Mérimée, l’auteur de Carmen, fut aussi…', 'inspecteur général des monuments historiques', ['ministre de la Guerre', 'architecte de la tour Eiffel', 'fondateur de l’Unesco'], 'Il fait classer et restaurer de nombreux édifices, comme la basilique de Vézelay.'],
  ['L’accord de Paris sur le climat (2015) vise à limiter le réchauffement…', 'bien en dessous de 2 °C, si possible à 1,5 °C', ['à 5 °C', 'à 0 °C', 'à 10 °C'], 'Par rapport à l’ère préindustrielle ; il a été adopté lors de la COP21.'],
  ['Le premier parc national au monde, créé en 1872, est…', 'Yellowstone, aux États-Unis', ['la Vanoise', 'le Serengeti', 'le parc Kruger'], 'La Vanoise, premier parc national français, date de 1963.'],
  ['Le GIEC est…', 'un groupe d’experts qui évalue l’état des connaissances sur le climat', ['une entreprise pétrolière', 'une association de défense des animaux', 'un parti politique'], 'Créé en 1988, il publie des rapports de référence.'],
  ['Internet est issu d’ARPANET, un réseau…', 'créé à la fin des années 1960 pour la recherche américaine, financé par la défense', ['inventé au XIXe siècle', 'créé en 2010 par un réseau social', 'conçu par l’Unesco'], 'Les premières liaisons datent de 1969.'],
];
add({
  id: 'hggsp-1re', subject: 'hggsp', levels: ['1re'], facts: true, label: 'HGGSP (première) : démocratie, puissances, frontières, information, religions', skill: 'hggsp.1re',
  chapters: ['hggsp-spe-1re-tle-2019-1re'], description: 'Les cinq thèmes de première : questions expliquées.',
  make(rand) { return qcm(rand, pick(rand, HGGSP_1)); },
});
add({
  id: 'hggsp-tle', subject: 'hggsp', levels: ['tle'], facts: true, label: 'HGGSP (terminale) : espaces de conquête, guerre et paix, mémoires, patrimoine, environnement, connaissance', skill: 'hggsp.tle',
  chapters: ['hggsp-spe-1re-tle-2019-tle'], description: 'Les six thèmes de terminale : questions expliquées.',
  make(rand) { return qcm(rand, pick(rand, HGGSP_T)); },
});

/* ------------------------------ HLP ------------------------------ */

const HLP_1 = [
  ['Dans l’Antiquité, la rhétorique est…', 'l’art de bien parler pour persuader', ['l’étude des étoiles', 'la science des nombres', 'l’art de la guerre'], 'Aristote, Cicéron et Quintilien lui ont consacré des traités.'],
  ['Dans le Gorgias, Platon reproche aux sophistes…', 'de persuader sans se soucier de la vérité', ['de trop aimer la vérité', 'de refuser de parler en public', 'd’écrire en vers'], 'Socrate y oppose la rhétorique qui flatte et la recherche du vrai.'],
  ['« Chacun appelle barbarie ce qui n’est pas de son usage » : cette phrase se trouve dans…', '« Des cannibales », un chapitre des Essais de Montaigne', ['les Fables de La Fontaine', 'le Discours de la méthode', 'Candide'], 'Montaigne s’appuie sur des récits venus du Brésil pour critiquer l’ethnocentrisme.'],
  ['Le Supplément au voyage de Bougainville, où un vieillard tahitien critique les Européens, est de…', 'Diderot', ['Racine', 'Victor Hugo', 'Zola'], 'Écrit en 1772, il n’est publié qu’après la mort de l’auteur.'],
  ['Au XVIIe siècle, l’« éloquence de la chaire » désigne…', 'les sermons des prédicateurs, comme Bossuet', ['les discours des députés', 'les plaidoiries des avocats', 'les chansons populaires'], 'La chaire est la tribune d’où l’on prêchait dans les églises.'],
  ['Le Discours de la servitude volontaire, qui demande pourquoi un peuple obéit à un tyran, est de…', 'La Boétie', ['Pascal', 'Molière', 'Camus'], 'L’ami de Montaigne l’écrit au XVIe siècle.'],
  ['La « révolution copernicienne » désigne…', 'l’idée que la Terre tourne autour du Soleil, et non l’inverse', ['une révolution politique en Pologne', 'l’invention de l’imprimerie', 'la découverte de l’Amérique'], 'Copernic la défend en 1543 : la représentation du monde en est bouleversée.'],
  ['L’idée d’un homme naturellement bon, que la société corrompt, est au cœur…', 'du Discours sur l’origine de l’inégalité de Rousseau', ['du Léviathan de Hobbes', 'des Pensées de Pascal', 'du Prince de Machiavel'], 'L’expression « bon sauvage » n’est pas de Rousseau, mais l’idée de bonté naturelle l’est.'],
  ['Descartes écrit le Discours de la méthode (1637) en français pour…', 'être lu par tous ceux qui ont du bon sens, pas seulement par les savants', ['plaire au roi d’Espagne', 'être chanté', 'interdire le latin'], 'Il s’ouvre sur : « Le bon sens est la chose du monde la mieux partagée. »'],
  ['Une utopie est…', 'la description d’une société idéale imaginaire', ['un récit historique exact', 'un dictionnaire', 'une loi'], 'Le mot vient de L’Utopie de Thomas More (1516).'],
];
const HLP_T = [
  ['Les Confessions, qui s’ouvrent sur « Je forme une entreprise qui n’eut jamais d’exemple », sont de…', 'Rousseau', ['Montaigne', 'Proust', 'Voltaire'], 'Il veut s’y montrer « dans toute la vérité de la nature ».'],
  ['À la recherche du temps perdu, où une madeleine fait resurgir l’enfance, est de…', 'Marcel Proust', ['Émile Zola', 'Albert Camus', 'Victor Hugo'], 'C’est l’expérience de la mémoire involontaire.'],
  ['Pour Freud, l’inconscient désigne…', 'une part de la vie psychique qui échappe à la conscience', ['le sommeil sans rêves', 'une maladie rare', 'la mémoire des ordinateurs'], 'Rêves, lapsus et actes manqués en seraient des manifestations.'],
  ['Si c’est un homme, témoignage sur Auschwitz, est de…', 'Primo Levi', ['Elie Wiesel', 'Albert Camus', 'Jean-Paul Sartre'], 'Chimiste italien déporté en 1944, il publie ce récit en 1947.'],
  ['À propos du procès d’Eichmann, Hannah Arendt parle de…', 'la « banalité du mal »', ['la « tyrannie de la majorité »', 'la « main invisible »', 'l’« état de nature »'], 'Un organisateur de la Shoah pouvait être un fonctionnaire ordinaire, qui renonçait à penser.'],
  ['« Je est un autre » est une formule de…', 'Rimbaud', ['Baudelaire', 'Molière', 'La Fontaine'], 'Elle figure dans ses lettres dites « du voyant » (1871).'],
  ['Frankenstein ou le Prométhée moderne, roman sur une science sans limites, est de…', 'Mary Shelley', ['Jules Verne', 'Charles Dickens', 'H. G. Wells'], 'Il paraît en 1818.'],
  ['Le Meilleur des mondes, où l’on fabrique les humains en laboratoire, est d’…', 'Aldous Huxley', ['George Orwell', 'Ray Bradbury', 'Jules Verne'], 'Publié en 1932 ; 1984, d’Orwell, date de 1949.'],
  ['« Je suis moi-même la matière de mon livre » : c’est ce qu’écrit…', 'Montaigne, dans l’avis au lecteur des Essais', ['Pascal, dans les Pensées', 'Descartes, dans les Méditations', 'Rabelais, dans Gargantua'], 'Les Essais paraissent à partir de 1580.'],
  ['« L’homme n’est ni ange ni bête, et le malheur veut que qui veut faire l’ange fait la bête » est de…', 'Pascal', ['Voltaire', 'Rousseau', 'Diderot'], 'Pensées.'],
  ['L’anthropocène désigne…', 'une époque où les activités humaines transforment la planète entière', ['une période de la Préhistoire', 'une maladie', 'un mouvement littéraire'], 'Le terme a été popularisé en 2000 par le chimiste Paul Crutzen.'],
];
add({
  id: 'hlp-1re', subject: 'hlp', levels: ['1re'], facts: true, label: 'HLP (première) : les pouvoirs de la parole, les représentations du monde', skill: 'hlp.1re',
  chapters: ['hlp-spe-1re-tle-2019-1re'], description: 'Rhétorique, sophistes, éloquence, découverte du monde, Montaigne, Diderot, Rousseau, utopies.',
  make(rand) { return qcm(rand, pick(rand, HLP_1)); },
});
add({
  id: 'hlp-tle', subject: 'hlp', levels: ['tle'], facts: true, label: 'HLP (terminale) : la recherche de soi, l’humanité en question', skill: 'hlp.tle',
  chapters: ['hlp-spe-1re-tle-2019-tle'], description: 'Autobiographie, mémoire, inconscient, témoignages, Arendt, Rimbaud, science et dystopies, anthropocène.',
  make(rand) { return qcm(rand, pick(rand, HLP_T)); },
});

/* ------------------------------ LLCER anglais ------------------------------ */

const WORKS = [['Pride and Prejudice', 'Jane Austen'], ['Oliver Twist', 'Charles Dickens'], ['Nineteen Eighty-Four', 'George Orwell'], ['Frankenstein', 'Mary Shelley'],
  ['The Great Gatsby', 'F. Scott Fitzgerald'], ['Of Mice and Men', 'John Steinbeck'], ['To Kill a Mockingbird', 'Harper Lee'], ['Mrs Dalloway', 'Virginia Woolf'],
  ['Beloved', 'Toni Morrison'], ['Adventures of Huckleberry Finn', 'Mark Twain'], ['Hamlet', 'William Shakespeare'], ['Jane Eyre', 'Charlotte Brontë'],
  ['Wuthering Heights', 'Emily Brontë'], ['The Catcher in the Rye', 'J. D. Salinger'], ['Lord of the Flies', 'William Golding'], ['The Handmaid’s Tale', 'Margaret Atwood'],
  ['Things Fall Apart', 'Chinua Achebe'], ['Strange Case of Dr Jekyll and Mr Hyde', 'Robert Louis Stevenson'], ['Dracula', 'Bram Stoker'], ['On the Road', 'Jack Kerouac']];
const LIT = [
  ['A dystopia is…', 'an imagined society that is frightening or oppressive', ['a perfect society', 'a true story', 'a love poem'], 'Nineteen Eighty-Four, Brave New World and The Handmaid’s Tale are famous dystopias.'],
  ['The Harlem Renaissance of the 1920s was…', 'a flowering of African American art, music and literature in New York', ['a period of Italian painting', 'a British political party', 'a scientific revolution'], 'Langston Hughes and Zora Neale Hurston are key figures.'],
  ['A Shakespearean sonnet has…', '14 lines, ending with a rhyming couplet', ['3 lines', '20 lines', 'no rhymes at all'], 'Three quatrains and a final couplet: ABAB CDCD EFEF GG.'],
  ['The English Romantic poets, such as Wordsworth and Coleridge, celebrated…', 'nature, emotion and imagination', ['factories and machines', 'strict classical rules', 'war and empire'], 'Their Lyrical Ballads (1798) is often seen as the start of English Romanticism.'],
  ['The Victorian era is named after…', 'Queen Victoria, who reigned from 1837 to 1901', ['a famous battle', 'a novel by Dickens', 'a London street'], 'An age of industry and empire, and of the great novels of Dickens.'],
  ['Gothic fiction typically features…', 'mystery, horror, dark castles and the supernatural', ['sunny beaches', 'sports competitions', 'scientific reports'], 'Frankenstein and Dracula are classics of the genre.'],
  ['A “stream of consciousness” narrative…', 'follows the flow of a character’s thoughts', ['only describes landscapes', 'is written as a play', 'is always in verse'], 'Virginia Woolf and James Joyce are famous for it.'],
  ['The Beat Generation (Kerouac, Ginsberg) was a group of…', 'American writers of the 1950s who rejected conformity', ['British kings', 'Renaissance painters', 'Roman poets'], 'On the Road (1957) by Jack Kerouac is its best-known novel.'],
  ['An unreliable narrator is…', 'a narrator whose account cannot be fully trusted', ['a narrator who is always right', 'the author’s editor', 'a historian'], 'The reader has to read between the lines.'],
  ['The “American Dream” is…', 'the idea that anyone can succeed through hard work', ['a famous Hollywood film', 'a type of novel', 'a law passed in 1776'], 'The Great Gatsby and Of Mice and Men both question it.'],
  ['A soliloquy, in a play, is…', 'a speech in which a character, alone, speaks their thoughts aloud', ['a dance', 'a song for two voices', 'the list of characters'], '“To be, or not to be” in Hamlet is the most famous one.'],
  ['Magical realism mixes…', 'realistic settings with magical or supernatural events', ['only historical facts', 'poetry and mathematics', 'comics and sport'], 'It is often associated with Latin American writers, and with Salman Rushdie or Toni Morrison in English.'],
];
add({
  id: 'llcer-anglais', subject: 'llcer', levels: ['1re', 'tle'], facts: true, label: 'LLCER anglais : œuvres, auteurs et notions littéraires', skill: 'llcer.anglais',
  chapters: ['llcer-spe-1re-tle-2019-themes'], description: 'Who wrote it? Twenty great works in English, and key literary notions (dystopia, Gothic fiction, soliloquy, stream of consciousness…).',
  make(rand) {
    if (rand() < 0.5) { const [w, a] = pick(rand, WORKS); return qcm(rand, [`Who wrote “${w}”?`, a, WORKS.map(([, x]) => x).filter((x) => x !== a), `“${w}” was written by ${a}.`]); }
    return qcm(rand, pick(rand, LIT));
  },
});

/* ------------------------------ Mathématiques expertes ------------------------------ */

const ME = ['maths-expertes-tle-2019-nombres-complexes', 'maths-expertes-tle-2019-arithmetique', 'maths-expertes-tle-2019-graphes-matrices'];
const sg = (x) => (x < 0 ? `−${-x}` : String(x));
const cx = (a, b) => `${sg(a)}${b < 0 ? ' − ' : ' + '}${Math.abs(b) === 1 ? '' : Math.abs(b)}i`;
const nz = (rand, a, b) => { for (;;) { const x = ri(rand, a, b); if (x) return x; } };

add({
  id: 'me-complexes', subject: 'maths-expertes', levels: ['tle'], label: 'Nombres complexes : forme algébrique, conjugué, module, puissances de i', skill: 'me.complexes', chapters: [ME[0]],
  description: 'Produit et somme sous forme algébrique, conjugué, module d’un complexe, puissances de i.',
  make(rand) {
    const k = pick(rand, ['produit-re', 'produit-im', 'module', 'conjugue', 'puissance', 'somme']);
    const a = nz(rand, -5, 5); const b = nz(rand, -5, 5); const c = nz(rand, -5, 5); const d = nz(rand, -5, 5);
    if (k === 'produit-re') {
      const re = a * c - b * d;
      return num(re, { prompt: `z = ${cx(a, b)} et w = ${cx(c, d)}. Quelle est la partie réelle de z × w ?`, misconceptions: [mc(a * c + b * d, 'mc:i-carre', 'notion', 'i² = −1 : le produit (bi)(di) donne −bd, pas +bd.')].filter((m) => m.answer !== re),
        hints: ['Développe (a + bi)(c + di) = ac + adi + bci + bd i², puis remplace i² par −1.'], solution: `Partie réelle : ${a}×${c} − (${b})×(${d}) = ${re}` });
    }
    if (k === 'produit-im') {
      const im = a * d + b * c;
      return num(im, { prompt: `z = ${cx(a, b)} et w = ${cx(c, d)}. Quelle est la partie imaginaire de z × w ?`, misconceptions: [mc(b * d, 'mc:produit-parties', 'notion', 'Les termes en i viennent de a × di et de bi × c : ad + bc.')].filter((m) => m.answer !== im),
        hints: ['Les termes en i du développement sont adi et bci.'], solution: `Partie imaginaire : ${a}×${d} + ${b}×${c} = ${im}` });
    }
    if (k === 'module') {
      const [p, q, r] = pick(rand, [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 6, 10], [12, 5, 13], [9, 12, 15]]);
      const sp = pick(rand, [1, -1]); const sq = pick(rand, [1, -1]);
      return num(r, { prompt: `Quel est le module du nombre complexe z = ${cx(sp * p, sq * q)} ?`, misconceptions: [mc(p + q, 'mc:module-somme', 'notion', '|a + bi| = √(a² + b²), pas a + b.'), mc(p * p + q * q, 'mc:module-racine', 'notion', 'Il reste à prendre la racine carrée de a² + b².')],
        hints: ['|a + bi| = √(a² + b²).'], solution: `|z| = √(${p * p} + ${q * q}) = √${p * p + q * q} = ${r}` });
    }
    if (k === 'conjugue') {
      return num(-b, { prompt: `Quelle est la partie imaginaire du conjugué de z = ${cx(a, b)} ?`, misconceptions: [mc(b, 'mc:conjugue-signe', 'notion', 'Le conjugué de a + bi est a − bi : la partie imaginaire change de signe.')],
        hints: ['Le conjugué de a + bi est a − bi.'], solution: `z̄ = ${cx(a, -b)} : partie imaginaire ${-b}` });
    }
    if (k === 'somme') {
      const re = a + c;
      return num(re, { prompt: `z = ${cx(a, b)} et w = ${cx(c, d)}. Quelle est la partie réelle de z + w ?`, hints: ['On additionne les parties réelles entre elles.'], solution: `${a} + ${c} = ${re}` });
    }
    const n = ri(rand, 2, 30); const vals = ['1', 'i', '−1', '−i'];
    return qcm(rand, [`Combien vaut i^${n} ?`, vals[n % 4], vals.filter((x, j) => j !== n % 4), `i² = −1, i³ = −i, i⁴ = 1 : les puissances de i se répètent tous les 4. ${n} = 4 × ${Math.floor(n / 4)} + ${n % 4}, donc i^${n} = i^${n % 4} = ${vals[n % 4]}.`]);
  },
});

const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113];
const powMod = (b, e, n) => { let r = 1; for (let i = 0; i < e; i++) r = (r * b) % n; return r; };
add({
  id: 'me-arithmetique', subject: 'maths-expertes', levels: ['tle'], label: 'Arithmétique : division euclidienne, congruences, PGCD, nombres premiers', skill: 'me.arithmetique', chapters: [ME[1]],
  description: 'Reste d’une division euclidienne, congruences et puissances modulo n, PGCD, reconnaître un nombre premier.',
  make(rand) {
    const k = pick(rand, ['reste', 'reste', 'congruence', 'pgcd', 'premier']);
    if (k === 'reste') {
      const n = ri(rand, 3, 13); const a = ri(rand, 40, 600); const r = a % n;
      return num(r, { prompt: `Quel est le reste de la division euclidienne de ${a} par ${n} ?`, misconceptions: [mc(Math.floor(a / n), 'mc:quotient-reste', 'notion', `${Math.floor(a / n)} est le quotient : le reste est ce qui reste, entre 0 et ${n - 1}.`)].filter((m) => m.answer !== r),
        hints: ['a = n × q + r avec 0 ≤ r < n.'], solution: `${a} = ${n} × ${Math.floor(a / n)} + ${r}` });
    }
    if (k === 'congruence') {
      const n = pick(rand, [3, 5, 7, 9, 11]); const b = ri(rand, 2, 5); const e = ri(rand, 3, 12); const r = powMod(b, e, n);
      return num(r, { prompt: `Quel est l’entier r, avec 0 ≤ r < ${n}, tel que ${b}^${e} ≡ r (mod ${n}) ?`, hints: [`Calcule les restes des puissances successives de ${b} modulo ${n} : ils finissent par se répéter.`], solution: `${b}^${e} ≡ ${r} (mod ${n})` });
    }
    if (k === 'pgcd') {
      let m, n2; do { m = ri(rand, 2, 9); n2 = ri(rand, 2, 9); } while (gcd(m, n2) !== 1 || m === n2);
      const g = ri(rand, 2, 15); const x = g * m; const y = g * n2;
      return num(g, { prompt: `Quel est le PGCD de ${x} et de ${y} ?`, misconceptions: [mc((x * y) / g, 'mc:pgcd-ppcm', 'notion', 'Ce nombre est le PPCM ; le PGCD est le plus grand diviseur commun.')],
        hints: ['Algorithme d’Euclide : PGCD(a, b) = PGCD(b, reste de a par b).'], solution: `${x} = ${g} × ${m} et ${y} = ${g} × ${n2}, avec ${m} et ${n2} premiers entre eux : PGCD = ${g}` });
    }
    const p = pick(rand, PRIMES.filter((x) => x > 20));
    const composites = sample(rand, [21, 27, 33, 39, 49, 51, 57, 63, 69, 77, 81, 87, 91, 93, 99, 111, 117, 119], 3);
    return qcm(rand, ['Lequel de ces nombres est premier ?', String(p), composites.map(String), `${p} n’a pas d’autre diviseur que 1 et lui-même. Les autres se décomposent : ${composites.map((c) => { const d = PRIMES.find((q) => c % q === 0); return `${c} = ${d} × ${c / d}`; }).join(' ; ')}.`]);
  },
});

add({
  id: 'me-graphes-matrices', subject: 'maths-expertes', levels: ['tle'], label: 'Graphes et matrices : produit, degrés, matrice d’adjacence, chaînes de Markov', skill: 'me.graphes-matrices', chapters: [ME[2]],
  description: 'Coefficient d’un produit de matrices 2 × 2, nombre d’arêtes d’un graphe, sens des puissances de la matrice d’adjacence, matrices de transition.',
  make(rand) {
    const k = pick(rand, ['produit', 'produit', 'aretes', 'qcm']);
    if (k === 'produit') {
      const A = [[ri(rand, -3, 5), ri(rand, -3, 5)], [ri(rand, -3, 5), ri(rand, -3, 5)]];
      const B = [[ri(rand, -3, 5), ri(rand, -3, 5)], [ri(rand, -3, 5), ri(rand, -3, 5)]];
      const i = ri(rand, 0, 1); const j = ri(rand, 0, 1);
      const v = A[i][0] * B[0][j] + A[i][1] * B[1][j];
      const show = (M) => `(${sg(M[0][0])} ${sg(M[0][1])} ; ${sg(M[1][0])} ${sg(M[1][1])})`;
      return num(v, { prompt: `A = ${show(A)} et B = ${show(B)} (lignes séparées par « ; »). Quel est le coefficient de la ligne ${i + 1}, colonne ${j + 1} de A × B ?`,
        misconceptions: [mc(A[i][j] * B[i][j], 'mc:produit-terme-a-terme', 'notion', 'Le produit de matrices n’est pas terme à terme : ligne i de A « fois » colonne j de B, puis on additionne.')].filter((m) => m.answer !== v),
        hints: ['Coefficient (i, j) de AB = somme des produits de la ligne i de A par la colonne j de B.'], solution: `${A[i][0]} × ${B[0][j]} + ${A[i][1]} × ${B[1][j]} = ${v}` });
    }
    if (k === 'aretes') {
      let deg; do { deg = Array.from({ length: ri(rand, 4, 6) }, () => ri(rand, 1, 4)); } while (deg.reduce((s, x) => s + x, 0) % 2);
      const sum = deg.reduce((s, x) => s + x, 0);
      return num(sum / 2, { prompt: `Les sommets d’un graphe non orienté ont pour degrés ${deg.join(', ')}. Combien ce graphe a-t-il d’arêtes ?`,
        misconceptions: [mc(sum, 'mc:somme-degres', 'notion', 'Chaque arête compte dans le degré de ses deux extrémités : la somme des degrés vaut le double du nombre d’arêtes.')],
        hints: ['Somme des degrés = 2 × nombre d’arêtes.'], solution: `${deg.join(' + ')} = ${sum}, donc ${sum / 2} arêtes` });
    }
    return qcm(rand, pick(rand, [
      ['Si A est la matrice d’adjacence d’un graphe, le coefficient (i, j) de A² compte…', 'les chemins de longueur 2 du sommet i au sommet j', ['les arêtes du graphe', 'les sommets de degré 2', 'les cycles du graphe'], 'Plus généralement, le coefficient (i, j) de Aⁿ compte les chemins de longueur n de i à j.'],
      ['Dans la matrice de transition d’une chaîne de Markov, la somme des coefficients de chaque ligne vaut…', '1', ['0', 'le nombre d’états', '2'], 'Chaque ligne donne les probabilités de passer d’un état à chacun des autres.'],
      ['Un graphe est complet quand…', 'deux sommets distincts quelconques sont toujours reliés par une arête', ['il n’a aucune arête', 'tous ses sommets ont le degré 1', 'il a exactement un cycle'], 'Un graphe complet à n sommets a n(n − 1)/2 arêtes.'],
      ['La matrice d’adjacence d’un graphe non orienté est toujours…', 'symétrique', ['nulle', 'diagonale', 'inversible'], 'Si i est relié à j, j est relié à i : le coefficient (i, j) égale le coefficient (j, i).'],
    ]));
  },
});

/* ------------------------------ Mathématiques complémentaires ------------------------------ */

const MC_CH = ['maths-complementaires-tle-2019-themes', 'maths-complementaires-tle-2019-contenus'];
for (const id of ['l1-suites', 'l1-exponentielle', 'l1-derivation', 'lt-logarithme', 'lt-integrales', 'lt-binomiale']) {
  const g = LYCEE_MATHS_1T.find((x) => x.id === id);
  if (g) GEN.push({ ...g, id: `mc-${id}`, subject: 'maths-complementaires', levels: ['tle'], chapters: MC_CH, label: `${g.label} (maths complémentaires)` });
}

export const LYCEE_OPTIONS = GEN;
export const LYCEE_OPTIONS_SKILLS = [
  ['hggsp', 'hggsp.1re', '1re', 'HGGSP de première : démocratie, puissances, frontières, information, États et religions'],
  ['hggsp', 'hggsp.tle', 'tle', 'HGGSP de terminale : espaces de conquête, guerre et paix, mémoires, patrimoine, environnement, connaissance'],
  ['hlp', 'hlp.1re', '1re', 'HLP de première : les pouvoirs de la parole, les représentations du monde'],
  ['hlp', 'hlp.tle', 'tle', 'HLP de terminale : la recherche de soi, l’humanité en question'],
  ['llcer', 'llcer.anglais', '1re', 'LLCER anglais : œuvres, auteurs et notions littéraires'],
  ['maths-expertes', 'me.complexes', 'tle', 'Nombres complexes : forme algébrique, conjugué, module'],
  ['maths-expertes', 'me.arithmetique', 'tle', 'Arithmétique : division euclidienne, congruences, PGCD, nombres premiers'],
  ['maths-expertes', 'me.graphes-matrices', 'tle', 'Graphes et matrices'],
].map(([subject, id, level, label]) => ({ subject, id, label, level, track: 'classe', status: 'programme', domain: 'lycee', prereqs: [], editorialLevel: true }));
