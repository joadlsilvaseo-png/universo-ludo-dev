// Listagem pública unificada; edição continua independente em cada CMS.
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const COVER = /^\/assets\/[a-zA-Z0-9_./-]+\.(?:png|jpe?g|webp)$/i;
const CMS_FALLBACK = "/ludo-conecta/materia.html?id=";

const validImage = (value) =>
  typeof value === "string" && COVER.test(value) && !value.includes("..")
    ? value : "/assets/ludo-conecta.png";

async function pagesPublications() {
  const response = await fetch("/content/ludo-conecta/posts.json", { cache: "no-store" });
  if (!response.ok) throw new Error("Catálogo do Pages CMS indisponível");
  const records = await response.json();
  return (Array.isArray(records) ? records : [])
    .filter((p) => SLUG.test(p.slug || "") && typeof p.title === "string")
    .map((p) => ({
      source: "pages", slug: p.slug, id: p.slug,
      title: p.title, summary: p.summary || "", category: p.category || "Ludo Conecta",
      date: String(p.date || "").slice(0, 10), image: validImage(p.image),
      imageAlt: p.imageAlt || p.title, featured: Boolean(p.featured),
      url: "/ludo-conecta/materias/" + p.slug + "/",
      featuredPrimary: false,
    }));
}

async function legacyPublications() {
  // Importação dinâmica: problemas de conectividade com Firebase não bloqueiam o Pages CMS.
  const [{ db }, firestore] = await Promise.all([
    import("./firebase-config.js"),
    import("https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js")
  ]);
  const { collection, getDocs, query, where } = firestore;
  const [snapshot, manifestResponse] = await Promise.all([
    getDocs(query(collection(db, "materias"), where("status", "==", "publicado"))),
    fetch("/content/ludo-conecta/manifest.json", { cache: "no-store" }).catch(() => null)
  ]);
  let paths = {};
  if (manifestResponse?.ok) {
    try {
      const manifest = await manifestResponse.json();
      if (manifest?.articles && typeof manifest.articles === "object") paths = manifest.articles;
    } catch { /* Sem manifest, links dinâmicos do CMS continuam disponíveis. */ }
  }

  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((p) => typeof p.titulo === "string" && p.titulo.trim())
    .map((p) => {
      const slug = String(p.slug || "");
      const staticPath = "/ludo-conecta/materias/" + slug + "/";
      const url = SLUG.test(slug) && paths[slug] === staticPath
        ? staticPath : CMS_FALLBACK + encodeURIComponent(p.id);
      return {
        source: "cms", id: p.id, slug, title: p.titulo,
        summary: p.resumo || "", category: p.categoriaNome || "Ludo Conecta",
        date: String(p.dataPublicacao || p.atualizadoEm || "").slice(0, 10),
        image: validImage(p.imagemCapaUrl), imageAlt: p.imagemCapaAlt || p.titulo,
        url, featured: Boolean(p.destaquePrincipal || p.destaqueSecundario),
        featuredPrimary: Boolean(p.destaquePrincipal),
      };
    });
}

export async function loadPublishedArticles() {
  const [legacy, pages] = await Promise.allSettled([
    legacyPublications(), pagesPublications()
  ]);
  if (legacy.status === "rejected") console.warn("CMS antigo indisponível:", legacy.reason);
  if (pages.status === "rejected") console.warn("Pages CMS indisponível:", pages.reason);

  const merged = [];
  const ownedSlugs = new Set();
  // CMS antigo é dono das suas matérias; snapshots antigos no Pages não as substituem.
  for (const record of legacy.status === "fulfilled" ? legacy.value : []) {
    merged.push(record);
    if (SLUG.test(record.slug)) ownedSlugs.add(record.slug);
  }
  for (const record of pages.status === "fulfilled" ? pages.value : []) {
    if (ownedSlugs.has(record.slug)) continue;
    ownedSlugs.add(record.slug);
    merged.push(record);
  }
  merged.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  return merged;
}
