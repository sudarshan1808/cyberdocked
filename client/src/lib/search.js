export function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeCompact(text) {
  return normalize(text).replace(/\s/g, "");
}

export function searchContent(items, query) {
  if (!query) return [];
  const cleanQuery = normalize(query);

  let results = items.filter((item) => {
    const titleNormal = normalize(item.title);
    const titleCompact = normalizeCompact(item.title);
    const queryCompact = cleanQuery.replace(/\s/g, "");
    return titleNormal.includes(cleanQuery) || titleCompact.includes(queryCompact);
  });

  const exactMatch = items.find((item) => normalize(item.title) === cleanQuery);
  if (exactMatch && cleanQuery.split(" ").length > 1) {
    results = [exactMatch];
  }

  return results;
}
