export function calculateMatchScore(user, genres) {
  let score = 0;
  let total = 0;
  for (const g of Object.keys(user)) {
    const capitalizedGenre = g.charAt(0).toUpperCase() + g.slice(1);
    if (genres[capitalizedGenre] && user[g] > 0) {
      score += user[g] * genres[capitalizedGenre];
      total += user[g];
    }
  }
  return total ? Math.min(100, Math.round(score / total)) : 0;
}

export function calculateRatingMatchScore(user, averages) {
  let totalMatch = 0;
  let count = 0;
  for (const g of Object.keys(user)) {
    const capitalizedGenre = g.charAt(0).toUpperCase() + g.slice(1);
    const value = Number(averages[capitalizedGenre]);
    if (Number.isNaN(value)) continue;
    const diff = Math.abs(user[g] - value);
    totalMatch += Math.max(0, 100 - diff);
    count += 1;
  }
  return count ? Math.round(totalMatch / count) : 0;
}

export function getConfidence(s) {
  if (s >= 70) return "high";
  if (s >= 40) return "medium";
  return "low";
}

export function getTopMatchingGenres(user, genres, count = 2) {
  return Object.keys(user)
    .filter((g) => {
      const capitalizedGenre = g.charAt(0).toUpperCase() + g.slice(1);
      return user[g] > 0 && genres[capitalizedGenre] > 0;
    })
    .map((g) => {
      const capitalizedGenre = g.charAt(0).toUpperCase() + g.slice(1);
      return { genre: g, score: user[g] * genres[capitalizedGenre] };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((g) => g.genre);
}

export function getTopRatingGenres(user, averages, count = 2) {
  return Object.keys(user)
    .filter((g) => {
      const capitalizedGenre = g.charAt(0).toUpperCase() + g.slice(1);
      return typeof averages[capitalizedGenre] === "number";
    })
    .map((g) => {
      const capitalizedGenre = g.charAt(0).toUpperCase() + g.slice(1);
      const diff = Math.abs(user[g] - averages[capitalizedGenre]);
      return { genre: g, score: 100 - diff };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((g) => g.genre);
}
