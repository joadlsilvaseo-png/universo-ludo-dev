import { loadPublishedArticles } from "./ludo-publications.js";
const list = document.querySelector("#lc-all-list");
const count = document.querySelector("#lc-all-count");
const el = (tag, cls, text) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
};
function renderCard(p) {
  const card = el("article", "lc-ed-all-card");
  const media = el("a", "lc-ed-media");
  media.href = p.url || "/ludo-conecta/";
  media.setAttribute("aria-label", "Ler artigo: " + p.title);
  const img = el("img");
  img.src = p.image || "/assets/ludo-conecta.webp";
  img.alt = p.imageAlt || p.title;
  img.width = 1200;
  img.height = 900;
  img.loading = "lazy";
  img.decoding = "async";
  media.append(img);
  const body = el("div", "lc-ed-body");
  body.append(el("span", "lc-ed-category", p.category || "Ludo Conecta"));
  const h = el("h3");
  const title = el("a", "", p.title);
  title.href = media.href;
  h.append(title);
  const summary = el("p", "", p.summary || "");
  const read = el("a", "lc-ed-read", "Ler artigo →");
  read.href = media.href;
  body.append(h, summary, read);
  card.append(media, body);
  return card;
}
async function init() {
  try {
    // Apenas artigos publicados pelo Pages CMS e pelo CMS legado.
    const publications = await loadPublishedArticles();
    if (!list || !count) return;
    count.textContent = publications.length + (publications.length === 1 ? " artigo publicado" : " artigos publicados");
    if (!publications.length) {
      list.append(el("p", "lc-all-empty", "Ainda não há artigos publicados. Volte em breve!"));
      return;
    }
    list.replaceChildren(...publications.map(renderCard));
  } catch (err) {
    console.warn("Ludo Conecta: erro ao carregar lista de artigos.", err);
    if (count) count.textContent = "Não foi possível carregar os artigos neste momento.";
  }
}
init();
