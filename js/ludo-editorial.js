// Selecao editorial compartilhada entre landing e portal.
// Um artigo mais recente, ate tres destaques e o restante para exploracao.
// Usa somente o conjunto de artigos publicados entregue pelo agregador dos dois CMS.
export function selectEditorial(publications, limit = 3) {
  const posts = [...(Array.isArray(publications) ? publications : [])]
    .filter((post) => post && typeof post.title === "string" && post.title.trim())
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  const latest = posts[0] || null;
  const candidates = posts.slice(1);
  // A sinalizacao de destaque do Pages CMS e do CMS antigo prevalece.
  // Sem material suficiente, completa com publicacoes recentes ainda nao escolhidas.
  const flagged = candidates.filter((post) => post.featured);
  const others = candidates.filter((post) => !post.featured);
  const highlights = [...flagged, ...others].slice(0, limit);
  const chosen = new Set(highlights);
  return {
    latest,
    highlights,
    remaining: candidates.filter((post) => !chosen.has(post)),
    all: posts
  };
}
