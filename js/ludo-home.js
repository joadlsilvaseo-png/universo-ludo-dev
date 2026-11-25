import { loadPublishedArticles } from "./ludo-publications.js";
import { selectEditorial } from "./ludo-editorial.js";
const section = document.querySelector("#ludo-conecta");
const track = document.querySelector("#home-conecta-grid");
const mobileShowcase = document.querySelector("#home-conecta-mobile");
const latestSlot = document.querySelector("#home-conecta-mobile-latest");
const highlightArea = document.querySelector("#home-conecta-mobile-highlights");
const miniTrack = document.querySelector("#home-conecta-mini-track");
const miniControls = document.querySelector("#home-conecta-mini-controls");
const miniPrev = document.querySelector("#home-conecta-mini-prev");
const miniNext = document.querySelector("#home-conecta-mini-next");
const miniDots = document.querySelector("#home-conecta-mini-dots");
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

function buildCard(article, lead = false) {
  const card = element("article", "home-conecta-card" + (lead ? " is-lead" : ""));
  const media = element("a", "home-conecta-card__media");
  media.href = article.url || articleUrl(article);
  media.setAttribute("aria-label", "Ler matéria: " + article.titulo);
  const image = element("img", "home-conecta-card__image");
  image.src = imageFor(article);
  image.alt = article.imagemCapaAlt || article.titulo;
  image.width = 1200;
  image.height = 900;
  image.loading = lead ? "eager" : "lazy";
  image.decoding = "async";
  media.append(image);
  const content = element("div", "home-conecta-card__content");
  content.append(element("span", "home-conecta-card__category", article.categoriaNome || "Ludo Conecta"));
  const heading = element("h3");
  heading.append(linkTo(article, "home-conecta-card__title-link", article.titulo));
  content.append(heading);
  if (article.resumo) content.append(element("p", "home-conecta-card__summary", article.resumo));
  content.append(linkTo(article, "home-conecta-card__read", "Ler artigo →"));
  card.append(media, content);
  return card;
}

function imageFor(article) {
  return imagePattern.test(article.imagemCapaUrl || "")
    ? article.imagemCapaUrl : "./assets/ludo-conecta.webp";
}

function linkTo(article, className, label) {
  const link = element("a", className, label);
  link.href = article.url || articleUrl(article);
  return link;
}

// Card principal mobile: foto acima, informações abaixo, como no blog Isabele.
function buildMobilePrimary(article) {
  const card = element("article", "home-conecta__mobile-primary");
  const media = linkTo(article, "home-conecta__mobile-primary-media");
  media.setAttribute("aria-label", "Ler artigo: " + article.titulo);
  const img = element("img");
  img.src = imageFor(article);
  img.alt = article.imagemCapaAlt || article.titulo;
  img.loading = "lazy";
  img.decoding = "async";
  media.append(img);

  const body = element("div", "home-conecta__mobile-primary-body");
  const category = element("span", "home-conecta__mobile-category", article.categoriaNome || "Ludo Conecta");
  const heading = element("h4");
  heading.append(linkTo(article, "", article.titulo));
  body.append(category, heading);
  if (article.resumo) body.append(element("p", "", article.resumo));
  body.append(linkTo(article, "home-conecta__mobile-read", "Ler artigo →"));
  card.append(media, body);
  return card;
}

// Card secundário mobile: imagem à esquerda e conteúdo à direita.
function buildMobileMini(article) {
  const card = element("article", "home-conecta__mini-card");
  const media = linkTo(article, "home-conecta__mini-media");
  media.setAttribute("aria-label", "Ler artigo: " + article.titulo);
  const img = element("img");
  img.src = imageFor(article);
  img.alt = article.imagemCapaAlt || article.titulo;
  img.loading = "lazy";
  img.decoding = "async";
  media.append(img);

  const body = element("div", "home-conecta__mini-content");
  const category = element("span", "home-conecta__mobile-category", article.categoriaNome || "Ludo Conecta");
  const heading = element("h4");
  heading.append(linkTo(article, "", article.titulo));
  body.append(category, heading, linkTo(article, "home-conecta__mobile-read", "Ler artigo →"));
  card.append(media, body);
  return card;
}

// Mesmos controles da Isabele: setas, dots, swipe e teclado.
function setupMiniCarousel(cards) {
  if (!miniTrack || !miniControls || !miniDots) return;
  miniDots.replaceChildren();
  if (cards.length < 2) {
    miniControls.hidden = true;
    return;
  }
  const dots = cards.map((card, i) => {
    const dot = element("button", "home-conecta__mini-dot" + (i === 0 ? " is-active" : ""));
    dot.type = "button";
    dot.setAttribute("aria-label", "Ir para destaque " + (i + 1) + " de " + cards.length);
    if (i === 0) dot.setAttribute("aria-current", "true");
    miniDots.append(dot);
    return dot;
  });
  miniControls.hidden = false;
  let current = 0;
  let queued = false;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  function render(index) {
    current = Math.max(0, Math.min(cards.length - 1, index));
    dots.forEach((dot, i) => {
      dot.classList.toggle("is-active", i === current);
      if (i === current) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });
    if (miniPrev) miniPrev.disabled = current === 0;
    if (miniNext) miniNext.disabled = current === cards.length - 1;
  }
  function navigate(index) {
    const i = Math.max(0, Math.min(cards.length - 1, index));
    miniTrack.scrollTo({
      left: cards[i].offsetLeft - cards[0].offsetLeft,
      behavior: reducedMotion.matches ? "auto" : "smooth"
    });
    render(i);
  }
  miniPrev?.addEventListener("click", () => navigate(current - 1));
  miniNext?.addEventListener("click", () => navigate(current + 1));
  dots.forEach((dot, i) => dot.addEventListener("click", () => navigate(i)));
  miniTrack.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    navigate(current + (event.key === "ArrowRight" ? 1 : -1));
  });
  miniTrack.addEventListener("scroll", () => {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(() => {
      queued = false;
      render(Math.round(miniTrack.scrollLeft / Math.max(1, miniTrack.clientWidth)));
    });
  }, { passive: true });
  render(0);
}

async function loadLatest() {
  if (!section || !track) return;
  try {
    const published = await loadPublishedArticles();
    const { latest, highlights } = selectEditorial(published, 3);
    if (!latest) return;
    const normalize = (post) => ({
      id: post.id, slug: post.slug, titulo: post.title, resumo: post.summary,
      categoriaNome: post.category, dataPublicacao: post.date,
      imagemCapaUrl: post.image, imagemCapaAlt: post.imageAlt, url: post.url
    });
    const main = normalize(latest);
    const secondary = highlights.map(normalize);

    // Desktop: capa principal + ate 3 destaques horizontais, como na Isabele.
    const recent = element("div", "home-conecta__desktop-lead");
    recent.append(element("h3", "home-conecta__desktop-heading", "Mais recente"), buildCard(main, true));
    const aside = element("div", "home-conecta__desktop-side");
    const sideHeading = element("div", "home-conecta__desktop-side-heading");
    sideHeading.append(element("h3", "home-conecta__desktop-heading", "Destaques"));
    const all = element("a", "home-conecta__mini-all", "Ver todos →");
    all.href = "./ludo-conecta/todos/";
    sideHeading.append(all);
    aside.append(sideHeading);
    if (secondary.length) {
      const stack = element("div", "home-conecta__desktop-stack");
      stack.append(...secondary.map((article) => buildCard(article)));
      aside.append(stack);
    } else {
      aside.append(element("p", "home-conecta__empty", "Novos destaques em breve."));
    }
    track.replaceChildren(recent, aside);

    // Mobile: o ultimo publicado ganha a capa grande; os destaques deslizam.
    if (mobileShowcase && latestSlot && highlightArea && miniTrack) {
      latestSlot.replaceChildren(buildMobilePrimary(main));
      if (secondary.length) {
        const miniCards = secondary.map(buildMobileMini);
        miniTrack.replaceChildren(...miniCards);
        setupMiniCarousel(miniCards);
      } else {
        miniTrack.replaceChildren(element("p", "home-conecta__empty", "Novos destaques em breve."));
        if (miniControls) miniControls.hidden = true;
      }
      // O botao Ver todos fica disponivel mesmo com poucos artigos.
      highlightArea.hidden = false;
      mobileShowcase.hidden = false;
    }
    section.hidden = false;
  } catch (error) {
    console.warn("Ludo Conecta: não foi possível carregar as matérias.", error);
  }
}

loadLatest();
