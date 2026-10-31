import { db } from "./firebase-config.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

const publicSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
async function publishedPaths() {
  try {
    const response = await fetch("/content/ludo-conecta/manifest.json", { cache: "no-store" });
    if (!response.ok) return {};
    const manifest = await response.json();
    return manifest?.articles && typeof manifest.articles === "object" ? manifest.articles : {};
  } catch {
    return {};
  }
}
function articleUrl(article, paths) {
  const slug = String(article.slug || "");
  const path = paths[slug];
  return publicSlug.test(slug) && path === "/ludo-conecta/materias/" + slug + "/"
    ? path
    : "materia.html?id=" + encodeURIComponent(article.id);
}


function escapeText(s = "") {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

document.addEventListener("DOMContentLoaded", () => {
  function setupStaticCarousel({
    root,
    trackSelector,
    slideSelector,
    dotSelector,
    prevSelector,
    nextSelector,
    analyticsEvent,
    autoplayMs = 0,
  }) {
    const carousel = document.querySelector(root);

    if (!carousel) {
      return;
    }

    const track = carousel.querySelector(trackSelector);
    const slides = Array.from(carousel.querySelectorAll(slideSelector));
    const dots = Array.from(carousel.querySelectorAll(dotSelector));
    const prevButton = carousel.querySelector(prevSelector);
    const nextButton = carousel.querySelector(nextSelector);

    if (!track || !slides.length) {
      return;
    }

    let current = 0;
    let autoplayTimer = null;
    let pointerInside = false;
    let keyboardFocusInside = false;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function show(index) {
      current = (index + slides.length) % slides.length;
      track.style.transform = `translateX(-${current * 100}%)`;

      slides.forEach((slide, slideIndex) => {
        const active = slideIndex === current;
        slide.classList.toggle("is-active", active);
        slide.setAttribute("aria-hidden", String(!active));
      });

      dots.forEach((dot, dotIndex) => {
        const active = dotIndex === current;
        dot.classList.toggle("is-active", active);
        dot.setAttribute("aria-pressed", String(active));
      });

      if (analyticsEvent && typeof window.gtag === "function") {
        window.gtag("event", analyticsEvent, {
          position: current + 1,
        });
      }
    }

    function stopAutoplay() {
      if (autoplayTimer !== null) {
        window.clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    }

    function startAutoplay() {
      stopAutoplay();

      if (
        autoplayMs <= 0 ||
        slides.length < 2 ||
        reducedMotion ||
        document.hidden ||
        pointerInside ||
        keyboardFocusInside
      ) {
        return;
      }

      autoplayTimer = window.setInterval(() => show(current + 1), autoplayMs);
    }

    function goTo(index) {
      show(index);
      startAutoplay(); // Reinicia a contagem após uma interação manual.
    }

    prevButton?.addEventListener("click", () => goTo(current - 1));
    nextButton?.addEventListener("click", () => goTo(current + 1));

    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => goTo(index));
    });

    let touchStartX = 0;

    carousel.addEventListener(
      "touchstart",
      (event) => {
        touchStartX = event.changedTouches[0]?.clientX || 0;
      },
      { passive: true },
    );

    carousel.addEventListener(
      "touchend",
      (event) => {
        const touchEndX = event.changedTouches[0]?.clientX || 0;
        const distance = touchEndX - touchStartX;

        if (Math.abs(distance) >= 45) {
          goTo(distance < 0 ? current + 1 : current - 1);
        }
      },
      { passive: true },
    );

    // Pausa quando o visitante está lendo, usando teclado, ou mudou de aba.
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      carousel.addEventListener("mouseenter", () => {
        pointerInside = true;
        stopAutoplay();
      });
      carousel.addEventListener("mouseleave", () => {
        pointerInside = false;
        startAutoplay();
      });
    }

    carousel.addEventListener("focusin", (event) => {
      if (event.target.matches(":focus-visible")) {
        keyboardFocusInside = true;
        stopAutoplay();
      }
    });

    carousel.addEventListener("focusout", (event) => {
      if (!carousel.contains(event.relatedTarget)) {
        keyboardFocusInside = false;
        startAutoplay();
      }
    });

    document.addEventListener("visibilitychange", startAutoplay);

    show(0);
    startAutoplay();
  }

  setupStaticCarousel({
    root: ".shop-carousel",
    trackSelector: ".shop-carousel__track",
    slideSelector: ".shop-slide",
    dotSelector: ".shop-carousel__dot",
    prevSelector: ".shop-carousel__arrow--prev",
    nextSelector: ".shop-carousel__arrow--next",
    analyticsEvent: "store_banner_view",
    autoplayMs: 3000,
  });

  const videoCarousel = document.querySelector(".video-carousel");

  if (videoCarousel) {
    const track = videoCarousel.querySelector(".video-carousel__track");
    const slides = Array.from(videoCarousel.querySelectorAll(".video-carousel__slide"));
    const dots = Array.from(videoCarousel.querySelectorAll(".video-carousel__dot"));
    const prevButton = videoCarousel.querySelector(".video-carousel__arrow--prev");
    const nextButton = videoCarousel.querySelector(".video-carousel__arrow--next");

    let currentSlide = 0;

    function pauseVideos() {
      slides.forEach((slide) => {
        const frame = slide.querySelector("iframe");

        frame?.contentWindow?.postMessage(
          JSON.stringify({
            event: "command",
            func: "pauseVideo",
            args: "",
          }),
          "*",
        );
      });
    }

    function showSlide(index) {
      if (!slides.length || !track) {
        return;
      }

      pauseVideos();

      currentSlide = (index + slides.length) % slides.length;
      track.style.transform = `translateX(-${currentSlide * 100}%)`;

      slides.forEach((slide, slideIndex) => {
        const active = slideIndex === currentSlide;
        slide.classList.toggle("is-active", active);
        slide.setAttribute("aria-hidden", String(!active));
      });

      dots.forEach((dot, dotIndex) => {
        const active = dotIndex === currentSlide;
        dot.classList.toggle("is-active", active);
        dot.setAttribute("aria-pressed", String(active));
      });

      if (typeof window.gtag === "function") {
        window.gtag("event", "video_carousel_view", {
          video_position: currentSlide + 1,
        });
      }
    }

    prevButton?.addEventListener("click", () => showSlide(currentSlide - 1));
    nextButton?.addEventListener("click", () => showSlide(currentSlide + 1));

    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => showSlide(index));
    });

    showSlide(0);
  }

  const blogHome = document.querySelector(".blog-home");
  const blogHeading = document.querySelector(".blog-heading");
  const postsSection = document.querySelector(".conecta-posts");
  const postsContainer = document.querySelector("#ludo-posts");
  const filtersContainer = document.querySelector("#ludo-filters");
  const desktopFeatured = document.querySelector("#desktop-featured");
  const desktopMain = document.querySelector("#featured-main");
  const desktopList = document.querySelector("#featured-list");
  const mobileFeatured = document.querySelector("#mobile-featured");
  const mobileTrack = document.querySelector("#mobile-featured-track");
  const mobileDots = document.querySelector("#mobile-featured-dots");

  function formatDate(value) {
    if (!value) {
      return "";
    }

    const date = new Date(`${value}T12:00:00`);

    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  }

  function renderFeatured(posts) {
    const featuredPosts = posts.filter((post) => post.featured);

    if (!featuredPosts.length) {
      return;
    }

    blogHome?.classList.remove("is-empty");
    if (blogHeading) blogHeading.hidden = false;

    const mainPost = featuredPosts[0];
    const sidePosts = featuredPosts.slice(1, 4);

    if (desktopFeatured && desktopMain && desktopList) {
      desktopMain.innerHTML = `
        <article class="desktop-main-card">
          <a href="${mainPost.url}" aria-label="Ler ${mainPost.title}">
            <div class="desktop-main-card__image">
              <img src="${mainPost.image}" alt="${mainPost.imageAlt || mainPost.title}">
            </div>
            <div class="desktop-main-card__overlay"></div>
            <div class="desktop-main-card__content">
              <div class="desktop-main-card__meta">
                ${mainPost.category || "Ludo Conecta"} · ${formatDate(mainPost.date)}
              </div>
              <h3>${mainPost.title}</h3>
              <p>${mainPost.summary || ""}</p>
            </div>
          </a>
        </article>
      `;

      desktopList.innerHTML = sidePosts
        .map(
          (post) => `
            <article class="desktop-list-card">
              <a href="${post.url}" aria-label="Ler ${post.title}">
                <div class="desktop-list-card__image">
                  <img src="${post.image}" alt="${post.imageAlt || post.title}" loading="lazy">
                </div>
                <div>
                  <div class="desktop-list-card__meta">${post.category || "Ludo Conecta"}</div>
                  <h3>${post.title}</h3>
                  <p>${formatDate(post.date)}</p>
                </div>
              </a>
            </article>
          `,
        )
        .join("");

      desktopFeatured.classList.toggle("desktop-featured--single", sidePosts.length === 0);
      desktopList.hidden = sidePosts.length === 0;
      desktopFeatured.hidden = false;
    }

    if (mobileFeatured && mobileTrack && mobileDots) {
      mobileTrack.innerHTML = featuredPosts
        .map(
          (post, index) => `
            <article class="mobile-featured-card${index === 0 ? " is-active" : ""}">
              <a href="${post.url}" aria-label="Ler ${post.title}">
                <div class="mobile-featured-card__image">
                  <img src="${post.image}" alt="${post.imageAlt || post.title}" loading="${index === 0 ? "eager" : "lazy"}">
                </div>
                <div class="mobile-featured-card__overlay"></div>
                <div class="mobile-featured-card__content">
                  <div class="mobile-featured-card__meta">${post.category || "Ludo Conecta"}</div>
                  <h3>${post.title}</h3>
                </div>
              </a>
            </article>
          `,
        )
        .join("");

      mobileDots.innerHTML = featuredPosts
        .map(
          (_, index) => `
            <button
              class="mobile-featured__dot${index === 0 ? " is-active" : ""}"
              type="button"
              aria-label="Destaque ${index + 1}"
              aria-pressed="${index === 0 ? "true" : "false"}"
            ></button>
          `,
        )
        .join("");

      const slides = Array.from(mobileTrack.querySelectorAll(".mobile-featured-card"));
      const dots = Array.from(mobileDots.querySelectorAll(".mobile-featured__dot"));
      const prev = mobileFeatured.querySelector(".mobile-featured__arrow--prev");
      const next = mobileFeatured.querySelector(".mobile-featured__arrow--next");

      let current = 0;

      function show(index) {
        current = (index + slides.length) % slides.length;
        mobileTrack.style.transform = `translateX(-${current * 100}%)`;

        dots.forEach((dot, dotIndex) => {
          const active = dotIndex === current;
          dot.classList.toggle("is-active", active);
          dot.setAttribute("aria-pressed", String(active));
        });
      }

      prev?.addEventListener("click", () => show(current - 1));
      next?.addEventListener("click", () => show(current + 1));
      dots.forEach((dot, index) => dot.addEventListener("click", () => show(index)));

      mobileFeatured.hidden = false;
      show(0);
    }
  }

  async function loadPosts() {
    try {
      const snapshot = await getDocs(
        query(collection(db, "materias"), where("status", "==", "publicado"))
      );
      const articles = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
        .sort((a, b) => String(b.dataPublicacao || b.atualizadoEm || "")
          .localeCompare(String(a.dataPublicacao || a.atualizadoEm || "")));
      const mainArticle = articles.find((a) => a.destaquePrincipal) || articles[0];
      const secondary = articles
        .filter((a) => a !== mainArticle && a.destaqueSecundario).slice(0, 3);
      const featured = new Set([mainArticle, ...secondary]);
      const ordered = [mainArticle, ...secondary, ...articles.filter((a) => !featured.has(a))]
        .filter(Boolean);
      const paths = await publishedPaths();
      const posts = ordered.map((article) => ({
        title: escapeText(article.titulo),
        summary: escapeText(article.resumo),
        category: escapeText(article.categoriaNome || "Ludo Conecta"),
        date: String(article.dataPublicacao || article.atualizadoEm || "").slice(0, 10),
        image: /^\/assets\/materias\/[a-f0-9-]{36}\.(png|jpg|webp)$/i.test(article.imagemCapaUrl || "")
          ? article.imagemCapaUrl : "../assets/ludo-conecta.png",
        imageAlt: escapeText(article.imagemCapaAlt || article.titulo),
        url: articleUrl(article, paths),
        featured: featured.has(article),
      }));

      if (!Array.isArray(posts) || posts.length === 0) {
        return;
      }

      // Exibe somente matérias reais publicadas no Firestore.
      const visiblePosts = posts;
      renderFeatured(visiblePosts);

      if (!postsSection || !postsContainer || !filtersContainer) {
        return;
      }

      const regularPosts = visiblePosts.filter((post) => !post.featured);

      if (!regularPosts.length) {
        postsSection.hidden = true;
        return;
      }

      const categories = [
        "Todos",
        ...new Set(regularPosts.map((post) => post.category).filter(Boolean)),
      ];

      let activeCategory = "Todos";

      function renderPosts() {
        const visiblePosts =
          activeCategory === "Todos"
            ? regularPosts
            : regularPosts.filter((post) => post.category === activeCategory);

        postsContainer.innerHTML = visiblePosts
          .map(
            (post) => `
              <article class="conecta-post-card">
                <a href="${post.url}" aria-label="Ler ${post.title}">
                  <div class="conecta-post-card__image">
                    <img src="${post.image}" alt="${post.imageAlt || post.title}" loading="lazy">
                  </div>

                  <div class="conecta-post-card__content">
                    <div class="conecta-post-card__meta">
                      <span>${post.category || "Ludo Conecta"}</span>
                      ${post.date ? `<span>•</span><time datetime="${post.date}">${formatDate(post.date)}</time>` : ""}
                    </div>

                    <h3>${post.title}</h3>
                    <p>${post.summary || ""}</p>
                    <span class="conecta-post-card__link">Ler conteúdo →</span>
                  </div>
                </a>
              </article>
            `,
          )
          .join("");
      }

      filtersContainer.innerHTML = categories
        .map(
          (category, index) => `
            <button
              class="conecta-filter${index === 0 ? " is-active" : ""}"
              type="button"
              data-category="${category}"
            >
              ${category}
            </button>
          `,
        )
        .join("");

      filtersContainer.addEventListener("click", (event) => {
        const button = event.target.closest("[data-category]");

        if (!button) {
          return;
        }

        activeCategory = button.dataset.category || "Todos";

        filtersContainer
          .querySelectorAll(".conecta-filter")
          .forEach((filterButton) => {
            filterButton.classList.toggle("is-active", filterButton === button);
          });

        renderPosts();
      });

      renderPosts();
      postsSection.hidden = false;
    } catch {
      postsSection?.setAttribute("hidden", "");
    }
  }

  loadPosts();
});
