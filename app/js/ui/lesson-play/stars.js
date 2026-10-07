/** Étoiles gagnées sur un exercice terminé (0 à 3) : premier coup sans indice = 3. */
export function starsFor(diag, { tries = 0, hintsUsed = 0, solutionShown = false } = {}) {
  if (!diag || solutionShown) return 0;
  if (diag.verdict === 'a-valider' || diag.verdict === 'incertain') return 2;
  if (diag.verdict !== 'correct') return 0;
  if (tries <= 1 && hintsUsed === 0) return 3;
  if (tries <= 2 && hintsUsed <= 1) return 2;
  return 1;
}
