import { loadPublishedArticles } from "./ludo-publications.js";
import { selectEditorial } from "./ludo-editorial.js";
const publicSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
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
  const showcase = document.querySelector("#ludo-editorial");
  const latestSlot = document.querySelector("#ludo-recent-post");
  const highlightTrack = document.querySelector("#ludo-highlight-track");
  const highlightControls = document.querySelector("#ludo-highlight-controls");
  const highlightDots = document.querySelector("#ludo-highlight-dots");
  const postsSection = document.querySelector(".conecta-posts");
  const postsContainer = document.querySelector("#ludo-posts");

  function formatDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return "";
    const date = new Date(value + "T12:00:00");
    return Number.isNaN(date.valueOf()) ? "" : new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit", month: "short", year: "numeric"
    }).format(date);
  }
  function safePost(p) {
    return {
      title: escapeText(p.title),
      summary: escapeText(p.summary || ""),
      category: escapeText(p.category || "Ludo Conecta"),
      date: String(p.date || "").slice(0, 10),
      image: escapeText(p.image || "/assets/ludo-conecta.webp"),
      imageAlt: escapeText(p.imageAlt || p.title),
      url: escapeText(p.url || "/ludo-conecta/")
    };
  }
  function postImage(p, lead = false) {
    return '<a class="lc-ed-media" href="' + p.url + '" aria-label="Ler: ' + p.title + '">' +
      '<img src="' + p.image + '" alt="' + p.imageAlt +
      '" width="1200" height="900" loading="' + (lead ? "eager" : "lazy") +
      '" decoding="async"></a>';
  }
  function postBody(p, tag = "h3", compact = false) {
    const details = p.summary ? "<p>" + p.summary + "</p>" : "";
    return '<div class="lc-ed-body"><span class="lc-ed-category">' + p.category +
      '</span><' + tag + '><a href="' + p.url + '">' + p.title + '</a></' + tag + '>' +
      details + '<a class="lc-ed-read" href="' + p.url + '">Ler artigo <span aria-hidden="true">→</span></a></div>';
  }
  function leadCard(post) {
    const p = safePost(post);
    return '<article class="lc-ed-lead">' + postImage(p, true) + postBody(p) + "</article>";
  }
  function compactCard(post, all = false) {
    const p = safePost(post);
    return '<article class="' + (all ? "lc-ed-all-card" : "lc-ed-compact") + '">' +
      postImage(p) + postBody(p, "h3", !all) + "</article>";
  }
  function setupHighlights() {
    if (!highlightTrack || !highlightControls || !highlightDots) return;
    const cards = [...highlightTrack.querySelectorAll(".lc-ed-compact")];
    highlightDots.replaceChildren();
    if (cards.length < 2) { highlightControls.hidden = true; return; }
    const prev = document.querySelector("#ludo-highlight-prev");
    const next = document.querySelector("#ludo-highlight-next");
    const mobile = window.matchMedia("(max-width: 800px)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let current = 0;
    let pending = false;
    const dots = cards.map((card, i) => {
      const dot = document.createElement("button");
      dot.className = "lc-ed-dot" + (i ? "" : " is-active");
      dot.type = "button";
      dot.setAttribute("aria-label", "Ir para destaque " + (i + 1) + " de " + cards.length);
      highlightDots.append(dot);
      return dot;
    });
    function update(index) {
      current = Math.max(0, Math.min(cards.length - 1, index));
      dots.forEach((dot, i) => {
        dot.classList.toggle("is-active", i === current);
        if (i === current) dot.setAttribute("aria-current", "true");
        else dot.removeAttribute("aria-current");
      });
      if (prev) prev.disabled = current === 0;
      if (next) next.disabled = current === cards.length - 1;
    }
    function go(index) {
      if (!mobile.matches) return;
      const i = Math.max(0, Math.min(cards.length - 1, index));
      highlightTrack.scrollTo({
        left: cards[i].offsetLeft - cards[0].offsetLeft,
        behavior: reduce.matches ? "auto" : "smooth"
      });
      update(i);
    }
    prev?.addEventListener("click", () => go(current - 1));
    next?.addEventListener("click", () => go(current + 1));
    dots.forEach((dot, i) => dot.addEventListener("click", () => go(i)));
    highlightTrack.addEventListener("keydown", (event) => {
      if (!mobile.matches || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      go(current + (event.key === "ArrowRight" ? 1 : -1));
    });
    highlightTrack.addEventListener("scroll", () => {
      if (!mobile.matches || pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        update(Math.round(highlightTrack.scrollLeft / Math.max(1, highlightTrack.clientWidth)));
      });
    }, { passive: true });
    mobile.addEventListener("change", () => { if (mobile.matches) go(current); });
    highlightControls.hidden = false;
    update(0);
  }

  async function loadPosts() {
    try {
      // Apenas registros publicados: o Pages CMS não publica artigos em rascunho.
      const publications = await loadPublishedArticles();
      const { latest, highlights, remaining } = selectEditorial(publications, 3);
      if (!latest || !showcase || !latestSlot || !highlightTrack) return;

      latestSlot.innerHTML = leadCard(latest);
      highlightTrack.style.setProperty("--lc-count", String(Math.max(1, highlights.length)));
      highlightTrack.innerHTML = highlights.length
        ? highlights.map(p => compactCard(p)).join("")
        : '<p class="lc-ed-empty">Novos destaques em breve.</p>';
      setupHighlights();
      showcase.hidden = false;
      blogHome?.classList.remove("is-empty");

      if (postsSection && postsContainer && remaining.length) {
        postsContainer.innerHTML = remaining.map(p => compactCard(p, true)).join("");
        postsSection.hidden = false;
      } else if (postsSection) {
        postsSection.hidden = true;
      }
    } catch (error) {
      console.warn("Ludo Conecta: não foi possível carregar os artigos.", error);
    }
  }

  loadPosts();
});
