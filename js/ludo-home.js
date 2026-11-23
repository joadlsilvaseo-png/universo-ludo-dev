import { loadPublishedArticles } from "./ludo-publications.js";
const section = document.querySelector("#ludo-conecta");
const track = document.querySelector("#home-conecta-grid");
const controls = document.querySelector("#home-conecta-controls");
const prev = document.querySelector("#home-conecta-prev");
const next = document.querySelector("#home-conecta-next");
const pagination = document.querySelector("#home-conecta-pagination");
const imagePattern = /^\/assets\/[a-zA-Z0-9_./-]+\.(png|jpg|jpeg|webp)$/i;

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function articleUrl(article) {
  const slug = String(article.slug || "");
  return slugPattern.test(slug) ? "/ludo-conecta/materias/" + slug + "/" : "/ludo-conecta/";
}

function element(tag, className, value) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (value !== undefined) node.textContent = String(value);
  return node;
}

function publicationDate(article) {
  return String(article.dataPublicacao || article.atualizadoEm || "").slice(0, 10);
}

function displayDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const date = new Date(value + "T12:00:00");
  if (Number.isNaN(date.valueOf())) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "short", year: "numeric"
  }).format(date);
}

function buildCard(article, index) {
  const card = element("article", "home-conecta-card" + (index === 0 ? " is-lead" : ""));
  const link = element("a", "home-conecta-card__link");
  link.href = article.url || articleUrl(article);
  link.setAttribute("aria-label", "Ler matéria: " + article.titulo);

  const image = element("img", "home-conecta-card__image");
  image.src = imagePattern.test(article.imagemCapaUrl || "")
    ? article.imagemCapaUrl : "./assets/ludo-conecta.png";
  image.alt = article.imagemCapaAlt || article.titulo;
  image.loading = index === 0 ? "eager" : "lazy";
  image.decoding = "async";

  const shade = element("span", "home-conecta-card__shade");
  shade.setAttribute("aria-hidden", "true");

  const content = element("div", "home-conecta-card__content");
  const meta = element("div", "home-conecta-card__meta");
  meta.append(element("span", "", article.categoriaNome || "Ludo Conecta"));
  const isoDate = publicationDate(article);
  const readable = displayDate(isoDate);
  if (readable) {
    const date = element("time", "", readable);
    date.dateTime = isoDate;
    meta.append(date);
  }
  content.append(meta, element("h3", "", article.titulo));

  if (index === 0 && article.resumo) {
    content.append(element("p", "home-conecta-card__summary", article.resumo));
  }
  const read = element("span", "home-conecta-card__read", "Ler matéria →");
  content.append(read);
  link.append(image, shade, content);
  card.append(link);
  return card;
}

function setupMobileCarousel(cards) {
  if (cards.length < 2 || !track || !controls) return;
  controls.hidden = false;
  let current = 0;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function updatePosition(index, shouldScroll) {
    current = Math.max(0, Math.min(cards.length - 1, index));
    if (pagination) pagination.textContent = (current + 1) + " / " + cards.length;
    if (prev) prev.disabled = current === 0;
    if (next) next.disabled = current === cards.length - 1;
    if (shouldScroll) {
      track.scrollTo({
        left: cards[current].offsetLeft,
        behavior: reducedMotion ? "instant" : "smooth"
      });
    }
  }

  if (prev) prev.addEventListener("click", () => updatePosition(current - 1, true));
  if (next) next.addEventListener("click", () => updatePosition(current + 1, true));
  let queued = false;
  track.addEventListener("scroll", () => {
    if (queued || window.innerWidth > 820) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      let closest = 0;
      let distance = Infinity;
      cards.forEach((card, i) => {
        const delta = Math.abs(card.offsetLeft - track.scrollLeft);
        if (delta < distance) {
          distance = delta;
          closest = i;
        }
      });
      updatePosition(closest, false);
    });
  }, { passive: true });
  updatePosition(0, false);
}

async function loadLatest() {
  if (!section || !track) return;
  try {
    const published = await loadPublishedArticles();
    const articles = published.slice(0, 3).map((post) => ({
      id: post.id, slug: post.slug, titulo: post.title, resumo: post.summary,
      categoriaNome: post.category, dataPublicacao: post.date,
      imagemCapaUrl: post.image, imagemCapaAlt: post.imageAlt, url: post.url
    }));
    if (articles.length === 0) return;
    const cards = articles.map((article, index) => buildCard(article, index));
    track.replaceChildren(...cards);
    track.classList.toggle("is-single", cards.length === 1);
    track.classList.toggle("is-pair", cards.length === 2);
    section.hidden = false;
    setupMobileCarousel(cards);
  } catch (error) {
    console.warn("Ludo Conecta: não foi possível carregar as matérias.", error);
  }
}

loadLatest();
